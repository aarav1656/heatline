# Judge: Sean Roberts (VP of Applied AI, Netlify)

Lens: substance over platform promotion; would this survive a skeptical read; is the product
real for its named user.

## 1. What I did

Read this the way a skeptic reads any hackathon submission: assume every claim is marketing
until independently checked, then check the ones that are checkable in the time I have.

**Is there a real public repo, a real license, a real live URL reachable from another
machine?** `LICENSE` file exists at repo root (MIT, matching the README's one-line "MIT."
footer). The live URL (`https://order-to-correct.vercel.app`) answered a fresh `POST
/api/case` from this machine with no prior session, returning working `ownerUrl`/`partnerUrl`.
That's the organiser's own "Halfway there" readiness bar (public repo + license + live,
cross-machine URL), actually met, not just claimed.

**Does the copy oversell what's running?** The README explicitly disclaims: "Nothing here is
legal advice; every packet is drafted for review with your advocate before it goes anywhere
near a courtroom." Checked whether that discipline holds inside the tool descriptions too, not
just the README: `match_condition_to_code`'s description ends "for review with your advocate,
never as legal advice", the same rule, restated where the model actually reads it. The 311
form carries a visible "SIMULATED" badge in the UI and its button reads "Send to 311
(simulated)," and the component's own doc comment says "SIMULATED: this drafts a complaint on
the shared case." I don't see the failure mode this hackathon explicitly punishes ("overstate
what is actually running") anywhere I looked.

**Is the named user real, and does the flow actually serve them?** The tenant is a specific,
plausible person (someone at 52°F logging a condition, matching it to a code section, drafting
but not auto-sending a 311 complaint) and the advocate is a specific, plausible second person
(pulling violation history, assembling a packet, asking the tenant a targeted question). I ran
both roles' `getTools()` live and they are asymmetric exactly the way the story requires: the
tenant cannot assemble a packet, the advocate cannot file one, verified over forged curl
requests, not just by reading the client code.

**Does the pitch use the organiser's own named anti-pattern language?** Checked the README and
tool descriptions for "seamless" and "leverages... for... experiences": absent from both. The
README's product paragraph is specific and mechanical ("drafts the 311 complaint... files the
finished packet... pulls the building's enforcement history from NYC Open Data") rather than
abstract.

## 2. Scores (1-5)

- **WebMCP Leverage: 4.** Real, asymmetric, adversarially-verified tool sets on one origin;
  I have no reason to think this is dressed-up DOM automation, and I checked for exactly that.
- **Execution: 4.** Everything I tried worked. Held one point because I found one factual drift
  (the README's headline "nine open class C" number doesn't match the live tool's 102 for the
  same named BBL), a small thing, but exactly the kind of small overstatement a skeptical read
  is supposed to catch, even when it's clearly an unintentional stale number rather than a
  fabricated one.
- **Potential Impact: 4.** Named, specific users (a tenant, a legal-aid advocate), a named
  specific problem (a real Bronx building's real open violations), and a demonstrated pipeline
  from condition to code section to draft complaint. Credible, not hand-wavy.
- **Creativity & Ambition: 4.** The dual-role, server-enforced tool asymmetry on one shared
  origin is a genuinely different shape from a single-agent tool demo, and it's substantive
  under a skeptical read, not just a slide.

**Total: 16/20.**

## 3. One thing that would move my score up a point

Same fix as the Grigorik and orchestrator notes: reconcile the README's "nine open class C"
line with the live `data/index.json`/`INDEX_META` (currently 102 for the named BBL). One
stale number in the opening paragraph is the single thing standing between this and a clean
skeptical read. File: `README.md`, top of the file.

## 4. One thing that would make me distrust the submission

The stale "nine open class C" README number against a live 102, on the exact building the
demo names. Small and honest (not a faked demo, not an overstated capability), but it's the
one place this submission's own "every number carries its source" standard would fail if a
skeptical reader checked it, which I did.
