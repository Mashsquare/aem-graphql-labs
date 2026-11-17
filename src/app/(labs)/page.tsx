import Link from "next/link";
import { labs, parts, type LabPart } from "@/lib/labs";

const order: LabPart[] = ["foundations", "clients", "aem", "classic", "sling"];

const steps = [
  { title: "Read the brief", body: "Each lab starts with a prompt: background, the exact data shapes the API returns, tasks and acceptance criteria." },
  { title: "Edit the starter", body: "Code lives in src/labs/<lab>/. TODOs throw a friendly error until you implement them. The workspace tab hot-reloads." },
  { title: "Check your work", body: "npm test -- <lab number> runs the lab's checks against your code — the same checks the reference solution passes." },
  { title: "Compare", body: "src/solutions/<lab>/ holds the reference implementation and a walkthrough with real-world notes." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-12">
        <p className="mb-3 font-mono text-xs tracking-wider text-accent uppercase">Next.js 16 · TypeScript · GraphQL · AEM as a Cloud Service</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Get fluent in GraphQL for Adobe Experience Manager — before day one.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
          Twenty-three hands-on labs: GraphQL fundamentals on public APIs, the client libraries you&apos;ll meet in real codebases, AEM headless work against a
          mock AEM with Author and Publish tiers, persisted queries, replication and webhooks — and the classic side: HTL and Sling Models passing props to
          React, <code>.model.json</code> exports and the SPA Editor page model — plus a deep dive into how Sling Models work: <code>ValueMap</code> conversion, the <code>adaptTo</code> algorithm, component models and the Jackson exporter.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/labs/01-graphql-over-http" className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
            Start with Lab 01 →
          </Link>
          <Link href="/aem" className="rounded-lg border border-line px-4 py-2 font-medium hover:bg-surface-2">
            AEM GraphQL cheat sheet
          </Link>
          <a href="http://localhost:4503/aem/graphiql.html" target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-2 font-medium hover:bg-surface-2">
            Open GraphiQL ↗
          </a>
        </div>
      </section>

      <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-mono text-xs text-muted">0{index + 1}</p>
            <h2 className="mt-1 font-medium">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </section>

      {order.map((part) => (
        <section key={part} id={part} className="mb-12">
          <h2 className="text-xl font-semibold tracking-tight">{parts[part].title}</h2>
          <p className="mt-1 mb-4 text-sm text-muted">{parts[part].description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {labs
              .filter((lab) => lab.part === part)
              .map((lab) => (
                <Link key={lab.slug} href={`/labs/${lab.slug}`} className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/60">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-medium group-hover:text-accent">
                      <span className="mr-2 font-mono text-xs text-muted">{String(lab.number).padStart(2, "0")}</span>
                      {lab.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted">~{lab.minutes} min</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{lab.summary}</p>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {lab.tools.map((tool) => (
                      <span key={tool} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
                        {tool}
                      </span>
                    ))}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-line bg-surface p-5 text-sm">
        <h2 className="mb-2 font-semibold">Running it</h2>
        <pre className="overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-xs">{`npm run dev            # Next.js on :3000 + mock AEM Author :4502 / Publish :4503
npm test -- 07         # check one lab (your code)
npm run test:solutions # the same checks against the reference solutions
npm run codegen        # regenerate GraphQL types (Labs 06 + 15)
npm run mock:reset     # forget persisted queries / edits / publish state`}</pre>
      </section>
    </div>
  );
}
