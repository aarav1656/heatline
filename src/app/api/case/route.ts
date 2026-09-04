import { createCase, stripKeys } from "@/lib/store";
import { checkRateLimit, clientIp } from "@/lib/store/ratelimit";
import { bodyTooLarge, tooLargeResponse, rateLimitedResponse, PRIVATE_NO_STORE } from "@/lib/http";

export const dynamic = "force-dynamic";

/** 60 case creations per minute per caller IP. There is no case id yet at this point, so this
 * route only has the IP axis to rate-limit on; per-case limiting starts at the action route. */
const CREATE_RATE_LIMIT = 60;
const CREATE_RATE_WINDOW_SECONDS = 60;

const BBL_PATTERN = /^\d{10}$/;
const APARTMENT_MAX = 20;
const CONDITION_TYPES = new Set(["heat", "hot_water", "mold", "pests", "lead", "gas"]);
const CONDITION_READING_MAX = 60;
const CONDITION_NOTE_MAX = 500;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const verdict = await checkRateLimit(`ip:${ip}:case-create`, CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_SECONDS);
  if (!verdict.allowed) {
    return rateLimitedResponse(
      verdict.retryAfterSeconds,
      "Too many cases created from this address. Wait a moment and try again.",
    );
  }

  if (bodyTooLarge(request)) return tooLargeResponse();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const bbl = String(body.bbl ?? "").trim();
  const apartment = String(body.apartment ?? "").trim();
  const firstConditionRaw = (body.firstCondition ?? {}) as Record<string, unknown>;
  const conditionType = String(firstConditionRaw.type ?? "").trim();
  const reading = firstConditionRaw.reading !== undefined ? String(firstConditionRaw.reading).trim() : undefined;
  const note = String(firstConditionRaw.note ?? "").trim();

  if (!BBL_PATTERN.test(bbl)) {
    return Response.json({ error: "bbl must be a 10-digit borough-block-lot number." }, { status: 400 });
  }
  if (!apartment) {
    return Response.json({ error: "Give the apartment number." }, { status: 400 });
  }
  if (apartment.length > APARTMENT_MAX) {
    return Response.json({ error: `Apartment is ${apartment.length} characters, over the ${APARTMENT_MAX}-character limit.` }, { status: 400 });
  }
  if (!conditionType || !CONDITION_TYPES.has(conditionType)) {
    return Response.json(
      { error: `firstCondition.type must be one of: ${[...CONDITION_TYPES].join(", ")}.` },
      { status: 400 },
    );
  }
  if (!note) {
    return Response.json({ error: "firstCondition.note is required: describe what happened." }, { status: 400 });
  }
  if (note.length > CONDITION_NOTE_MAX) {
    return Response.json({ error: `firstCondition.note is ${note.length} characters, over the ${CONDITION_NOTE_MAX}-character limit.` }, { status: 400 });
  }
  if (reading && reading.length > CONDITION_READING_MAX) {
    return Response.json({ error: `firstCondition.reading is ${reading.length} characters, over the ${CONDITION_READING_MAX}-character limit.` }, { status: 400 });
  }

  const caseState = await createCase({ bbl, apartment, firstCondition: { type: conditionType, reading, note } });

  // The one-time exception: the creator's own response carries both capability
  // keys and the two ready-to-share URLs. Every later read of this case (GET,
  // SSE, tool results) strips both keys.
  return Response.json(
    {
      case: stripKeys(caseState),
      ownerKey: caseState.ownerKey,
      partnerKey: caseState.partnerKey,
      ownerUrl: `/c/${caseState.id}?k=${caseState.ownerKey}`,
      partnerUrl: `/c/${caseState.id}?k=${caseState.partnerKey}`,
    },
    { status: 201, headers: PRIVATE_NO_STORE },
  );
}
