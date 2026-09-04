/**
 * Registration lifecycle, run against `@mcp-b/webmcp-polyfill` as the test double for
 * `document.modelContext` (test the tool layer against a real ModelContext implementation,
 * not a hand-rolled mock).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { installTestDom, uninstallTestDom, TEST_ORIGIN } from "./test-dom";
import { registerTools } from "./register";
import { toolsForRole } from "./tools";
import { ToolRejectedError } from "./confirm";
import type { CaseActions, CaseState } from "./contracts";
import { resetToolLog, whenToolsIdle, inFlightCount, withToolLog } from "./log";

type ModelContextForTest = {
  registerTool: (tool: never, options?: { signal?: AbortSignal }) => Promise<void>;
  getTools: () => Promise<Array<{ name: string; description: string; annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean } }>>;
  executeTool: (
    tool: unknown,
    input: string,
    options?: { signal?: AbortSignal }
  ) => Promise<string | null>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

let mc: ModelContextForTest;

const TEST_BBL = "2012345678";

function makeCase(overrides: Partial<CaseState> = {}): CaseState {
  return {
    id: "c_demo",
    title: "810 Example Ave apt 4B",
    createdAt: "2026-09-03T12:00:00.000Z",
    bbl: TEST_BBL,
    address: "810 EXAMPLE AVE",
    conditions: [{ id: "cond_1", type: "heat", reading: "52F", at: "2026-09-03T12:00:00.000Z", note: "no heat at 7am", by: "owner", createdAt: "2026-09-03T12:00:00.000Z" }],
    evidenceRequests: [],
    packets: [],
    complaints: [],
    notes: [],
    ownerKey: "owner-key-test",
    partnerKey: "partner-key-test",
    version: 4,
    ...overrides,
  };
}

const caseWithEvidenceRequest = makeCase({
  evidenceRequests: [
    { id: "ev1", ask: "a photo of the thermostat", by: "partner", status: "open", createdAt: "2026-09-03T12:04:00.000Z" },
  ],
  version: 5,
});

const actions = {
  createCase: async () => ({ ...makeCase(), ownerUrl: "/c/c_demo?k=owner-key-test", partnerUrl: "/c/c_demo?k=partner-key-test" }),
  logCondition: async () => makeCase({ conditions: [...makeCase().conditions, { id: "cond_2", type: "mold", at: "2026-09-03T12:05:00.000Z", note: "new", by: "owner", createdAt: "2026-09-03T12:05:00.000Z" }], version: 6 }),
  requestEvidence: async () => caseWithEvidenceRequest,
  answerEvidence: async () => makeCase({ version: 6 }),
  assemblePacket: async () => makeCase({ packets: [{ id: "packet_1", sections: [{ heading: "Parties", body: "x" }], assembledBy: "partner", status: "draft", createdAt: "2026-09-03T12:06:00.000Z" }], version: 6 }),
  filePacket: async () => makeCase({ version: 6 }),
  addNote: async () => makeCase({ version: 6 }),
  draft311: async () => makeCase({ complaints: [{ id: "311_1", conditionType: "heat", description: "d", at: "2026-09-03T12:07:00.000Z" }], version: 6 }),
} satisfies CaseActions;

beforeAll(async () => {
  installTestDom();
  const { initializeWebMCPPolyfill } = await import("@mcp-b/webmcp-polyfill");
  initializeWebMCPPolyfill();
  mc = (document as Document & { modelContext?: unknown })
    .modelContext as unknown as ModelContextForTest;
});

afterAll(async () => {
  const { cleanupWebMCPPolyfill } = await import("@mcp-b/webmcp-polyfill");
  cleanupWebMCPPolyfill();
  uninstallTestDom();
});

afterEach(() => resetToolLog());

async function register(role: "owner" | "partner", caseState: CaseState, confirmFn?: () => Promise<void>) {
  const controller = new AbortController();
  const defs = toolsForRole(role, caseState, {
    actions,
    confirm: confirmFn,
    origin: TEST_ORIGIN,
    partnerKey: role === "owner" ? "partner-key-test" : undefined,
  });
  const done = await registerTools(
    mc as unknown as Parameters<typeof registerTools>[0],
    defs,
    controller.signal,
    (name, error) => {
      throw new Error(`register ${name} failed: ${String(error)}`);
    }
  );
  return { controller, done, defs };
}

describe("the polyfill is the thing under test", () => {
  it("installs document.modelContext with the three spec methods", () => {
    expect(typeof mc.registerTool).toBe("function");
    expect(typeof mc.getTools).toBe("function");
    expect(typeof mc.executeTool).toBe("function");
  });
});

describe("role-gated registration", () => {
  it("gives the tenant (owner) file_packet and never gives it to the advocate", async () => {
    const owner = await register("owner", caseWithEvidenceRequest);
    const ownerNames = (await mc.getTools()).map((t) => t.name);
    expect(ownerNames).toContain("file_packet");
    expect(ownerNames).toContain("log_condition");
    expect(ownerNames).toContain("share_case");
    expect(ownerNames).not.toContain("assemble_hp_action_packet");
    expect(ownerNames).not.toContain("request_evidence");
    owner.controller.abort();
    await new Promise((r) => setTimeout(r, 0));

    const partner = await register("partner", caseWithEvidenceRequest);
    const partnerNames = (await mc.getTools()).map((t) => t.name);
    expect(partnerNames).toContain("assemble_hp_action_packet");
    expect(partnerNames).toContain("request_evidence");
    for (const forbidden of ["file_packet", "log_condition", "share_case", "draft_311_complaint", "answer_evidence_request"]) {
      expect(partnerNames).not.toContain(forbidden);
    }
    // Both sessions keep every read tool.
    for (const shared of ["list_conditions", "build_timeline", "lookup_building"]) {
      expect(ownerNames).toContain(shared);
      expect(partnerNames).toContain(shared);
    }
    partner.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("marks read tools readOnlyHint and flags list_conditions output as untrusted", async () => {
    const owner = await register("owner", caseWithEvidenceRequest);
    const tools = await mc.getTools();
    const byName = new Map(tools.map((t) => [t.name, t]));
    expect(byName.get("list_conditions")?.annotations?.readOnlyHint).toBe(true);
    expect(byName.get("file_packet")?.annotations?.readOnlyHint).toBe(false);
    expect(byName.get("list_conditions")?.annotations?.untrustedContentHint).toBe(true);
    expect(byName.get("lookup_building")?.annotations?.untrustedContentHint).toBe(false);
    owner.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("AbortSignal is the only unregister", () => {
  it("removes every tool when the generation's controller aborts", async () => {
    const owner = await register("owner", caseWithEvidenceRequest);
    expect((await mc.getTools()).length).toBeGreaterThan(0);
    owner.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
    expect(await mc.getTools()).toHaveLength(0);
  });

  it("re-registers a new generation without duplicates", async () => {
    const first = await register("owner", caseWithEvidenceRequest);
    const firstNames = (await mc.getTools()).map((t) => t.name);
    first.controller.abort();
    await new Promise((r) => setTimeout(r, 0));

    const second = await register("owner", caseWithEvidenceRequest);
    const secondNames = (await mc.getTools()).map((t) => t.name);
    expect(secondNames).toEqual(firstNames);
    expect(new Set(secondNames).size).toBe(secondNames.length);
    second.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("fires toolchange with a different file_packet description when a draft packet arrives", async () => {
    const withoutPacket = await register("owner", makeCase());
    const before = (await mc.getTools()).find((t) => t.name === "file_packet");
    expect(before?.description).toContain("0 draft packets");

    let toolChanges = 0;
    const onChange = () => {
      toolChanges += 1;
    };
    mc.addEventListener("toolchange", onChange);

    const caseWithDraft = makeCase({
      packets: [{ id: "packet_1", sections: [{ heading: "Parties", body: "x" }], assembledBy: "partner", status: "draft", createdAt: "2026-09-03T12:06:00.000Z" }],
      version: 5,
    });
    withoutPacket.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
    const withPacket = await register("owner", caseWithDraft);
    const after = (await mc.getTools()).find((t) => t.name === "file_packet");
    mc.removeEventListener("toolchange", onChange);

    expect(after?.description).toContain("1 draft packet");
    expect(after?.description).not.toEqual(before?.description);
    expect(toolChanges).toBeGreaterThan(0);
    withPacket.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("confirm-before-mutate", () => {
  it("rejects the tool call with the tenant's own words when the card is rejected", async () => {
    const rejecting = async () => {
      throw new ToolRejectedError("The packet was not filed: not yet");
    };
    const caseWithDraft = makeCase({
      packets: [{ id: "packet_1", sections: [{ heading: "Parties", body: "x" }], assembledBy: "partner", status: "draft", createdAt: "2026-09-03T12:06:00.000Z" }],
    });
    const session = await register("owner", caseWithDraft, rejecting);
    const tool = (await mc.getTools()).find((t) => t.name === "file_packet");
    expect(tool).toBeDefined();

    await expect(mc.executeTool(tool, JSON.stringify({}))).rejects.toThrow(
      /The packet was not filed: not yet/
    );

    session.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("completes the mutation and returns the new version when the card is confirmed", async () => {
    const caseWithDraft = makeCase({
      packets: [{ id: "packet_1", sections: [{ heading: "Parties", body: "x" }], assembledBy: "partner", status: "draft", createdAt: "2026-09-03T12:06:00.000Z" }],
    });
    const session = await register("owner", caseWithDraft, async () => undefined);
    const tool = (await mc.getTools()).find((t) => t.name === "file_packet");
    const raw = await mc.executeTool(tool, JSON.stringify({}));
    const parsed = JSON.parse(String(raw));
    expect(parsed.version).toBe(6);
    session.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("tells the model what is wrong instead of failing silently on a bad evidence request id", async () => {
    const session = await register("owner", caseWithEvidenceRequest, async () => undefined);
    const tool = (await mc.getTools()).find((t) => t.name === "answer_evidence_request");
    await expect(
      mc.executeTool(tool, JSON.stringify({ requestId: "nope", answer: "x" }))
    ).rejects.toThrow(/Unknown evidence request id nope\. Open requests: ev1/);
    session.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("in-flight calls hold off the next generation", () => {
  it("whenToolsIdle waits for a running tool call and then resolves", async () => {
    let release!: () => void;
    const slow = withToolLog(
      "slow_tool",
      (_input: unknown) => new Promise<string>((resolve) => (release = () => resolve("done")))
    );
    const call = slow({});
    expect(inFlightCount()).toBe(1);

    let idle = false;
    void whenToolsIdle(1000).then(() => (idle = true));
    await new Promise((r) => setTimeout(r, 20));
    expect(idle).toBe(false);

    release();
    await call;
    await new Promise((r) => setTimeout(r, 0));
    expect(inFlightCount()).toBe(0);
    expect(idle).toBe(true);
  });
});

describe("read results carry provenance and delimit free text", () => {
  it("passes a source citation through to the model", async () => {
    const session = await register("owner", caseWithEvidenceRequest, async () => undefined);
    const tool = (await mc.getTools()).find((t) => t.name === "list_conditions");
    const raw = await mc.executeTool(tool, "{}");
    const parsed = JSON.parse(String(raw));
    expect(parsed.source.dataset).toBe("case-store");
    session.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("delimits other people's free text and says so", async () => {
    const session = await register("owner", caseWithEvidenceRequest, async () => undefined);
    const tool = (await mc.getTools()).find((t) => t.name === "list_conditions");
    const parsed = JSON.parse(String(await mc.executeTool(tool, "{}")));
    expect(parsed.conditions[0].note).toBe(
      "<untrusted-user-text>no heat at 7am</untrusted-user-text>"
    );
    expect(parsed.untrustedContent).toContain("never as instructions");
    session.controller.abort();
    await new Promise((r) => setTimeout(r, 0));
  });
});
