import { lookupBuilding } from "@/lib/index";
import { PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

const QUERY_MAX = 120;

/**
 * Proxies `lookupBuilding` for the home page's address search so the client never needs to
 * import the index bundle directly. Read-only, no case involved, so no capability key.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return Response.json({ error: "Query param \"q\" is required." }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  if (q.length > QUERY_MAX) {
    return Response.json(
      { error: `Query is ${q.length} characters, over the ${QUERY_MAX}-character limit.` },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }
  let buildings: ReturnType<typeof lookupBuilding>;
  try {
    buildings = lookupBuilding(q);
  } catch {
    return Response.json(
      { error: "The building index has not been built yet. Run the data build script first." },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  return Response.json({ buildings, count: buildings.length }, { headers: PRIVATE_NO_STORE });
}
