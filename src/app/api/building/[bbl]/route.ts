import { getBuildingRecord } from "@/lib/index";
import { PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Proxies `getBuildingRecord` for the home page and any client that needs the full record
 *  without importing the index bundle directly. Read-only, no case, no capability key. */
export async function GET(_request: Request, ctx: RouteContext<"/api/building/[bbl]">) {
  const { bbl } = await ctx.params;
  let record: ReturnType<typeof getBuildingRecord>;
  try {
    record = getBuildingRecord(bbl);
  } catch {
    return Response.json(
      { error: "The building index has not been built yet. Run the data build script first." },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  if (!record) {
    return Response.json({ error: `No building record for BBL "${bbl}".` }, { status: 404, headers: PRIVATE_NO_STORE });
  }
  return Response.json({ record }, { headers: PRIVATE_NO_STORE });
}
