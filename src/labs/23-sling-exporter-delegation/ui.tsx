/** Provided UI for Lab 23 — exports the fixture page with YOUR serializer, selector and delegation. */
import { Badge, JsonPeek, Panel } from "@/components/lab-ui";
import { adaptTo, CONTAINER, createFixtureResolver, fixtureServices, SITE_ROOT, type ModelContext, type ModelDef, type ModelRegistry, type Resource } from "@/lib/sling";
import { createRegistry } from "./models";

export interface ExporterApi {
  serialize: (value: unknown, registry: ModelRegistry) => unknown;
  selectModel: (registry: ModelRegistry, resource: Resource) => ModelDef<unknown> | null;
  wrapAsSuperType: (resource: Resource) => Resource | null;
  exportResource: (resource: Resource, registry: ModelRegistry, context: ModelContext) => Record<string, unknown> | null;
}

function guarded<T>(render: () => T, fallback: (message: string) => T): T {
  try {
    return render();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("TODO:")) return fallback(error.message);
    throw error;
  }
}

export function ExporterView({ api }: { api: ExporterApi }) {
  const resolver = createFixtureResolver();
  const registry = createRegistry();
  const context: ModelContext = { services: fixtureServices, registry, hooks: { wrapAsSuperType: api.wrapAsSuperType, selectModel: api.selectModel } };
  const at = (name: string) => resolver.getResource(`${CONTAINER}/${name}`)!;
  const todoNote = (message: string) => <p className="text-xs text-amber-600">{message}</p>;

  return (
    <div className="space-y-6">
      <Panel title="Task 2 · which model for which component?" description="selectModel walks the super type chain. spacer and the price tags have no model.">
        {guarded(
          () => (
            <ul className="space-y-1 text-sm">
              {["hero", "featured-hero", "heading", "intro", "spacer", "price-early"].map((name) => {
                const def = api.selectModel(registry, at(name));
                return (
                  <li key={name}>
                    <span className="font-mono text-xs">{name}</span> <span className="text-muted">({at(name).getResourceType()})</span> →{" "}
                    {def ? <Badge tone="accent">{def.name}</Badge> : <Badge>no model</Badge>}
                  </li>
                );
              })}
            </ul>
          ),
          todoNote,
        )}
      </Panel>

      <Panel title="Task 3 · delegation" description="The project's WkndTeaser asks for the Core teaser of the same resource and builds on it.">
        {guarded(
          () => {
            const hero = at("hero");
            const wrapped = api.wrapAsSuperType(hero);
            const core = wrapped && adaptTo(wrapped, api.selectModel(registry, wrapped)!, context);
            return (
              <>
                <p className="text-sm">
                  hero is a <code>{hero.getResourceType()}</code>; wrapped, it claims to be <code>{wrapped?.getResourceType() ?? "—"}</code>.
                </p>
                <JsonPeek label="the Core model for the same resource, serialised" data={core ? api.serialize(core, registry) : null} />
              </>
            );
          },
          todoNote,
        )}
      </Panel>

      <Panel title="Task 1 + 4 · the export" description="What GET …/hero.model.json and the container's .model.json would return.">
        {guarded(
          () => (
            <>
              <JsonPeek label={`${at("hero").getPath()}.model.json`} data={api.exportResource(at("hero"), registry, context)} />
              <JsonPeek label={`${at("featured-hero").getPath()}.model.json (a proxy with NO model of its own)`} data={api.exportResource(at("featured-hero"), registry, context)} />
              <JsonPeek label={`${SITE_ROOT}/jcr:content.model.json`} data={api.exportResource(resolver.getResource(`${SITE_ROOT}/jcr:content`)!, registry, context)} />
            </>
          ),
          todoNote,
        )}
      </Panel>
    </div>
  );
}
