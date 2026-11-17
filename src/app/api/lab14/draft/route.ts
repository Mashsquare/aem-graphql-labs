import { connection } from "next/server";
// Lab 14: the implementation lives in the lab module so you edit it next to the rest of the lab.
import { GET as draftRoute } from "@/labs/14-aem-author-preview/draft-route";

export async function GET(request: Request) {
  // With Cache Components, GET route handlers are prerendered at build time unless they read
  // request-time data. A preview entry point must always run per request.
  await connection();
  return draftRoute(request);
}
