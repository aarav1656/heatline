You are the UI agent for "Order to Correct" at /Users/kamal/Desktop/devpost/projects/webmcp/order-to-correct.

You own: DESIGN.md, src/app/globals.css, src/app/page.tsx, src/app/layout.tsx, src/app/c/**, src/components/**, README.md, public/**, CLAUDE.md (append the Visual rules block). Nobody else touches these.

Two other agents build in parallel: TOOLS agent (src/lib/types.ts, store, tools.ts, contracts.ts, api routes) and DATA agent (src/lib/index). Read docs/BUILD-CONTRACT.md fully: it fixes CaseState, CaseActions, the API bodies, and the tool names you must render. Poll `git log --oneline` and docs/HANDOFF-tools.md every ~15 minutes; when the TOOLS agent's types.ts and contracts.ts land, type your components against them. Until then code against the contract's types (write them locally in a scratch file you do NOT commit if you need to compile).

Step 1, DESIGN.md (15 min): keep the template's file structure and every section. Change: name to Order-to-Correct-design-system; description to a housing-court docket / HPD notice register aesthetic on the same warm paper; accent to a civic red-brown #8B2500 (compute contrast vs surface #F2EFE9 and write it in); semantic tiers: class C = out #7A1010, class B = watch #8A5A00, class A = reliable #0C6B3D; delete all line-* transit tokens and prose; keep Archivo, 2px radius, hairlines, no shadows, tabular numerals. Then append the Visual rules block to CLAUDE.md (see below). Then run:
uicraft read --as "case docket for a tenant and a legal-aid advocate, printed housing court register" --dials 2/1/1 --type Archivo --surface "#F2EFE9" --accent "#8B2500" --radius 2 --showpiece none --cwd .
Commit.

Step 2, pages and components. Rename copy: owner -> Tenant, partner -> Advocate. Home page (src/app/page.tsx + CreateCase): address search input hitting GET /api/building?q= (TOOLS agent adds it; fall back to importing lookupBuilding from "@/lib/index" if the route is not there yet), result list with open class C count per building, pick one, apartment field, first condition (type select from the six: heat, hot_water, mold, pests, lead, gas; reading; note), Create case -> POST /api/case { bbl, apartment, firstCondition }. Case page (src/app/c/[caseId], CaseView): role banner; panels: Building record (open C/B/A counts large tabular numerals, oldest open days, owner + portfolio size, block comparison, SODA source URL with row count as a SourceNote), Conditions log (tenant adds via form; code section chip per row), Evidence requests (advocate asks; tenant answers inline; status), HP Action packet (sections rendered as a document; Draft/Filed state; File button visible only to tenant, calls actions.filePacket), 311 complaint form (declarative: <form toolname="draft_311_complaint" tooldescription="..."> with toolparamdescription on each field, NO toolautosubmit; human Send posts draft_311 action; see existing ReportForm.tsx and keep the same pattern, rename file Report311Form.tsx), Timeline, WebMCPTools panel (existing component; keep). CaseProvider: implement CaseActions (createCase, logCondition, requestEvidence, answerEvidence, assemblePacket, filePacket, addNote, draft311) against POST /api/case/[id]/action { type, key, payload } exactly as the template does today; keep SSE stream and unspotlight logic. Loading, empty, and error states on every list (empty copy must be specific: "No conditions logged yet. Log the first one below or tell your agent.").

Copy rules: never "legal advice"; "for review with your advocate". SIMULATED label on any demo-only control. No em dashes or en dashes in any string. No "Elevate/Seamless/Unleash". Off-black, off-white only via DESIGN.md tokens; semantic tokens, never raw hex, in components.

Step 3, README.md: rewrite for the product: one-paragraph problem (a tenant at 52F for eleven mornings, landlord silent since January, nine open class C violations already on the building), what the tenant's agent and the advocate's agent each do, the two-session asymmetry with a table of tools per role, how WebMCP is used (registerTool, declarative form, confirm gate, DevTools > Application > WebMCP), data sources with the exact SODA URLs, local run, licence MIT. Keep it honest: "index covers N buildings in one Bronx zip" (read N from data/index-meta.json when it exists).

Step 4, verify: `npx tsc --noEmit` (errors only in files you own count against you), `npx next build` once the other agents' work compiles, `uicraft gate --cwd src` exit 0, then start `npx next dev -p 3111` and `uicraft look --url http://localhost:3111` at 375 and 1440; open a case and look at /c/<id>?k=<ownerKey> too. Name three slop tells you found and fixed. Kill the dev server when done.

CLAUDE.md block to append:
## Visual rules
- Always read @DESIGN.md before generating any UI.
- Do not invent colours, fonts, radii, or spacing outside DESIGN.md. Add new tokens to DESIGN.md first, in its existing format, with a computed contrast ratio if the token carries text.
- Use semantic tokens ({colors.accent}, {rounded.control}, etc.), never raw hex, in components.

uicraft child-agent contract (binding): one accent; Next.js App Router + Tailwind; motion only from motion/react if at all (prefer none); no animated registry blocks on product UI; no 3-column equal feature cards; max 1 eyebrow per 3 sections; press scale(0.97); animate only transform and opacity; no transition-all; prefers-reduced-motion respected; loading + empty + error on every list.

RULES (bind you):
- Edit ONLY files you own. Need a change elsewhere? Write docs/HANDOFF-ui.md.
- Commit after every solid step with `git add <your paths> && git commit -m "..."`. Never `git add -A`. Never push.
- Next.js 16: read node_modules/next/dist/docs/ before app-router work (params are Promises, etc.).
- Browser only via `bhn`/`bh-multi` profiles (uicraft look uses deepsurge). Never Chrome/Playwright.
- When done: `swarm report` with status, files, the three tells fixed, gate/look results, and HANDOFF items. Then stop.
