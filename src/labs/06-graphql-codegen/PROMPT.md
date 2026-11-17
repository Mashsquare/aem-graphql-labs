## Goal

Stop writing result types by hand. **GraphQL Code Generator** (≈30M downloads/month) reads the schema and your documents and generates exact TypeScript types — the standard in professional GraphQL codebases. This is also the first lab against the **mock AEM**, so you'll meet the AEM schema through its generated types.

By the end you will have: run codegen, changed a query and watched the types follow, built a type-checked AEM filter, and consumed a fragment through **fragment masking**.

> [!NOTE]
> Make sure the mock AEM is running (`npm run dev` starts it next to Next.js). This lab queries **Publish** at `http://localhost:4503`.

## Concepts and tooling

### 1. Why generate types?

A hand-written `interface Adventure { title: string }` is a promise nobody checks. If the query selects `price` but the interface says `cost`, or the schema makes a field nullable, TypeScript is happy and production is not. With codegen the **schema is the source of truth** and the types are *derived* from "schema + the exact fields you selected". Change the query → the type changes → every use that no longer fits is a compile error.

### 2. The pipeline

```
mock-aem/schema.graphql ─┐
                         ├─> graphql-codegen (client preset) ─> src/labs/06-graphql-codegen/gql/
your graphql(`…`) calls ─┘                                        ├─ graphql.ts   (all types)
                                                                   ├─ gql.ts       (typed graphql() overloads)
                                                                   └─ fragment-masking.ts
```

Open [codegen.ts](../../../codegen.ts) at the project root. The parts that matter:

| Setting | What it does |
| --- | --- |
| `schema` | where the types come from. Here a file; against real AEM you can use the endpoint URL (introspection) or `…/endpoint.GQLschema`. |
| `documents` | the glob of files codegen scans for `graphql(\`…\`)` calls |
| `preset: "client"` | the recommended preset: typed `graphql()` function + fragment masking |
| `scalars` | maps AEM's custom scalars to TypeScript (`Date` → `string`, `JSON` → `unknown`, …) because JSON has no dates |
| `fragmentMasking.unmaskFunctionName` | renames the unmask helper to `getFragmentData` |

Commands: `npm run codegen` (once) · `npm run codegen:watch` (re-generates on save — keep it open in a second terminal).

### 3. The `graphql()` function

You write your documents inside the generated `graphql()` function. It must receive a **plain string literal** (no `${}` interpolation) — codegen finds the call by its text and generates an overload for *exactly that string*:

```ts
import { graphql } from "./gql";

// A query on a model this lab does NOT use: locations.
export const locationsByCountry = graphql(`
  query LocationsByCountry($country: String!) {
    locationList(filter: { country: { _expressions: [{ value: $country }] } }) {
      items { _path name city }
    }
  }
`);
```

After `npm run codegen`, `locationsByCountry` is a `TypedDocumentNode<LocationsByCountryQuery, LocationsByCountryQueryVariables>`. The generated names always follow one rule:

| In your document | Generated type |
| --- | --- |
| `query LocationsByCountry` | `LocationsByCountryQuery` (result) and `LocationsByCountryQueryVariables` |
| `fragment AdventureTeaser on AdventureModel` | `AdventureTeaserFragment` |
| schema input `AdventureModelFilter` | `AdventureModelFilter` (generated because a document uses it as a variable type — plus the types it references) |

> [!WARNING]
> If you edit a document and **forget to re-run codegen**, the string no longer matches a generated overload and `graphql()` returns an untyped document — you'll see `unknown`/`any` appear. First fix to try for odd types: run `npm run codegen`.

Also: **name every operation**. Anonymous queries can't produce a type name.

### 4. Variables become typed inputs

Typed documents work with any client that understands `TypedDocumentNode` — including `graphql-request`, Apollo and urql (Labs 03–05):

```ts
import { request } from "graphql-request";

const data = await request(endpoint, locationsByCountry, { country: "France" });
//    ^? { locationList: { items: ({ _path: string; name: string; city?: string | null } | null)[] } }
```

Rules the generator applies to variables: `$country: String!` is **required** in `…Variables`; `$filter: AdventureModelFilter` (nullable) is **optional**; a default (`$locale: String = "en"`) is also optional — the server fills it in.

### 5. AEM filter *input types* are generated too

Every AEM model gets a filter type in the schema (Lab 08 covers the grammar in depth). Because codegen emits them, a filter object is type-checked:

```ts
import type { LocationModelFilter } from "./gql/graphql";

const ok: LocationModelFilter = { country: { _expressions: [{ value: "France" }] } };

const typo: LocationModelFilter = { country: { _expresions: [{ value: "France" }] } };
//                                              ~~~~~~~~~~~ compile error: unknown property
const wrong: LocationModelFilter = { country: { _expressions: [{ value: 3 }] } };
//                                                                      ~ error: number is not assignable to string
```

The shape to remember for now: **`{ <field>: { _expressions: [{ value }] } }`** — one entry per field, with a list of expressions inside.

### 6. Fragments and fragment masking

A **fragment** names a reusable set of fields on a type. In a component-based app the idea goes further: *each component declares the data it needs as a fragment* and the page's query just spreads it.

```ts
export const locationBadgeFragment = graphql(`
  fragment LocationBadge on LocationModel {
    name
    country
  }
`);

export const adventureWithLocation = graphql(`
  query AdventureWithLocation($path: String!) {
    adventureByPath(_path: $path) {
      item { title location { ...LocationBadge } }
    }
  }
`);
```

With the client preset, **fragment masking** is on: in the query result, `item.location` does **not** expose `name` or `country` — it only holds an opaque reference. Reading `location.name` in the parent is a compile error. Only the component that owns the fragment can open ("unmask") it:

```tsx
import { getFragmentData, type FragmentType } from "./gql";

export function LocationBadge(props: { location: FragmentType<typeof locationBadgeFragment> }) {
  const location = getFragmentData(locationBadgeFragment, props.location);   // now typed: { name, country }
  return <span>{location.name}, {location.country}</span>;
}
```

Why bother? A component can only depend on what it declared, so changing the fragment can't silently break another component, and the parent can't accidentally rely on a field somebody else selected.

### 7. Unions: `__typename` narrows

AEM content references are a **union** (`ImageRef | DocumentRef | …`, Lab 07). To read image fields select `__typename` and use an inline fragment; TypeScript then narrows on the discriminator:

```ts
const image = item.primaryImage?.__typename === "ImageRef" ? item.primaryImage : null;
image?._dynamicUrl;   // only exists on the narrowed type
```

The starter fragment and component already do this — look at them.

> [!TIP]
> Keep `npm run codegen:watch` running in a second terminal while you work — types regenerate on save.

## Data shape

```graphql
query AdventureTeasers($filter: AdventureModelFilter, $locale: String = "en") {
  adventureList(filter: $filter, _locale: $locale, sort: "title ASC") {
    items { ...AdventureTeaser }
  }
}
```

```json
{
  "data": {
    "adventureList": {
      "items": [
        {
          "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp",
          "title": "Bali Surf Camp",
          "slug": "bali-surf-camp",
          "activity": "Surfing",
          "difficulty": "Beginner",
          "price": 1890,
          "tripLength": "6 Days",
          "primaryImage": {
            "__typename": "ImageRef",
            "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--dce67894-…/bali-surf-camp-hero.jpg?preferwebp=true",
            "width": 2000,
            "height": 1333
          }
        }
      ]
    }
  }
}
```

`items` is typed `Array<… | null>`: AEM's schema allows null entries, so generated code makes you handle them.

## Your tasks

### Task 1 — run codegen and explore · no code

1. Run `npm run codegen`.
2. Open [gql/graphql.ts](./gql/graphql.ts) and use your editor's search to find: `AdventureModel` (the whole model as a type), `AdventureModelFilter`, `AdventureTeaserFragment` and `AdventureTeasersQuery`.
3. Write down for yourself: which fields does `AdventureTeaserFragment` have? What does `AdventureTeasersQueryVariables` look like right now?

### Task 2 — improve the query · [documents.ts](./documents.ts) → `adventureTeasersQuery`

Change the starter query into exactly:

```graphql
query AdventureTeasers($filter: AdventureModelFilter, $locale: String = "en") {
  adventureList(filter: $filter, _locale: $locale, sort: "title ASC") {
    items {
      ...AdventureTeaser
    }
  }
}
```

That is: add `$locale` with its default, pass `_locale: $locale` and `sort: "title ASC"`, and **remove `limit: 3`**. Run `npm run codegen` and compare `AdventureTeasersQueryVariables` with what you wrote down in Task 1: `locale?` should have appeared.

**Works when:** the workspace lists more than 3 adventures (after Tasks 3–5).

### Task 3 — a typed filter · [data.ts](./data.ts) → `teaserFilter(difficulty?)`

| Input | Output |
| --- | --- |
| `undefined` (or `""`) | `undefined` |
| `"Expert"` | `{ difficulty: { _expressions: [{ value: "Expert" }] } }` |

The return type `AdventureModelFilter | undefined` is generated — after writing the object, deliberately mistype `_expressions` once and watch TypeScript object (concept 5). Fix it again.

**Works when:** the two `teaserFilter()` tests pass.

### Task 4 — run the typed document · [data.ts](./data.ts) → `getAdventureTeasers(difficulty?)`

```ts
const data = await request(aemEndpoint(), adventureTeasersQuery, { filter: teaserFilter(difficulty) });
return data.adventureList.items;
```

Hover `data`: the whole result type is inferred from the document — no annotation, no `as`. Leave out `locale`; the default `"en"` applies.

**Works when:** "returns every English adventure sorted by title" passes (16 items).

### Task 5 — unmask the fragment · [AdventureTeaser.tsx](./AdventureTeaser.tsx)

Replace the `todo(...)` with `const adventure = getFragmentData(adventureTeaserFragment, props.adventure);` (concept 6). `getFragmentData` comes from `./gql`; `adventureTeaserFragment` must become a **value** import from `./documents` (the starter imports only its type). Remove the `void props;` line and the `as AdventureTeaserFragment` cast.

### Task 6 — extend the fragment · [documents.ts](./documents.ts), [AdventureTeaser.tsx](./AdventureTeaser.tsx)

1. Add `difficulty` to `adventureTeaserFragment`.
2. Run `npm run codegen` (or have `codegen:watch` running).
3. In `AdventureTeaser.tsx`, replace the `/* TODO (task 6) */` inside the `meta` array with `adventure.difficulty`.

Notice that you **did not touch `adventureTeasersQuery`** — the fragment travels inside it.

**Works when:** "filters by difficulty and exposes the difficulty field through the fragment" passes and each card shows its difficulty.

## Acceptance criteria

- `npm run codegen && npm test -- 06` passes.
- `npm run typecheck` passes with no `any` and no hand-written result types in `data.ts`.
- The workspace lists all 16 English adventures; the difficulty buttons filter them.

## Stretch goals

- Try reading `items[0].title` in `Exercise.tsx` — fragment masking makes it a type error. That's the point.
- Point codegen at the live endpoint instead of the file: `schema: "http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.json"` (introspection over HTTP — like you'd do against a real AEM).
- Look at `gql.tada` — the same type safety without a generation step, inferred by the TypeScript compiler.
