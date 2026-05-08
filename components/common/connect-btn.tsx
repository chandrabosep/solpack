"use client";

import dynamic from "next/dynamic";

// WalletMultiButton uses browser-only APIs; load it client-side only.
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton,
    ),
  { ssr: false },
);

export default function ConnectButton() {
  return <WalletMultiButton />;
}
