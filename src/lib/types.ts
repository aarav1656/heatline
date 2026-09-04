/**
 * The whole domain model for Heatline: a Case shared by a tenant (Role "owner") and a
 * legal-aid advocate (Role "partner") on one NYC building. Everything in src/lib/webmcp and
 * src/lib/store/backend.ts is domain-agnostic and does not change; this file and
 * src/lib/store/actions.ts are the two files a domain fork rewrites.
 */
export type Role = "owner" | "partner";

/** A source citation. Building/violation reads point this at the real NYC Open Data SODA query
 *  that produced the number (see src/lib/index); case-only reads point it at the case store. */
export type SourceRef = { dataset: string; query: string; rows: number };

/** The six condition types the code table and the data layer key off of. Free text is still
 *  accepted at the tool boundary (see log_condition), this is the closed set matching helps. */
export type ConditionType = "heat" | "hot_water" | "mold" | "pests" | "lead" | "gas";

export type Condition = {
  id: string;
  type: string;
  reading?: string;
  at: string;
  note: string;
  by: Role;
  createdAt: string;
  codeSection?: string;
};

export type EvidenceRequest = {
  id: string;
  ask: string;
  by: "partner";
  status: "open" | "answered";
  createdAt: string;
  /** Set once the tenant answers. Optional so a still-open request omits both fields. */
  answer?: string;
  answeredAt?: string;
};

export type Packet = {
  id: string;
  sections: { heading: string; body: string }[];
  assembledBy: "partner";
  status: "draft" | "filed";
  createdAt: string;
  filedAt?: string;
};

export type Complaint311 = {
  id: string;
  conditionType: string;
  description: string;
  at: string;
};

export type TimelineEvent = {
  at: string;
  by: Role | "system";
  kind: string;
  text: string;
};

export type CaseState = {
  id: string;
  title: string;
  createdAt: string;
  /** The building this case is about, set once at creation from the index. */
  bbl: string;
  address: string;
  conditions: Condition[];
  evidenceRequests: EvidenceRequest[];
  packets: Packet[];
  complaints: Complaint311[];
  notes: TimelineEvent[];
  /**
   * Per-link capability tokens minted at creation. `role` is derived from which of these a
   * caller presents; it is never trusted as a self-declared label. Stripped from every
   * serialised case (GET, SSE, tool results) except the one-time POST /api/case response,
   * which hands both to the creator.
   */
  ownerKey: string;
  partnerKey: string;
  version: number;
};

export type CaseActionType =
  | "log_condition"
  | "request_evidence"
  | "answer_evidence"
  | "assemble_packet"
  | "file_packet"
  | "add_note"
  | "draft_311";

export type CaseAction = {
  type: CaseActionType;
  /** The capability token from the caller's link. Role is derived from this, never trusted as a label. */
  key: string;
  payload?: Record<string, unknown>;
};

export type CreateCaseInput = {
  /** The 10-digit BBL of the building this case is about, chosen from lookup_building results. */
  bbl: string;
  apartment: string;
  /** Seeds the case's first condition, attributed to the tenant (owner). */
  firstCondition: { type: string; reading?: string; note: string };
};
