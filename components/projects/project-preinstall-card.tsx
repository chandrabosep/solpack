"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

const PLACEHOLDER_PROJECT_ID = "YOUR_PROJECT_ID";
const PLACEHOLDER_API_KEY = "YOUR_API_KEY";
const PLACEHOLDER_HOST = "https://yourapp.com";

function buildSolpackConfig(projectId: string, apiKey: string, baseUrl: string) {
  return `"solpack": {
  "projectId": "${projectId}",
  "apiKey": "${apiKey}",
  "baseUrl": "${baseUrl}"
}`;
}

function buildExamplePackageJson(
  projectId: string,
  apiKey: string,
  baseUrl: string,
  packageName: string,
) {
  return `{
  "name": "${packageName}",
  "version": "1.0.0",
  "scripts": {
    "preinstall": "node ./preinstall.js"
  },
  "files": ["preinstall.js"],
  "engines": {
    "node": ">=18.0.0"
  },
  "solpack": {
    "projectId": "${projectId}",
    "apiKey": "${apiKey}",
    "baseUrl": "${baseUrl}"
  }
}`;
}

function CodeBlock({
  label,
  value,
  copyLabel = "Copy",
}: {
  label: string;
  value: string;
  copyLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground font-mono">
          {label}
        </span>
        <CopyButton
          value={value}
          label={copyLabel}
          buttonText="Copy"
          size="xs"
          variant="ghost"
          className="h-7"
        />
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs font-mono leading-relaxed whitespace-pre">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-200">
      <span className="font-semibold text-amber-100">Note:</span> {children}
    </div>
  );
}

export function ProjectPreinstallCard({
  preinstallScript,
  projectId,
  apiKey,
  baseUrl,
  packageName,
}: {
  preinstallScript: string;
  projectId?: string;
  apiKey?: string;
  baseUrl?: string;
  packageName?: string;
}) {
  const effectiveProjectId = projectId?.trim() || PLACEHOLDER_PROJECT_ID;
  const effectiveApiKey = apiKey?.trim() || PLACEHOLDER_API_KEY;
  const effectiveHost = baseUrl?.trim() || PLACEHOLDER_HOST;
  const effectivePackageName = packageName?.trim() || "your-paid-package";
  const solpackConfig = buildSolpackConfig(
    effectiveProjectId,
    effectiveApiKey,
    effectiveHost,
  );
  const examplePackageJson = buildExamplePackageJson(
    effectiveProjectId,
    effectiveApiKey,
    effectiveHost,
    effectivePackageName,
  );

  return (
    <Card id="integration-guide" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">
          Integration guide
        </CardTitle>
        <CardDescription>
          Add the preinstall script to your package so installs are validated
          against this project. The script reads the <code>solpack</code>{" "}
          config from <code>package.json</code>, prints the cost up front, and
          only proceeds once payment is verified on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-foreground text-xs font-bold">
              1
            </span>
            Open your package
          </h3>
          <p className="text-sm text-muted-foreground pl-8">
            Open your package root in any editor (same folder as{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              package.json
            </code>
            ).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-foreground text-xs font-bold">
              2
            </span>
            Add the preinstall script
          </h3>
          <p className="text-sm text-muted-foreground pl-8">
            Create a file named{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              preinstall.js
            </code>{" "}
            in your package root and paste the code below. It prints the cost
            and a refusal path before opening the payment URL — keep that
            messaging intact.
          </p>
          <div className="pl-8">
            <CodeBlock
              label="preinstall.js"
              value={preinstallScript}
              copyLabel="Copy preinstall script"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-foreground text-xs font-bold">
              3
            </span>
            Update package.json
          </h3>
          <p className="text-sm text-muted-foreground pl-8">
            Add the following fields to your{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              package.json
            </code>
            . Use the Project ID, API key, and app URL from the Credentials
            section above.
          </p>

          <Note>
            Use the{" "}
            <code className="rounded bg-amber-300/20 px-1 py-0.5 font-mono">
              preinstall
            </code>{" "}
            script (not{" "}
            <code className="rounded bg-amber-300/20 px-1 py-0.5 font-mono">
              install
            </code>
            ). It runs before dependencies are installed.
          </Note>

          <div className="space-y-4 pl-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                scripts
              </p>
              <CodeBlock
                label="package.json"
                value={`"scripts": {
  ...
  "preinstall": "node ./preinstall.js"
},`}
                copyLabel="Copy scripts snippet"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                files (publish only the script)
              </p>
              <CodeBlock
                label="package.json"
                value={'"files": ["preinstall.js"]'}
                copyLabel="Copy files snippet"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                engines (Node &gt;= 18 for fetch)
              </p>
              <CodeBlock
                label="package.json"
                value={'"engines": {\n  "node": ">=18.0.0"\n}'}
                copyLabel="Copy engines snippet"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                solpack config (projectId, apiKey, baseUrl)
              </p>
              <CodeBlock
                label="package.json"
                value={solpackConfig}
                copyLabel="Copy solpack config"
              />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Example package.json</h3>
          <p className="text-sm text-muted-foreground">
            Full example with all required fields. Replace placeholders with
            your Project ID, API key, and host from Credentials above.
          </p>
          <CodeBlock
            label="package.json"
            value={examplePackageJson}
            copyLabel="Copy example package.json"
          />
        </section>

        <p className="text-sm text-muted-foreground border-t border-border/60 pt-4">
          Drop{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            preinstall.js
          </code>{" "}
          in your package root (same folder as{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            package.json
          </code>
          ). No <code>.env</code> required — config lives in package.json.
        </p>
      </CardContent>
    </Card>
  );
}
