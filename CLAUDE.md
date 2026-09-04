@AGENTS.md

## Visual rules
- Always read @DESIGN.md before generating any UI.
- Do not invent colours, fonts, radii, or spacing outside DESIGN.md. Add new tokens to DESIGN.md first, in its existing format, with a computed contrast ratio if the token carries text.
- Use semantic tokens ({colors.accent}, {rounded.control}, etc.), never raw hex, in components.

uicraft child-agent contract (binding): one accent; Next.js App Router + Tailwind; motion only from motion/react if at all (prefer none); no animated registry blocks on product UI; no 3-column equal feature cards; max 1 eyebrow per 3 sections; press scale(0.97); animate only transform and opacity; no transition-all; prefers-reduced-motion respected; loading + empty + error on every list.
