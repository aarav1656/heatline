import { compareToBlock } from "@/lib/index";
import { PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Proxies `compareToBlock` so client-reachable code (src/lib/webmcp/tools.ts) never imports
 *  @/lib/index directly: that module does node:fs reads and cannot be bundled for the browser. */
export async function GET(_request: Request, ctx: RouteContext<"/api/building/[bbl]/compare">) {
  const { bbl } = await ctx.params;
  let result: ReturnType<typeof compareToBlock>;
  try {
    result = compareToBlock(bbl);
  } catch {
    return Response.json(
      { error: "The building index has not been built yet. Run the data build script first." },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  if (!result) {
    return Response.json({ error: `No block comparison available for BBL "${bbl}".` }, { status: 404, headers: PRIVATE_NO_STORE });
  }
  return Response.json(result, { headers: PRIVATE_NO_STORE });
}
