## Goal

Write GraphQL documents the way production codebases do: **variables** for every input, **fragments** for reusable selections, **aliases** to ask for the same field twice and **directives** to toggle parts of a query. Then wrap `fetch` in a request helper that infers TypeScript types from the document — the idea behind `TypedDocumentNode`, which Apollo, urql and GraphQL Codegen all use.

## The API

**Rick and Morty API** — `https://rickandmortyapi.com/graphql` (public). Open it in a browser for the GraphQL playground and schema docs.

Relevant schema (simplified):

```graphql
type Query {
  characters(page: Int, filter: FilterCharacter): Characters
  character(id: ID!): Character
}

input FilterCharacter { name: String, status: String, species: String, type: String, gender: String }

type Characters { info: Info, results: [Character] }
type Info { count: Int, pages: Int, next: Int, prev: Int }

type Character {
  id: ID
  name: String
  status: String      # "Alive" | "Dead" | "unknown"
  species: String
  image: String
  location: Location  # { name }
  origin: Location
  episode: [Episode]  # { id name episode }
}
```

### Data shape: `characters(page: 1, filter: { name: "rick", status: "alive" })`

```json
{
  "data": {
    "characters": {
      "info": { "count": 29, "pages": 2, "next": 2, "prev": null },
      "results": [
        {
          "id": "1",
          "name": "Rick Sanchez",
          "status": "Alive",
          "species": "Human",
          "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
          "location": { "name": "Citadel of Ricks" },
          "origin": { "name": "Earth (C-137)" },
          "episode": [{ "id": "1", "name": "Pilot", "episode": "S01E01" }, "…"]
        }
      ]
    }
  }
}
```

### Data shape: two characters at once, using aliases

```json
{
  "data": {
    "first": { "id": "1", "name": "Rick Sanchez", "…": "…" },
    "second": { "id": "2", "name": "Morty Smith", "…": "…" }
  }
}
```

## Your tasks

### Part A — a typed request helper ([client.ts](./client.ts))

`TypedQuery<TData, TVariables>` is already defined: a plain `string` that *also* carries the result and variable types (a "phantom type"). Implement:

1. **`request(query, variables)`** — POST `{ query, variables }` to `RICK_AND_MORTY_API` and return `data`.
   - The return type must be inferred from the document: `request(CHARACTERS_QUERY, …)` returns `Promise<CharactersData>` without passing generics.
   - Passing wrong variables must be a **TypeScript error** (try `request(CHARACTER_PAIR_QUERY, { a: 1 })`).
   - If the response has `errors`, throw a `GraphQLRequestError` (provided) carrying both the `errors` and whatever partial `data` came back.

### Part B — documents ([documents.ts](./documents.ts))

2. **`CHARACTER_CARD_FRAGMENT`** — `fragment CharacterCard on Character` selecting `id name status species image location { name } origin { name }`.
3. **`CHARACTERS_QUERY`** — `query Characters($page: Int, $name: String, $status: String, $withEpisodes: Boolean!)`:
   - pass `page` and a `filter: { name: $name, status: $status }`,
   - select `info { count pages next prev }`,
   - spread `...CharacterCard` in `results`,
   - select `episode { id name episode }` **only when** `$withEpisodes` is true (`@include`),
   - append the fragment definition to the document (a fragment must be sent with every operation that uses it).
4. **`CHARACTER_PAIR_QUERY`** — `query CharacterPair($a: ID!, $b: ID!)` that fetches two characters using the aliases `first` and `second`, both using the fragment.

Each document is created with `typedQuery<Data, Variables>(…)` using the types in [types.ts](./types.ts).

## Acceptance criteria

- `npm test -- 02` passes.
- The workspace search works for name + status + page, the "include episodes" checkbox changes the request (not just the UI), and the compare panel shows two characters side by side.
- `npm run typecheck` passes — and fails if you pass wrong variables.

> [!TIP]
> To verify `@include` really changes what is fetched, toggle the checkbox and open the "Raw JSON" panel: `episode` should disappear from the response itself.

> [!NOTE]
> Why phantom types? A real `TypedDocumentNode` (Lab 03, 06) is the same trick on a parsed `DocumentNode` instead of a string. Once you've written one by hand, generated ones stop looking mysterious.

## Stretch goals

- Use `@skip(if: …)` instead of `@include` and invert the variable.
- Give `$page` a default value (`$page: Int = 1`) and drop it from the variables type.
- Write a second fragment `CharacterLocation on Character` and spread it inside `CharacterCard` (fragments can nest).
