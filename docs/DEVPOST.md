# Devpost submission text

Paste-ready. Field names match the Devpost submission form for The WebMCP Challenge.

---

## Project name

Heatline

## Tagline (under 100 characters)

A tenant and a legal-aid advocate each get an agent on one NYC building's own enforcement record.

(96 characters)

## Links

- Live: https://heatline-nyc.vercel.app
- Repo: https://github.com/aarav1656/heatline (MIT)
- Video: https://www.youtube.com/watch?v=c6iGV-WVmWw

---

## Why this use case is a strong fit for WebMCP

A tenant and the advocate helping them are two people with different powers looking at the same
case. The tenant can log what they see and file; the advocate can build the packet and ask for
evidence, but cannot file on the tenant's behalf. WebMCP registers tools per session from inside
the page, so the tenant's link and the advocate's link, on one origin and one deployment, present
different tool lists to different agents. DevTools > Application > WebMCP shows 12 tools in the
tenant's window and 9 in the advocate's. `file_packet`, `log_condition` and the declarative
`draft_311_complaint` exist only in the tenant's; `assemble_hp_action_packet` and
`request_evidence` only in the advocate's. A server-side MCP server cannot express that because it
never learns which browser tab is asking. Role is a capability key in the URL, never a label the
client claims, and every write is re-checked on the server, so a forged call from the wrong
session is a 403 with a sentence the model can act on.

## How it creates a better user experience

Before: a tenant with no heat searches HPD Online by address, reads a violations table one row at
a time, does not know that "class C" means immediately hazardous or that 27-2029 is the heat rule,
and the advocate rebuilds the same building history by hand for the HP Action petition. After: the
tenant says "no heat again, 52 degrees at 7am" and the agent calls `match_condition_to_code`
(section 27-2029, 68F from 6am to 10pm when it is under 55F outside, heat season Oct 1 to May 31),
then `log_condition`, which parks in a confirmation card until the tenant presses Confirm.
`building_violation_history` takes no arguments in an open case and returns the building's own
record: for 2315 Barnes Avenue, 102 open class C violations, the oldest open 601 days, the owner
and their portfolio size, and the exact NYC Open Data SODA URL beside every number so the claim can
be checked rather than trusted.

## What people and agents can now do together that was difficult before

The advocate's agent calls `request_evidence` ("a photo of the thermostat at 7am tomorrow") and it
lands in the tenant's window over a live stream with no reload; the tenant's agent answers it. The
advocate's agent then calls `assemble_hp_action_packet`, which builds five sections from the case
and the city record (parties from the registration, conditions with code sections, building
record with block comparison, timeline, relief sought) and stores a draft. The tenant's agent sees
"one draft packet waiting", calls `file_packet`, and a person presses Confirm. The advocate's agent
cannot file, even by forging the call. The 311 complaint is a declarative form: the agent fills
every field, only a human presses Send. None of this works with DOM scraping or a shared login.

Context: HPD's own enforcement data (violations dataset wvxf-dwi5, complaints uwyv-629c, 311
erm2-nwe9, registrations tesw-yqqr and feu5-w2e2) is public and keyless. "Heatline" is the
name of the notice HPD itself issues. The index behind this entry covers 40 buildings in Bronx zip
10467 with 6,077 violations, chosen because it is the zip with the most open class C heat
violations in the borough; the build script and every query are in the repo.

## How WebMCP was implemented

`document.modelContext.registerTool` only. The runtime reads `document.modelContext` once, falls
back to `@mcp-b/webmcp-polyfill`, and an on-page badge prints `native`, `polyfill` or
`unavailable`. Fourteen tools with strict `inputSchema` and `readOnlyHint`; `untrustedContentHint`
on `list_conditions` and `build_timeline`, the two reads that return text another person typed,
which is delimited before the model sees it. Tool descriptions are dynamic: `file_packet` says how
many drafts are waiting, `building_violation_history` names the case's building. Every mutating
tool builds its own confirm gate inside `execute`, because WebMCP has no destructive-action
annotation. `draft_311_complaint` is a declarative `<form toolname>` with `toolparamdescription`
on each field and no `toolautosubmit`. Seventeen eval fixtures under `evals/` assert the expected
call per user message and, for the negative cases, that the denied tool is absent from that
session's `toolsForRole`. Read tools fetch from `/api/building/*` so the 1.3 MB index never ships
to the client. 125 tests.

---

## What is new since 25 August 2026

Everything. The repository was created on 4 September 2026. The two-role WebMCP spine (capability
keys, confirm gate, SSE), the domain, the data index, the tools and the UI were all written for
this entry.

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS 4, WebMCP (`document.modelContext`),
`@mcp-b/webmcp-polyfill`, `@mcp-b/webmcp-types`, Server-Sent Events, Vercel, Upstash Redis,
Vitest, NYC Open Data (Socrata SODA: HPD violations, complaints, complaint problems, 311, HPD
registrations).

---

## Testing instructions (submission field)

No login, no API key, no setup. Chrome 149 or later with WebMCP turned on at
`chrome://flags/#enable-webmcp-testing`. Open https://heatline-nyc.vercel.app.

1. **Create the demo case.** Search "Barnes" and pick 2315 Barnes Avenue (BBL 2043520010, 102 open
   class C). Apartment 4C, condition heat, reading "52F at 7am". Create. You are the tenant.
2. **Open the WebMCP pane.** DevTools > Application > WebMCP lists 12 tools. Run
   `building_violation_history` with `{}`; the record comes back with the SODA URL in `source`.
   Run `match_condition_to_code` with `{"text":"no heat at 7am, 52 degrees"}` and read 27-2029.
3. **Open the advocate link** from the right column in a second window. Its pane lists 9 tools:
   `assemble_hp_action_packet` and `request_evidence` present; `file_packet`, `log_condition`,
   `share_case`, `answer_evidence_request` and `draft_311_complaint` absent.
4. **Run the loop.** Advocate: `request_evidence` with an ask, Confirm; the tenant window shows it
   with no reload. Advocate: `assemble_hp_action_packet`, Confirm. Tenant: `file_packet`, Confirm.
   Try `file_packet` from the advocate's window via curl to the action route: 403.
5. **Fill the 311 form** with the agent; note the Send button is the only way it submits.
6. **Cross-check** any number by opening the SODA URL printed beside it.
   `GET /api/health` reports the store backend.
