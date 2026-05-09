import { NextRequest, NextResponse } from "next/server";
import { requireWalletAddressFromHeaders } from "@/lib/auth/wallet-auth";
import { getDashboardStats } from "@/lib/x402/install-service";

export async function GET(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const dateFromRaw = searchParams.get("dateFrom");
    const dateToRaw = searchParams.get("dateTo");

    const dateFrom = dateFromRaw ? new Date(dateFromRaw) : undefined;
    const dateTo = dateToRaw ? new Date(dateToRaw) : undefined;
    if (dateFrom && isNaN(dateFrom.getTime())) {
      return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
    }
    if (dateTo && isNaN(dateTo.getTime())) {
      return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
    }

    const stats = await getDashboardStats({
      walletAddress,
      projectId,
      dateFrom,
      dateTo,
    });
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
