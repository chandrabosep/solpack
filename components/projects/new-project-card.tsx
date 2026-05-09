"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <Card className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] py-8 transition-colors hover:border-[#9945ff]/40 hover:bg-white/[0.04]">
        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#9945ff]/20 to-[#14f195]/20 border border-white/10 text-foreground">
          <Plus className="size-6" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          New project
        </span>
      </Card>
    </button>
  );
}
