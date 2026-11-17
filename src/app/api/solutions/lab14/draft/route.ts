import { connection } from "next/server";
import { GET as draftRoute } from "@/solutions/14-aem-author-preview/draft-route";

export async function GET(request: Request) {
  await connection();
  return draftRoute(request);
}
