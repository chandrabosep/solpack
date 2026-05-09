import { NextRequest, NextResponse } from "next/server";
import {
  projectCreateSchema,
  projectRotateSchema,
  projectUpdateSchema,
} from "@/types/schemas";
import { requireWalletAddressFromHeaders } from "@/lib/auth/wallet-auth";
import {
  createProject,
  deleteProject,
  listProjects,
  rotateApiKey,
  updateProject,
} from "@/lib/x402/project-service";

export async function GET(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const projects = await listProjects(walletAddress);
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const body = projectCreateSchema.parse(await req.json());
    const project = await createProject(body, walletAddress);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const body = await req.json();
    const hasUpdate =
      body.paymentAddress !== undefined ||
      body.currency !== undefined ||
      body.price !== undefined ||
      body.pricingModel !== undefined;
    if (hasUpdate) {
      const parsed = projectUpdateSchema.parse(body);
      const project = await updateProject(parsed.projectId, walletAddress, {
        paymentAddress: parsed.paymentAddress,
        currency: parsed.currency,
        price: parsed.price,
        pricingModel: parsed.pricingModel,
      });
      return NextResponse.json(project);
    }
    const parsed = projectRotateSchema.parse(body);
    const apiKey = await rotateApiKey(parsed.projectId, walletAddress);
    return NextResponse.json(apiKey);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const walletAddress = requireWalletAddressFromHeaders(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }
    const result = await deleteProject(projectId, walletAddress);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
