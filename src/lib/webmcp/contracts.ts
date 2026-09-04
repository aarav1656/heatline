/**
 * The interface the WebMCP tool layer needs from the rest of the app.
 *
 * Domain types come from `src/lib/types.ts` (canonical). This file adds only what is specific to
 * the tool layer: the actions interface tools call, and the WebMCP tool descriptor shape.
 */
export type {
  Role,
  SourceRef,
  ConditionType,
  Condition,
  EvidenceRequest,
  Packet,
  Complaint311,
  TimelineEvent,
  CaseState,
  CreateCaseInput,
} from "@/lib/types";

import type { CaseState, CreateCaseInput } from "@/lib/types";

/**
 * Mutations, exactly the `actions` object from the UI agent's `useCase() -> { caseState,
 * role, actions }`. Every one of these is server-authoritative: the server re-checks the role,
 * so a hidden tool is never the only thing standing between an advocate and a tenant-only action.
 */
export interface CaseActions {
  createCase(input: CreateCaseInput): Promise<CaseState & { ownerUrl: string; partnerUrl: string }>;
  logCondition(type: string, note: string, reading?: string, codeSection?: string): Promise<CaseState>;
  requestEvidence(ask: string): Promise<CaseState>;
  answerEvidence(requestId: string, answer: string): Promise<CaseState>;
  assemblePacket(sections: { heading: string; body: string }[]): Promise<CaseState>;
  filePacket(): Promise<CaseState>;
  addNote(text: string): Promise<CaseState>;
  draft311(conditionType: string, description: string): Promise<CaseState>;
}

/** JSON Schema (draft 2020-12 subset) as accepted by `document.modelContext.registerTool`. */
export type JsonSchema = {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties: false;
};

/** WebMCP has exactly two annotations. There is no destructiveHint. */
export type ToolAnnotations = { readOnlyHint: boolean; untrustedContentHint: boolean };

export type ToolExecuteOptions = { signal?: AbortSignal };

export type WebMcpToolDef = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: ToolAnnotations;
  /**
   * Native Chrome passes `{ signal }` per spec; `@mcp-b/webmcp-polyfill` calls
   * `execute(args)` with one argument, so `options` must be treated as optional.
   */
  execute: (input: Record<string, unknown>, options?: ToolExecuteOptions) => Promise<unknown>;
  /**
   * "form" means this tool is registered by the browser from a `<form toolname=...>`,
   * not by registerTool. WebMCPTools skips these so the two never collide on name.
   */
  declarative?: "form";
};
