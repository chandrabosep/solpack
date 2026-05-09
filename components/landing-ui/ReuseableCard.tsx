"use client";

import type { LucideIcon } from "lucide-react";

export default function ReusableCard({
  icon: Icon,
  title,
  description,
  stepNumber,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  stepNumber?: number;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[var(--surface)]/60 backdrop-blur-sm p-6 transition-colors hover:border-[#9945ff]/30 hover:bg-[var(--surface)]/80">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(40rem 18rem at 50% -20%, rgba(153,69,255,0.10), transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#9945ff]/20 to-[#14f195]/20 border border-white/10">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        {stepNumber !== undefined && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Step {stepNumber}
          </span>
        )}
      </div>
      <h3 className="relative mt-4 text-lg font-semibold">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
