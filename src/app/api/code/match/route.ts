import { matchConditionToCode } from "@/lib/index";
import { PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

const TEXT_MAX = 1000;

/** Proxies `matchConditionToCode` so client-reachable code (src/lib/webmcp/tools.ts) never
 *  imports @/lib/index directly: that module does node:fs reads and cannot be bundled for the
 *  browser (Turbopack's client chunker rejects node:fs). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get("text") ?? "").trim();
  if (!text) {
    return Response.json({ error: "Query param \"text\" is required." }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  if (text.length > TEXT_MAX) {
    return Response.json(
      { error: `text is ${text.length} characters, over the ${TEXT_MAX}-character limit.` },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }
  let matches: ReturnType<typeof matchConditionToCode>;
  try {
    matches = matchConditionToCode(text);
  } catch {
    return Response.json(
      { error: "The code table has not been built yet. Run the data build script first." },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  return Response.json({ matches, count: matches.length }, { headers: PRIVATE_NO_STORE });
}
