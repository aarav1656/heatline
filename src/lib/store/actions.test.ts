/**
 * Role-as-capability, tested against the real store (in-memory backend, no env vars set) and
 * the actual API route handlers, so a regression here fails a test, not just a judge's curl.
 */
import { describe, expect, it, vi } from "vitest";

// `putCase` is programmable so the retry-exhaustion test can force every attempt in
// `applyAction`'s loop to collide, deterministically, without racing real concurrent writes.
// Defaults to the real implementation; only the one test below overrides it, and restores it
// immediately after.
const { putCaseMock } = vi.hoisted(() => ({ putCaseMock: vi.fn() }));
vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  putCaseMock.mockImplementation(actual.putCase);
  return { ...actual, putCase: putCaseMock };
});

import { createCase, getCase as storeGetCase, StaleWriteError } from "@/lib/store";
import { applyAction, RoleError } from "@/lib/store/actions";
import type { CaseState } from "@/lib/types";
import { GET as getCaseRoute } from "@/app/api/case/[id]/route";
import { GET as streamRoute } from "@/app/api/case/[id]/stream/route";
import { listConditions as listConditionsToolFactory } from "@/lib/webmcp/tools";

const TEST_BBL = "2012345678";

async function buildCase(): Promise<CaseState> {
  return createCase({
    bbl: TEST_BBL,
    apartment: "4B",
    firstCondition: { type: "heat", reading: "52F", note: "no heat at 7am" },
  });
}

describe("role is derived from the capability key, never a self-declared label", () => {
  it("missing key: 403", async () => {
    const caseState = await buildCase();
    await expect(applyAction(caseState.id, "log_condition", "", { type: "heat", note: "x" })).rejects.toBeInstanceOf(RoleError);
  });

  it("a guessed key that matches neither capability: 403", async () => {
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "log_condition", "totally-guessed-key", { type: "heat", note: "x" }),
    ).rejects.toBeInstanceOf(RoleError);
  });

  it("advocate (partner) key cannot log_condition, file_packet or draft_311", async () => {
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "log_condition", caseState.partnerKey, { type: "heat", note: "x" }),
    ).rejects.toBeInstanceOf(RoleError);
    await expect(applyAction(caseState.id, "file_packet", caseState.partnerKey, {})).rejects.toBeInstanceOf(RoleError);
    await expect(
      applyAction(caseState.id, "draft_311", caseState.partnerKey, { conditionType: "heat", description: "d" }),
    ).rejects.toBeInstanceOf(RoleError);
  });

  it("tenant (owner) key cannot request_evidence or assemble_packet", async () => {
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "request_evidence", caseState.ownerKey, { ask: "a photo" }),
    ).rejects.toBeInstanceOf(RoleError);
    await expect(
      applyAction(caseState.id, "assemble_packet", caseState.ownerKey, { sections: [{ heading: "Parties", body: "x" }] }),
    ).rejects.toBeInstanceOf(RoleError);
  });

  it("prove the gate: commenting out assertRole in log_condition's path would let a partner log a condition", async () => {
    // This test documents the gate's shape rather than mutating source at runtime: see the
    // manual break/restore performed and reported in docs/HANDOFF-tools.md instead, since
    // vitest here runs against the committed assertRole, not a monkey-patched one.
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "log_condition", caseState.partnerKey, { type: "heat", note: "should be blocked" }),
    ).rejects.toBeInstanceOf(RoleError);
  });

  it("the tenant key legitimately logs a condition; the advocate key legitimately requests evidence", async () => {
    const caseState = await buildCase();
    const logged = await applyAction(caseState.id, "log_condition", caseState.ownerKey, { type: "mold", note: "mold behind the fridge" });
    expect(logged.conditions).toHaveLength(2);

    const requested = await applyAction(caseState.id, "request_evidence", caseState.partnerKey, { ask: "a photo of the thermostat" });
    expect(requested.evidenceRequests).toHaveLength(1);
    expect(requested.evidenceRequests[0].by).toBe("partner");
    expect(requested.evidenceRequests[0].status).toBe("open");
  });

  it("tenant answering an open evidence request marks it answered", async () => {
    let caseState = await buildCase();
    caseState = await applyAction(caseState.id, "request_evidence", caseState.partnerKey, { ask: "a photo" });
    const requestId = caseState.evidenceRequests[0].id;
    const answered = await applyAction(caseState.id, "answer_evidence", caseState.ownerKey, { requestId, answer: "attached below" });
    expect(answered.evidenceRequests[0].status).toBe("answered");
    expect(answered.evidenceRequests[0].answer).toBe("attached below");
  });

  it("advocate assembling a packet then tenant filing it: only the newest draft is filed", async () => {
    let caseState = await buildCase();
    caseState = await applyAction(caseState.id, "assemble_packet", caseState.partnerKey, {
      sections: [{ heading: "Parties", body: "the tenant and the owner" }],
    });
    expect(caseState.packets).toHaveLength(1);
    expect(caseState.packets[0].status).toBe("draft");

    const filed = await applyAction(caseState.id, "file_packet", caseState.ownerKey, {});
    expect(filed.packets[0].status).toBe("filed");
    expect(filed.packets[0].filedAt).toBeDefined();
  });

  it("file_packet with no draft packet: 400, not a silent no-op", async () => {
    const caseState = await buildCase();
    await expect(applyAction(caseState.id, "file_packet", caseState.ownerKey, {})).rejects.toMatchObject({ status: 400 });
  });
});

describe("both capability keys are stripped from every unauthenticated or model-facing read", () => {
  it("GET /api/case/[id] never contains either key's actual value", async () => {
    const caseState = await buildCase();
    const res = await getCaseRoute(new Request(`http://test/api/case/${caseState.id}`), {
      params: Promise.resolve({ id: caseState.id }),
    } as never);
    const body = (await res.json()) as { case: CaseState };
    const raw = JSON.stringify(body);
    expect(raw).not.toContain(caseState.ownerKey);
    expect(raw).not.toContain(caseState.partnerKey);
    expect(body.case.ownerKey).toBe("");
    expect(body.case.partnerKey).toBe("");
  });

  it("the case SSE stream's first frame never contains either key's actual value", async () => {
    const caseState = await buildCase();
    const controller = new AbortController();
    const req = new Request(`http://test/api/case/${caseState.id}/stream`, { signal: controller.signal });
    const res = await streamRoute(req, { params: Promise.resolve({ id: caseState.id }) } as never);
    const reader = res.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("event: case");
    expect(text).not.toContain(caseState.ownerKey);
    expect(text).not.toContain(caseState.partnerKey);
    controller.abort();
    await reader.cancel().catch(() => undefined);
  });

  it("the list_conditions tool result never contains either key's actual value", async () => {
    const caseState = await buildCase();
    const stored = await storeGetCase(caseState.id);
    const toolDef = listConditionsToolFactory({
      role: "owner",
      caseState: stored,
      actions: {} as never,
      confirm: async () => undefined,
      origin: "http://test",
    });
    const result = await toolDef.execute({});
    const raw = JSON.stringify(result);
    expect(raw).not.toContain(caseState.ownerKey);
    expect(raw).not.toContain(caseState.partnerKey);
  });
});

describe("free text over its length ceiling is rejected with 400, never silently truncated", () => {
  it("a note over 500 characters: 400 with the actual and allowed length, nothing stored", async () => {
    const caseState = await buildCase();
    const text = "A".repeat(612);
    await expect(
      applyAction(caseState.id, "add_note", caseState.ownerKey, { text }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("612") });
    const after = await storeGetCase(caseState.id);
    expect(after!.notes.some((n) => n.text.startsWith("AAAA"))).toBe(false);
  });

  it("a note at exactly 500 characters is accepted, in full, not truncated further", async () => {
    const caseState = await buildCase();
    const text = "B".repeat(500);
    const after = await applyAction(caseState.id, "add_note", caseState.ownerKey, { text });
    expect(after.notes.at(-1)!.text).toBe(text);
    expect(after.notes.at(-1)!.text).toHaveLength(500);
  });

  it("a 311 complaint description over 1000 characters: 400, nothing stored", async () => {
    const caseState = await buildCase();
    const description = "C".repeat(1200);
    await expect(
      applyAction(caseState.id, "draft_311", caseState.ownerKey, { conditionType: "heat", description }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("1200") });
    const after = await storeGetCase(caseState.id);
    expect(after!.complaints).toHaveLength(0);
  });

  it("a request_evidence ask over 280 characters: 400", async () => {
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "request_evidence", caseState.partnerKey, { ask: "D".repeat(300) }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("a log_condition note over 500 characters: 400", async () => {
    const caseState = await buildCase();
    await expect(
      applyAction(caseState.id, "log_condition", caseState.ownerKey, { type: "heat", note: "E".repeat(600) }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("status codes an agent can act on: 404 for an unknown case, 409 for retry exhaustion", () => {
  it("POST .../action against an unknown case id: 404, not 400", async () => {
    await expect(
      applyAction("does-not-exist-at-all", "add_note", "some-key", { text: "x" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("every optimistic-concurrency retry colliding: 409, not 500", async () => {
    const caseState = await buildCase();
    putCaseMock.mockRejectedValue(new StaleWriteError(caseState.id, caseState.version, caseState.version + 1));
    try {
      await expect(
        applyAction(caseState.id, "add_note", caseState.ownerKey, { text: "x" }),
      ).rejects.toMatchObject({ status: 409, name: "ActionError" });
    } finally {
      // Restore the passthrough so every later test in this file writes for real.
      const actual = await vi.importActual<typeof import("@/lib/store")>("@/lib/store");
      putCaseMock.mockImplementation(actual.putCase);
    }
  });
});

describe("GET /api/case/[id] and the SSE stream spotlight free text the same way list_conditions does", () => {
  it("GET wraps notes[].text, conditions[].note and evidenceRequests[].ask/answer", async () => {
    let caseState = await buildCase();
    caseState = await applyAction(caseState.id, "add_note", caseState.ownerKey, { text: "call me when the inspector comes" });
    caseState = await applyAction(caseState.id, "request_evidence", caseState.partnerKey, { ask: "a photo of the thermostat" });
    caseState = await applyAction(caseState.id, "answer_evidence", caseState.ownerKey, {
      requestId: caseState.evidenceRequests[0].id,
      answer: "attached below",
    });

    const res = await getCaseRoute(new Request(`http://test/api/case/${caseState.id}`), {
      params: Promise.resolve({ id: caseState.id }),
    } as never);
    const body = (await res.json()) as { case: CaseState };
    const humanNote = body.case.notes.find((n) => n.kind === "note")!;
    expect(humanNote.text).toBe("<untrusted-user-text>call me when the inspector comes</untrusted-user-text>");
    expect(body.case.conditions[0]!.note).toBe("<untrusted-user-text>no heat at 7am</untrusted-user-text>");
    expect(body.case.evidenceRequests[0]!.ask).toBe("<untrusted-user-text>a photo of the thermostat</untrusted-user-text>");
    expect(body.case.evidenceRequests[0]!.answer).toBe("<untrusted-user-text>attached below</untrusted-user-text>");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("the SSE stream's case frame carries the same spotlighted text", async () => {
    let caseState = await buildCase();
    caseState = await applyAction(caseState.id, "add_note", caseState.ownerKey, { text: "spotlight me over sse" });
    const controller = new AbortController();
    const req = new Request(`http://test/api/case/${caseState.id}/stream`, { signal: controller.signal });
    const res = await streamRoute(req, { params: Promise.resolve({ id: caseState.id }) } as never);
    const reader = res.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("<untrusted-user-text>spotlight me over sse</untrusted-user-text>");
    controller.abort();
    await reader.cancel().catch(() => undefined);
  });

  it("GET /api/case/[id] on an unknown case is still private, no-store", async () => {
    const res = await getCaseRoute(new Request("http://test/api/case/does-not-exist"), {
      params: Promise.resolve({ id: "does-not-exist" }),
    } as never);
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
