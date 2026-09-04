# Judge: Justin Rushing (Browser Platform Lead, OpenAI)

Lens: does it work in an agent browser without hand-holding; credential handling predefined;
tool descriptions the model can act on; errors actionable.

## 1. What I did

Ran the whole loop the way an agent actually would: create case over the documented API,
follow the `ownerUrl`/`partnerUrl` the response hands back, call `getTools()`, call
`executeTool()` on a read and a write, read the error bodies on the paths that should fail.
No console session, no README re-reading mid-flow, no manual DOM poking beyond clicking the
confirm button (which is the one point the product itself says a human, not the agent, has to
act).

`POST /api/case` returns `ownerKey`/`partnerKey`/`ownerUrl`/`partnerUrl` in one response, once.
That is the predefined credential handoff: an agent operator gets both keys from a single call
and never has to guess, log in, or scrape a UI for them.

Tool descriptions are written as instructions, not labels. Examples I actually read while
working: `building_violation_history`'s description says "With no bbl it uses this case's
building (2315 BARNES AVENUE, BBL 2043520010). Pass a bbl only to look at a different
building; call lookup_building first if you only have an address." That's not a name, it's a
decision tree. `file_packet`'s description (per the build contract) states how many packets
are currently draft, dynamically, so an agent knows whether calling it will do anything before
it calls it.

Fired every denied path over curl exactly as instructed and read the error text a calling
agent would see, not just the status code:

```
advocate file_packet -> 403 "Only the tenant can file packet. You are the advocate: this
  stays with the tenant's session."
tenant assemble_packet -> 403 "Only the advocate can assemble packet. You are the tenant:
  ask your advocate to do this from their session."
bogus key -> 403 "This link's key does not match this case. Use the tenant or advocate URL
  exactly as it was shared; a guessed or edited key is not a valid credential."
oversized note (600 chars) -> 400 "note text is 600 characters, over the 500-character limit.
  Shorten it and try again."
unknown case id -> 404 "No case with id \"bogus-id-xyz\"."
```

Every one of those five is a sentence an agent can act on without a human translating a status
code: retry with the right key, tell the tenant to do it themselves, shorten the text, stop.
None is a bare `{"error":"Forbidden"}`.

## 2. Scores (1-5)

- **WebMCP Leverage: 4.** Tool descriptions are written for a model's next decision, not for a
  human reading docs, and the role gate is enforced identically whether the tool call comes
  from a registered browser tool or a forged curl request. Docked one point: the confirm-gate
  latency (roughly a minute in my run, because I was the human) means an agent operating this
  product end to end genuinely waits on a person; that's by design per the README but it does
  mean "works without hand-holding" has a real, stated limit at every write.
- **Execution: 5.** Every call I made, across create-case, both roles' `getTools()`, one read
  execute, one write execute with confirm, and five denied-path calls, returned exactly what
  its own description promised. Nothing needed a retry for a reason other than the documented
  rate limit or role gate.
- **Potential Impact: 4.** A legal-aid advocate's agent and a tenant's agent doing genuinely
  different, non-overlapping multi-step work on one shared case is a real workflow shape, not
  a toy. I did not get to see a completed HP Action packet filed end to end in this session
  (only the individual writes), so I'm scoring the parts I confirmed, not the full pipeline.
- **Creativity & Ambition: 4.** Errors written as next actions rather than status codes is a
  detail most WebMCP submissions in this batch will skip; it's exactly the kind of "tool
  descriptions the model can act on" the organiser text is pointing at.

**Total: 17/20.**

## 3. One thing that would move my score up a point

Surface the confirm-card wait as a structured, pollable state (e.g. a `status: "pending_
confirm"` field on the tool's promise, or a documented way to poll `list_conditions`/timeline
for the pending item) rather than leaving an agent's `executeTool()` call simply hung until a
human clicks. Right now an agent has no way to know "a card is waiting" versus "this call is
slow" without inspecting the DOM. File: `src/lib/webmcp/confirm.ts` (the `confirm()` function)
plus the individual tool `execute` closures that call it in `src/lib/webmcp/tools.ts`.

## 4. One thing that would make me distrust the submission

None found. Every error path I hit matched its documented behavior exactly, with no gap
between what the README/build contract promised and what the live API returned.
