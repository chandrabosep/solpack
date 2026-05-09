import { NextRequest, NextResponse } from "next/server";
import { requireWalletAddressFromHeaders } from "@/lib/auth/wallet-auth";
import { listInstallAttempts } from "@/lib/x402/install-service";
import type { InstallLogEntry, InstallLogEventType } from "@/types/logs";

function mapEventType(status: string): InstallLogEventType {
  switch (status) {
    case "payment_required":
      return "payment_required_x402";
    case "payment_completed":
      return "payment_completed";
    case "allowed":
      return "install_success";
    default:
      return "install_attempt";
  }
}

export async function GET(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "30", 10) || 30,
      100,
    );

    const { items, nextCursor } = await listInstallAttempts({
      walletAddress,
      projectId,
      cursor,
      limit,
    });

    const logs: InstallLogEntry[] = items.map((a) => ({
      id: a.id,
      timestamp: a.createdAt.toISOString(),
      packageName: a.project.name,
      eventType: mapEventType(a.status),
      amount: a.amount ?? null,
      status:
        a.status === "allowed" || a.status === "payment_completed"
          ? "success"
          : "failed",
      projectId: a.projectId,
    }));

    return NextResponse.json({ logs, nextCursor });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
