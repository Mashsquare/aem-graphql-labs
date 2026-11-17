/** Provided UI for Lab 22 — adapts fixture nodes with YOUR model definitions and reads them like HTL does. */
import { Badge, JsonPeek, Panel } from "@/components/lab-ui";
import { adaptTo, CONTAINER, createFixtureResolver, fixtureServices, SITE_ROOT, type Resource, type SlingRequest } from "@/lib/sling";
import type * as Models from "./models";

export interface ComponentsApi {
  resolveProperty: (target: unknown, name: string) => unknown;
  toBoolean: (value: unknown) => boolean;
  models: typeof Models;
}

const context = { services: fixtureServices };

const show = (value: unknown) => <code className="text-xs">{value === undefined ? "undefined" : JSON.stringify(value)}</code>;

function Todo({ error }: { error: unknown }) {
  if (error instanceof Error && error.message.startsWith("TODO:")) return <p className="text-xs text-amber-600">{error.message}</p>;
  throw error;
}

export function ComponentsView({ api }: { api: ComponentsApi }) {
  const resolver = createFixtureResolver();
  const at = (name: string) => resolver.getResource(`${CONTAINER}/${name}`)!;
  const page = (path: string) => resolver.getResource(`${SITE_ROOT}${path}`)!;
  const { models } = api;

  /** What a template author writes -> what HTL would print / how data-sly-test would branch. */
  const htl = (model: unknown, expressions: string[]) => (
    <table className="mt-2 w-full text-left text-sm">
      <tbody>
        {expressions.map((expression) => {
          let value: unknown = model;
          try {
            for (const segment of expression.split(".").slice(1)) value = api.resolveProperty(value, segment);
          } catch (error) {
            return (
              <tr key={expression}>
                <td colSpan={3}>
                  <Todo error={error} />
                </td>
              </tr>
            );
          }
          return (
            <tr key={expression} className="border-t border-line">
              <td className="py-1 pr-3 font-mono text-xs">{"${" + expression + "}"}</td>
              <td className="py-1 pr-3">{show(value)}</td>
              <td className="py-1 text-xs text-muted">data-sly-test: {String(safeBool(api.toBoolean, value))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const adapt = (adaptable: Resource | SlingRequest, def: Parameters<typeof adaptTo>[1]) => adaptTo(adaptable, def, context);

  return (
    <div className="space-y-6">
      <Panel title="PriceTag" description="Four nodes with increasingly bad data: a clean one, 'true' as text, 'abc' as the amount, and an empty node.">
        <div className="grid gap-4 md:grid-cols-2">
          {["price-early", "price-string-sale", "price-broken", "price-empty"].map((name) => {
            const model = adapt(at(name), models.PriceTagModel as never);
            return (
              <div key={name} className="rounded-lg border border-line p-3">
                <p className="mb-1 font-mono text-xs">
                  {name} {model ? <Badge tone="ok">adapted</Badge> : <Badge tone="danger">null</Badge>}
                </p>
                {model ? htl(model, ["model.amount", "model.sale", "model.isSale", "model.label", "model.formatted"]) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Teaser" description="hero is fully authored; featured-hero has no image or actions; no-title-teaser has no title.">
        <div className="grid gap-4 md:grid-cols-2">
          {["hero", "featured-hero", "no-title-teaser"].map((name) => {
            const model = adapt(at(name), models.TeaserModel as never);
            return (
              <div key={name} className="rounded-lg border border-line p-3">
                <p className="mb-1 font-mono text-xs">
                  {name} {model ? <Badge tone="ok">adapted</Badge> : <Badge tone="danger">null</Badge>}
                </p>
                {model ? htl(model, ["teaser.title", "teaser.titleType", "teaser.href", "teaser.image", "teaser.actionsEnabled", "teaser.actions"]) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Breadcrumb (adapted from a request)" description="currentPage comes from the script bindings, like in a real HTL request.">
        <ul className="space-y-2 text-sm">
          {["/adventures/bali-surf-camp", "/about", ""].map((suffix) => {
            const request: SlingRequest = { kind: "request", resource: at("breadcrumb"), attributes: {}, bindings: { currentPage: page(suffix) } };
            const model = adapt(request, models.BreadcrumbModel as never) as InstanceType<typeof models.Breadcrumb> | null;
            return (
              <li key={suffix}>
                <span className="font-mono text-xs">currentPage = …/en{suffix}</span> →{" "}
                {model ? model.getItems().map((crumb) => <span key={crumb.href}>{crumb.active ? <b>{crumb.title}</b> : crumb.title} › </span>) : <Badge tone="danger">null</Badge>}
                {model && model.getItems().length === 0 ? <span className="text-xs text-muted">(no items yet — Task 4)</span> : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Navigation" description="Two levels of child pages under the navigation root; hideInNav pages are skipped.">
        {(() => {
          const model = adapt(at("navigation"), models.NavigationModel as never) as InstanceType<typeof models.Navigation> | null;
          if (!model) return <Badge tone="danger">null</Badge>;
          return (
            <>
              {model.getItems().length === 0 ? <p className="text-xs text-muted">(no items yet — Task 5)</p> : null}
              <ul className="text-sm">
                {model.getItems().map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.title}</a>
                    <ul className="ml-5 list-disc">
                      {item.children.map((childItem) => (
                        <li key={childItem.href}>{childItem.title}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <JsonPeek label="getItems()" data={model.getItems()} />
            </>
          );
        })()}
      </Panel>
    </div>
  );
}

function safeBool(toBoolean: (value: unknown) => boolean, value: unknown) {
  try {
    return toBoolean(value);
  } catch {
    return "?";
  }
}
