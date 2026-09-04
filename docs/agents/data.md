You are the DATA agent for "Order to Correct" at /Users/kamal/Desktop/devpost/projects/webmcp/order-to-correct.

Deliverable: scripts/build-index.ts (run with `npx tsx scripts/build-index.ts`), data/index.json (< 3 MB), data/index-meta.json, src/lib/index/index.ts + src/lib/index/types.ts exporting EXACTLY the Data layer API in docs/BUILD-CONTRACT.md, and src/lib/index/index.test.ts.

Sources (NYC Open Data SODA, keyless; use $limit, $where, $select, $group, $order):
- HPD violations https://data.cityofnewyork.us/resource/wvxf-dwi5.json (fields: violationid, bbl, boroid, borough, housenumber, streetname, zip, apartment, class, inspectiondate, novdescription, currentstatus, currentstatusdate, ordernumber, violationstatus)
- HPD complaints https://data.cityofnewyork.us/resource/uwyv-629c.json and problems https://data.cityofnewyork.us/resource/a2nx-4u46.json (check field names live with $limit=1 first; schemas changed in 2024)
- 311 https://data.cityofnewyork.us/resource/erm2-nwe9.json (complaint_type='HEAT/HOT WATER', incident_address, bbl)
- Registrations https://data.cityofnewyork.us/resource/tesw-yqqr.json (owner/agent contacts; may need registration contacts dataset feu5-w2e2; discover live)

Scope: pick the Bronx zip with the most open class C heat violations; take the top 40 BBLs there by open class C; for each pull full violation history (cap 200, open first), heat/hot-water complaints per winter (Oct-May) for the last 3 winters, and the owner's registration + portfolio size (count of BBLs registered to the same owner name, computed within your pull or via a $group query). Store the exact SODA URL beside every derived number (SourceRef {dataset, query, rows}). Infer codeSection from ordernumber/novdescription where possible (heat 27-2029, hot water 27-2031, mold 27-2017.x, pests 27-2018, lead 27-2056.x, gas 27-2033). Six-row CODE_TABLE with plain-English requirement sentences including the statutory heat rule (68F 6am to 10pm when outside < 55F; 62F overnight; heat season Oct 1 to May 31).

INDEX_META.demoBbl = the BBL with the most open class C. Print a summary at the end of the build: zip, buildings, violations, demo BBL and its open C count, and the top 3 SODA URLs. Reference: ../out-of-service/scripts/build-index.ts shows the SourceRef pattern used before.

Tests (real data, not empty): getBuildingRecord(demoBbl).openClassC >= 5; lookupBuilding by address substring finds demoBbl; matchConditionToCode("no heat at 7am, 52 degrees") returns 27-2029; compareToBlock returns a number for demoBbl; every violation has a SourceRef with a URL that starts with https://data.cityofnewyork.us/resource/. Break one (e.g. mutate class filter), see red, restore, see green.

RULES (bind you):
- Work ONLY in the repo path given. Edit ONLY the files your role owns per docs/BUILD-CONTRACT.md. If you need a change elsewhere, write docs/HANDOFF-<role>.md and stub locally against the contract types.
- Read docs/BUILD-CONTRACT.md fully first, then ../docs/NEXT-ENTRIES.md (your entry), then the existing files you will replace.
- Commit after every solid step with `git add <your paths> && git commit -m "..."`. Never `git add -A` (other agents share the tree). Never push.
- Keyless public data only. For HTTP use curl or node fetch; if you get 403/429 use mcp__ScraplingServer__get. Never handle secrets.
- Verification: a check that cannot fail is not a check. Never verify against empty data. Break the guarded thing, see red, restore, see green, report both.
- No em dashes anywhere in code comments, docs, or copy. No "legal advice" wording.
- Tests: `npx vitest run src/lib/index`. Types: `npx tsc --noEmit`.
- When done: run the checks that touch your paths, then `swarm report` with status, files, what you verified (numbers), and any HANDOFF items. Then stop.
