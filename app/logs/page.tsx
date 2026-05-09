"use client";

import { useState } from "react";
import { useWalletAddress } from "@/lib/auth/use-wallet-address";
import type { ProjectSummary } from "@/types/projects";
import type { InstallLogEntry } from "@/types/logs";
import { EVENT_TYPE_LABELS } from "@/types/logs";
import { useProjectsQuery } from "@/controllers/projects.query";
import { useLogsInfiniteQuery } from "@/controllers/logs.query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ScrollText, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function LogsPage() {
  const walletAddress = useWalletAddress();
  const [projectId, setProjectId] = useState("");

  const { data: projectsData } = useProjectsQuery(walletAddress ?? undefined);
  const projects: ProjectSummary[] = projectsData?.projects ?? [];

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLogsInfiniteQuery(walletAddress ?? undefined, {
    projectId: projectId || undefined,
    limit: 30,
  });

  const logs: InstallLogEntry[] = (data?.pages ?? []).flatMap((p) => p.logs);

  if (!walletAddress) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ScrollText className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Logs</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view install and payment events.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Install attempts and payment events across your projects.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <Select
          value={projectId || "all"}
          onValueChange={(v) => setProjectId(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error.message}
        </div>
      ) : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="mx-auto size-10 text-muted-foreground/70" />
              <p className="mt-3 text-sm font-medium">No logs yet</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Install attempts and payment events will show up here.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03] text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(l.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium">{l.packageName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {EVENT_TYPE_LABELS[l.eventType]}
                    </td>
                    <td className="px-4 py-3">
                      {l.amount != null ? `${l.amount}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={l.status === "success" ? "success" : "destructive"}
                      >
                        {l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </main>
  );
}
