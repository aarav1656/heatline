# HANDOFF from tools agent

## Action route bodies (for CaseProvider)

`POST /api/case/[id]/action` body: `{ type, key, payload }`, same shape as the template.

| action type | payload |
|---|---|
| `log_condition` | `{ type, note, reading?, codeSection? }` |
| `request_evidence` | `{ ask }` |
| `answer_evidence` | `{ requestId, answer }` |
| `assemble_packet` | `{ sections: [{ heading, body }] }` |
| `file_packet` | `{}` |
| `add_note` | `{ text }` |
| `draft_311` | `{ conditionType, description }` |

`CaseActions` interface (`src/lib/webmcp/contracts.ts`) your `CaseProvider` implements:

```ts
createCase(input: CreateCaseInput): Promise<CaseState & { ownerUrl; partnerUrl }>;
logCondition(type, note, reading?, codeSection?): Promise<CaseState>;
requestEvidence(ask): Promise<CaseState>;
answerEvidence(requestId, answer): Promise<CaseState>;
assemblePacket(sections): Promise<CaseState>;
filePacket(): Promise<CaseState>;
addNote(text): Promise<CaseState>;
draft311(conditionType, description): Promise<CaseState>;
```

`POST /api/case` body is now `{ bbl, apartment, firstCondition: { type, reading?, note } }`.
`bbl` must match `^\d{10}$`. `firstCondition.type` must be one of heat/hot_water/mold/pests/lead/gas.
Title is derived server-side as `${address} apt ${apartment}` (address comes from
`lookupBuilding(bbl)`, falls back to the bbl itself if the index build hasn't run yet).

New read routes added: `GET /api/building?q=<query>` (proxies `lookupBuilding`) and
`GET /api/building/[bbl]` (proxies `getBuildingRecord`). Both no-auth, read-only, `PRIVATE_NO_STORE`.

## Tool names to render in the WebMCPTools panel / role banner

Tenant (owner) tools: `lookup_building`, `building_violation_history`, `compare_to_block`,
`match_condition_to_code`, `list_conditions`, `build_timeline`, `log_condition` (write, confirm),
`answer_evidence_request` (write, confirm), `file_packet` (write, confirm), `share_case`,
`draft_311_complaint` (declarative form, `Report311Form.tsx`, no toolautosubmit).

Advocate (partner) tools: same six reads, plus `assemble_hp_action_packet` (write, confirm),
`request_evidence` (write, confirm), `add_note`.

`add_note` is available to both roles.

## CaseState shape you render

`bbl`, `address`, `conditions[]`, `evidenceRequests[]`, `packets[]`, `complaints[]`, `notes[]`.
No more `items`/`proposals`/`reports`. Packet has `sections: {heading, body}[]` and
`status: "draft" | "filed"`. EvidenceRequest has `answer?`/`answeredAt?` once answered.

## Known gap

`src/lib/index/index.ts` and `data/index.json` are the data agent's build output. Until
`npx tsx scripts/build-index.ts` has run, `data/index.json` does not exist and `lookupBuilding`/
`getBuildingRecord` throw. The two `/api/building*` routes catch that and return 503 with a
clear message; `createCase` degrades gracefully (falls back to the bbl as the address). The
WebMCP read tools (`lookup_building`, `building_violation_history`, `compare_to_block`,
`match_condition_to_code`) do not catch it, so an agent calling them before the index is built
gets a raw throw surfaced as the tool's error message, not a 503, which is the correct behaviour
for a tool (the model sees an actionable error either way).
