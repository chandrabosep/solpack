"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { USDC_DECIMALS } from "@/config";
import { shortAddress } from "@/lib/utils";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const LifiPayWidget = dynamic(
  () => import("@/components/pay/lifi-pay-widget"),
  { ssr: false },
);

type SessionInfo = {
  sessionToken: string;
  status: "payment_required" | "allowed" | "failed" | string;
  projectName: string;
  pricingModel: string;
  price: number;
  currency: "USDC" | "SOL";
  address: string;
  cluster: string;
  tokenMint: string | null;
};

function PayInner() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("session") ?? "";
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState<"solana" | "lifi">("solana");

  useEffect(() => {
    if (!sessionToken) {
      setError("Missing session parameter");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/install/session?session=${encodeURIComponent(sessionToken)}`,
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Session not found");
        }
        const data = (await res.json()) as SessionInfo;
        if (!cancelled) {
          setSession(data);
          if (data.status === "allowed") setVerified(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  async function pay() {
    if (!session || !publicKey) return;
    setError(null);
    setPaying(true);
    try {
      const recipient = new PublicKey(session.address);
      const tx = new Transaction();

      if (session.currency === "SOL") {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipient,
            lamports: Math.round(session.price * LAMPORTS_PER_SOL),
          }),
        );
      } else {
        if (!session.tokenMint) throw new Error("Missing USDC mint");
        const mint = new PublicKey(session.tokenMint);
        const fromAta = await getAssociatedTokenAddress(mint, publicKey);
        const toAta = await getAssociatedTokenAddress(mint, recipient);

        const toAtaInfo = await connection.getAccountInfo(toAta);
        if (!toAtaInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              toAta,
              recipient,
              mint,
            ),
          );
        }
        const raw = BigInt(Math.round(session.price * 10 ** USDC_DECIMALS));
        tx.add(
          createTransferCheckedInstruction(
            fromAta,
            mint,
            toAta,
            publicKey,
            raw,
            USDC_DECIMALS,
          ),
        );
      }

      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      await connection.confirmTransaction(sig, "confirmed");

      const verifyRes = await fetch("/api/install/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: session.sessionToken, signature: sig }),
      });
      const verifyJson = (await verifyRes.json()) as
        | { verified: true }
        | { verified: false; reason: string };
      if (!verifyJson.verified) {
        throw new Error(verifyJson.reason || "Verification failed");
      }
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading session…</p>
      </main>
    );
  }
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-rose-300">{error || "Session not found"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--surface)]/80 backdrop-blur-md p-8 shadow-2xl shadow-purple-900/20">
        <h1 className="text-2xl font-bold solana-gradient-text inline-block">
          Install payment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This package requires payment before install.
        </p>

        <div className="mt-6 space-y-3 rounded-lg bg-white/5 border border-white/5 p-4 text-sm">
          <Row label="Package" value={session.projectName} />
          <Row label="Amount" value={`${session.price} ${session.currency}`} />
          <Row label="Pay to" value={shortAddress(session.address, 6)} />
          <Row
            label="Network"
            value={
              session.cluster === "mainnet-beta"
                ? "Solana mainnet"
                : "Solana devnet"
            }
          />
        </div>

        {verified ? (
          <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Payment verified. You can return to your terminal — install will
            continue automatically.
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 rounded-lg border border-white/10 bg-white/5 p-1 text-sm">
              <button
                type="button"
                onClick={() => setTab("solana")}
                className={`rounded-md py-2 transition ${
                  tab === "solana"
                    ? "bg-white/10 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Solana wallet
              </button>
              <button
                type="button"
                onClick={() => setTab("lifi")}
                disabled={session.currency !== "USDC"}
                className={`rounded-md py-2 transition disabled:opacity-40 ${
                  tab === "lifi"
                    ? "bg-white/10 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={
                  session.currency !== "USDC"
                    ? "Cross-chain pay is USDC-only"
                    : undefined
                }
              >
                Pay from any chain
              </button>
            </div>

            {tab === "solana" ? (
              <>
                <div className="mt-4">
                  <WalletMultiButton />
                </div>
                <button
                  type="button"
                  disabled={!connected || paying}
                  onClick={pay}
                  className="mt-4 w-full rounded-lg bg-[image:var(--gradient-solana)] py-3 font-semibold text-[#0a0612] disabled:opacity-50 hover:brightness-105 transition"
                >
                  {paying ? "Sending…" : `Pay ${session.price} ${session.currency}`}
                </button>
                {txSig && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tx: {shortAddress(txSig, 8)}
                  </p>
                )}
                {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
              </>
            ) : (
              <div className="mt-4">
                <LifiPayWidget
                  sessionToken={session.sessionToken}
                  payoutAddress={session.address}
                  priceUsdc={session.price}
                  onVerified={() => setVerified(true)}
                />
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          You can close this tab and refuse payment at any time. Closing the
          tab will not charge your wallet — funds only move when you sign the
          transaction in your wallet.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <PayInner />
    </Suspense>
  );
}
