# Cross-chain install payments via LI.FI

Solpack lets npm package authors charge for installs in USDC on Solana. The
problem: not every user already holds USDC on Solana. They might have funds
on Ethereum, Polygon, Arbitrum, Base, Avalanche, BNB, or somewhere else
entirely.

This integration uses **LI.FI** to bridge that gap — literally. From the pay
page, a user can fund the install from *any* supported source chain and LI.FI
quotes a route, executes the bridge + swap, and delivers the exact USDC
amount to the package author's Solana wallet. From the author's side
nothing changes — the funds arrive as a normal SPL-USDC transfer.

## How LI.FI is used

The integration uses the **LI.FI Widget** with a locked destination:

- `toChain`: Solana (LI.FI chain id `1151111081099710`)
- `toToken`: USDC SPL mint (`4zMMC9srt5Ri…` on devnet,
  `EPjFWdd5…` on mainnet)
- `toAddress`: the project's payout wallet (read from the install session)
- `toAmount`: the exact install price in USDC base units
- `disabledUI`: `["toAddress", "toAmount", "toToken", "toChain"]` — the user
  cannot change the destination side; only the source chain and source token
  are selectable

Source code: [`components/pay/lifi-pay-widget.tsx`](components/pay/lifi-pay-widget.tsx)

## End-to-end user flow

1. User runs `npm i some-paid-package`.
2. The package's `preinstall` script calls `/api/install/start`, gets back
   an HTTP 402 with the `x-pay-url`, and prints a "PAYMENT REQUIRED" notice
   pointing the user to the pay page.
3. Pay page loads the session — package name, price, payout address.
4. User picks the **Pay from any chain** tab.
5. LI.FI Widget renders, locked to "USDC on Solana → author wallet, exact
   amount".
6. User selects their source (e.g. USDC on Arbitrum), connects their
   source-chain wallet inside the widget, and signs.
7. LI.FI executes the route — bridge, swap, or both — until the destination
   step lands a Solana SPL-USDC transfer to the author's wallet.
8. Solpack listens to the widget's `routeExecutionCompleted` event,
   extracts the **destination Solana tx signature**, and POSTs it to
   `/api/install/verify`.
9. `/api/install/verify` runs the same on-chain SPL verification that direct
   Solana payments use (`lib/payments/verify-onchain.ts`) — it confirms the
   tx succeeded, that it contains a USDC transfer of at least the required
   amount to the recipient ATA. Cross-chain payments are treated as
   first-class: same recipient, same currency, same verifier.
10. Session marked `allowed`, the still-running `npm install` polls the
    status endpoint, sees `allowed`, and continues to install the package.

The widget is the only on-page interaction needed for cross-chain payment.
The verifier on the backend does not need to know LI.FI exists — by the time
it runs, the funds are already a normal Solana SPL transfer.

## Why this matters for Solana UX

- **Cuts the onboarding tax.** A user who'd otherwise have to bridge to
  Solana, swap into USDC, then come back and click pay can do all three in
  one flow without leaving the install.
- **Authors don't care where the money came from.** They get a regular
  Solana SPL-USDC transfer to their existing payout wallet — same indexers,
  same dashboards, same accounting.
- **No custodial step.** Funds move from the user's source wallet directly
  to the author's Solana wallet via LI.FI's executors. Solpack never holds
  funds.

## Files

- `components/pay/lifi-pay-widget.tsx` — widget wrapper, route-completion
  listener, and verification call
- `app/pay/page.tsx` — pay page with the new "Pay from any chain" tab
- `config/index.ts` — `LIFI_INTEGRATOR` and `LIFI_SOLANA_CHAIN_ID` constants
- `lib/payments/verify-onchain.ts` — unchanged; verifies the destination
  Solana tx the same way it verifies direct payments

## Configuration

```env
# Optional — register at https://portal.li.fi to claim an integrator key.
# Without it the widget runs in unbranded mode.
NEXT_PUBLIC_LIFI_INTEGRATOR=solpack
```

## Demo

Pay flow: open any test package's pay URL on devnet, switch to the
"Pay from any chain" tab, choose a source chain + token in the widget,
sign, and watch the install resume in the terminal once the route finishes.
