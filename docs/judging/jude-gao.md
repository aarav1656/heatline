# Judge: Jude Gao (Member of Technical Staff, Vercel / Next.js core team)

Lens: Next.js app quality, server enforcement of role, SSE and state design, deploy hygiene,
no client-only trust.

## 1. What I did

Read the App Router structure (`src/app/api/**`) and the store layer before touching the live
site, then verified the server-trust claims against real requests, not the README's word.

`src/lib/store/actions.ts`, `roleForKey()`: role is derived server-side purely from which of
`caseState.ownerKey` / `caseState.partnerKey` the presented key equals; a non-matching key
returns `null`, and `applyAction` throws `RoleError` before `mutate()` ever runs. `assertRole`
then re-checks `OWNER_ONLY` / `PARTNER_ONLY` against that server-derived role, not anything the
client sent. I forged the two adversarial calls the build contract calls out explicitly, over
curl, with no browser involved:

```
advocate key + file_packet -> 403 "Only the tenant can file packet. You are the advocate:
  this stays with the tenant's session."
tenant key + assemble_packet -> 403 "Only the advocate can assemble packet. You are the
  tenant: ask your advocate to do this from their session."
```

Both 403s came from a route that never reads a `role` field from the body at all (confirmed in
`src/app/api/case/[id]/action/route.ts`: "Role is never read from the body: it is derived,
inside applyAction, from which capability key was presented"). That's server enforcement, not
client-hidden-tool trust.

`GET /api/case/[id]` and the SSE stream (`src/app/api/case/[id]/stream/route.ts`) both call
`stripKeysAndSpotlight`, which does two things server-side before the response leaves: strips
both capability keys unconditionally (`ownerKey: "", partnerKey: ""`), and wraps every piece of
free text a person typed in the same `<untrusted-user-text>` spotlighting the WebMCP tool
results use, "so a caller reading this over plain fetch() sees the identical untrusted-content
boundary a tool call would have shown it." That's real symmetry between the tool surface and
the plain-REST surface, not a security boundary that only exists inside `document.modelContext`.

The SSE route: `force-dynamic`, 2s poll interval against the store, a 5-minute hard cap with an
explicit `end` event telling the client to reconnect, and a `keepalive` comment line on
unchanged versions rather than resending the whole case. Correctly bounded, not a naive
`setInterval` that runs forever.

Every API route I read (`case`, `case/[id]`, `case/[id]/action`, `case/[id]/stream`,
`building`, `building/[bbl]`, `building/[bbl]/compare`, `code/match`, `health`) declares
`export const dynamic = "force-dynamic"`, correct for a live-mutating, per-request app, and
consistent across all nine routes rather than only the ones someone remembered.

## 2. Scores (1-5)

- **WebMCP Leverage: 4.** The tool layer and the plain-REST layer share the exact same
  server-side role gate and the exact same untrusted-content spotlighting function, which
  means the WebMCP tools are not a separate, weaker-checked surface bolted onto a trusting
  API; they're two entry points into one enforced core.
- **Execution: 5.** Every server-trust claim I could adversarially test (role, key validation,
  key stripping, SSE bounding) held under a real forged request, not just a documented one.
- **Potential Impact: 4.** A real legal-aid workflow with a genuine two-party trust boundary is
  exactly the shape where "the server re-checks it independently" matters in production, not
  just in a demo; this is closer to shippable than most of what I'll see in this batch.
- **Creativity & Ambition: 4.** Sharing one spotlighting/stripping function between the tool
  surface and the REST surface, so a non-tool caller gets the identical untrusted-content
  boundary, is a level of consistency most submissions this size won't bother with.

**Total: 17/20.**

## 3. One thing that would move my score up a point

I did not verify the rate-limit code (`src/lib/store/ratelimit.ts`, 60 req/min per IP and per
case per the action route's own comment) against a real burst, I only read it. Run it live:
fire 61+ actions in under a minute against the demo case and confirm the 429 fires with a
`retryAfterSeconds` an agent can act on, the same way the 403/400/404 paths were verified live
here. File: `src/lib/store/ratelimit.ts`, exercised via `src/app/api/case/[id]/action/route.ts`.

## 4. One thing that would make me distrust the submission

None found. Every server-enforcement claim in `BUILD-CONTRACT.md` and the code comments
matched a live, adversarial request I made myself.
