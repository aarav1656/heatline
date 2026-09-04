# Order to Correct

A tenant at 52F at 7am for eleven mornings. The landlord has been silent since January. The
building, 2315 Barnes Avenue in the Bronx, already carries 102 open class C ("immediately
hazardous") HPD violations, the oldest open 601 days (index built 2026-09-04; live count in
`data/index-meta.json` and on the case page's Building record panel, with the SODA URL beside it). The tenant knows
something is legally wrong; they don't know the housing code section, they don't have the
paperwork, and they don't have an advocate on retainer to assemble one.

Before: the tenant opens HPD Online, reads a violations table one row at a time, and does not know
what class C means or that 27-2029 is the heat rule; the advocate rebuilds the same building
history by hand for the HP Action petition, typically hours across HPD Online, 311 and ACRIS.
After: one `building_violation_history` call returns the record with counts, oldest-open days,
owner and portfolio size, and `match_condition_to_code` names the section from the tenant's own
words; the packet's five sections assemble from that in one confirmed call. Estimate, not measured.

Order to Correct is one shared case page for a tenant and their legal-aid advocate, each with a
different WebMCP tool set on the same origin. The tenant's agent logs conditions as they happen,
matches them to the Housing Maintenance Code, drafts the 311 complaint, and files the finished
packet. The advocate's agent pulls the building's enforcement history from NYC Open Data, assembles
the HP Action packet, and asks the tenant for specific evidence. Neither agent can do the other's
job, and the server enforces that even if a tool call is forged. Nothing here is legal advice; every
packet is drafted for review with your advocate before it goes anywhere near a courtroom.

## What each agent does

The tenant is the case's "owner"; the advocate is the "partner". Role comes from which capability
key the URL carries (`?k=`), never from a self-declared label, and the server re-checks it on every
write.

| Tool | Tenant | Advocate |
|---|---|---|
| `lookup_building`, `building_violation_history`, `compare_to_block`, `match_condition_to_code` | yes | yes |
| `list_conditions`, `build_timeline` | yes | yes |
| `log_condition` | yes | no |
| `answer_evidence_request` | yes | no |
| `file_packet` | yes | no |
| `draft_311_complaint` (declarative form) | yes | no |
| `share_case` | yes | no |
| `request_evidence` | no | yes |
| `assemble_hp_action_packet` | no | yes |
| `add_note` | yes | yes |

Every mutating tool suspends behind an in-page confirm card until a human presses Confirm. The
311 complaint is a declarative `<form toolname="draft_311_complaint">`: an agent fills the fields,
but there is no `toolautosubmit`, so the tenant has to read it and press Send themselves.

## How WebMCP is used

Tools are registered two ways in this app:

- **Imperative** (`document.modelContext.registerTool`, in `src/lib/webmcp/tools.ts`): every read
  tool and every non-form write tool. Role-gated on the client via `toolsForRole()`, and re-gated
  on the server in `src/lib/store/actions.ts` so a hidden tool is never the only guard.
- **Declarative** (`<form toolname=... tooldescription=... toolparamdescription=...>`, in
  `src/components/webmcp/Report311Form.tsx`): the browser synthesises the input schema from the
  form's own controls and registers the tool itself. No `toolautosubmit`, so the human always sees
  the filled form before it sends.

Every write goes through `confirm()` (`src/lib/webmcp/confirm.ts`), which parks the tool call and
renders `<ConfirmCard>` until a person clicks. Rejecting hands the agent a sentence it can act on,
not a status code.

To watch it work: open Chrome 149+ with `chrome://flags/#enable-webmcp-testing` on, open a case,
then DevTools → Application → WebMCP to see the registered tool set change as you switch role.

## Data sources

Everything traces back to NYC Open Data SODA queries, and every number on the page carries the
query that produced it (click the dotted value). The index covers 40 buildings in one Bronx zip
code, built by `scripts/build-index.ts` into `data/index.json` (read `INDEX_META.buildings` /
`INDEX_META.zip` at `data/index-meta.json` for the live count):

- **HPD Housing Maintenance Code Violations** (`wvxf-dwi5`): open class C heat violations, grouped
  by zip to pick the worst zip, then grouped by block/lot to pick the demo building, then a full
  per-BBL violation history.
- **HPD Complaints** (`uwyv-629c`) and **HPD Complaint Problems** (`a2nx-4u46`): heat/hot water
  complaint counts by winter season.
- **HPD Registrations** (`tesw-yqqr`): the owner name and how many other buildings they own.

The demo building is whichever BBL in the worst zip has the most open class C violations. See
`docs/BUILD-CONTRACT.md` for the exact query shapes.

## Local run

```bash
pnpm install
npx tsx scripts/build-index.ts   # builds data/index.json from NYC Open Data
pnpm dev                          # http://localhost:3000
```

Create a case from the home page, then open the tenant and advocate URLs it gives you in two
separate tabs (or two browser profiles, so each keeps its own WebMCP tool registration). A local,
in-memory store backend is used automatically when no `UPSTASH_REDIS_REST_URL` /
`BLOB_READ_WRITE_TOKEN` env var is set; both are supported for a shared deployment.

## Licence

MIT.
