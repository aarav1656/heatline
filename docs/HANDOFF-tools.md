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

## Fixed: tools.ts no longer imports @/lib/index directly (blocked next build)

`tools.ts` (client-reachable via `WebMCPTools.tsx`) now fetches `/api/building`,
`/api/building/[bbl]`, the new `/api/building/[bbl]/compare`, and the new `/api/code/match`
instead of calling `lookupBuilding`/`getBuildingRecord`/`compareToBlock`/`matchConditionToCode`
directly. Only types are imported from `@/lib/index` now. Verified `rm -rf .next && npx next
build` exits 0 with no `node:fs` chunking error; `npx vitest run` still 110/110.

## Fixed: action route TYPES array

Already matched the real `CaseActionType` union as of the first commit (b9f6599); the report of
it still listing `add_item`/`propose_change`/etc was against a stale checkout. Current file
correctly lists `log_condition | request_evidence | answer_evidence | assemble_packet |
file_packet | add_note | draft_311`.

## Known gap (resolved)

`data/index.json` has now been built by the data agent, so this no longer applies day-to-day:
`lookupBuilding`/`getBuildingRecord` no longer throw. The `/api/building*` routes still 503
gracefully if the file is ever missing again (e.g. a fresh clone before running the build
script), and the WebMCP read tools now go through those routes (see the fix above), so they get
that same 503 surfaced as a tool error rather than a raw throw.
