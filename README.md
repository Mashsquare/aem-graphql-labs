# AEM GraphQL Labs

Hands-on labs for **GraphQL with Adobe Experience Manager (AEM) headless** — built with Next.js 16 (App Router, Cache Components) and TypeScript, with a **mock AEM as a Cloud Service backend** (Author + Publish) to train against.

- **23 labs** in five parts: GraphQL fundamentals on public APIs → the popular client libraries → AEM headless work (filters, paging, references, rich text, persisted queries, images, preview, a capstone site) → **classic and hybrid AEM** (HTL/Sling Models passing props to React, `.model.json` exports, the SPA Editor page model, page model + Content Fragments) → a **Sling Models deep dive** (resources & `ValueMap` conversion, how `adaptTo` injects and when it returns `null`, models for real components and how HTL reads them, the Jackson exporter and the delegation pattern).
- Every lab has a **prompt** (background, real data shapes, tasks, acceptance criteria), a **starter** you edit, **automated checks**, and a separate **solution module** with a walkthrough.
- The **mock AEM** generates its schema from Content Fragment Models, supports AEM's filter grammar, variations, locales, `_references`, `_assetTransform`, persisted queries with replication and cache headers, Author auth, CORS, an authoring console and publish webhooks. It also serves a small **classic site** (HTL-style HTML with React mount points, Sling Model Exporter `.model.json`, Core Image renditions). It is compatible with Adobe's `@adobe/aem-headless-client-js`.

## Quick start

Requires Node.js 20+ (tested with 22).

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run dev` starts Next.js **and** the mock AEM:

| | URL |
| --- | --- |
| Labs app | http://localhost:3000 |
| Mock AEM Publish (anonymous) | http://localhost:4503 — GraphiQL at `/aem/graphiql.html` |
| Mock AEM Author (`admin` / `admin`) | http://localhost:4502 — authoring console at `/mock/console` |

Labs 01–05 call public APIs (Countries, Rick and Morty) and need internet access; Labs 06–19 only need the mock; Labs 20–23 run on an in-memory fixture and need neither.

## How a lab works

```
src/labs/07-aem-first-query/        <- the lab module: what you read and edit
  PROMPT.md                            brief: concepts + tooling, data shapes, tasks, acceptance criteria
  aem.ts                               starter with TODOs (todo() throws a friendly message)
  ui.tsx / Exercise.tsx                provided UI that renders YOUR functions
  lab.test.ts                          automated checks
src/solutions/07-aem-first-query/   <- the solution module
  SOLUTION.md                          walkthrough + real-world notes
  aem.ts / Solution.tsx                reference implementation
```

Every brief from Lab 03 on follows the same order — **lecture first, then you are tested**:

1. **Goal** — what you will have built.
2. **Concepts and tooling** (the lecture) — the libraries and GraphQL/AEM ideas the lab needs, each with a runnable example. Examples deliberately use a *different* model or API than the tasks (e.g. Location/Article/Author in the AEM labs, Countries in the Apollo lab), so you learn the pattern first and then apply it.
3. **The API / data shapes** — real request and response payloads.
4. **Your tasks** — one per TODO in the starter, each naming the file and function, its inputs → outputs, and a "Works when" check that maps to a test or something visible in the workspace.
5. **Acceptance criteria** and **stretch goals**.

In the app, each lab has four tabs: **Brief**, **Your workspace** (live render of your code, hot-reloads), **Solution walkthrough** and **Solution (live)**.

```bash
npm test -- 07           # run Lab 07's checks against your code
npm run test:watch -- 07 # …in watch mode
npm run test:solutions   # the same checks against the reference solutions (all should pass)
```

Tests start a private in-memory mock AEM on random ports, so they don't touch your `npm run dev` instance.

## The labs

| # | Lab | API | Tools |
| --- | --- | --- | --- |
| 01 | GraphQL over HTTP | Countries | `fetch` |
| 02 | Variables, fragments, aliases & directives | Rick and Morty | `fetch`, typed documents |
| 03 | Apollo Client 4 | Rick and Morty | `@apollo/client`, `@apollo/client-integration-nextjs` |
| 04 | urql | Countries | `urql` |
| 05 | TanStack Query + graphql-request | Rick and Morty | `@tanstack/react-query`, `graphql-request` |
| 06 | GraphQL Code Generator | mock AEM | `@graphql-codegen/cli` (client preset) |
| 07 | Your first AEM query | mock AEM | `fetch`, Server Components |
| 08 | Filtering & sorting | mock AEM | Apollo Client |
| 09 | Pagination: offset vs cursor | mock AEM | `fetch`, Apollo `relayStylePagination` |
| 10 | References & rich text | mock AEM | Server Components |
| 11 | Persisted queries & caching | mock AEM (Author + Publish) | `@adobe/aem-headless-client-js`, `"use cache"` |
| 12 | Variations, locales & metadata | mock AEM | `fetch` |
| 13 | Images & web-optimized delivery | mock AEM | `next/image` custom loader |
| 14 | Author vs Publish & preview | mock AEM (Author + Publish) | `server-only`, Draft Mode |
| 15 | Capstone: WKND adventures site | mock AEM (Author + Publish) | codegen, `"use cache"`, `generateStaticParams`, webhooks |
| 16 | HTL & Sling Models: props into React | mock AEM (HTL output) | `data-*` / JSON props, island mounting, `safeHref` |
| 17 | Sling Model Exporter: `.model.json` | mock AEM (Publish + Author) | `fetch`, adapter layer, HTML sanitiser |
| 18 | SPA Editor: the page model | mock AEM (Publish) | `MapTo`-style registry, recursive renderer, editor mode |
| 19 | Capstone: page model + Content Fragments | mock AEM (Publish) | page model, GraphQL `_path` filter, batching |
| 20 | Sling foundations: resources & ValueMaps | in-memory JCR fixture | `Resource`, `ValueMap` conversion, super type chain, inherited properties |
| 21 | How `adaptTo` works | in-memory JCR fixture | injectors, required vs optional, `@Default`, `@PostConstruct` |
| 22 | Models for real components | in-memory JCR fixture | HTL property rules, price tag / teaser / breadcrumb / navigation models |
| 23 | The Exporter & the delegation pattern | in-memory JCR fixture | Jackson-style serializer, model selection, `@Via(ResourceSuperType)`, `:items` |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server + mock AEM (watch mode) |
| `npm run mock` | only the mock AEM |
| `npm run mock:reset` | forget runtime changes in the mock (persisted queries you created, edits, publish state) |
| `npm run mock:schema` | regenerate `mock-aem/schema.graphql` after changing `mock-aem/src/models.ts` |
| `npm run codegen` / `codegen:watch` | GraphQL Code Generator (Labs 06 and 15) |
| `npm run lab11:persist` | run your Lab 11 persist-and-publish script |
| `npm test`, `npm run test:solutions`, `npm run test:mock` | checks for your code / the solutions / the mock itself |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run build` / `npm start` | production build (starts the mock if it isn't running, because pages prerender AEM content) / serve it |

## Project layout

```
mock-aem/                 mock AEM as a Cloud Service (Node + graphql-js) — see mock-aem/README.md
docs/                     AEM GraphQL cheat sheet, client tooling guide (also rendered in the app)
src/labs/<lab>/           lab modules (prompts + starters + checks)
src/solutions/<lab>/      solution modules (walkthroughs + reference code)
src/lib/aem/              small reusable AEM helpers (config, client, image loader, rich text, types)
src/lib/sling/            mini Sling runtime for Labs 20–23: resources, ValueMap, adaptTo, exporter, JCR fixture
src/app/(labs)/           the labs app
src/app/(sites)/          the capstone WKND site (yours and the solution)
src/app/api/              Lab 14 draft-mode routes, Lab 15 webhook routes
codegen.ts                GraphQL Code Generator config
graphql.config.ts         for the VS Code GraphQL extension
```

## Using a real AEM later

The code reads its targets from environment variables (see `.env.example`). Point them at an AEM as a Cloud Service environment and most labs work unchanged:

```bash
AEM_PUBLISH_HOST=https://publish-p12345-e67890.adobeaemcloud.com
AEM_AUTHOR_HOST=https://author-p12345-e67890.adobeaemcloud.com
AEM_AUTHOR_TOKEN=<local development token from the Developer Console>
```

You need the WKND models and content (or your own, adjusting the queries), GraphQL endpoints enabled for the configuration, and CORS configured for `http://localhost:3000` if you call Publish from the browser.

## Troubleshooting

- **Ports 4502/4503 in use** — another mock (or a real local AEM SDK) is running. Stop it, or set `MOCK_AEM_AUTHOR_PORT` / `MOCK_AEM_PUBLISH_PORT` and the matching `AEM_*_HOST` variables.
- **Git Bash rewrites `/conf/...` arguments** in `curl` commands — prefix with `MSYS_NO_PATHCONV=1` or use PowerShell (`curl.exe`).
- **A workspace shows "Not implemented yet"** — that's the starter. Implement the function named in the message.
- **Types out of date in Labs 06/15** — `npm run codegen`.
- **Strange persisted-query state** — `npm run mock:reset`, then restart `npm run dev`.
