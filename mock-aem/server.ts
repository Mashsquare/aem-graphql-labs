/**
 * Starts the mock AEM as a Cloud Service backend:
 *   Author  -> http://localhost:4502  (auth required, sees drafts)
 *   Publish -> http://localhost:4503  (anonymous, only published content)
 *
 *   npm run mock         (or `npm run dev` to start it together with Next.js)
 */
import { createMockAem } from "./src/http/server";

async function main() {
  const aem = createMockAem();
  const { author, publish } = await aem.start();
  const { configurationName, username, password, devToken, stateFile } = aem.options;
  const endpoint = `/content/cq:graphql/${configurationName}/endpoint.json`;

  console.log(`
  Mock AEM as a Cloud Service is running

  Author   ${author}   (Basic ${username}:${password} or Bearer ${devToken})
  Publish  ${publish}   (anonymous)

  GraphQL endpoint   ${endpoint}
  GraphiQL IDE       ${publish}/aem/graphiql.html
  Persisted queries  ${publish}/graphql/execute.json/${configurationName}/adventures-all
  Authoring console  ${author}/mock/console
  State file         ${stateFile ?? "(in memory)"}   reset with: npm run mock:reset
`);

  const shutdown = () => {
    aem.stop().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[mock-aem] Port already in use (${error.message}). Is the mock already running? Set MOCK_AEM_AUTHOR_PORT / MOCK_AEM_PUBLISH_PORT to change ports.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
