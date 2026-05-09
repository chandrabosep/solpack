"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDate, pricingModelLabel, paymentTypeLabel } from "@/lib/utils";
import type { ProjectSummary } from "@/types/projects";
import { Loader2, Pencil, RefreshCw, Check, X } from "lucide-react";

export interface ProjectPackageInfoCardProps {
  project: ProjectSummary;
  editingPaymentAddress: boolean;
  inlinePaymentAddress: string;
  updateLoading: boolean;
  updateError: string | null;
  onInlinePaymentAddressChange: (value: string) => void;
  onSavePaymentAddress: (address: string) => void;
  onCancelEditPaymentAddress: () => void;
  onStartEditPaymentAddress: (address: string) => void;
  rotateLoading: boolean;
  onRotateKeyClick: () => void;
  onRefreshClick?: () => void;
}

function DocRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 py-3 first:pt-0 last:pb-0 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {description ? (
          <span className="text-xs text-muted-foreground/80">{description}</span>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ProjectPackageInfoCard({
  project,
  editingPaymentAddress,
  inlinePaymentAddress,
  updateLoading,
  updateError,
  onInlinePaymentAddressChange,
  onSavePaymentAddress,
  onCancelEditPaymentAddress,
  onStartEditPaymentAddress,
  rotateLoading,
  onRotateKeyClick,
  onRefreshClick,
}: ProjectPackageInfoCardProps) {
  return (
    <Card id="credentials" className="scroll-mt-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Credentials &amp; settings
          </CardTitle>
          {onRefreshClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshClick}
              aria-label="Refresh project data"
              className="text-muted-foreground"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          ) : null}
        </div>
        <CardDescription>
          Use these values in your app. Keep your API key secret and do not
          commit it to version control.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <DocRow label="Package name">
          <p className="font-medium">{project.name}</p>
        </DocRow>

        <DocRow
          label="Project ID"
          description="Use in package.json solpack.projectId"
        >
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md bg-white/5 px-2 py-1.5 text-xs font-mono">
              {project.id}
            </code>
            <CopyButton
              value={project.id}
              label="Copy Project ID"
              buttonText="Copy"
              size="xs"
              variant="ghost"
            />
          </div>
        </DocRow>

        <DocRow
          label="API key"
          description="Keep secret. Use in package.json solpack.apiKey"
        >
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md bg-white/5 px-2 py-1.5 text-xs font-mono">
              {project.apiKeyValue ?? "—"}
            </code>
            {project.apiKeyValue ? (
              <>
                <CopyButton
                  value={project.apiKeyValue}
                  label="Copy API key"
                  buttonText="Copy"
                  size="xs"
                  variant="ghost"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  aria-label="Rotate API key"
                  onClick={onRotateKeyClick}
                  disabled={rotateLoading}
                >
                  {rotateLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Rotate
                </Button>
              </>
            ) : null}
          </div>
        </DocRow>

        <DocRow
          label="Solana payout address"
          description={`${project.currency} received at this wallet`}
        >
          {editingPaymentAddress ? (
            <div className="space-y-2">
              <Input
                value={inlinePaymentAddress}
                onChange={(e) => onInlinePaymentAddressChange(e.target.value)}
                placeholder="Base58 Solana address"
                className="font-mono text-sm max-w-md"
                disabled={updateLoading}
              />
              {updateError ? (
                <p className="text-xs text-rose-300">{updateError}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onSavePaymentAddress(inlinePaymentAddress)}
                  disabled={updateLoading || !inlinePaymentAddress.trim()}
                >
                  {updateLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEditPaymentAddress}
                  disabled={updateLoading}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-sm">
                {project.paymentAddress}
              </code>
              <CopyButton
                value={project.paymentAddress}
                label="Copy payout address"
                buttonText="Copy"
                size="xs"
                variant="ghost"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit payout address"
                onClick={() => onStartEditPaymentAddress(project.paymentAddress)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          )}
        </DocRow>

        <DocRow label={`Price (${project.currency})`}>
          <p className="font-medium">
            {project.price != null ? `${project.price} ${project.currency}` : "—"}
          </p>
        </DocRow>

        <DocRow label="Payment type">
          <Badge variant="secondary">{paymentTypeLabel(project.currency)}</Badge>
        </DocRow>

        <DocRow label="Pricing model">
          <Badge variant="secondary">{pricingModelLabel(project.pricingModel)}</Badge>
        </DocRow>

        <DocRow label="Created">
          <p className="text-sm text-muted-foreground">
            {formatDate(project.createdAt)}
          </p>
        </DocRow>
      </CardContent>
    </Card>
  );
}
