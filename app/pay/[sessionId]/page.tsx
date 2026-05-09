import { redirect } from "next/navigation";

/**
 * Legacy path — the pay page now lives at /pay?session=<token>. Keep this
 * redirect so old links still resolve.
 */
export default async function LegacyPayRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/pay?session=${encodeURIComponent(sessionId)}`);
}
