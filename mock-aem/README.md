## What it is

A small Node.js server (no framework, `graphql-js` for execution) that behaves like **AEM as a Cloud Service** for headless GraphQL work. It starts two tiers — like the local AEM SDK — on the same in-memory content:

| Tier | URL | Auth | Content |
| --- | --- | --- | --- |
| Author | `http://localhost:4502` | `Basic admin:admin` or `Bearer mock-local-dev-token` | working copies, drafts, unpublished edits |
| Publish | `http://localhost:4503` | anonymous | only what was replicated |

`npm run dev` starts it together with Next.js (`npm run mock` alone). Content and models are plain TypeScript in [`src/content/`](./src/content) and [`src/models.ts`](./src/models.ts); the GraphQL schema is **generated from the models**, like AEM does.

## Endpoints

| Request | Notes |
| --- | --- |
| `POST /content/cq:graphql/wknd-shared/endpoint.json` | ad-hoc queries (also `/content/_cq_graphql/…` and `/content/graphql/…`). `GET ?query=` works too. Other configurations → 404. |
| `GET /content/cq:graphql/wknd-shared/endpoint.GQLschema` | the schema as SDL |
| `GET /aem/graphiql.html` | GraphiQL IDE with the Explorer plugin (loads from unpkg.com) |
| `GET /graphql/execute.json/wknd-shared/<name>;var=value` | persisted queries; encoded (`%3B…`) or raw matrix params; also `POST` with `{ "variables": … }` |
| `PUT` / `POST` / `DELETE /graphql/persist.json/wknd-shared/<name>` | Author only: create (409 if it exists) / update (404 if missing) / delete. Body: raw query or `{ "query", "cache-control", "surrogate-control" }` |
| `GET /graphql/list.json` | persisted queries (Author: all, Publish: published) |
| `POST /bin/replicate.json` | Author only: `cmd=activate\|deactivate`, `path=<fragment path or /conf/…/persistentQueries/<name>>` (urlencoded, multipart or JSON) |
| `GET /content/dam/…` | DAM originals: placeholder SVG images and tiny PDFs |
| `GET /adobe/dynamicmedia/deliver/dm-aid--<uuid>/<name>.<ext>?width=&quality=&…` | web-optimized delivery; the image shows the delivered size/quality/format in a badge |
| `GET /mock/console` | Author only: edit fragments, publish/unpublish fragments and persisted queries |
| `GET /content/wknd/us/en/<page>.html` | **classic site**: HTL-style HTML with React mount points (`/en`, `/en/adventures`, `/en/featured`). Author adds `data-cq-data-path` unless `?wcmmode=disabled` |
| `GET /content/wknd/us/en/<page>.model.json` | page model (`:items`, `:itemsOrder`, `:type`, `:path`); `<page>/jcr:content/root/…/<component>.model.json` for one component |
| `GET …/<path>.infinity.json` (also `.tidy.json`, `.1.json`) | 403 — the default JSON renderer is blocked, like on Publish |
| `GET …/<component>.coreimg{.width}.jpeg/<ts>/<uuid>/<file>` | Core Image renditions (placeholder SVG at the requested width) |
| `GET /mock/health` | no auth; used by scripts and tests |

## Behaviour modelled on AEM

- **Schema naming**: `<model>ByPath`, `<model>List`, `<model>Paginated`, `<Model>Model`, `<Model>ModelFilter`, `MultiFormatString`, `Reference`/`ImageRef`/`DocumentRef`, `_references`, `TypedMetaData`.
- **Filtering**: `_expressions`, `_operator` (strings `EQUALS…`, numbers `EQUAL…`, dates `AT…`), `_logOp`, `_ignoreCase`, `_sensitiveness`, arrays with `_apply`/`values`, nested filters on fragment references and `_match` for multi-references.
- **Sorting** with `"field DIR, field2"` incl. nested `location.country`; **paging** with `offset/limit` (no totals) and cursors (`first` ≤ 100).
- **Variations** with silent master fallback, `includeVariations`; **locales** via `_locale` (language folders `en`, `de`).
- **Rich text** in four formats; `json` uses AEM's node types; inline references are returned by `_references`.
- **`_assetTransform` → `_dynamicUrl`** (relative URLs), `_authorUrl`, `_publishUrl`.
- **Author vs Publish**: drafts and unpublished edits only on Author; references to unpublished fragments resolve to `null` on Publish.
- **Persisted queries**: create on Author, invisible on Publish until replicated; default cache headers `Cache-Control: max-age=60` and `Surrogate-Control: max-age=7200, stale-while-revalidate=86400, stale-if-error=86400` (Author: `max-age=60`), per-query overrides.
- **Errors**: HTTP 200 with `extensions.classification` (`InvalidSyntax`, `ValidationError`, `DataFetchingException`).
- **CORS**: only origins in `MOCK_AEM_CORS_ALLOWED_ORIGINS` get CORS headers (default `http://localhost:3000`); preflight handled before auth.
- **Eventing**: every (un)publish POSTs a CloudEvent (`aem.sites.contentFragment.published`, …) to `MOCK_AEM_WEBHOOK_URLS` with an `x-aem-webhook-secret` header.

## The classic site

Three pages under `/content/wknd/us/en` (`mock-aem/src/content/sites.ts`): the home page (Core-Component-style Teaser/Title/Text/Image, one deliberately hostile text), `/adventures` (custom components rendered as React mount points: data attributes, `data-props` JSON, JSON script tag) and `/featured` (fragment-referencing cards for the hybrid lab). Used by Labs 16–19. The content is static and does not follow Author edits.

## Where it is simplified

- Error *messages* come from graphql-js, not graphql-java — the classification and structure match, the wording differs.
- `list.json` and the persist/replicate responses are simplified shapes; real AEM returns more fields.
- The classic site is a fixed tree: no dialogs, no template/policy model, no Dispatcher, no `:children` hierarchy, and a simplified Teaser export.
- One Sites configuration (`wknd-shared`), four models, two languages. No `_smartCrops`, `_dmS7Url`, `ById` queries, query-complexity limits, or Dispatcher/CDN in front.
- Authentication is a fixed user/token, not IMS. Assets are always visible on Publish.
- Exact HTTP status codes for edge cases (409/404 on persist, 404 for a missing persisted query) may differ from your AEM version.

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| `MOCK_AEM_AUTHOR_PORT` / `MOCK_AEM_PUBLISH_PORT` | `4502` / `4503` | ports |
| `MOCK_AEM_USER` / `MOCK_AEM_PASSWORD` | `admin` / `admin` | Basic auth on Author |
| `MOCK_AEM_DEV_TOKEN` | `mock-local-dev-token` | Bearer token on Author |
| `MOCK_AEM_LATENCY_MS` | `150` | artificial latency for GraphQL responses |
| `MOCK_AEM_BLOCK_ADHOC_ON_PUBLISH` | `false` | `true` = POST queries on Publish return 403 (like the Dispatcher default) |
| `MOCK_AEM_CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | CORS allow-list |
| `MOCK_AEM_WEBHOOK_URLS` | the two `/api/…/aem-events` routes | webhook targets (empty = off) |
| `MOCK_AEM_WEBHOOK_SECRET` | `mock-webhook-secret` | sent as `x-aem-webhook-secret` |
| `MOCK_AEM_PERSIST_STATE` | `true` | keep runtime changes in `mock-aem/.data/state.json` |

Runtime changes (persisted queries you created, edits, publish status) survive restarts. `npm run mock:reset` forgets them. After changing `src/models.ts`, run `npm run mock:schema` and `npm run codegen`.
