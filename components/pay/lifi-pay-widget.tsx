"use client";

/**
 * Cross-chain install payments via the LI.FI SDK (no widget).
 *
 * Why we don't use @lifi/widget here:
 *   - The widget auto-detects every connected wallet on the page. Solpack's
 *     pay page already has Phantom connected for the direct-Solana flow,
 *     so the widget would treat Solana as the *source* — exactly the wrong
 *     direction for a payment whose destination is always Solana.
 *   - The widget bundles multi-chain wallet plumbing we don't need (Sui,
 *     Bigmi, Wagmi providers, etc.).
 *
 * What this does instead:
 *   1. User picks an EVM source chain (Ethereum / Arbitrum / Base / Polygon
 *      / Optimism) and pays in USDC.
 *   2. We connect to the user's EVM wallet directly via window.ethereum.
 *   3. LI.FI's `getRoutes` quotes a route for an *exact toAmount* of USDC
 *      delivered to the project's payout wallet on Solana.
 *   4. We send the source-chain transaction the route asks for and poll
 *      `getStatus` until LI.FI reports the destination Solana tx hash.
 *   5. That destination signature is fed to /api/install/verify, which
 *      runs the same on-chain SPL-USDC verification used for direct
 *      Solana wallet payments. The cross-chain payment is treated as a
 *      first-class Solana payment by the time the verifier sees it.
 *
 * Bounty alignment (Best Cross-Chain Solana UX powered by LI.FI):
 *   - Solana is the destination on every route, every time.
 *   - LI.FI is used for a real quote and an executed transfer.
 *   - Concrete UX problem solved: "I want this paid npm package but my
 *     funds aren't on Solana". User pays from any EVM chain, package
 *     author gets paid in USDC on Solana, install resumes automatically.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createConfig,
  EVM,
  getRoutes,
  getStepTransaction,
  ChainId,
  type Route,
} from "@lifi/sdk";
import {
  LIFI_DEST_USDC_MINT,
  LIFI_INTEGRATOR,
  LIFI_SOLANA_CHAIN_ID,
} from "@/config";

// USDC contract addresses on supported EVM source chains.
const USDC_BY_CHAIN: Record<number, { symbol: "USDC"; address: string }> = {
  [ChainId.ETH]: {
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  [ChainId.ARB]: {
    symbol: "USDC",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  [ChainId.BAS]: {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  [ChainId.POL]: {
    symbol: "USDC",
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  [ChainId.OPT]: {
    symbol: "USDC",
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
};

const SOURCE_CHAINS: { id: number; label: string }[] = [
  { id: ChainId.ARB, label: "Arbitrum" },
  { id: ChainId.BAS, label: "Base" },
  { id: ChainId.OPT, label: "Optimism" },
  { id: ChainId.POL, label: "Polygon" },
  { id: ChainId.ETH, label: "Ethereum" },
];

// Initialise the SDK once. We don't pass any signing providers — we sign
// transactions directly through window.ethereum below.
let sdkInitialized = false;
function ensureSdk() {
  if (sdkInitialized) return;
  createConfig({
    integrator: LIFI_INTEGRATOR,
    providers: [EVM({})], // EVM source-chain support, no wagmi setup needed
  });
  sdkInitialized = true;
}

type Props = {
  sessionToken: string;
  payoutAddress: string;
  priceUsdc: number;
  onVerified: () => void;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

// ---------- LI.FI /status REST polling ----------
// We hit https://li.quest/v1/status directly instead of using the SDK's
// getStatus(), because:
//   - The SDK throws on transient 404s (NOT_FOUND) which break our flow.
//   - The REST shape is well-documented and stable.
// Spec: https://docs.li.fi/transaction-status
type LifiStatus =
  | "NOT_FOUND" // tx not yet indexed — keep polling
  | "INVALID" // wrong tool — bail
  | "PENDING" // in flight — keep polling
  | "DONE"
  | "FAILED";

type LifiStatusResponse = {
  status: LifiStatus;
  substatus?: string;
  substatusMessage?: string;
  sending?: { txHash?: string };
  receiving?: { txHash?: string };
  tool?: string;
};

async function lifiStatus(args: {
  txHash: string;
  fromChain?: number;
  toChain?: number;
  bridge?: string;
}): Promise<LifiStatusResponse> {
  const url = new URL("https://li.quest/v1/status");
  url.searchParams.set("txHash", args.txHash);
  if (args.fromChain != null)
    url.searchParams.set("fromChain", String(args.fromChain));
  if (args.toChain != null)
    url.searchParams.set("toChain", String(args.toChain));
  if (args.bridge) url.searchParams.set("bridge", args.bridge);

  const res = await fetch(url.toString(), { cache: "no-store" });
  // 404 from LI.FI = "haven't seen this tx yet" — treat as NOT_FOUND, not
  // as a fatal error. This is the single fix that makes the polling loop
  // robust right after a bridge submission.
  if (res.status === 404) return { status: "NOT_FOUND" };
  if (!res.ok) {
    throw new Error(`LI.FI /status returned ${res.status}`);
  }
  return (await res.json()) as LifiStatusResponse;
}

function getEth(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

// ----- Minimal ERC-20 approve helpers (no viem/wagmi dependency) -----
const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

function pad32(hexNo0x: string) {
  return hexNo0x.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

async function readAllowance(
  eth: EthereumProvider,
  token: string,
  owner: string,
  spender: string,
): Promise<bigint> {
  // allowance(address,address) — selector 0xdd62ed3e
  const data = "0xdd62ed3e" + pad32(owner) + pad32(spender);
  const hex = (await eth.request({
    method: "eth_call",
    params: [{ to: token, data }, "latest"],
  })) as string;
  return BigInt(hex || "0x0");
}

async function sendApproval(
  eth: EthereumProvider,
  token: string,
  spender: string,
  from: string,
): Promise<string> {
  // approve(address,uint256) — selector 0x095ea7b3
  const data =
    "0x095ea7b3" + pad32(spender) + pad32(MAX_UINT256.slice(2));
  return (await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: token, data, value: "0x0" }],
  })) as string;
}

async function waitForReceipt(
  eth: EthereumProvider,
  txHash: string,
  timeoutMs = 120_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = (await eth.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as { status?: string } | null;
    if (r) {
      if (r.status === "0x1") return;
      throw new Error("Approval transaction failed on-chain");
    }
    await new Promise((res) => setTimeout(res, 2_000));
  }
  throw new Error("Approval transaction timed out");
}

export default function LifiPayWidget({
  sessionToken,
  payoutAddress,
  priceUsdc,
  onVerified,
}: Props) {
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [sourceChain, setSourceChain] = useState<number>(ChainId.ARB);
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recoverHash, setRecoverHash] = useState("");
  const [showRecover, setShowRecover] = useState(false);

  useEffect(() => {
    ensureSdk();
  }, []);

  const toAmount = useMemo(
    () => BigInt(Math.round(priceUsdc * 1_000_000)).toString(),
    [priceUsdc],
  );

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEth();
    if (!eth) {
      setError("No EVM wallet detected. Install MetaMask or another EVM wallet.");
      return;
    }
    try {
      const accounts = (await eth.request({
        method: "eth_requestAccounts",
      })) as string[];
      setEvmAddress(accounts[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    }
  }, []);

  // LI.FI's getRoutes is exact-IN only (fromAmount required, no toAmount).
  // To deliver an exact USDC amount on Solana we do a two-pass quote:
  //   1. Quote with fromAmount = priceUsdc to learn the bridge fee/ratio.
  //   2. Re-quote with fromAmount scaled up so toAmount >= priceUsdc + 0.5%.
  const fetchQuote = useCallback(async () => {
    if (!evmAddress) return;
    setError(null);
    setRoute(null);
    setBusy(true);
    try {
      const usdc = USDC_BY_CHAIN[sourceChain];
      if (!usdc) throw new Error("Unsupported source chain");

      const baseRequest = {
        fromChainId: sourceChain,
        fromTokenAddress: usdc.address,
        fromAddress: evmAddress,
        toChainId: LIFI_SOLANA_CHAIN_ID,
        toTokenAddress: LIFI_DEST_USDC_MINT,
        toAddress: payoutAddress,
        options: { order: "RECOMMENDED" as const, slippage: 0.005 },
      };

      const targetRaw = BigInt(toAmount);

      // Pass 1: nominal fromAmount = price.
      const pass1 = await getRoutes({
        ...baseRequest,
        fromAmount: toAmount,
      });
      let candidate = pass1.routes[0];
      if (!candidate) throw new Error("No route available for this pair");

      // If the pass-1 route already delivers >= price, use it. Otherwise
      // scale fromAmount up by deficit ratio + 0.5% safety and re-quote.
      const pass1Out = BigInt(candidate.toAmount);
      if (pass1Out < targetRaw) {
        // ratio = price / pass1Out, applied to fromAmount, plus 0.5% buffer.
        // All math in BigInt with 1e6 precision.
        const ratioNumerator = targetRaw * 10_050n; // *1.005
        const ratioDenominator = pass1Out * 10_000n;
        const scaledFromAmount =
          (BigInt(candidate.fromAmount) * ratioNumerator) / ratioDenominator;

        const pass2 = await getRoutes({
          ...baseRequest,
          fromAmount: scaledFromAmount.toString(),
        });
        const adjusted = pass2.routes[0];
        if (!adjusted) throw new Error("No route available after re-quote");
        if (BigInt(adjusted.toAmount) < targetRaw) {
          throw new Error(
            "Bridge fees exceeded buffer — try a different source chain.",
          );
        }
        candidate = adjusted;
      }

      setRoute(candidate);
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to fetch quote";
      setError(detail);
    } finally {
      setBusy(false);
    }
  }, [evmAddress, sourceChain, payoutAddress, toAmount]);

  const pay = useCallback(async () => {
    if (!route || !evmAddress) return;
    const eth = getEth();
    if (!eth) {
      setError("EVM wallet disconnected");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Switch wallet to source chain if needed.
      const hex = `0x${sourceChain.toString(16)}`;
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hex }],
        });
      } catch {
        /* user may already be on the right chain */
      }

      // getRoutes only returns metadata. Fetch the actual transaction calldata
      // for the first step before sending it.
      setStatus("Preparing transaction…");
      const populated = await getStepTransaction(route.steps[0]);
      const tx = populated.transactionRequest;
      if (!tx?.to || !tx?.data) {
        throw new Error("LI.FI did not return a transaction request");
      }

      // Ensure the LI.FI router has an ERC-20 allowance for our source USDC.
      // Without this, the bridge contract's transferFrom() reverts and
      // MetaMask shows "transaction is likely to fail".
      const usdc = USDC_BY_CHAIN[sourceChain];
      const spender =
        populated.estimate?.approvalAddress ?? (tx.to as string);
      if (usdc && spender) {
        const needed = BigInt(populated.estimate?.fromAmount ?? route.fromAmount);
        const current = await readAllowance(
          eth,
          usdc.address,
          evmAddress,
          spender,
        );
        if (current < needed) {
          setStatus("Approving USDC for the LI.FI router…");
          const approveHash = await sendApproval(
            eth,
            usdc.address,
            spender,
            evmAddress,
          );
          setStatus("Waiting for approval to confirm…");
          await waitForReceipt(eth, approveHash);
        }
      }

      setStatus("Waiting for signature in your wallet…");
      const sourceTxHash = (await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: evmAddress,
            to: tx.to,
            data: tx.data,
            value: tx.value ?? "0x0",
          },
        ],
      })) as string;

      setStatus("Bridging — waiting for funds to land on Solana…");

      // Poll LI.FI's /status REST endpoint until the destination Solana
      // tx hash is reported. Status semantics (per LI.FI docs):
      //   NOT_FOUND   → indexer hasn't seen the tx yet → keep polling
      //   PENDING     → in flight → keep polling, surface the substatus
      //   DONE        → success → read receiving.txHash
      //   FAILED      → bail with substatusMessage
      //   INVALID     → wrong tool/bridge → bail
      const deadline = Date.now() + 8 * 60 * 1000; // 8 min ceiling
      let solSig: string | null = null;
      let consecutiveErrors = 0;

      while (Date.now() < deadline) {
        try {
          const st = await lifiStatus({
            txHash: sourceTxHash,
            fromChain: sourceChain,
            toChain: LIFI_SOLANA_CHAIN_ID,
            bridge: populated.tool,
          });
          consecutiveErrors = 0;

          if (st.status === "DONE") {
            solSig = st.receiving?.txHash ?? null;
            if (!solSig) {
              throw new Error(
                "LI.FI reported DONE but no destination Solana tx hash — try again shortly",
              );
            }
            break;
          }
          if (st.status === "FAILED") {
            throw new Error(
              st.substatusMessage ||
                `Bridge failed (${st.substatus ?? "unknown reason"})`,
            );
          }
          if (st.status === "INVALID") {
            throw new Error(
              "LI.FI reports the source tx is not tied to this bridge tool",
            );
          }

          // NOT_FOUND or PENDING — keep waiting and surface a useful
          // status message to the user.
          if (st.status === "PENDING" && st.substatus) {
            setStatus(
              `Bridging — ${st.substatus
                .toLowerCase()
                .replaceAll("_", " ")}…`,
            );
          } else if (st.status === "NOT_FOUND") {
            setStatus("Waiting for LI.FI to index your source transaction…");
          } else {
            setStatus("Bridging — waiting for funds to land on Solana…");
          }
        } catch (e) {
          // Transient API hiccup — retry a few times before giving up.
          consecutiveErrors += 1;
          if (consecutiveErrors >= 6) throw e;
        }
        await new Promise((r) => setTimeout(r, 5_000));
      }

      if (!solSig) {
        throw new Error(
          "Bridge timed out after 8 minutes — funds may still land. Use the Recover option below with your source tx hash to verify when ready.",
        );
      }

      setStatus("Confirming on-chain payment…");
      const verifyRes = await fetch("/api/install/verify-lifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, signature: solSig }),
      });
      const json = (await verifyRes.json()) as
        | { verified: true }
        | { verified: false; reason: string };
      if (!json.verified) throw new Error(json.reason || "Verification failed");

      setStatus("Payment verified.");
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }, [route, evmAddress, sourceChain, sessionToken, onVerified]);

  const fromAmount = route?.fromAmount
    ? Number(route.fromAmount) / 1_000_000
    : null;

  // Recovery: user already bridged via LI.FI in a previous attempt that
  // crashed before /api/install/verify ran. Take their source EVM tx hash,
  // ask LI.FI for the destination Solana signature, then verify.
  const recoverPayment = useCallback(async () => {
    if (!recoverHash.trim()) {
      setError("Paste the source EVM tx hash from your wallet activity.");
      return;
    }
    setError(null);
    setBusy(true);
    setStatus("Looking up bridge status with LI.FI…");
    try {
      // Try a few times — even a completed bridge takes a moment to index
      // if it's very recent. Same status semantics as the main pay loop.
      let solSig: string | null = null;
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline && !solSig) {
        const st = await lifiStatus({
          txHash: recoverHash.trim(),
          fromChain: sourceChain,
          toChain: LIFI_SOLANA_CHAIN_ID,
        });
        if (st.status === "DONE") {
          solSig = st.receiving?.txHash ?? null;
          break;
        }
        if (st.status === "FAILED") {
          throw new Error(
            st.substatusMessage ||
              `Bridge reported failed (${st.substatus ?? "unknown reason"})`,
          );
        }
        if (st.status === "INVALID") {
          throw new Error(
            "LI.FI doesn't recognize that tx hash on the selected source chain.",
          );
        }
        await new Promise((r) => setTimeout(r, 4_000));
      }
      if (!solSig) {
        throw new Error(
          "LI.FI couldn't locate a destination Solana tx for that hash. Double-check the hash and chain.",
        );
      }
      setStatus("Confirming on-chain payment…");
      const res = await fetch("/api/install/verify-lifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, signature: solSig }),
      });
      const json = (await res.json()) as
        | { verified: true }
        | { verified: false; reason: string };
      if (!json.verified) throw new Error(json.reason || "Verification failed");
      setStatus("Payment verified.");
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recovery failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }, [recoverHash, sourceChain, sessionToken, onVerified]);

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
        Pay from any EVM chain. LI.FI quotes a route and delivers at least{" "}
        <span className="font-medium text-foreground">
          {priceUsdc} USDC
        </span>{" "}
        to the package author on Solana mainnet.
        <br />
        <span className="text-rose-300/80">
          LI.FI is mainnet-only — destination is mainnet USDC, not your
          configured cluster.
        </span>
      </div>

      {!evmAddress ? (
        <button
          type="button"
          onClick={connect}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-3 font-medium hover:bg-white/10 transition"
        >
          Connect EVM wallet
        </button>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-muted-foreground">EVM wallet</div>
          <div className="font-mono text-xs">
            {evmAddress.slice(0, 6)}…{evmAddress.slice(-4)}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground">Source chain</label>
        <select
          value={sourceChain}
          onChange={(e) => {
            setSourceChain(Number(e.target.value));
            setRoute(null);
          }}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/20"
        >
          {SOURCE_CHAINS.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0a0612]">
              {c.label} (USDC)
            </option>
          ))}
        </select>
      </div>

      {!route ? (
        <button
          type="button"
          disabled={!evmAddress || busy}
          onClick={fetchQuote}
          className="w-full rounded-lg bg-white/10 py-3 font-medium disabled:opacity-50 hover:bg-white/15 transition"
        >
          {busy ? "Quoting…" : "Get LI.FI quote"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
            <Row
              label="You send"
              value={`${fromAmount?.toFixed(2) ?? "?"} USDC on ${
                SOURCE_CHAINS.find((c) => c.id === sourceChain)?.label ?? "EVM"
              }`}
            />
            <Row
              label="Author receives"
              value={`${(Number(route.toAmount) / 1_000_000).toFixed(4)} USDC on Solana`}
            />
            <Row label="Route via" value={route.steps[0]?.toolDetails?.name ?? route.steps[0]?.tool ?? "LI.FI"} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={pay}
            className="w-full rounded-lg bg-[image:var(--gradient-solana)] py-3 font-semibold text-[#0a0612] disabled:opacity-50 hover:brightness-105 transition"
          >
            {busy ? "Processing…" : "Pay via LI.FI"}
          </button>
        </div>
      )}

      {status && <p className="text-emerald-300">{status}</p>}
      {error && <p className="text-rose-300">{error}</p>}

      <div className="pt-2 border-t border-white/5 space-y-2">
        {!showRecover ? (
          <button
            type="button"
            onClick={() => setShowRecover(true)}
            className="text-[11px] text-muted-foreground underline hover:text-foreground"
          >
            Already bridged but verification didn&apos;t finish? Recover →
          </button>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Paste source-chain tx hash from your wallet activity
            </label>
            <input
              type="text"
              value={recoverHash}
              onChange={(e) => setRecoverHash(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono focus:outline-none focus:border-white/20"
            />
            <button
              type="button"
              disabled={busy || !recoverHash.trim()}
              onClick={recoverPayment}
              className="w-full rounded-lg bg-white/10 py-2 text-sm font-medium disabled:opacity-50 hover:bg-white/15 transition"
            >
              {busy ? "Recovering…" : "Recover payment"}
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Powered by LI.FI · destination locked to author wallet on Solana
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
