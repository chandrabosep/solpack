"use client";

import type { ProjectSummary } from "@/types/projects";
import { pricingModelLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardPackageRow({
  project,
}: {
  project: ProjectSummary;
}) {
  const router = useRouter();
  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3 font-medium text-foreground">{project.name}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {project.currency === "SOL" ? "SOL (native)" : "USDC (SPL)"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {pricingModelLabel(project.pricingModel)}
      </td>
      <td className="px-4 py-3 text-foreground">
        {project.price ?? 0} {project.currency}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Active
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {project.apiKeyValue ? (
            <CopyButton
              value={project.apiKeyValue}
              label="Copy API key"
              buttonText="Copy API key"
              variant="ghost"
              size="sm"
            />
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <ExternalLink className="size-3.5" />
            View
          </Button>
        </div>
      </td>
    </tr>
  );
}
