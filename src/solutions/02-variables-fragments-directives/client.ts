export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

declare const resultType: unique symbol;
declare const variablesType: unique symbol;

export type TypedQuery<TData, TVariables> = string & {
  readonly [resultType]?: TData;
  readonly [variablesType]?: TVariables;
};

export function typedQuery<TData, TVariables = Record<string, never>>(source: string): TypedQuery<TData, TVariables> {
  return source as TypedQuery<TData, TVariables>;
}

export interface GraphQLErrorItem {
  message: string;
  path?: (string | number)[];
}

export class GraphQLRequestError<TData = unknown> extends Error {
  constructor(
    readonly errors: GraphQLErrorItem[],
    readonly data: TData | null | undefined,
  ) {
    super(errors.map((error) => error.message).join("; "));
    this.name = "GraphQLRequestError";
  }
}

/**
 * TData and TVariables are *inferred from the document*: the phantom properties on TypedQuery
 * let TypeScript read the types back out, so call sites never pass generics.
 */
export async function request<TData, TVariables>(query: TypedQuery<TData, TVariables>, variables: TVariables): Promise<TData> {
  const response = await fetch(RICK_AND_MORTY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${RICK_AND_MORTY_API}`);

  const body = (await response.json()) as { data?: TData | null; errors?: GraphQLErrorItem[] };
  if (body.errors?.length) {
    // Keep partial data: some fields may have resolved even though others failed.
    throw new GraphQLRequestError<TData>(body.errors, body.data);
  }
  if (!body.data) throw new Error("GraphQL response contained no data");
  return body.data;
}
