import { NextRequest, NextResponse } from "next/server";
import { requireWalletAddressFromHeaders } from "@/lib/auth/wallet-auth";
import { getProjectById } from "@/lib/x402/project-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const { id } = await params;
    const project = await getProjectById(id, walletAddress);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
