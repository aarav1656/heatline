# Judge: Alex Nahas (creator of MCP-B)

Lens: tool contracts over DOM actuation; precise WebMCP vs MCP wording; which layer of the
stack (native, polyfill, bridge); AbortSignal lifecycle; would open DevTools > Application >
WebMCP first.

## 1. What I did

Created a fresh case via the API (`POST /api/case`, BBL 2043520010, 2315 Barnes Ave apt 4C).
Opened the tenant URL in `bh-multi` (qa profile, native WebMCP, no polyfill needed since this
is a real WebMCP-capable Chromium build).

Tenant `getTools()`, called from the page itself:

```
add_note,answer_evidence_request,build_timeline,building_violation_history,compare_to_block,
draft_311_complaint,file_packet,list_conditions,log_condition,lookup_building,
match_condition_to_code,share_case
```

Advocate `getTools()` (separate tab, partner key):

```
add_note,assemble_hp_action_packet,build_timeline,building_violation_history,compare_to_block,
list_conditions,lookup_building,match_condition_to_code,request_evidence
```

Two different tool sets, same origin, same session type, switched purely by which key is in
the URL. That's the DevTools > Application > WebMCP asymmetry I'd check first, and it's real,
not narrated: `log_condition`, `file_packet`, `share_case`, `draft_311_complaint`,
`answer_evidence_request` never register in the advocate's `document.modelContext` at all.

Ran a real read tool via `document.modelContext.executeTool(toolObject, args)`:

```
building_violation_history({}) ->
{"building":{"bbl":"2043520010","address":"2315 BARNES AVENUE",...
"registration":{"ownerName":"2316 WALLACE AVE REALTY CORP",...
"source":{"dataset":"feu5-w2e2","query":"https://data.cityofnewyork.us/resource/feu5-w2e2.json?...","rows":1}}},
"openClassC":102,"openClassB":82,"openClassA":15,"totalOpen":200,"oldestOpenDays":601,
"violations":[{"violationId":"18900694","class":"A",...}, ...]}
```

Ran a real write tool the same way (`log_condition`), which suspended on a confirm card in the
page (not a modal dialog, not `window.confirm`) until I clicked CONFIRM. Timeline updated
("Tenant logged heat (53F at 8am): judge panel test log via tool") and the in-page "TOOL LOG"
panel recorded the call with a real elapsed time (58274ms, because the confirm click was
manual and slow), that panel is the thing this team built in place of the DevTools inspector,
and it does the same job: shows a tool call actually landed, with its args.

Read `src/lib/webmcp/confirm.ts`: `confirm()` takes the `AbortSignal` the browser hands
`execute`, attaches an `abort` listener, and rejects with a distinct `ToolCancelledError` if
the agent aborts while the card is open ("The agent cancelled this call while the confirmation
card was open; nothing was changed.") versus `ToolRejectedError` for a human clicking Reject.
That is a correctly modeled AbortSignal lifecycle, not a `try/catch` bolted on.

Read `src/lib/webmcp/tools.ts`: this app registers imperatively
(`document.modelContext.registerTool`) for every read tool and non-form write, and
declaratively (`<form toolname="draft_311_complaint" tooldescription="...">`) for the 311
complaint, and the README says so explicitly. That's the layering distinction (native
`document.modelContext` API, both registration styles, no polyfill, no MCP-B bridge to a
desktop client) stated plainly instead of "WebMCP" used as an undifferentiated word.

## 2. Scores (1-5)

- **WebMCP Leverage: 5.** Two divergent tool sets from one role-derived key, both imperative
  and declarative registration used for the reason each fits, a hand-built confirm gate that
  correctly threads `AbortSignal`, and a visible tool-call log that substitutes for the
  DevTools inspector. This is tool contracts, not actuation, end to end.
- **Execution: 4.** Every tool call I made worked with no hand-holding, wrote real state, and
  the confirm card resolved cleanly. Docked one point only because the demo relies on the
  agent operator manually driving `executeTool()` in a JS console rather than the product
  shipping its own agent-facing surface (there's no bundled agent client to just point at the
  URL); that's expected for this style of submission, not a defect.
- **Potential Impact: 4.** Specific and demonstrated, not abstract: the tenant's agent turns
  "eleventh morning without heat" into a code section, a logged condition, and a filed 311
  complaint the tenant still has to press Send on. The advocate's agent turns building history
  into a packet draft the tenant still has to file. That's the "which layer of the stack, and
  why" story Nahas's own docs reward.
- **Creativity & Ambition: 4.** Two distinct human roles sharing one origin with server-
  enforced, not merely client-hidden, tool asymmetry is a genuinely different shape than the
  single-agent-single-tool-list demos this challenge will be full of.

**Total: 17/20.**

## 3. One thing that would move my score up a point

Ship a real "Model Context Tool Inspector"-equivalent screenshot or short clip in the README
showing `document.modelContext.getTools()` output side by side for both roles from actual
DevTools, not just the in-page TOOL LOG panel, the in-page panel is good but it's the site's
own claim about itself; an external inspector view is a claim I don't have to trust the site
to make. File: `README.md`, add a screenshot section near "How WebMCP is used."

## 4. One thing that would make me distrust the submission

None found. Every claim in the README about tool sets, confirm gating, and server-side role
re-checking matched what the live tool calls and 403 tests actually did.
