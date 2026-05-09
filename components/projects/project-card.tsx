"use client";

import Link from "next/link";
import type { ProjectSummary } from "@/types/projects";
import { pricingModelLabel, shortenAddress, formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FolderKanban, ChevronRight } from "lucide-react";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const subtitle = [
    pricingModelLabel(project.pricingModel),
    project.price != null ? `${project.price} ${project.currency}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <Card className="h-full transition-all duration-200 hover:border-[#9945ff]/30 hover:shadow-purple-900/30 cursor-pointer">
        <CardHeader>
          <div className="flex flex-row items-start gap-3 justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#9945ff]/20 to-[#14f195]/20 border border-white/10">
                <FolderKanban className="size-5 text-[#14f195]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{project.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground mt-1.5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDate(project.createdAt)}</span>
            <span className="font-mono">{shortenAddress(project.id, 8, 6)}</span>
          </div>
          {project.apiKeyValue ? (
            <div
              className="flex items-center gap-2 pt-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <code className="flex-1 min-w-0 truncate rounded-md bg-white/5 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                {shortenAddress(project.apiKeyValue, 10, 6)}
              </code>
              <CopyButton
                value={project.apiKeyValue}
                label="Copy API key"
                buttonText="Copy"
                variant="outline"
                size="sm"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
