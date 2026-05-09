"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Hero() {
	return (
		<section className="relative px-4 pt-20 pb-24 sm:px-6 lg:px-8">
			{/* Solana grid backdrop */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 -z-0"
				style={{
					background:
						"radial-gradient(50rem 30rem at 50% 0%, rgba(153,69,255,0.18), transparent 70%)",
					maskImage:
						"radial-gradient(60% 60% at 50% 30%, #000 30%, transparent 100%)",
				}}
			/>
			<div className="relative mx-auto max-w-4xl text-center">
				<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
					<span className="size-1.5 rounded-full bg-[#14f195]" />
					Solana devnet · USDC + SOL
				</span>
				<h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl text-foreground">
					Charge for npm installs in{" "}
					<span className="solana-gradient-text">USDC on Solana</span>
				</h1>
				<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
					Solpack lets package authors monetize npm installs with
					on-chain payments. Add a small preinstall script and a
					payment config — users pay in USDC or SOL, funds settle
					directly to your wallet.
				</p>
				<p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground/80">
					Built for clearly-labeled paid packages: list your package
					as paid in its README and registry description so installers
					know up front.
				</p>
				<div className="mt-10 flex items-center justify-center gap-4">
					<Link
						href="/dashboard"
						className="group inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-solana)] px-6 py-3 text-sm font-semibold text-[#0a0612] shadow-[0_8px_24px_-8px_rgba(153,69,255,0.6)] transition hover:brightness-105"
					>
						Open dashboard
						<ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</Link>
				</div>
			</div>
		</section>
	);
}
