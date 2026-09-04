# Judge: Ilya Grigorik (Distinguished Engineer, Shopify)

Lens: quantified before/after, no marketing claims, real usage numbers or a credible path to
them, agent experience over hype.

## 1. What I did

Read the README and BUILD-CONTRACT for language, then verified the specific numeric claims
against the live building record rather than taking them on faith. The README opens with:
"A tenant at 68°F for eleven mornings... The building already carries nine open class C,
'immediately hazardous,' HPD violations." I pulled the live record for the actual demo BBL
(2043520010) via `building_violation_history`:

```
openClassC: 102, openClassB: 82, openClassA: 15, totalOpen: 200, oldestOpenDays: 601
```

The README's "nine open class C" is stale against the live data (which shows 102). That's not
a fabricated number, it's a number that drifted from an earlier data pull and was never
reconciled with the shipped `data/index.json` before I ran the live tool. Every other in-app
number I checked (openClassC=102, the SODA source URL, the 601-day oldest violation) matched
exactly what the tool returned, unprompted and unedited by me: I read the JSON straight off the
API.

Checked the "no marketing language" bar against the README and tool descriptions directly for
the organiser's own named anti-pattern phrases ("seamless", "leverages... for... experiences"):
none of the tool descriptions in `tools.ts` use either phrase. The README's product paragraph
is written in concrete verbs ("logs conditions as they happen, matches them... drafts...
files") not abstractions.

Checked whether a claim was falsifiable and I could falsify it myself: "Every number on the
page carries the query that produced it (click the dotted value)", verified live, the
building violation panel's `<details class="sourced">` expands to `wvxf-dwi5, 200 rows,
https://data.cityofnewyork.us/resource/wvxf-dwi5.json?...`. That claim is true and I checked
it, not took it on the README's word.

Checked "40 buildings in one Bronx zip" against `data/index-meta.json` rather than the README
prose, since that's the file that's supposed to be the live source of truth per the README's
own instruction ("read `INDEX_META.buildings` / `INDEX_META.zip`... for the live count").

## 2. Scores (1-5)

- **WebMCP Leverage: 4.** The tool set is real and the descriptions carry real numbers pulled
  from live state (packet draft counts, open evidence request counts), which is exactly the
  "quantified, not vague" bar applied at the tool-description layer, not just the pitch layer.
- **Execution: 4.** Every mechanism I exercised worked as described. One point held back
  because the headline README claim ("nine open class C") doesn't match what the shipped index
  and live tool actually return for the named demo building (102); a project whose whole pitch
  is "every number carries its source" needs its own headline number to survive that same
  scrutiny.
- **Potential Impact: 4.** This is the kind of specific, falsifiable claim the organiser text
  asks for: not "helps tenants," but "the tenant's agent matches a logged condition to HMC
  27-2029 and can draft a 311 complaint for it," and I verified that pipeline actually runs.
- **Creativity & Ambition: 3.** Solid, not novel in concept (tenant rights tooling exists); the
  ambition is in the dual-role WebMCP mechanics, which I score under Leverage, not here.

**Total: 15/20.**

## 3. One thing that would move my score up a point

Regenerate `data/index.json` (`npx tsx scripts/build-index.ts`) and update the README's
opening paragraph's "nine open class C" to match the live number (102, per my own tool call
today), or make the README pull that number from `INDEX_META` at render time instead of
hardcoding prose. File: `README.md` line 4-6, and confirm against `data/index-meta.json`.

## 4. One thing that would make me distrust the submission

The README's lead statistic not matching the live tool's own output on the exact demo
building it names. It's a small, honest drift (an earlier data pull, not a fabrication -
every other number I checked matched), but it's the specific failure mode this project's own
"every number carries its source" promise is supposed to prevent, on its own front page.
