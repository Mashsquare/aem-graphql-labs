## Walkthrough

### Typed documents without a library

```ts
export type TypedQuery<TData, TVariables> = string & {
  readonly [resultType]?: TData;
  readonly [variablesType]?: TVariables;
};

export async function request<TData, TVariables>(query: TypedQuery<TData, TVariables>, variables: TVariables): Promise<TData>
```

When you call `request(CHARACTERS_QUERY, { … })`, TypeScript *infers* `TData` and `TVariables` from the optional phantom properties of `CHARACTERS_QUERY`. Nothing exists at runtime — it's still a plain string — but:

```ts
const data = await request(CHARACTER_PAIR_QUERY, { a: "1", b: "2" }); // data: CharacterPairData
request(CHARACTER_PAIR_QUERY, { a: 1 });                               // ✗ error: 'b' is missing, a must be string
```

`@graphql-typed-document-node/core`'s `TypedDocumentNode<TResult, TVariables>` (used by Apollo, urql, graphql-request and Codegen) is exactly this idea applied to a parsed `DocumentNode`.

### Fragments travel with the operation

```graphql
query Characters(...) {
  characters(...) { results { ...CharacterCard } }
}
fragment CharacterCard on Character { id name ... }
```

The server only knows the fragment if the definition is part of the same document. Interpolating `${CHARACTER_CARD_FRAGMENT}` is the manual version; Apollo's `gql` and Codegen do the bookkeeping for you (and deduplicate fragments).

> [!WARNING]
> Interpolating the same fragment twice (e.g. a query that uses two fragments which both include a third one) produces a duplicate-definition validation error. That's one of the reasons teams switch to Codegen.

### `@include` changes the *request*, not just the UI

With `withEpisodes: false` the server never resolves `episode`, so the field is missing from the JSON. That matters for performance — AEM supports `@include`/`@skip` too, and conditionally skipping heavy fields (rich text, references) keeps responses small.

### Aliases

`first: character(id: $a)` and `second: character(id: $b)` — without aliases both fields would be called `character` and the response keys would collide (GraphQL rejects that).

### Partial data

GraphQL can return `data` *and* `errors`: fields that resolved are kept, failed fields become `null` with an error that has a `path`. Throwing a `GraphQLRequestError` that keeps `data` lets callers decide whether partial data is good enough (Apollo's `errorPolicy: "all"` is the library equivalent).
