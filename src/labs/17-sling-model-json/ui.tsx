/** Provided UI for Lab 17 — four components fetched one by one from their own .model.json. */
import { Badge, JsonPeek, Panel } from "@/components/lab-ui";
import type { ImageModel, TeaserModel, TextModel } from "@/lib/aem/page-model";
import type { TeaserViewModel } from "./types";

export interface ModelApi {
  modelUrl: (path: string) => string;
  fetchModel: <T = unknown>(path: string) => Promise<T>;
  adaptTeaser: (model: TeaserModel) => TeaserViewModel;
  sanitizeRichText: (html: string) => string;
  buildSrcSet: (template: string, widths: number[]) => string;
}

const PAGE = "/content/wknd/us/en/jcr:content/root/container";

function Html({ html }: { html: string }) {
  // The string went through sanitizeRichText — that is the whole point of Task 3.
  return <div className="prose prose-zinc max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function ModelView({ api }: { api: ModelApi }) {
  const [hero, intro, promo, banner] = await Promise.all([
    api.fetchModel<TeaserModel>(`${PAGE}/hero`),
    api.fetchModel<TextModel>(`${PAGE}/intro`),
    api.fetchModel<TextModel>(`${PAGE}/promo`),
    api.fetchModel<ImageModel>(`${PAGE}/banner`),
  ]);
  const teaser = api.adaptTeaser(hero);
  const Heading = teaser.headingLevel;

  return (
    <div className="space-y-6">
      <Panel
        title="Teaser"
        description={<code className="text-xs">GET {api.modelUrl(`${PAGE}/hero`)}</code>}
        actions={<Badge tone="accent">{hero[":type"]}</Badge>}
      >
        <div className="overflow-hidden rounded-xl border border-line">
          {teaser.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- srcset comes from the AEM template (Task 4a)
            <img src={teaser.image.src} srcSet={teaser.image.srcSet} sizes="(min-width: 768px) 700px, 100vw" alt={teaser.image.alt} className="aspect-[16/7] w-full object-cover" />
          ) : null}
          <div className="p-5">
            <Heading className="text-2xl font-semibold">{teaser.href ? <a href={teaser.href}>{teaser.heading}</a> : teaser.heading}</Heading>
            <Html html={teaser.bodyHtml} />
            <p className="mt-3 flex flex-wrap gap-2">
              {teaser.actions.map((action) => (
                <a key={action.id} href={action.href} {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})} className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2">
                  {action.label}
                  {action.external ? " ↗" : ""}
                </a>
              ))}
            </p>
          </div>
        </div>
        <JsonPeek label="raw export" data={hero} />
        <JsonPeek label="your TeaserViewModel" data={teaser} />
      </Panel>

      <Panel title="Rich text from the JSON export" description="The same property HTL would have filtered. Left: what the export contains. Right: what your sanitiser lets through.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted">raw (never render this)</p>
            <pre className="overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-xs whitespace-pre-wrap break-all">{promo.text}</pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted">sanitised</p>
            <Html html={api.sanitizeRichText(promo.text)} />
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-xs whitespace-pre-wrap break-all">{api.sanitizeRichText(promo.text)}</pre>
          </div>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">the benign text component (&quot;intro&quot;)</summary>
          <Html html={api.sanitizeRichText(intro.text)} />
        </details>
      </Panel>

      <Panel title="Image" description="srcUriTemplate -> srcset (Task 4a)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={new URL(banner.src, process.env.NEXT_PUBLIC_AEM_PUBLISH_HOST ?? "http://localhost:4503").toString()}
          srcSet={api.buildSrcSet(banner.srcUriTemplate, banner.widths ?? [320, 640, 1200])}
          sizes="(min-width: 768px) 700px, 100vw"
          alt={banner.alt}
          className="aspect-[16/7] w-full rounded-lg object-cover"
        />
        <JsonPeek label="raw export" data={banner} />
      </Panel>
    </div>
  );
}
