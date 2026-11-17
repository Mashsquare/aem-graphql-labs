export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

/* -------------------------------------------------------------------------- */
/* Provided: a string that remembers its result and variable types            */
/* -------------------------------------------------------------------------- */

declare const resultType: unique symbol;
declare const variablesType: unique symbol;

/** A GraphQL document (as a string) tagged with the types of its result and variables. */
export type TypedQuery<TData, TVariables> = string & {
  readonly [resultType]?: TData;
  readonly [variablesType]?: TVariables;
};

/** Tags a document with types. At runtime it is just the string. */
export function typedQuery<TData, TVariables = Record<string, never>>(source: string): TypedQuery<TData, TVariables> {
  return source as TypedQuery<TData, TVariables>;
}

export interface GraphQLErrorItem {
  message: string;
  path?: (string | number)[];
}

/** Thrown when the server answers with `errors`. Keeps the partial data, if any. */
export class GraphQLRequestError<TData = unknown> extends Error {
  constructor(
    readonly errors: GraphQLErrorItem[],
    readonly data: TData | null | undefined,
  ) {
    super(errors.map((error) => error.message).join("; "));
    this.name = "GraphQLRequestError";
  }
}

/* -------------------------------------------------------------------------- */
/* Task 1 — your typed request helper                                          */
/* -------------------------------------------------------------------------- */

export async function request<TData, TVariables>(query: TypedQuery<TData, TVariables>, variables: TVariables): Promise<TData> {
  // TODO:
  //  - POST { query, variables } as JSON to RICK_AND_MORTY_API
  //  - throw new GraphQLRequestError(body.errors, body.data) when body.errors is non-empty
  //  - return body.data

  const response = await fetch(RICK_AND_MORTY_API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({query, variables})
  });

  if(!response.ok){
    throw new Error("oops something went wrong "+response.status);
  }
  const body: {data?:TData | null; errors?: GraphQLErrorItem[]}= await response.json();
  if(body.errors && body.errors.length > 0){
    throw new GraphQLRequestError(body.errors, body.data);
  }
  return body.data as TData;
}
