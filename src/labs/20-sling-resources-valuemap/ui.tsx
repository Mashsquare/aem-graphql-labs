/** Provided UI for Lab 20 — explores the fixture repository with YOUR functions. */
import { Badge, Panel } from "@/components/lab-ui";
import { createFixtureResolver, type Resource, type ResourceResolver, type ValueType, type ValueTypes } from "@/lib/sling";
import { CONTAINER, SITE_ROOT } from "@/lib/sling";

export interface ResourcesApi {
  coerce: <K extends ValueType>(value: unknown, type: K) => ValueTypes[K] | null;
  normalizePath: (path: string) => string | null;
  typeChain: (resolver: ResourceResolver, resource: Resource) => string[];
  isResourceType: (resolver: ResourceResolver, resource: Resource, type: string) => boolean;
  inheritedProperty: <K extends ValueType>(page: Resource, name: string, type: K) => { value: ValueTypes[K]; from: string } | null;
}

const show = (value: unknown) => (value === null ? <span className="text-muted">null</span> : <code>{value instanceof Date ? value.toISOString() : JSON.stringify(value)}</code>);

export function ResourcesView({ api }: { api: ResourcesApi }) {
  const resolver = createFixtureResolver();
  const prices = ["price-early", "price-string-sale", "price-broken", "price-empty"].map((name) => resolver.getResource(`${CONTAINER}/${name}`)!);
  const types: { label: string; type: ValueType; property: string }[] = [
    { label: "amount as double", type: "double", property: "amount" },
    { label: "amount as long", type: "long", property: "amount" },
    { label: "sale as boolean", type: "boolean", property: "sale" },
    { label: "currency as string", type: "string", property: "currency" },
  ];
  const components = ["hero", "featured-hero", "heading", "loop", "spacer"].map((name) => resolver.getResource(`${CONTAINER}/${name}`)!);
  const pages = [SITE_ROOT, `${SITE_ROOT}/adventures/bali-surf-camp`, `${SITE_ROOT}/about`].map((path) => resolver.getResource(path)!);

  return (
    <div className="space-y-6">
      <Panel title="Task 1 · ValueMap coercion" description="Raw property → what get(name, type) returns. Four pricetag nodes, authored 'badly' on purpose.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-4">node</th>
                {types.map((t) => (
                  <th key={t.label} className="py-1 pr-4">
                    {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map((resource) => (
                <tr key={resource.getPath()} className="border-t border-line">
                  <td className="py-1 pr-4 font-mono text-xs">{resource.getName()}</td>
                  {types.map((t) => {
                    const raw = resource.getValueMap().raw(t.property);
                    return (
                      <td key={t.label} className="py-1 pr-4">
                        <span className="text-xs text-muted">{raw === undefined ? "∅" : JSON.stringify(raw)} → </span>
                        {safe(() => show(api.coerce(raw, t.type)))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Task 2 · normalizePath">
        <ul className="space-y-1 font-mono text-xs">
          {["/content//wknd/./us/../us/en/", "/content/wknd/us/en/jcr:content", "/..", "content/wknd", "/"].map((input) => (
            <li key={input}>
              {JSON.stringify(input)} → {safe(() => show(api.normalizePath(input)))}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Task 3 · resource type chain" description="Which component does each node extend? (/apps first, then /libs)">
        <ul className="space-y-3 text-sm">
          {components.map((resource) => (
            <li key={resource.getPath()}>
              <span className="font-mono text-xs">{resource.getName()}</span>{" "}
              {safe(() => (
                <>
                  <span className="text-muted">→</span> {api.typeChain(resolver, resource).map((type, index) => (index === 0 ? <Badge key={type} tone="accent">{type}</Badge> : <span key={type}> ← <Badge>{type}</Badge></span>))}
                  <div className="mt-1 text-xs text-muted">
                    isResourceType(&quot;core/wcm/components/teaser/v2/teaser&quot;) = {String(api.isResourceType(resolver, resource, "core/wcm/components/teaser/v2/teaser"))}
                  </div>
                </>
              ))}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Task 4 · inherited page property" description="footerText is authored on the site root and on /about. Which page does each page get it from?">
        <ul className="space-y-1 text-sm">
          {pages.map((page) => (
            <li key={page.getPath()}>
              <span className="font-mono text-xs">{page.getPath()}</span> → {safe(() => show(api.inheritedProperty(page, "footerText", "string")))}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/** Lets one unfinished task show its TODO message without hiding the sections that already work. */
function safe(render: () => React.ReactNode): React.ReactNode {
  try {
    return render();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("TODO:")) return <span className="text-xs text-amber-600">{error.message}</span>;
    throw error;
  }
}
