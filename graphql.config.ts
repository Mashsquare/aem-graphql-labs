import type { IGraphQLConfig } from "graphql-config";

/**
 * Used by the VS Code "GraphQL: Language Feature Support" extension (and other graphql-config
 * tools) for autocompletion + validation inside GraphQL strings. One project per API.
 */
const config: IGraphQLConfig = {
  projects: {
    aem: {
      schema: "mock-aem/schema.graphql",
      documents: [
        "src/{labs,solutions}/{06,07,08,09,10,11,12,13,14,15}-*/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "mock-aem/src/content/persisted-queries.ts",
      ],
    },
    countries: {
      schema: "https://countries.trevorblades.com/graphql",
      documents: ["src/{labs,solutions}/{01,04}-*/**/*.{ts,tsx}"],
    },
    rickAndMorty: {
      schema: "https://rickandmortyapi.com/graphql",
      documents: ["src/{labs,solutions}/{02,03,05}-*/**/*.{ts,tsx}"],
    },
  },
};

export default config;
