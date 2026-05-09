"use client";

import { useState } from "react";
import { useWalletAddress } from "@/lib/auth/use-wallet-address";
import { CreatePackageButton } from "@/components/projects/create-package-button";
import { DashboardPackageRow } from "@/components/projects/dashboard-package-row";
import { useProjectsQuery } from "@/controllers/projects.query";
import { useDashboardStatsQuery } from "@/controllers/dashboard.query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, FolderKanban, Download, DollarSign } from "lucide-react";
import type { ProjectSummary } from "@/types/projects";

export default function DashboardPage() {
  const walletAddress = useWalletAddress();
  const [filterProjectId, setFilterProjectId] = useState("");

  const { data: projectsData, isLoading: loading, refetch: refetchProjects } =
    useProjectsQuery(walletAddress ?? undefined);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } =
    useDashboardStatsQuery(walletAddress ?? undefined, {
      projectId: filterProjectId || undefined,
    });

  const projects: ProjectSummary[] = projectsData?.projects ?? [];

  const onUpdated = () => {
    refetchProjects();
    refetchStats();
  };

  if (!walletAddress) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Connect your Solana wallet to view analytics and manage your packages.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How is your monetization doing at a glance?
          </p>
        </div>
        <CreatePackageButton walletAddress={walletAddress} onCreated={onUpdated} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">
                Active projects
              </CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-semibold">
                {stats?.activeProjects ?? 0}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">
                Successful installs
              </CardTitle>
              <Download className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-semibold">
                {stats?.installs ?? 0}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-muted-foreground">
                Total revenue
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-semibold">
                {(stats?.totalPayments ?? 0).toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  USDC
                </span>
              </span>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Select
          value={filterProjectId || "all"}
          onValueChange={(v) => setFilterProjectId(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
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

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Packages
        </h2>
        {loading ? (
          <Card>
            <CardContent className="py-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-4 border-b border-border/40 pb-3 last:border-0"
                >
                  <div className="h-6 w-1/3 rounded bg-muted" />
                  <div className="h-6 w-1/4 rounded bg-muted" />
                  <div className="ml-auto h-6 w-16 rounded bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No packages yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Create your first package to get an API key and start integrating.
            </p>
            <CreatePackageButton
              walletAddress={walletAddress}
              onCreated={onUpdated}
              variant="inline"
            />
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.03] text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">
                      Package name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Pricing model
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Price</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <DashboardPackageRow key={p.id} project={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}
