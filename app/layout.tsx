import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import { LayoutShell } from "@/components/common/layout-shell";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Solpack — Monetize npm packages on Solana",
  description:
    "Solpack lets npm package authors charge for installs in USDC on Solana. Add a preinstall script and a payment config to your package; users pay on-chain at install time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased">
        <ContextProvider>
          <LayoutShell>{children}</LayoutShell>
        </ContextProvider>
      </body>
    </html>
  );
}
