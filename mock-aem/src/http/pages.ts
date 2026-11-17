import type { ContentFragment, PersistedQuery, Tier } from "../types";
import { getModel } from "../models";
import type { MockAemStore } from "../store";

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const styles = `
  :root { color-scheme: light dark; --accent: #eb1000; --muted: #6b7280; --line: #e5e7eb; --bg: #fff; --card: #f9fafb; }
  @media (prefers-color-scheme: dark) { :root { --line: #2d3340; --bg: #0f1115; --card: #171a21; --muted: #9ca3af; } }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 system-ui, sans-serif; background: var(--bg); }
  header { display: flex; gap: 16px; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--line); }
  header strong { font-size: 15px; } header .tier { padding: 2px 8px; border-radius: 999px; background: var(--accent); color: white; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
  header nav { margin-left: auto; display: flex; gap: 14px; } a { color: inherit; }
  main { padding: 20px; max-width: 1200px; }
  h2 { margin: 28px 0 8px; font-size: 16px; }
  table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
  code, .mono { font-family: ui-monospace, monospace; font-size: 12px; }
  .pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; white-space: nowrap; }
  .pill.ok { background: #dcfce7; color: #166534; } .pill.warn { background: #fef3c7; color: #92400e; } .pill.off { background: #e5e7eb; color: #374151; }
  form.inline { display: inline; } button { font: inherit; padding: 3px 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--card); cursor: pointer; }
  button.primary { background: var(--accent); color: white; border-color: var(--accent); }
  .muted { color: var(--muted); } .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 12px 0; }
  label { display: block; margin: 10px 0 4px; font-weight: 600; } input[type=text], input[type=number], input[type=date], select { width: 100%; max-width: 520px; padding: 6px 8px; font: inherit; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: inherit; }
`;

function layout(tier: Tier, title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Mock AEM ${tier}</title><style>${styles}</style></head><body>
<header><strong>Mock AEM</strong><span class="tier">${tier}</span><span class="muted">${esc(title)}</span>
<nav><a href="/">Home</a><a href="/aem/graphiql.html">GraphiQL</a><a href="/graphql/list.json">Persisted queries</a>${tier === "author" ? `<a href="/mock/console">Console</a>` : ""}</nav></header>
<main>${body}</main></body></html>`;
}

export function homePage(tier: Tier, configurationName: string, origins: { author: string; publish: string }): string {
  const endpoint = `/content/cq:graphql/${configurationName}/endpoint.json`;
  return layout(
    tier,
    "Home",
    `
<p>This is the <b>${tier}</b> tier of the mock AEM as a Cloud Service backend used by the GraphQL labs.
${tier === "author" ? "Every request needs <code>Authorization</code> (Basic admin:admin or Bearer &lt;dev token&gt;). Author shows drafts." : "Publish is anonymous and only serves replicated (published) content."}</p>
<div class="card"><table>
<tr><th>What</th><th>Request</th></tr>
<tr><td>GraphQL endpoint</td><td><code>POST ${esc(endpoint)}</code></td></tr>
<tr><td>Schema (SDL)</td><td><a href="/content/cq:graphql/${esc(configurationName)}/endpoint.GQLschema"><code>GET /content/cq:graphql/${esc(configurationName)}/endpoint.GQLschema</code></a></td></tr>
<tr><td>GraphiQL IDE</td><td><a href="/aem/graphiql.html"><code>GET /aem/graphiql.html</code></a></td></tr>
<tr><td>Run a persisted query</td><td><a href="/graphql/execute.json/${esc(configurationName)}/adventures-all"><code>GET /graphql/execute.json/${esc(configurationName)}/adventures-all</code></a></td></tr>
<tr><td>…with variables</td><td><a href="/graphql/execute.json/${esc(configurationName)}/adventure-by-slug;slug=bali-surf-camp"><code>GET /graphql/execute.json/${esc(configurationName)}/adventure-by-slug;slug=bali-surf-camp</code></a></td></tr>
<tr><td>List persisted queries</td><td><a href="/graphql/list.json"><code>GET /graphql/list.json</code></a></td></tr>
${
  tier === "author"
    ? `<tr><td>Create / update a persisted query</td><td><code>PUT|POST /graphql/persist.json/${esc(configurationName)}/&lt;name&gt;</code></td></tr>
<tr><td>Publish / unpublish</td><td><code>POST /bin/replicate.json</code> <span class="muted">cmd=activate|deactivate, path=…</span></td></tr>
<tr><td>Authoring console</td><td><a href="/mock/console">/mock/console</a> <span class="muted">(edit + publish fragments)</span></td></tr>`
    : ""
}
<tr><td>DAM asset</td><td><code>GET /content/dam/…</code></td></tr>
<tr><td>Web-optimized image</td><td><code>GET /adobe/dynamicmedia/deliver/dm-aid--&lt;uuid&gt;/&lt;name&gt;.&lt;ext&gt;?width=…</code></td></tr>
</table></div>
<p class="muted">Other tier: <a href="${tier === "author" ? origins.publish : origins.author}">${tier === "author" ? origins.publish : origins.author}</a></p>`,
  );
}

export function graphiqlPage(tier: Tier, configurationName: string): string {
  const endpoint = `/content/cq:graphql/${configurationName}/endpoint.json`;
  const defaultQuery = `# Welcome to the mock AEM ${tier} GraphiQL IDE.
# Endpoint: ${endpoint}
# Tip: open the Explorer (compass icon) to click queries together.

query AdventureCards {
  adventureList(_locale: "en", sort: "price ASC", limit: 5) {
    items {
      _path
      title
      activity
      price
      primaryImage {
        ... on ImageRef {
          _dynamicUrl
        }
      }
    }
  }
}
`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>GraphiQL — Mock AEM ${tier}</title>
<link rel="stylesheet" href="https://unpkg.com/graphiql@3.8.3/graphiql.min.css">
<link rel="stylesheet" href="https://unpkg.com/@graphiql/plugin-explorer@3.2.6/dist/style.css">
<style>html,body{margin:0;height:100%;font-family:system-ui,sans-serif} body{display:flex;flex-direction:column}
.bar{display:flex;gap:16px;align-items:center;padding:6px 14px;background:#1d1f24;color:#e5e7eb;font-size:13px}
.bar b{color:#fff}.bar .tier{background:#eb1000;color:#fff;border-radius:999px;padding:1px 8px;font-size:11px;text-transform:uppercase}
.bar a{color:#cbd5e1;margin-left:auto}#graphiql{flex:1;min-height:0}</style></head><body>
<div class="bar"><b>Mock AEM</b><span class="tier">${tier}</span><code>${esc(endpoint)}</code><a href="/">endpoints &amp; docs</a></div>
<div id="graphiql">Loading GraphiQL…</div>
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script crossorigin src="https://unpkg.com/graphiql@3.8.3/graphiql.min.js"></script>
<script crossorigin src="https://unpkg.com/@graphiql/plugin-explorer@3.2.6/dist/index.umd.js"></script>
<script>
  const fetcher = GraphiQL.createFetcher({ url: ${JSON.stringify(endpoint)} });
  const explorer = GraphiQLPluginExplorer.explorerPlugin();
  ReactDOM.createRoot(document.getElementById("graphiql")).render(
    React.createElement(GraphiQL, {
      fetcher,
      plugins: [explorer],
      defaultQuery: ${JSON.stringify(defaultQuery)},
      defaultEditorToolsVisibility: true,
    }),
  );
</script></body></html>`;
}

function statusPill(store: MockAemStore, fragment: ContentFragment): string {
  if (!fragment.published) return `<span class="pill off">Draft — not on Publish</span>`;
  if (store.isOutdatedOnPublish(fragment)) return `<span class="pill warn">Modified since publish</span>`;
  return `<span class="pill ok">Published</span>`;
}

const replicateButtons = (path: string, published: boolean) => `
<form class="inline" method="post" action="/mock/console/replicate"><input type="hidden" name="path" value="${esc(path)}">
<input type="hidden" name="cmd" value="activate"><button class="primary">Publish</button></form>
${published ? `<form class="inline" method="post" action="/mock/console/replicate"><input type="hidden" name="path" value="${esc(path)}"><input type="hidden" name="cmd" value="deactivate"><button>Unpublish</button></form>` : ""}`;

export function consolePage(store: MockAemStore, flash?: string): string {
  const groups = ["adventure", "article", "author", "location"].map((modelName) => {
    const model = getModel(modelName);
    const rows = store
      .fragmentsOfModel(modelName)
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(
        (fragment) => `<tr>
<td><b>${esc(fragment.content.master.title ?? fragment.title)}</b><br><span class="mono muted">${esc(fragment.path)}</span></td>
<td>${statusPill(store, fragment)}<br><span class="muted">modified ${esc(fragment.lastModified.slice(0, 16).replace("T", " "))} by ${esc(fragment.lastModifiedBy)}</span></td>
<td><a href="/mock/console/edit?path=${encodeURIComponent(fragment.path)}">Edit</a> ${replicateButtons(fragment.path, fragment.published !== null)}</td></tr>`,
      )
      .join("");
    return `<h2>${esc(model.title)} fragments</h2><table><tr><th>Fragment</th><th>Status</th><th>Actions</th></tr>${rows}</table>`;
  });

  const queries = [...store.persistedQueries.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((query: PersistedQuery) => {
      const repoPath = `/conf/${query.configurationName}/settings/graphql/persistentQueries/${query.name}`;
      return `<tr><td><b>${esc(query.configurationName)}/${esc(query.name)}</b><br><span class="mono muted">${esc(repoPath)}</span></td>
<td>${query.published ? `<span class="pill ok">Published</span>` : `<span class="pill off">Author only</span>`} <span class="muted">${esc(query.origin)}</span></td>
<td><a href="/graphql/execute.json/${esc(query.configurationName)}/${esc(query.name)}">Run on Author</a> ${replicateButtons(repoPath, query.published)}
<form class="inline" method="post" action="/mock/console/delete-query"><input type="hidden" name="name" value="${esc(query.configurationName)}/${esc(query.name)}"><button>Delete</button></form></td></tr>`;
    })
    .join("");

  return layout(
    "author",
    "Authoring console",
    `${flash ? `<div class="card">${esc(flash)}</div>` : ""}
<p class="muted">Simulates the AEM Assets / Content Fragment editor: edit a fragment on Author, then <b>Publish</b> it (replication) to make the change visible on Publish.
Every (un)publish also sends an AEM-Eventing-style webhook to the Next.js app.</p>
<h2>Persisted queries</h2><table><tr><th>Query</th><th>Status</th><th>Actions</th></tr>${queries}</table>
${groups.join("")}`,
  );
}

const EDITABLE = new Set(["single-line-text", "number", "boolean", "enumeration", "date-time"]);

export function editPage(fragment: ContentFragment): string {
  const model = getModel(fragment.model);
  const inputs = model.fields
    .filter((field) => EDITABLE.has(field.type) && !("multiple" in field && field.multiple))
    .map((field) => {
      const value = fragment.content.master[field.name];
      const id = `f-${field.name}`;
      switch (field.type) {
        case "boolean":
          return `<label><input type="checkbox" name="${field.name}" value="true" ${value ? "checked" : ""}> ${esc(field.label)}</label><input type="hidden" name="__bool" value="${field.name}">`;
        case "enumeration":
          return `<label for="${id}">${esc(field.label)}</label><select id="${id}" name="${field.name}">${field.options
            .map((option) => `<option ${option === value ? "selected" : ""}>${esc(option)}</option>`)
            .join("")}</select>`;
        case "number":
          return `<label for="${id}">${esc(field.label)}</label><input id="${id}" type="number" step="${field.numberType === "integer" ? "1" : "0.01"}" name="${field.name}" value="${esc(value)}"><input type="hidden" name="__number" value="${field.name}">`;
        case "date-time":
          return `<label for="${id}">${esc(field.label)}</label><input id="${id}" type="${field.flavor === "date" ? "date" : "text"}" name="${field.name}" value="${esc(value)}">`;
        default:
          return `<label for="${id}">${esc(field.label)}</label><input id="${id}" type="text" name="${field.name}" value="${esc(value)}">`;
      }
    })
    .join("");
  return layout(
    "author",
    `Edit ${fragment.title}`,
    `<p><a href="/mock/console">← Back to console</a></p>
<p class="muted">Editing the <b>master</b> variation of <code>${esc(fragment.path)}</code> (${esc(model.title)} model). Rich text, references and variations are read-only here.</p>
<form method="post" action="/mock/console/edit"><input type="hidden" name="path" value="${esc(fragment.path)}">${inputs}
<p><button class="primary" type="submit">Save on Author</button> <span class="muted">— remember to publish afterwards</span></p></form>`,
  );
}
