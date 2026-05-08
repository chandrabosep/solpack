import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PricingModel } from "@/types/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(addr: string, n = 4): string {
  if (!addr) return "";
  if (addr.length <= n * 2 + 3) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function pricingModelLabel(model: PricingModel | string): string {
  const labels: Record<string, string> = {
    per_device: "Per device",
    per_user: "Per user",
    subscription: "Subscription",
  };
  return labels[model] ?? model;
}

export function paymentTypeLabel(currency: string | null | undefined): string {
  if (!currency) return "USDC";
  if (currency === "SOL") return "SOL (native)";
  return "USDC (SPL)";
}
