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

## 52 degrees at 7am, eleven mornings in a row

That was the reading in a fourth-floor apartment on Barnes Avenue in the Bronx this winter. The landlord stopped answering in January. What the tenant did not know, and what I did not know until I pulled the data, is that the city already had a file on the building: 102 open class C violations. Class C is HPD's word for "immediately hazardous." The oldest has been open 601 days.

All of that sits on NYC Open Data. No key, no login, one SODA query. It has never been in the same room as the tenant.

## What Heatline does with it

Two people open one case page from two different links. The tenant gets 12 WebMCP tools; the legal-aid advocate helping them gets 9. Same origin, same deployment, different agents. I want to be precise about the difference because it is the whole product:

Only the tenant's window has `log_condition`, `file_packet`, `answer_evidence_request`, `share_case` and the 311 form. Only the advocate's window has `assemble_hp_action_packet` and `request_evidence`. Open DevTools, Application, WebMCP in both windows and the lists are not the same.

The role is a capability key in the URL. The server re-derives it on every write, so when the advocate's agent forges a `file_packet` call (I tried) it gets a 403 that reads: "Only the tenant can file packet. You are the advocate: this stays with the tenant's session." The hidden tool is a convenience. The server is the boundary.

## A tenant does not know what a BBL is

The first version of `building_violation_history` required a 10-digit borough-block-lot number. The advocate's agent called it with `{}` and got "bbl is required." That is a tool written for a database, not for a person freezing in an apartment. It now reads the BBL off the open case and only takes one if you want a different building. Fixed the same hour, in the commit log.

The same instinct runs through the rest. The tenant types "no heat again, 52 degrees at 7am." `match_condition_to_code` returns section 27-2029 with the rule in plain English: 68F from 6am to 10pm when it is under 55F outside, heat season October 1 to May 31. `log_condition` then stops inside a confirmation card until the tenant presses Confirm. The agent proposes; the person decides.

Every number on the page carries the SODA URL that produced it. Paste the URL and you get the same 102.


![Architecture](https://raw.githubusercontent.com/aarav1656/heatline/main/video/diagrams/architecture.png)

*Four NYC Open Data feeds become one per-building index, the page registers a different tool set per link, and the server re-checks the role before any write lands.*

## The loop the two agents run

The advocate's agent asks for a photo of the thermostat at 7am tomorrow. That request lands in the tenant's window over a live stream, no reload. The tenant's agent answers. The advocate's agent then calls `assemble_hp_action_packet`, which writes five sections from the case plus the city record: parties (owner name and portfolio size from the HPD registration), conditions with code sections, the building record with a block comparison, a timeline, relief sought. It saves a draft. In the tenant's window, `file_packet`'s description now says "one draft packet waiting"; the agent calls it, a person presses Confirm, the packet is filed.

The 311 complaint is a real `<form toolname="draft_311_complaint">` with `toolparamdescription` on each field and deliberately no `toolautosubmit`. The agent fills it. Only a human can press Send.

You cannot do this with a chatbot wrapper or by scraping the page. Nothing else knows which window is asking.


![Two sessions, one page](https://raw.githubusercontent.com/aarav1656/heatline/main/video/diagrams/two-sessions.png)

*The tenant's window and the advocate's window on the same case. The gate in the middle is the server, not the tool list.*

## The parts that are not glamorous

`document.modelContext.registerTool`, never `navigator.modelContext`. Native first, `@mcp-b/webmcp-polyfill` as fallback, and a badge on the page says which one is live.

Fourteen tools. `untrustedContentHint` on `list_conditions` and `build_timeline`, because those return text another person typed; that text is wrapped in `<untrusted-user-text>` on the tool path, the REST path and the SSE stream. Confirm gates are built inside each mutating tool's `execute`, since WebMCP has no destructive-action annotation.

Seventeen eval fixtures. The negative ones assert the denied tool is absent from that session's `toolsForRole`, so "just file it for them" from the advocate expects zero calls. 125 tests. Read tools fetch through `/api/building/*` so the 1.3 MB index stays server-side; importing it into the client broke the production build on day one, and that fix is in the history too.

The index covers 40 buildings in zip 10467, the Bronx zip with the most open class C heat violations, 6,077 rows. The build script and every query URL are in the repo.

Everything here was written on 4 September 2026 with Next.js 16, TypeScript, Tailwind 4, Upstash Redis, Vitest and NYC Open Data. The build script, every SODA query URL and the eval fixtures are in the repo.

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
