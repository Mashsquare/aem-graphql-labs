import { Kind, parse, visit, type FieldNode, type OperationDefinitionNode } from "graphql";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pick } from "@/test/lab";
import * as exerciseClient from "./client";
import * as exerciseDocuments from "./documents";
import * as solutionClient from "@/solutions/02-variables-fragments-directives/client";
import * as solutionDocuments from "@/solutions/02-variables-fragments-directives/documents";

const client = pick(exerciseClient, solutionClient);
const documents = pick(exerciseDocuments, solutionDocuments);

const operationOf = (source: string) =>
  parse(source).definitions.find((definition): definition is OperationDefinitionNode => definition.kind === Kind.OPERATION_DEFINITION)!;

describe("Lab 02 · request()", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends query + variables and returns data", async () => {
    const fetchMock = vi.fn(async () => Response.json({ data: { hello: "world" } }));
    vi.stubGlobal("fetch", fetchMock);
    const query = client.typedQuery<{ hello: string }, { id: string }>("query Q($id: ID!) { hello }");
    await expect(client.request(query, { id: "7" })).resolves.toEqual({ hello: "world" });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body))).toEqual({ query: "query Q($id: ID!) { hello }", variables: { id: "7" } });
  });

  it("throws GraphQLRequestError with errors and partial data", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ data: { a: { name: "Rick" }, b: null }, errors: [{ message: "b failed", path: ["b"] }] }));
    const error = await client.request(client.typedQuery<unknown, Record<string, never>>("{ a b }"), {}).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(client.GraphQLRequestError);
    expect((error as InstanceType<typeof client.GraphQLRequestError>).errors[0].message).toBe("b failed");
    expect((error as InstanceType<typeof client.GraphQLRequestError>).data).toEqual({ a: { name: "Rick" }, b: null });
  });
});

describe("Lab 02 · documents", () => {
  it("CHARACTER_CARD_FRAGMENT is a fragment on Character", () => {
    const fragment = parse(documents.CHARACTER_CARD_FRAGMENT).definitions[0];
    expect(fragment.kind).toBe(Kind.FRAGMENT_DEFINITION);
    expect(fragment.kind === Kind.FRAGMENT_DEFINITION && fragment.name.value).toBe("CharacterCard");
  });

  it("CHARACTERS_QUERY declares the four variables, spreads the fragment and uses @include", () => {
    const document = parse(documents.CHARACTERS_QUERY);
    const operation = operationOf(documents.CHARACTERS_QUERY);
    const variables = Object.fromEntries(
      (operation.variableDefinitions ?? []).map((definition) => [definition.variable.name.value, definition.type.kind]),
    );
    expect(variables).toEqual({ page: Kind.NAMED_TYPE, name: Kind.NAMED_TYPE, status: Kind.NAMED_TYPE, withEpisodes: Kind.NON_NULL_TYPE });

    let spreadsFragment = false;
    let includedField: string | undefined;
    visit(document, {
      FragmentSpread: (node) => {
        if (node.name.value === "CharacterCard") spreadsFragment = true;
      },
      Field: (node: FieldNode) => {
        if (node.directives?.some((directive) => directive.name.value === "include")) includedField = node.name.value;
      },
    });
    expect(spreadsFragment).toBe(true);
    expect(includedField).toBe("episode");
    expect(document.definitions.some((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)).toBe(true);
  });

  it("CHARACTER_PAIR_QUERY aliases character twice", () => {
    const operation = operationOf(documents.CHARACTER_PAIR_QUERY);
    const fields = operation.selectionSet.selections as FieldNode[];
    expect(fields.map((field) => [field.alias?.value, field.name.value])).toEqual([
      ["first", "character"],
      ["second", "character"],
    ]);
  });
});

describe("Lab 02 · against the real Rick and Morty API", () => {
  it("filters by name + status and includes episodes on demand", async () => {
    const withEpisodes = await client.request(documents.CHARACTERS_QUERY, { page: 1, name: "rick", status: "alive", withEpisodes: true });
    const results = withEpisodes.characters?.results ?? [];
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((character) => character.status === "Alive" && /rick/i.test(character.name))).toBe(true);
    expect(results[0].episode?.length).toBeGreaterThan(0);

    const withoutEpisodes = await client.request(documents.CHARACTERS_QUERY, { page: 1, name: "rick", withEpisodes: false });
    expect(withoutEpisodes.characters?.results[0]).not.toHaveProperty("episode");
  });

  it("fetches two characters with aliases", async () => {
    const pair = await client.request(documents.CHARACTER_PAIR_QUERY, { a: "1", b: "2" });
    expect(pair.first?.name).toBe("Rick Sanchez");
    expect(pair.second?.name).toBe("Morty Smith");
  });
});
