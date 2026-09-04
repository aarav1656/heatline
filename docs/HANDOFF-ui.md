# Handoff from UI agent

## BLOCKING: src/lib/webmcp/tools.ts imports @/lib/index directly, breaks the client build
`tools.ts` is `"use client"`-reachable (imported by `WebMCPTools.tsx`, a client component) and
imports `lookupBuilding`, `getBuildingRecord`, `matchConditionToCode` straight from `@/lib/index`,
which does `node:fs` / `node:path` reads of `data/index.json`. `next build` (Turbopack) fails
hard trying to bundle `node:fs` for the browser:
```
Failed to write app endpoint /c/[caseId]/page
Caused by: the chunking context (unknown) does not support external modules (request: node:fs)
```
`next dev` doesn't hit this (dev doesn't chunk the same way), so it was easy to miss. Two ways to
fix, either works: (a) route every building/code read tool's `execute` through the existing
`/api/building` REST routes instead of calling the index functions directly, or (b) keep the
direct import but make `src/lib/index/index.ts` safe to bundle client-side (e.g. guard the
`node:fs` calls behind `typeof window === "undefined"`, though then a browser-run tool call gets
nothing back, so (a) is the real fix). This blocks `pnpm build` for everyone, not just UI: I
cannot verify `next build` or run `uicraft look` against a production build until it's fixed. I
verified `next dev` renders correctly in the meantime.

## api/case/[id]/action/route.ts TYPES array is stale
`src/app/api/case/[id]/action/route.ts` still validates `type` against the old spine's action
list: `["add_item", "propose_change", "accept_change", "add_note", "report"]`. The real
`CaseActionType` union (src/lib/types.ts) is `log_condition | request_evidence |
answer_evidence | assemble_packet | file_packet | add_note | draft_311`. Every write from the
UI (CaseProvider.tsx actions) currently 400s with "Unknown action" until this array is updated
to match. Please update `TYPES` in that route to the real union (or import
`CaseActionType` and drop the manual list).

## GET /api/building?q= has no openClassC on hits
`src/app/api/building/route.ts` returns `{ buildings: Building[] }` from `lookupBuilding`,
without an `openClassC` count per hit. `CreateCase.tsx`'s result list shows the BBL as a
fallback when `openClassC` is absent (per the contract's "open class C count per building" UI
requirement). Not blocking, but the result list is less useful without it: consider joining
`getBuildingRecord(b.bbl)?.openClassC` per hit before returning.

## data/index.json not present yet
`src/lib/index/index.ts` is currently the tools agent's stub (untracked) reading
`data/index.json`, which does not exist. Every read tool (lookup_building,
building_violation_history, compare_to_block, match_condition_to_code) and the Building record
panel will render its empty state until the data agent lands `data/index.json` +
`INDEX_META`. README's "index covers N buildings" line reads `INDEX_META.buildings` and will
show 0 until then; not a UI bug.
