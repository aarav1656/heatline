---
version: alpha
name: Order-to-Correct-design-system
description: A housing-court docket printed by a broadsheet, not a paper case register. Stark white canvas, black ink, a tall condensed serif display for the address and record numbers, hairline rules between panels, numbered packet sections (I., II., III.), dateline-style mono timestamps, all-caps tracked labels for panel headings. One civic red accent for the primary action and focus ring. Zero shadows, zero gradients, square corners throughout.
structure_source: "Structure adapted from docs/DESIGN-SOURCE-wired.md (Wired: white canvas, black ink, tall condensed serif display, hairline rules, editorial column rhythm, one link blue). Branding not copied: no Wired wordmark, no proprietary fonts. Fallback stack only."
research_source: "Colour, tier, and type reasoning carried over and re-derived from the prior paper/Archivo revision of this file; contrast ratios below are freshly computed against the new white canvas, not copied."

colors:
  canvas: "#ffffff"
  canvas-soft: "#f5f5f5"
  ink: "#000000"
  ink-soft: "#1a1a1a"
  body: "#757575"
  hairline: "#e0e0e0"
  hairline-strong: "#b3b3b3"
  accent: "#b91c1c"
  accent-ink: "#7f1414"
  accent-soft: "#fbe4e4"
  accent-on: "#ffffff"
  reliable: "#166534"
  watch: "#92400e"
  out: "#991b1b"
  sim: "#6c2bd9"

typography:
  display-hero:
    fontFamily: "var(--font-display), 'Times New Roman', Georgia, serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 56px
    letterSpacing: -0.5px
    fontFeature: '"tnum", "lnum"'
  display-lg:
    fontFamily: "var(--font-display), 'Times New Roman', Georgia, serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 48px
    letterSpacing: -0.4px
    fontFeature: '"tnum", "lnum"'
  display-md:
    fontFamily: "var(--font-display), 'Times New Roman', Georgia, serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.3px
  display-sm:
    fontFamily: "var(--font-display), 'Times New Roman', Georgia, serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 27px
    letterSpacing: -0.2px
  subhead:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  body:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
    fontFeature: '"tnum", "lnum"'
  body-strong:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
    fontFeature: '"tnum", "lnum"'
  body-sm:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
    fontFeature: '"tnum", "lnum"'
  caption:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 15px
    letterSpacing: 0.13em
    textTransform: uppercase
  dateline:
    fontFamily: "var(--font-mono), ui-monospace, Menlo, Consolas, monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.02em
    fontFeature: '"tnum", "lnum"'
  section-number:
    fontFamily: "var(--font-display), Georgia, serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 20px
    letterSpacing: 0px
  button:
    fontFamily: "var(--font-sans), Helvetica, Arial, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 18px
    letterSpacing: 0.06em
    textTransform: uppercase

rounded:
  none: 0px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 12px 20px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 12px 20px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: 12px 20px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 10px 12px
  panel-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    borderTop: "1px solid {colors.ink}"
    padding: 12px 0px
  tier-label-reliable:
    textColor: "{colors.reliable}"
    typography: "{typography.body-strong}"
  tier-label-watch:
    textColor: "{colors.watch}"
    typography: "{typography.body-strong}"
  tier-label-out:
    textColor: "{colors.out}"
    typography: "{typography.body-strong}"
  chip-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: 2px 8px
  chip-sim:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.sim}"
    borderColor: "{colors.sim}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: 2px 8px
  table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-sm}"
    padding: 8px 0px
  notice-box:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    borderWidth: 2px
    rounded: "{rounded.none}"
    padding: 16px
  masthead:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: 12px 0px
  role-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.display-sm}"
    padding: 24px
---

## Overview

Order to Correct reads like a legal docket printed by a broadsheet newspaper, not a courthouse
bulletin board and not a SaaS dashboard. The canvas is pure `{colors.canvas}` (#FFFFFF); ink is
pure `{colors.ink}` (#000000). The address and building record numbers are set in a tall
condensed serif display face, the way a broadsheet sets its section heads. Panels are separated
by 1px black hairline rules top-and-bottom, never boxed in a tinted card. The one chromatic
accent is civic red `{colors.accent}` (#B91C1C), reserved for the single primary action per view
(File the Packet, Create Case) and the focus ring. Everything else is black, white, and two grays.

Panels carry zero radius, zero shadow. A notice card (the confirm dialog, an invalid-link state)
gets a 2px solid black border, like a boxed legal notice, not a floating modal.

Type is layered: a condensed serif display (`Bodoni Moda`, fallback `Playfair Display`, fallback
`Times New Roman`/Georgia) for headlines, addresses, and the building record numeral; a clean
sans (`IBM Plex Sans`, fallback `Helvetica`) for body copy, labels, and buttons; a mono (`IBM Plex Mono`)
for BBLs, dates, timestamps, and any dateline-style stamp. Every numeric context carries
`font-variant-numeric: tabular-nums`.

**Key characteristics:**
- White canvas (`{colors.canvas}` #FFFFFF), black ink (`{colors.ink}` #000000) - 21:1 contrast, WCAG AAA, computed.
- Civic red (`{colors.accent}` #B91C1C) is the single chromatic UI accent - 6.47:1 contrast against canvas, computed. One primary action per view.
- Three status tiers - reliable / watch / out - mapped to violation class A / B / C, set as colored text on white, each checked against `{colors.canvas}` below.
- Zero radius everywhere; no control radius exception in this system (docket controls are square, not pill-pressable).
- Hairline rules (`{colors.hairline}` #E0E0E0) between panel rows; a heavier black top rule (`{colors.ink}`) opens each numbered panel header, in place of a boxed card.
- Tabular numerals on every numeric field.

## Colors

### Surface
- **Canvas** (`{colors.canvas}` - `#FFFFFF`): the only background for reading surfaces. Pure white, broadsheet paper.
- **Canvas Soft** (`{colors.canvas-soft}` - `#F5F5F5`): table headers, the role banner text well, one step off white for light sectioning.
- **Hairline** (`{colors.hairline}` - `#E0E0E0`): 1px dividers between table rows, list items.
- **Hairline Strong** (`{colors.hairline-strong}` - `#B3B3B3`): 1px borders on inputs and secondary buttons.

### Text
- **Ink** (`{colors.ink}` - `#000000`): headlines, body, primary numerals, panel top rules. Contrast against `{colors.canvas}` = **21:1** (WCAG AAA, computed).
- **Ink Soft** (`{colors.ink-soft}` - `#1A1A1A`): the ink fill for solid buttons and the role band, indistinguishable from ink at reading size but keeps a true-black reserved for text and rules.
- **Body** (`{colors.body}` - `#757575`): secondary/muted text, timestamps outside mono contexts, placeholder copy. Contrast against `{colors.canvas}` = **4.61:1** (WCAG AA, computed).

### Accent
- **Civic Red** (`{colors.accent}` - `#B91C1C`): the single chromatic accent - the one primary CTA per view, focus rings, the active-selection mark. Contrast against `{colors.canvas}` = **6.47:1** (WCAG AA, computed). White text on the accent fill (`{colors.accent-on}` #FFFFFF) contrasts at **6.47:1**.
- **Accent Ink** (`{colors.accent-ink}` - `#7F1414`): hover/active state for the accent, darker red. Contrast against `{colors.canvas}` = **10.43:1**.
- **Accent Soft** (`{colors.accent-soft}` - `#FBE4E4`): tinted background for the "SIMULATED"/code-section chip; accent text on this fill contrasts at **5.34:1**.

### Semantic status tiers (violation class)
Each tier's foreground color is computed against `{colors.canvas}` (#FFFFFF), not guessed, and
maps directly to HPD violation class:
- **Reliable** (`{colors.reliable}` - `#166534`, dark green) - **class A**: lowest severity, on record but not urgent. Contrast against `{colors.canvas}` = **7.13:1**.
- **Watch** (`{colors.watch}` - `#92400E`, dark amber) - **class B**: hazardous, worth escalating. Contrast against `{colors.canvas}` = **7.09:1**.
- **Out** (`{colors.out}` - `#991B1B`, deep red) - **class C**: immediately hazardous, the count this whole product exists to shrink. Contrast against `{colors.canvas}` = **8.31:1** - deliberately the highest-contrast tier since it is the most consequential state.

A tier label always pairs its color with the tier word itself ("Reliable", "Watch", "Out") and,
where space allows, the class letter (A/B/C); color never carries meaning alone.

### Simulated affordance
- **Sim** (`{colors.sim}` - `#6C2BD9`, violet): the "SIMULATED" outline chip on the declarative 311 form, so a demo control is never mistaken for a real one. Not used elsewhere.

## Typography

### Font Family
Three families, loaded via `next/font/google` in `layout.tsx`:
- **Display**: `Bodoni Moda` (weight 700 only), fallback `Playfair Display`, fallback `Times New
  Roman, Georgia, serif`. Carries the masthead wordmark, section headlines, the tenant/advocate
  address hero, and the building record numeral at 48px. Tight negative tracking (-0.2 to -0.5px)
  at every display size, the condensed broadsheet-headline setting.
- **Sans**: `IBM Plex Sans`, fallback `Helvetica Neue, Arial, sans-serif`. Body copy, labels, buttons,
  table cells, panel captions.
- **Mono**: `IBM Plex Mono`. BBLs, case ids, code sections, every timestamp and dateline.

Enable `font-variant-numeric: tabular-nums` on every numeric context via the `.num` utility
class, so counts never jitter in width as they update.

### Hierarchy

| Token | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-hero}` | 56px | 700 | 56px | -0.5px | Site masthead ("Order to Correct") on the home page |
| `{typography.display-lg}` | 48px | 700 | 48px | -0.4px | Building record numeral, case address hero |
| `{typography.display-md}` | 32px | 700 | 34px | -0.3px | Section headline inside a panel |
| `{typography.display-sm}` | 24px | 700 | 27px | -0.2px | Role band headline ("You are the advocate") |
| `{typography.subhead}` | 18px | 600 | 24px | 0 | Panel intro line, packet section body lead |
| `{typography.body}` | 16px | 400 | 22px | 0 | Default paragraph and list text, tabular numerals on |
| `{typography.body-strong}` | 16px | 600 | 22px | 0 | Emphasized body, tier labels |
| `{typography.body-sm}` | 14px | 400 | 20px | 0 | Secondary text, table body |
| `{typography.caption}` | 11px | 600 | 15px | 0.13em, uppercase | Panel section labels (I., II., III. style), chip labels |
| `{typography.dateline}` | 12px | 500 | 16px | 0.02em | Every timestamp, BBL, case id |
| `{typography.section-number}` | 16px | 700 | 20px | 0 | Roman numeral prefix on a packet section (I., II., III.) |
| `{typography.button}` | 13px | 600 | 18px | 0.06em, uppercase | All button labels |

### Principles
- **Tabular numerals are mandatory** everywhere a digit sits next to another digit that updates.
- **Uppercase is reserved** for captions, button labels, and panel section labels only, never headlines or body.
- **Display sizes are serif, everything else is sans or mono.** Never mix: a headline never falls back to sans mid-page, a table cell never renders in the display serif.
- **Negative tracking only at display sizes** (-0.2 to -0.5px); body sits at 0, caption/dateline sit slightly positive, matching a printed dateline stamp.

## Layout

### Spacing System
- **Base unit**: 4px, an 8pt grid.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- Panel interior padding sits at `{spacing.md}` (16px) by default; dense log rows tighten to `{spacing.sm}` (12px).

### Grid & Container
- Max content width ~1360px for the case page - an editorial column width, not full-bleed.
- Panels run full-width inside the container, separated by hairline rules, never boxed cards side by side without a gutter.
- The packet renders as numbered sections (I., II., III.), each opening with a black top rule and a `{typography.caption}` label.

## Borders & Shadows
No shadows exist in this system. A panel's separation from its neighbor is a 1px `{colors.hairline}` rule; a panel header opens with a 1px `{colors.ink}` top rule. A notice box (confirm card, invalid link, 404) gets a 2px solid `{colors.ink}` border - the weight of a stamped legal notice, still zero radius, still zero shadow.

## Motion
Motion is functional, not decorative.
- **Duration**: 120-150ms for color/state transitions (status text recoloring, button press). No motion longer than 200ms.
- **Easing**: linear or ease-out only. No spring, no bounce, no overshoot.
- **Never `transition: all`** - animate the specific property that changed (`color`, `background-color`, `border-color`, `transform`).
- **Respect `prefers-reduced-motion`**: disable transform/opacity transitions and fall back to an instant swap.

## Components

### Buttons
- **`button-primary`** - ink fill, white text, zero radius, uppercase `{typography.button}`. The default committing action.
- **`button-secondary`** - white fill, ink text, 1px `{colors.ink}` border, zero radius. Paired secondary action.
- **`button-accent`** - civic red fill, white text, zero radius. Reserved for the single most important action per screen (File the Packet, Create Case). Never more than one accent button visible at a time.

### Inputs
- **`text-input`** - white background, 1px `{colors.hairline-strong}` border, zero radius, ink text. Focus state: border switches to `{colors.accent}` at 2px, no glow, no shadow ring.

### Panel headers
- Every panel opens with a 1px `{colors.ink}` top rule and a `{typography.caption}` label, small, tracked, uppercase, in place of a boxed card top. This is the "docket page heading" moment, not a bordered card header.

### Tier labels
- Status is set directly as colored `{typography.body-strong}` text (`tier-label-reliable`, `tier-label-watch`, `tier-label-out`) on white - no fill required, all three pass AA directly. Always pair the color with the tier word and, where space allows, the class letter.

### Chips
- `chip-accent` - `{colors.accent-soft}` fill with `{colors.accent}` text, zero radius. Used for code-section chips.
- `chip-sim` - white fill, `{colors.sim}` text and 1px `{colors.sim}` border, zero radius. Marks a control as SIMULATED, never a real filing.

### Notice box
- `notice-box` - 2px solid `{colors.ink}` border, zero radius, white fill. Used for the confirm-before-mutate card, the invalid-link state, and any boxed warning. Distinct from a panel (1px hairline) by its heavier 2px rule, the weight difference between a printed rule and a stamped one.

### Tables
- **table row** - white background, `{colors.hairline}` bottom border, `{typography.body-sm}` for text columns, tabular numerals for numeric columns. Never zebra-striped.

### Forms
- Labels set in `{typography.caption}` above the field, ink color, uppercase, tracked.
- Error states use `{colors.out}` text under the field, focus moves to the first invalid field on submit.
- Placeholders end with `…`, not `...`, and show an example pattern.

## Interface Guidelines (verbatim)

Source: `vercel-labs/web-interface-guidelines`. Reproduced in full for the sections that apply to
a data-dense, accessible, no-motion product; every rule below is binding for this codebase, not
aspirational.

> ### Accessibility
> - Icon-only buttons need `aria-label`
> - Form controls need `<label>` or `aria-label`
> - Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)
> - `<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)
> - Images need `alt` (or `alt=""` if decorative)
> - Decorative icons need `aria-hidden="true"`
> - Async updates (toasts, validation) need `aria-live="polite"`
> - Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before ARIA
> - Headings hierarchical `<h1>`-`<h6>`; include skip link for main content
> - `scroll-margin-top` on heading anchors
>
> ### Focus States
> - Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
> - Never `outline-none` / `outline: none` without focus replacement
> - Use `:focus-visible` over `:focus` (avoid focus ring on click)
> - Group focus with `:focus-within` for compound controls
> - Sticky headers/footers/overlays must not cover the focused element
>
> ### Forms
> - Inputs need `autocomplete` and meaningful `name`
> - Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
> - Never block paste (`onPaste` + `preventDefault`)
> - Labels clickable (`htmlFor` or wrapping control)
> - Submit button stays enabled until request starts; spinner during request
> - Errors inline next to fields; focus first error on submit
> - Placeholders end with `…` and show example pattern
>
> ### Typography
> - `…` not `...`
> - Curly quotes `"` `"` not straight `"`
> - Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names
> - Loading states end with `…`: `"Loading…"`, `"Saving…"`
> - `font-variant-numeric: tabular-nums` for number columns/comparisons
> - Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)
>
> ### Content Handling
> - Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
> - Flex children need `min-w-0` to allow text truncation
> - Handle empty states - don't render broken UI for empty strings/arrays
> - User-generated content: anticipate short, average, and very long inputs
>
> ### Content & Copy
> - Active voice: "Log the condition" not "The condition will be logged"
> - Title Case for headings/buttons (Chicago style)
> - Numerals for counts: "9 open violations" not "nine"
> - Specific button labels: "File the Packet" not "Continue"
> - Error messages include fix/next step, not just problem
> - Second person; avoid first person
> - `&` over "and" where space-constrained
>
> ### Anti-patterns (flag these)
> - `user-scalable=no` or `maximum-scale=1` disabling zoom
> - `transition: all`
> - `outline-none` without focus-visible replacement
> - Inline `onClick` navigation without `<a>`
> - `<div>` or `<span>` with click handlers (should be `<button>`)
> - Images without dimensions
> - Form inputs without labels
> - Icon buttons without `aria-label`
> - Hardcoded date/number formats (use `Intl.*`)

## Do's and Don'ts

### Do
- Keep `{colors.canvas}` (#FFFFFF) as the only background color for reading surfaces.
- Reserve `{colors.accent}` (#B91C1C) for the single chromatic accent: focus, one accent button per screen.
- Turn on `font-variant-numeric: tabular-nums` for every number that sits next to another number or updates over time.
- Use `{rounded.none}` (0px) everywhere: panels, buttons, inputs, chips, notice boxes.
- Carry every panel separation with a `{colors.hairline}` rule or a `{colors.ink}` top rule, never a shadow.
- Set tier state directly as colored text, always paired with the tier word and the class letter.

### Don't
- Don't introduce a second chromatic UI accent.
- Don't round any element beyond 0px.
- Don't add box-shadow, blur, `backdrop-filter`, or gradient anywhere in the system.
- Don't animate with `transition: all`; animate the specific property that changed.
- Don't render a status tier below its computed contrast ratio; if a new tint is proposed, compute its ratio against `{colors.canvas}` before shipping it, don't eyeball it.
- Don't invent colors, fonts, radii, or spacing values outside this token set. If a new component needs a token that doesn't exist here, add it to this file first, in the same format, with a computed contrast ratio if it carries text.
- Don't set body copy or numerals in the display serif; body stays sans at 400, numerals get `.num` tabular figures.
