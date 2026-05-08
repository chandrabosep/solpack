import axios from "axios";

export const apiClient = axios.create({
  baseURL: typeof window !== "undefined" ? "" : undefined,
  headers: { "Content-Type": "application/json" },
});

export function apiHeaders(walletAddress: string): Record<string, string> {
  return { "x-wallet-address": walletAddress };
}
