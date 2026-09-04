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

I started with a building, not a feature. 2315 Barnes Avenue in the Bronx has 102 open class C violations on HPD's own books. Class C means "immediately hazardous." The oldest one has been open 601 days. All of that is public on NYC Open Data, keyless, one SODA query away, and the tenant freezing on the fourth floor has no idea it exists.

So Heatline puts two people on one case page: the tenant and the legal-aid advocate helping them. They open the same page from two different links. That is the whole trick, and it is only possible because WebMCP registers tools from inside the page rather than from a server that never learns which tab is asking. The tenant's link registers 12 tools; the advocate's link registers 9. `file_packet`, `log_condition` and the 311 form exist only in the tenant's window. `assemble_hp_action_packet` and `request_evidence` exist only in the advocate's. Open DevTools > Application > WebMCP in both windows and you can see the lists differ.

The role is a capability key in the URL, never a label the client claims. Every write is re-checked on the server, so if the advocate's agent forges a `file_packet` call it gets a 403 with a sentence the model can act on: "Only the tenant can file packet. You are the advocate: this stays with the tenant's session."

## How it creates a better user experience

Before this week, a tenant with no heat does one of two things: calls 311 and waits, or opens HPD Online and reads a violations table row by row without knowing that 27-2029 is the heat rule or what "class C" means. The advocate, if the tenant has one, rebuilds the same building history by hand for the HP Action petition.

Now the tenant types "no heat again, 52 degrees at 7am." The agent calls `match_condition_to_code` and gets back section 27-2029 with the plain-English requirement (68F from 6am to 10pm when it is under 55F outside, heat season October 1 to May 31). Then it calls `log_condition`, which stops inside a confirmation card until the tenant presses Confirm. Not the agent. The tenant.

`building_violation_history` takes no arguments in an open case; it reads the BBL off the case because a tenant has never heard of a BBL. I found that one the hard way: the first version required `bbl` and the advocate's agent called it with `{}` and got "bbl is required." Fixed the same hour.

Every number on the page carries the exact SODA URL that produced it. Judges can paste the URL and get the same 102.

## What people and agents can now do together that was difficult before

The advocate's agent asks the tenant for a photo of the thermostat at 7am tomorrow. That request lands in the tenant's window over a live stream, no reload, and the tenant's agent answers it. Then the advocate's agent calls `assemble_hp_action_packet`, which builds five sections from the case and the city's record: parties (from the HPD registration, owner name and portfolio size), conditions with their code sections, the building record with a block comparison, a timeline, and relief sought. It stores a draft. The tenant's agent sees "one draft packet waiting," calls `file_packet`, and a person presses Confirm.

The 311 complaint is a declarative form: `<form toolname="draft_311_complaint">` with `toolparamdescription` on every field and no `toolautosubmit`. The agent fills it in. Only a human presses Send.

None of this works with a chatbot wrapper or DOM scraping, because nothing else knows which window is asking.

The index behind it covers 40 buildings in zip 10467, chosen because it has the most open class C heat violations in the Bronx, 6,077 violations total. The build script and every query URL are in the repo. "Order to Correct" is HPD's own name for the notice it issues; I kept it as the working title until the product needed a name people would say out loud.

## How WebMCP was implemented

`document.modelContext.registerTool`, never `navigator.modelContext`. The runtime checks for the native object once, falls back to `@mcp-b/webmcp-polyfill`, and a badge on the page says which one is running.

Fourteen tools, each with a strict `inputSchema` and `readOnlyHint`. `untrustedContentHint` is set on `list_conditions` and `build_timeline`, the two reads that return text another person typed, and that text is wrapped in `<untrusted-user-text>` before the model sees it. The same wrapping applies on the REST reads and the SSE stream, so an agent that bypasses the tool layer sees the same boundary.

Descriptions are dynamic. `file_packet` says how many drafts are waiting; `building_violation_history` names the case's building and BBL. Every mutating tool builds its own confirm gate inside `execute`, because WebMCP ships no destructive-action annotation.

Seventeen eval fixtures in `evals/` assert the expected call for a given user message. The negative ones assert that the denied tool is absent from that session's `toolsForRole`, so "advocate asks to file it for them" expects no call at all. 125 tests. Read tools fetch from `/api/building/*` so the 1.3 MB index never ships to the client; that was a build-breaking bug on the first day (node:fs in a client bundle) and the fix is in the commit history.

---

## What is new since 25 August 2026

All of it. The repository was created on 4 September 2026 and every line, including the data index, the two-role spine, the tools and the UI, was written for this entry.

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS 4, WebMCP (`document.modelContext`), `@mcp-b/webmcp-polyfill`, `@mcp-b/webmcp-types`, Server-Sent Events, Vercel, Upstash Redis, Vitest, NYC Open Data (Socrata SODA: HPD violations `wvxf-dwi5`, complaints `uwyv-629c`, complaint problems `a2nx-4u46`, 311 `erm2-nwe9`, HPD registrations `tesw-yqqr` and `feu5-w2e2`).

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
