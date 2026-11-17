import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/lab-ui";
import { Markdown } from "@/components/markdown";
import { aemConfig } from "@/lib/aem/config";
import { readProjectFile } from "@/lib/lab-files";

export const metadata: Metadata = { title: "The mock AEM backend" };

async function TierStatus() {
  await connection();
  const { authorHost, publishHost } = aemConfig();
  const probe = async (label: string, host: string) => {
    try {
      const response = await fetch(`${host}/mock/health`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
      return { label, host, up: response.ok };
    } catch {
      return { label, host, up: false };
    }
  };
  const tiers = await Promise.all([probe("Author", authorHost), probe("Publish", publishHost)]);
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {tiers.map((tier) => (
        <a key={tier.label} href={tier.host} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <Badge tone={tier.up ? "ok" : "danger"}>{tier.up ? "running" : "not reachable"}</Badge>
          {tier.label} <span className="font-mono text-xs text-muted">{tier.host}</span>
        </a>
      ))}
    </div>
  );
}

export default function MockAemPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">The mock AEM backend</h1>
      <p className="mt-2 mb-6 text-muted">
        An AEM as a Cloud Service stand-in for the labs. Source: <code>mock-aem/</code>.
      </p>
      <Suspense fallback={<div className="mb-8 h-10" />}>
        <TierStatus />
      </Suspense>
      <Markdown source={readProjectFile("mock-aem/README.md") ?? ""} />
    </div>
  );
}
