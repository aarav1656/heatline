import type {
  CaseActionType,
  CaseState,
  Complaint311,
  Condition,
  EvidenceRequest,
  Packet,
  Role,
  TimelineEvent,
} from "@/lib/types";
import { getCase, putCase, StaleWriteError } from "./index";

export class RoleError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "RoleError";
  }
}

export class ActionError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ActionError";
    this.status = status;
  }
}

// Server role gates. The tenant is the case's owner: they log conditions, answer evidence
// requests, file the packet, and draft the 311 complaint. The advocate is the partner: they
// request evidence and assemble the packet. add_note is open to both.
const OWNER_ONLY: CaseActionType[] = ["log_condition", "answer_evidence", "file_packet", "draft_311"];
const PARTNER_ONLY: CaseActionType[] = ["request_evidence", "assemble_packet"];

/**
 * Free-text ceilings. Crossing one is a 400 with the actual and allowed length in the message,
 * not a silent `.slice()` that drops the tail of what someone typed with no signal it happened.
 */
const NOTE_MAX = 500;
const CONDITION_NOTE_MAX = 500;
const CONDITION_READING_MAX = 60;
const EVIDENCE_ASK_MAX = 280;
const EVIDENCE_ANSWER_MAX = 500;
const COMPLAINT_DESCRIPTION_MAX = 1000;
const PACKET_SECTION_HEADING_MAX = 80;
const PACKET_SECTION_BODY_MAX = 4000;
const PACKET_MAX_SECTIONS = 12;

function requireWithinLength(field: string, value: string, max: number): void {
  if (value.length > max) {
    throw new ActionError(
      `${field} is ${value.length} characters, over the ${max}-character limit. Shorten it and try again.`,
    );
  }
}

/**
 * `role` is never a client-supplied label. It is derived from which of the case's
 * two capability tokens (`ownerKey` / `partnerKey`) the caller presented. A key
 * that matches neither is not "partner by default" — it is not authenticated at
 * all, so the caller gets no role and every gated action 403s.
 */
export function roleForKey(caseState: CaseState, key: string): Role | null {
  if (!key) return null;
  if (key === caseState.ownerKey) return "owner";
  if (key === caseState.partnerKey) return "partner";
  return null;
}

export function assertRole(type: CaseActionType, role: Role): void {
  if (OWNER_ONLY.includes(type) && role !== "owner") {
    throw new RoleError(
      `Only the tenant can ${type.replace(/_/g, " ")}. You are the advocate: this stays with the tenant's session.`,
    );
  }
  if (PARTNER_ONLY.includes(type) && role !== "partner") {
    throw new RoleError(
      `Only the advocate can ${type.replace(/_/g, " ")}. You are the tenant: ask your advocate to do this from their session.`,
    );
  }
}

function event(by: Role | "system", kind: string, text: string): TimelineEvent {
  return { at: new Date().toISOString(), by, kind, text };
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type Payload = Record<string, unknown>;

function mutate(caseState: CaseState, type: CaseActionType, role: Role, payload: Payload): CaseState {
  const next: CaseState = {
    ...caseState,
    conditions: [...caseState.conditions],
    evidenceRequests: [...caseState.evidenceRequests],
    packets: [...caseState.packets],
    complaints: [...caseState.complaints],
    notes: [...caseState.notes],
    version: caseState.version + 1,
  };

  switch (type) {
    case "log_condition": {
      const conditionType = String(payload.type ?? "").trim();
      const reading = payload.reading !== undefined ? String(payload.reading).trim() : undefined;
      const note = String(payload.note ?? "").trim();
      if (!conditionType) throw new ActionError("log_condition needs a condition type, e.g. \"heat\".");
      if (!note) throw new ActionError("log_condition needs a short note describing what happened.");
      requireWithinLength("note", note, CONDITION_NOTE_MAX);
      if (reading) requireWithinLength("reading", reading, CONDITION_READING_MAX);
      const condition: Condition = {
        id: id("cond"),
        type: conditionType,
        reading: reading || undefined,
        at: new Date().toISOString(),
        note,
        by: role,
        createdAt: new Date().toISOString(),
        codeSection: typeof payload.codeSection === "string" ? payload.codeSection : undefined,
      };
      next.conditions.push(condition);
      next.notes.push(
        event(role, "log_condition", `Tenant logged ${conditionType}${reading ? ` (${reading})` : ""}: ${note}`),
      );
      return next;
    }

    case "request_evidence": {
      const ask = String(payload.ask ?? "").trim();
      if (!ask) throw new ActionError("request_evidence needs to say what to ask the tenant for.");
      requireWithinLength("ask", ask, EVIDENCE_ASK_MAX);
      const request: EvidenceRequest = {
        id: id("ev"),
        ask,
        by: "partner",
        status: "open",
        createdAt: new Date().toISOString(),
      };
      next.evidenceRequests.push(request);
      next.notes.push(event(role, "request_evidence", `Advocate asked: ${ask}`));
      return next;
    }

    case "answer_evidence": {
      const requestId = String(payload.requestId ?? "");
      const answer = String(payload.answer ?? "").trim();
      const request = next.evidenceRequests.find((r) => r.id === requestId);
      if (!request) {
        throw new ActionError(
          `No evidence request with id "${requestId}". Open requests: ${next.evidenceRequests.filter((r) => r.status === "open").map((r) => r.id).join(", ") || "none"}.`,
        );
      }
      if (request.status !== "open") {
        throw new ActionError(`Evidence request ${requestId} was already answered.`);
      }
      if (!answer) throw new ActionError("answer_evidence needs the answer text.");
      requireWithinLength("answer", answer, EVIDENCE_ANSWER_MAX);
      next.evidenceRequests = next.evidenceRequests.map((r) =>
        r.id === requestId ? { ...r, status: "answered" as const, answer, answeredAt: new Date().toISOString() } : r,
      );
      next.notes.push(event(role, "answer_evidence", `Tenant answered: ${answer}`));
      return next;
    }

    case "assemble_packet": {
      const rawSections = Array.isArray(payload.sections) ? payload.sections : [];
      if (rawSections.length === 0) {
        throw new ActionError("assemble_packet needs at least one section (Parties, Conditions, etc).");
      }
      if (rawSections.length > PACKET_MAX_SECTIONS) {
        throw new ActionError(`assemble_packet got ${rawSections.length} sections, over the ${PACKET_MAX_SECTIONS}-section limit.`);
      }
      const sections = rawSections.map((s, i) => {
        const raw = s as Record<string, unknown>;
        const heading = String(raw.heading ?? "").trim();
        const body = String(raw.body ?? "").trim();
        if (!heading) throw new ActionError(`Section ${i + 1} needs a heading.`);
        if (!body) throw new ActionError(`Section "${heading}" needs a body.`);
        requireWithinLength(`section "${heading}" heading`, heading, PACKET_SECTION_HEADING_MAX);
        requireWithinLength(`section "${heading}" body`, body, PACKET_SECTION_BODY_MAX);
        return { heading, body };
      });
      const packet: Packet = {
        id: id("packet"),
        sections,
        assembledBy: "partner",
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      next.packets.push(packet);
      next.notes.push(event(role, "assemble_packet", `Advocate assembled a draft HP Action packet (${sections.length} sections).`));
      return next;
    }

    case "file_packet": {
      const drafts = next.packets.filter((p) => p.status === "draft");
      if (drafts.length === 0) {
        throw new ActionError("There is no draft packet to file. Assemble one first (the advocate does this).");
      }
      const newest = drafts.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      next.packets = next.packets.map((p) =>
        p.id === newest.id ? { ...p, status: "filed" as const, filedAt: new Date().toISOString() } : p,
      );
      next.notes.push(event(role, "file_packet", "Tenant filed the HP Action packet."));
      return next;
    }

    case "add_note": {
      const text = String(payload.text ?? "").trim();
      if (!text) throw new ActionError("A note needs some text.");
      requireWithinLength("note text", text, NOTE_MAX);
      next.notes.push(event(role, "note", text));
      return next;
    }

    case "draft_311": {
      const conditionType = String(payload.conditionType ?? "").trim();
      const description = String(payload.description ?? "").trim();
      if (!conditionType) throw new ActionError("draft_311 needs a condition type.");
      if (!description) throw new ActionError("draft_311 needs a description of what happened.");
      requireWithinLength("description", description, COMPLAINT_DESCRIPTION_MAX);
      const complaint: Complaint311 = {
        id: id("311"),
        conditionType,
        description,
        at: new Date().toISOString(),
      };
      next.complaints.push(complaint);
      next.notes.push(event(role, "draft_311", `Tenant filed a 311 complaint for ${conditionType}.`));
      return next;
    }
  }
}

/**
 * Apply one action with optimistic-concurrency retry. `key` is the capability
 * token from the caller's link; role is derived from it here, never taken from
 * the request body. A key that matches neither `ownerKey` nor `partnerKey`
 * 403s before any mutation runs.
 */
export async function applyAction(
  caseId: string,
  type: CaseActionType,
  key: string,
  payload: Payload = {},
): Promise<CaseState> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const caseState = await getCase(caseId);
    if (!caseState) throw new ActionError(`No case with id "${caseId}".`, 404);
    const role = roleForKey(caseState, key);
    if (!role) {
      throw new RoleError(
        "This link's key does not match this case. Use the tenant or advocate URL exactly as it was shared; a guessed or edited key is not a valid credential.",
      );
    }
    assertRole(type, role);
    const next = mutate(caseState, type, role, payload);
    try {
      return await putCase(next);
    } catch (err) {
      if (err instanceof StaleWriteError) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  // Every attempt hit a real write conflict (someone else's write won the race each time), not
  // a bug in this request: that is a 409, an agent can re-`get_case` and retry, not a 500 that
  // reads like the server is broken.
  const message =
    lastError instanceof Error
      ? lastError.message
      : "Could not write the case after 4 attempts: another write kept winning the race.";
  throw new ActionError(message, 409);
}
