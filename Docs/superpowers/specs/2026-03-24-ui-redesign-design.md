# UI Redesign: Ink, Gold & Sapphire Design System

**Date:** 2026-03-24
**Status:** Approved
**Scope:** Full frontend visual redesign — styling only, no layout or functionality changes

---

## Goal

Replace the generic "vibe-coded" aesthetic (cyan/fuchsia gradients, glassmorphism blobs, Geist font) with a distinctive editorial-meets-theatrical identity that feels serious, captivating, and unlike every other AI app. The redesign is **style-only** — existing component structure, routing, Zustand store, and split-screen layout are preserved exactly.

---

## Design Identity

**Concept:** A premium debate journal. The gravity of a broadsheet newspaper meets the drama of an Oxford Union debate hall. Restrained, typographic, authoritative — with subtle ambient life in the background.

**What it is not:** Neon glows, animated gradient blobs, glassmorphism, generic dark mode with cyan/purple accents.

---

## Color System

### Dark Mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0c0c10` | Page background |
| `--bg2` | `#13131a` | Card/panel backgrounds |
| `--bg3` | `#1c1c26` | Elevated surfaces, phase nav active |
| `--gold` | `#c9a84c` | Pro side, primary actions, accents |
| `--gold-lt` | `#e8c97a` | Pro scores, hero italic, hover states |
| `--gold-dim` | `rgba(201,168,76,0.13)` | Avatar backgrounds, subtle fills |
| `--blue` | `#2a6db5` | Con side border, structural accents |
| `--blue-lt` | `#5a9fe0` | Con labels, scores, hover states |
| `--blue-dim` | `rgba(42,109,181,0.13)` | Avatar backgrounds |
| `--text` | `#f2ead6` | Primary text (headings, names) |
| `--text-2` | `#d4c9ae` | Argument body text — high contrast reading |
| `--text-ui` | `#8a7a60` | Labels, meta, dim UI chrome |
| `--border` | `rgba(201,168,76,0.2)` | Visible borders |
| `--border-dim` | `rgba(255,255,255,0.07)` | Subtle structural dividers |

### Light Mode (user-toggled)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#ffffff` | Clean white page |
| `--bg2` | `#f7f7f5` | Card surface |
| `--bg3` | `#eeeeea` | Elevated surfaces |
| `--gold` | `#8a5e0a` | Pro accents (deep amber for legibility) |
| `--gold-lt` | `#a87214` | Pro scores |
| `--blue` | `#0f4080` | Con accents (deep navy) |
| `--blue-lt` | `#1a5aa8` | Con scores |
| `--text` | `#0a0a0a` | Near-black primary text |
| `--text-2` | `#1a1a1a` | Argument body — near-black |
| `--text-ui` | `#767676` | Labels and meta |
| `--border` | `rgba(0,0,0,0.15)` | Visible borders |
| `--border-dim` | `rgba(0,0,0,0.08)` | Subtle dividers |

**Light mode specifics:**
- All background animations disabled (breathe glows, grain, vignette → opacity 0)
- A 3px solid black masthead rule appears at the very top of the page
- Argument card bodies use pure `#ffffff` for maximum reading contrast
- No warm parchment tones — clean newspaper white throughout

---

## Typography

Three-tier system. Each tier has a single job.

| Font | Role | Usage |
|------|------|-------|
| **Playfair Display** | Drama & identity | Page headlines, debate titles, persona names, scores |
| **Lora** | Reading comfort | Argument body text, hero subtitle, persona roles |
| **Inter** | UI chrome | Phase nav, labels, badges, eyebrows, buttons |

**Sizes (base 16px):**
- Hero h1: `clamp(52px, 9vw, 96px)`, weight 900, tracking -2px
- Hero italic sub-line: `clamp(26px, 4vw, 44px)`, Playfair italic 700, color `--gold-lt`
- Hero body: 18px Lora 400
- Debate title: 22px Playfair 700
- Persona name: 16px Playfair 700
- Score number: 34px Playfair 900
- Argument body text: **16px Lora 400, line-height 1.85** — this is the primary reading surface
- Section labels / eyebrows: 10px Inter 700, letter-spacing 4px, uppercase
- Phase nav: 9px Inter 600, letter-spacing 2px, uppercase

---

## Background System (dark mode only)

Three independent breathing radial glows + animated film grain + vignette. All disabled in light mode.

### Glow layers
1. **Gold glow** — `80vw` circle, top-left, `rgba(201,168,76,0.18)` core fading to transparent. Animates: scale 1→1.2→0.9, drifts slightly, period 11s.
2. **Blue glow** — `65vw` circle, bottom-right, `rgba(42,109,181,0.2)` core. Animates: scale 1→1.25→0.85, opposite drift, period 15s.
3. **Mid glow** — `45vw` circle, center-page, faint gold. Animates: scale 1→1.35, period 19s.

Each layer uses independent timing so they never sync — creates a continuously shifting, non-repetitive breathing effect.

### Film grain
SVG `feTurbulence` fractalNoise texture, `opacity: 0.045`, shifts position in 8-step increments every 8s. Adds texture without pattern repetition.

### Vignette
`radial-gradient` from transparent center to `rgba(0,0,0,0.65)` edges. Focuses the eye to center content, adds depth.

---

## Component Styling

### Hero Section
- Centered layout (text-align: center)
- Eyebrow: Inter uppercase with decorative line flanks (`::before` / `::after`)
- H1 "Two minds." — massive Playfair 900
- Italic gold sub-line "One argument." — Playfair italic, gold, visually subordinate but present
- Body: Lora 400, muted color (`--text-ui`)

### Phase Navigation
- Horizontal tab bar, full width
- Active phase: gold underline (2px), `--bg3` background, gold text
- Completed phases: dim underline, muted text
- Pending phases: no underline, dim text
- Inter 9px uppercase throughout

### Debate Header Card
- `--bg2` background, `border-top: 2px solid var(--gold)` (3px in light mode)
- "Motion Before the House" eyebrow in gold
- Debate title in Playfair 700
- Live pill: gold border, gold text, blinking dot

### Score Row
- Split grid below header, `--bg3` background
- Pro (left): gold badge, gold score number
- Con (right, right-aligned): blue badge, blue score number
- Persona role in Lora italic

### Argument Cards (split-screen)
- Two columns, Pro left / Con right — **layout unchanged from current**
- Left border: 3px solid gold (pro) or blue (con)
- Header: avatar initial (Playfair, 15px, circular), name (Playfair 700 14px), phase label (Inter 9px uppercase colored)
- Pro header tint: `rgba(201,168,76,0.05)` — Con header tint: `rgba(42,109,181,0.05)`
- **Body: Lora 400 16px, `--text-2` color, line-height 1.85** — primary reading surface, maximum contrast in both modes
- Light mode body: pure `#ffffff` background

### Ornament Dividers
- `✦` centered between two 1px horizontal rules
- Used between hero and debate content
- Dark: `opacity: 0.35`. Light: `opacity: 1` with very faint lines

### Dark/Light Toggle
- Fixed top-right, Inter uppercase 11px
- `☀ / ☾` label
- Hover: gold text and border

---

## Pro/Con Color Assignment

| Element | Pro | Con |
|---------|-----|-----|
| Card border | Gold | Sapphire |
| Score number | Gold light | Blue light |
| Phase label | Gold | Blue light |
| Avatar ring | Gold border | Blue border |
| Column header underline | Gold | Sapphire |
| Background glow | Gold (top-left) | Blue (bottom-right) |

---

## What Does Not Change

- Component file structure and names
- Zustand store shape
- SSE streaming logic
- Split-screen layout (Pro left, Con right)
- Phase navigation order and behavior
- Route structure
- All backend code

---

## Implementation Scope

Files to update:
- `frontend/src/app/globals.css` — CSS custom properties, keyframe animations, base styles
- `frontend/src/app/layout.tsx` — font imports (add Playfair Display + Lora, remove Geist)
- `frontend/src/app/page.tsx` — landing page hero and layout
- `frontend/src/app/debates/[id]/page.tsx` — debate view page
- `frontend/src/app/browse/page.tsx` — browse page
- `frontend/src/app/dashboard/page.tsx` — dashboard
- `frontend/src/app/auth/page.tsx` — auth page
- `frontend/src/components/debate/ArgumentCard.tsx` — argument card styling
- `frontend/src/components/debate/PhaseNav.tsx` — phase nav styling
- `frontend/src/components/debate/StreamingText.tsx` — reading text styles
- `frontend/src/components/debate/StrategicAnalysisPanel.tsx` — internal analysis panel
- `frontend/src/components/dashboard/HistoryCard.tsx` — history card styling
