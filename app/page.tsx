"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Wallet,
  Code,
  DollarSign,
  Zap,
  Lock,
  BarChart3,
  Download,
  CircleDollarSign,
  Rocket,
} from "lucide-react";
import ConnectButton from "@/components/common/connect-btn";
import Hero from "@/components/landing-ui/Hero";
import ReusableCard from "@/components/landing-ui/ReuseableCard";

export default function LandingPage() {
  const { connected } = useWallet();

  const stats = [
    {
      id: 1,
      icon: Rocket,
      title: "Solana speed",
      description:
        "Sub-second confirmations on Solana mean no awkward checkout wait.",
    },
    {
      id: 2,
      icon: DollarSign,
      title: "USDC + SOL",
      description:
        "Accept USDC (SPL) or native SOL. Funds settle directly to your wallet.",
    },
    {
      id: 3,
      icon: Zap,
      title: "Drop-in preinstall",
      description:
        "Add a small preinstall script. No private registry, no extra tooling.",
    },
  ];

  const howitworks = [
    {
      id: 1,
      stepNumber: 1,
      icon: Wallet,
      title: "Connect wallet",
      description:
        "Connect Phantom or Solflare. Your wallet becomes the payout address.",
    },
    {
      id: 2,
      stepNumber: 2,
      icon: Code,
      title: "Label your package",
      description:
        "Mark the package as paid in its README and registry description, add the preinstall script and your payment config, then publish.",
    },
    {
      id: 3,
      stepNumber: 3,
      icon: DollarSign,
      title: "Get paid",
      description:
        "Users pay in USDC or SOL at install. Funds land in your wallet on-chain.",
    },
  ];

  const features = [
    {
      id: 1,
      icon: Wallet,
      title: "Direct on-chain payouts",
      description:
        "Payments go straight from installer wallet to author wallet. No custodian.",
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Flexible pricing",
      description: "Per-install, per-device, or subscription pricing models.",
    },
    {
      id: 3,
      icon: Lock,
      title: "On-chain verification",
      description:
        "Server verifies the SPL transfer / system transfer via Solana RPC before unlocking install.",
    },
    {
      id: 4,
      icon: BarChart3,
      title: "Install analytics",
      description: "See which packages are installing, where, and how often.",
    },
    {
      id: 5,
      icon: Download,
      title: "Vanilla npm",
      description:
        "Works with the public npm registry. Users use their normal workflow.",
    },
    {
      id: 6,
      icon: CircleDollarSign,
      title: "Devnet + mainnet",
      description: "Test on devnet today, flip to mainnet when you're ready.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[var(--background)]/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="solana-gradient-text">sol</span>
            <span className="text-foreground">pack</span>
          </Link>
          <div className="flex items-center gap-6">
            {connected && (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            )}
            <ConnectButton />
          </div>
        </nav>
      </header>

      <main>
        <Hero />

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 space-y-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why Solpack
              </h2>
              <p className="text-muted-foreground">
                The essentials for monetizing your packages on Solana
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {stats.map((s) => (
                <ReusableCard
                  key={s.id}
                  icon={s.icon}
                  title={s.title}
                  description={s.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 space-y-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                How it works
              </h2>
              <p className="text-muted-foreground">
                Three steps from publish to paid
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {howitworks.map((s) => (
                <ReusableCard
                  key={s.id}
                  stepNumber={s.stepNumber}
                  icon={s.icon}
                  title={s.title}
                  description={s.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 space-y-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Features
              </h2>
              <p className="text-muted-foreground">
                Everything authors need to ship a paid package on Solana
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {features.map((f) => (
                <ReusableCard
                  key={f.id}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-white/5 px-6 py-8 text-center text-xs text-muted-foreground">
        <p>
          <span className="solana-gradient-text font-semibold">solpack</span>{" "}
          · built on Solana · publish paid packages with clear labeling
        </p>
      </footer>
    </div>
  );
}
