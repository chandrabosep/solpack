import { readFile } from "fs/promises";
import { join } from "path";
import { ProjectDetailPage } from "@/components/projects/project-detail-page";

/** Server component: reads the preinstall script template and passes it down. */
export default async function ProjectDetailRoute() {
  const scriptPath = join(process.cwd(), "config/package/preinstall.js");
  let preinstallScript = "";
  try {
    preinstallScript = await readFile(scriptPath, "utf-8");
  } catch {
    preinstallScript = "// preinstall.js template not found";
  }
  const appHost =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return <ProjectDetailPage preinstallScript={preinstallScript} appHost={appHost} />;
}
