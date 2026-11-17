/** Provided UI for Lab 21 — adapts fixture resources to the example models with YOUR adaptTo. */
import { Badge, JsonPeek, Panel } from "@/components/lab-ui";
import { CONTAINER, createFixtureResolver, fixtureServices, type Adaptable, type ModelContext, type ModelDef } from "@/lib/sling";
import { HeroModel, LenientCard, StrictCard } from "./examples";

export interface AdaptApi {
  adaptTo: <T>(adaptable: Adaptable, def: ModelDef<T>, context?: ModelContext) => T | null;
}

const NODES = ["hero", "no-title-teaser", "featured-hero", "price-empty"];

export function AdaptView({ api }: { api: AdaptApi }) {
  const resolver = createFixtureResolver();
  const context: ModelContext = { services: fixtureServices };
  const models = [StrictCard, LenientCard, HeroModel] as ModelDef<unknown>[];

  const run = (path: string, def: ModelDef<unknown>) => {
    try {
      const result = api.adaptTo(resolver.getResource(path)!, def, context);
      return result === null ? { ok: false as const } : { ok: true as const, value: result };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("TODO:")) return { todo: error.message };
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="resource.adaptTo(Model.class)" description="Rows: four nodes from the fixture. Columns: three models. null = adaptation failed (a required injection found nothing).">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-4">resource</th>
                {models.map((m) => (
                  <th key={m.name} className="py-1 pr-4">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NODES.map((name) => (
                <tr key={name} className="border-t border-line align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{name}</td>
                  {models.map((def) => {
                    const result = run(`${CONTAINER}/${name}`, def);
                    return (
                      <td key={def.name} className="py-2 pr-4">
                        {"todo" in result ? <span className="text-xs text-amber-600">{result.todo}</span> : result.ok ? <Badge tone="ok">adapted</Badge> : <Badge tone="danger">null</Badge>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="The Hero model, injected" description="title (@Named jcr:title, @Required), image (@ChildResource model), actions (@ChildResource List<Model>), a @PostConstruct that uses an @OSGiService.">
        {(() => {
          const result = run(`${CONTAINER}/hero`, HeroModel as ModelDef<unknown>);
          if ("todo" in result) return <p className="text-sm text-amber-600">{result.todo}</p>;
          return result.ok ? <JsonPeek label="the instance (fields only)" data={result.value} /> : <p className="text-sm text-muted">hero did not adapt.</p>;
        })()}
      </Panel>
    </div>
  );
}
