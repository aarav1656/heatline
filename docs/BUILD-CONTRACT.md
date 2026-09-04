# Build contract: Order to Correct

Three agents build in parallel on disjoint paths. This file is the interface between them.
Do not edit paths you do not own. If you need a change in another agent's path, write it in
`docs/HANDOFF-<yourrole>.md` and carry on with a local stub typed against this contract.

Product (from ../docs/NEXT-ENTRIES.md Entry A): tenant (= owner) and legal-aid advocate
(= partner) share one case page for one NYC building. Tenant's agent logs conditions, drafts the
311 complaint (declarative form, human submits), files the packet. Advocate's agent assembles the
HP Action packet and requests evidence. Only the tenant can file.

## Roles

`Role = "owner" | "partner"` stays as the type. UI copy: owner = **Tenant**, partner = **Advocate**.

## Ownership

| Agent | Owns |
|---|---|
| data | `scripts/build-index.ts`, `data/**`, `src/lib/index/**` |
| tools | `src/lib/types.ts`, `src/lib/store/actions.ts`, `src/lib/store/index.ts` (createCase seed), `src/lib/webmcp/tools.ts`, `src/lib/webmcp/contracts.ts`, `src/lib/webmcp/*.test.ts`, `evals/**`, `src/app/api/**` |
| ui | `DESIGN.md`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/**`, `README.md`, `public/**` |

## Data layer API (data agent exports from `src/lib/index/index.ts`)

```ts
export type SourceRef = { dataset: string; query: string; rows: number }; // re-export from @/lib/types

export type Building = {
  bbl: string;               // 10-digit borough-block-lot
  address: string;           // "123 EXAMPLE ST"
  borough: string;
  zip: string;
  buildingId?: string;       // HPD building id
  registration?: { ownerName: string; agentName?: string; portfolioBuildings: number; source: SourceRef };
};

export type Violation = {
  violationId: string;
  class: "A" | "B" | "C" | "I";
  status: "open" | "closed";
  inspectionDate: string;    // ISO date
  daysOpen: number;          // to build date if open, else to close date
  description: string;      // novdescription
  codeSection?: string;     // e.g. "27-2029" when inferrable from ordernumber/description
  apartment?: string;
};

export type ComplaintSummary = {
  winter: string;            // "2024-25"
  heatHotWaterComplaints: number;
  source: SourceRef;
};

export type BuildingRecord = {
  building: Building;
  openClassC: number;
  openClassB: number;
  openClassA: number;
  totalOpen: number;
  oldestOpenDays: number;
  violations: Violation[];   // open first, newest first, capped 200
  heatComplaintsByWinter: ComplaintSummary[];
  source: SourceRef;         // the SODA query for violations
};

export type CodeMatch = {
  condition: string;         // "heat" | "hot_water" | "mold" | "pests" | "lead" | "gas"
  section: string;           // "27-2029"
  title: string;
  requirement: string;       // one sentence, plain English, with numbers (68F 6am-10pm when outside <55F)
  heatSeason?: string;       // "Oct 1 - May 31"
  classHint: "A" | "B" | "C";
};

export function lookupBuilding(query: string): Building[];              // by address substring or BBL, from data/index.json
export function getBuildingRecord(bbl: string): BuildingRecord | null;  // from data/index.json
export function compareToBlock(bbl: string): { building: number; blockMedian: number; blockCount: number; source: SourceRef } | null; // open class C vs other BBLs on same block in index
export function matchConditionToCode(text: string): CodeMatch[];        // keyword match over the six-row table
export const CODE_TABLE: CodeMatch[];
export const INDEX_META: { builtAt: string; buildings: number; violations: number; sources: string[] };
```

Index scope: pull SODA for ~40 buildings in one Bronx zip with the most open class C heat
violations (query wvxf-dwi5 for class C, `novdescription like '%HEAT%'`, group by bbl, top N), then
per-BBL full violation history, complaints uwyv-629c + problems a2nx-4u46 for heat/hot water by
winter, registrations tesw-yqqr for owner. The demo building is the BBL with the most open class C.
Every number carries the SODA URL that produced it. `data/index.json` committed, target < 3 MB.
`INDEX_META.demoBbl` names the demo building.

## Case state (tools agent, `src/lib/types.ts`)

```ts
export type Condition = { id: string; type: string; reading?: string; at: string; note: string; by: Role; createdAt: string; codeSection?: string };
export type EvidenceRequest = { id: string; ask: string; by: "partner"; status: "open" | "answered"; createdAt: string };
export type Packet = { id: string; sections: { heading: string; body: string }[]; assembledBy: "partner"; status: "draft" | "filed"; createdAt: string; filedAt?: string };
export type Complaint311 = { id: string; conditionType: string; description: string; at: string };
export type CaseState = {
  id: string; title: string; createdAt: string;
  bbl: string; address: string;                // set at creation from the index
  conditions: Condition[]; evidenceRequests: EvidenceRequest[]; packets: Packet[];
  complaints: Complaint311[]; notes: TimelineEvent[];
  ownerKey: string; partnerKey: string; version: number;
};
export type CaseActionType = "log_condition" | "request_evidence" | "answer_evidence" | "assemble_packet" | "file_packet" | "add_note" | "draft_311";
```

Server role gates (actions.ts): OWNER_ONLY = log_condition, answer_evidence, file_packet, draft_311.
PARTNER_ONLY = request_evidence, assemble_packet. add_note both.

`POST /api/case` body: `{ bbl, apartment, firstCondition: { type, reading, note } }`. Title derives
as `${address} apt ${apartment}`.

## Tools (tools agent, `src/lib/webmcp/tools.ts`)

Tenant (owner): lookup_building (ro), building_violation_history (ro), compare_to_block (ro),
match_condition_to_code (ro), log_condition (write, confirm), list_my_conditions (ro),
build_timeline (ro), answer_evidence_request (write, confirm), file_packet (write, confirm),
share_case (ro), draft_311_complaint (declarative form in UI agent's `Report311Form.tsx`,
toolname `draft_311_complaint`, no toolautosubmit; UI agent posts to `draft_311` action).
Advocate (partner): lookup_building, building_violation_history, compare_to_block,
match_condition_to_code, list_my_conditions (renamed list_conditions for both), build_timeline,
assemble_hp_action_packet (write, confirm), request_evidence (write, confirm), add_note.
Never for advocate: log_condition, file_packet, share_case, draft_311_complaint,
answer_evidence_request. Never for tenant: assemble_hp_action_packet, request_evidence.

Read tools import from `@/lib/index` and return `{ ..., source: SourceRef }`. Every description is
written for a model: what it returns, when to call it, what to call next. Descriptions are dynamic
where state helps (e.g. file_packet says how many packets are draft).

Evals: >= 12 fixtures under `evals/fixtures`, including negative fixtures for advocate cannot
file_packet, tenant cannot assemble. `npx vitest run` green.

## UI (ui agent)

Start from the existing components. Panels: Building record (open C/B/A counts, oldest open days,
owner, block comparison, source link), Conditions log (tenant adds; readings in tabular numerals),
Evidence requests (advocate asks, tenant answers), HP Action packet (sections, Draft/Filed state,
File button only for tenant), 311 complaint form (declarative, human Send), Timeline, WebMCP tools
panel (existing). Role banner: "You are the tenant" / "You are the advocate". Home page: address
search over `lookupBuilding` (client-side import of the index is fine, or via `GET /api/building?q=`
which the tools agent adds), pick apartment, first condition.

DESIGN.md: keep the template's structure; accent becomes a civic red-brown or NYC-agency blue;
semantic colours: class C = out, class B = watch, class A = reliable. No shadows, hairlines, tabular
numerals. Run `uicraft gate` and `uicraft look` at 375 and 1440.

Copy rules: never "legal advice"; say "for review with your advocate". SIMULATED label on any demo
control. Sources shown as the SODA URL with the row count.

## Done means

`pnpm typecheck && pnpm lint && pnpm test` green in the repo, `pnpm build` green, commit on `main`.
