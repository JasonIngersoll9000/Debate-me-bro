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

## Dark / Light Mode Toggle

**Default:** Dark mode.

**Mechanism:** A `data-theme` attribute on `<html>`, toggled by a button, persisted to `localStorage`.

```ts
// On mount — read saved preference or default to dark
const saved = localStorage.getItem('theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', saved)

// On toggle
const next = current === 'dark' ? 'light' : 'dark'
document.documentElement.setAttribute('data-theme', next)
localStorage.setItem('theme', next)
```

**CSS selector pattern:** All tokens are defined under `[data-theme="dark"]` and `[data-theme="light"]` (not `@media (prefers-color-scheme)`). The current `globals.css` media query block is replaced by these attribute selectors. Remove the Tailwind `dark:` class strategy — all theming happens via CSS custom properties only.

**Toggle widget:** Fixed top-right. Inter 11px uppercase. `☀ / ☾` label. Hover: gold text and border. Background `var(--bg2)`, border `var(--border)`.

---

## Color System

### Token Definitions

All tokens must be defined under both `[data-theme="dark"]` and `[data-theme="light"]`.

#### Dark Mode (`[data-theme="dark"]`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0c0c10` | Page background |
| `--bg2` | `#13131a` | Card / panel backgrounds, argument card bodies |
| `--bg3` | `#1c1c26` | Elevated surfaces, phase nav active state |
| `--gold` | `#c9a84c` | Pro side borders, primary CTA text/border |
| `--gold-lt` | `#e8c97a` | Pro scores, hero italic line, hover states |
| `--gold-dim` | `rgba(201,168,76,0.13)` | Pro avatar fill background |
| `--blue` | `#2a6db5` | Con side borders |
| `--blue-lt` | `#5a9fe0` | Con labels, scores, hover states |
| `--blue-dim` | `rgba(42,109,181,0.13)` | Con avatar fill background |
| `--text` | `#f2ead6` | Primary text: headings, debate titles, names |
| `--text-2` | `#d4c9ae` | Argument body text — highest reading contrast |
| `--text-ui` | `#8a7a60` | Labels, meta, phase nav, eyebrows |
| `--border` | `rgba(255,255,255,0.1)` | Neutral structural borders (dividers, card outlines) |
| `--border-dim` | `rgba(255,255,255,0.07)` | Subtle structural dividers |

> **Note on card borders:** Pro card left-borders use `--gold` directly. Con card left-borders use `--blue` directly. `--border` and `--border-dim` are neutral structural tokens only (card outlines, dividers, score row lines). Never use `--border` for the colored accent border on argument cards.

#### Light Mode (`[data-theme="light"]`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#ffffff` | Clean white page |
| `--bg2` | `#f7f7f5` | Card surface |
| `--bg3` | `#eeeeea` | Elevated surfaces |
| `--gold` | `#8a5e0a` | Pro accents — deep amber for legibility on white |
| `--gold-lt` | `#a87214` | Pro scores |
| `--gold-dim` | `rgba(138,94,10,0.08)` | Pro avatar fill background |
| `--blue` | `#0f4080` | Con accents — deep navy |
| `--blue-lt` | `#1a5aa8` | Con scores |
| `--blue-dim` | `rgba(15,64,128,0.08)` | Con avatar fill background |
| `--text` | `#0a0a0a` | Near-black primary text |
| `--text-2` | `#1a1a1a` | Argument body text — near-black |
| `--text-ui` | `#767676` | Labels, meta |
| `--border` | `rgba(0,0,0,0.15)` | Neutral structural borders |
| `--border-dim` | `rgba(0,0,0,0.08)` | Subtle structural dividers |

**Light mode specifics:**
- All background animations disabled: `[data-theme="light"] .bg-gold, .bg-blue, .bg-mid, .bg-grain, .bg-vignette { opacity: 0; pointer-events: none; }`
- A 3px solid `var(--text)` masthead rule rendered as a `<div class="masthead-rule">` at the top of `layout.tsx`, hidden in dark mode. Full viewport width. Fixed position, `z-index: 20`.
- Argument card bodies: `background: #ffffff` (overrides `--bg2`) for maximum reading contrast.

---

## Typography

Three-tier system. Each font has a single job.

| Font | Role | Usage |
|------|------|-------|
| **Playfair Display** | Drama & identity | Page headlines, debate titles, persona names, score numbers, avatar initials |
| **Lora** | Reading comfort | Argument body text, hero subtitle paragraph, persona role lines |
| **Inter** | UI chrome | Phase nav, labels, badges, eyebrows, buttons, toggle, section labels |

**Load via Google Fonts in `layout.tsx`:**
```
Playfair+Display:ital,wght@0,700;0,900;1,700
Lora:ital,wght@0,400;0,500;1,400
Inter:wght@400;500;600;700
```
Remove Geist Sans and Geist Mono imports entirely.

**Type scale:**

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Hero h1 | Playfair Display | `clamp(52px, 9vw, 96px)` | 900 | tracking -2px |
| Hero italic sub-line | Playfair Display italic | `clamp(26px, 4vw, 44px)` | 700 | color `--gold-lt` (dark) / `--gold` (light) |
| Hero body paragraph | Lora | 18px | 400 | color `--text-ui`, line-height 1.8 |
| Debate / motion title | Playfair Display | 22px | 700 | color `--text` |
| Persona name | Playfair Display | 16px | 700 | color `--text` |
| Persona role / subtitle | Lora italic | 13px | 400 | color `--text-ui` |
| Score number | Playfair Display | 34px | 900 | Pro: `--gold-lt` / Con: `--blue-lt` |
| **Argument body text** | **Lora** | **16px** | **400** | **color `--text-2`, line-height 1.85, letter-spacing 0.01em** |
| Bold within argument text | Lora | 16px | 700 | color `--text` (one step brighter than body) |
| Section eyebrow | Inter | 10px | 700 | letter-spacing 4px, uppercase, color `--gold` |
| Section label | Inter | 10px | 700 | letter-spacing 4px, uppercase, color `--text-ui` |
| Phase nav | Inter | 9px | 600 | letter-spacing 2px, uppercase |
| Avatar initial | Playfair Display | 15px | 900 | |
| UI labels / badges | Inter | 9–11px | 600–700 | letter-spacing 2–3px, uppercase |

---

## Background System (dark mode only)

### Keyframe Animations

```css
@keyframes breathe-gold {
  0%, 100% { transform: scale(1) translate(0, 0);           opacity: 0.8; }
  33%       { transform: scale(1.2) translate(1.5vw, 1vw);  opacity: 1;   }
  66%       { transform: scale(0.9) translate(-1vw, -0.5vw); opacity: 0.5; }
}
@keyframes breathe-blue {
  0%, 100% { transform: scale(1) translate(0, 0);            opacity: 0.7; }
  40%       { transform: scale(1.25) translate(-1.5vw, 1vw); opacity: 1;   }
  70%       { transform: scale(0.85) translate(1vw, -1.5vw); opacity: 0.4; }
}
@keyframes breathe-mid {
  0%, 100% { transform: scale(1);    opacity: 0.35; }
  50%       { transform: scale(1.35); opacity: 0.7;  }
}
@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  12%  { transform: translate(-1.5%, -2%); }
  25%  { transform: translate(2%, -1%); }
  37%  { transform: translate(-1%, 2.5%); }
  50%  { transform: translate(2.5%, 1%); }
  62%  { transform: translate(-2%, 1.5%); }
  75%  { transform: translate(1%, -2.5%); }
  87%  { transform: translate(-1.5%, 0.5%); }
  100% { transform: translate(0, 0); }
}
```

### Layer Specs

| Layer | Size | Position | Color | Animation | Period | Easing |
|-------|------|----------|-------|-----------|--------|--------|
| Gold glow | `80vw × 80vw` | top `-30vw`, left `-15vw` | `rgba(201,168,76,0.18)` core → transparent | `breathe-gold` | 11s | `ease-in-out` |
| Blue glow | `65vw × 65vw` | bottom `-20vw`, right `-10vw` | `rgba(42,109,181,0.2)` core → transparent | `breathe-blue` | 15s | `ease-in-out` |
| Mid glow | `45vw × 45vw` | top `45%`, left `30%` | `rgba(201,168,76,0.05)` core → transparent | `breathe-mid` | 19s | `ease-in-out` |
| Film grain | `200% × 200%` (inset `-50%`) | fixed, inset `-50%` | SVG feTurbulence fractalNoise, `opacity: 0.045` | `grain-shift` steps(8) | 8s | `steps(8)` |
| Vignette | full viewport | fixed inset 0 | `radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.65) 100%)` | none | — | — |

All layers: `position: fixed`, `pointer-events: none`, `border-radius: 50%` (glows only), `transform-origin: center`.

Grain layer uses a `200% × 200%` wrapper div positioned at `inset: -50%` so edge-shifting doesn't reveal blank space. `animation-timing-function: steps(8)` — not smooth, discrete jumps every frame interval.

---

## Component Styling

### Ornament Divider

A new inline JSX element (not a separate component file) used in `page.tsx` and `debates/[id]/page.tsx`:

```tsx
<div className="ornament">
  <div className="ornament-line" />
  <span className="ornament-mark">✦</span>
  <div className="ornament-line" />
</div>
```

CSS: flex row, `gap: 14px`, lines are `flex: 1; height: 1px; background: var(--border)`. Mark is `color: var(--gold); font-size: 12px`. Whole element `opacity: 0.35` dark / `opacity: 0.6` light.

### Eyebrow

```tsx
<div className="eyebrow">DebateMeBro</div>
```

Inter 11px 700, letter-spacing 5px, uppercase, `color: var(--gold)`. Flanked by decorative lines via `::before` / `::after` pseudo-elements: `width: 28px; height: 1px; background: var(--gold); opacity: 0.6`.

### Hero Section
- Centered (`text-align: center`), max-width 740px, `margin: 0 auto`
- H1 "Two minds." — Playfair 900, massive, near-black tracking
- Italic gold sub-line "One argument." — Playfair italic 700, `--gold-lt` dark / `--gold` light
- Body: Lora 400 18px, `--text-ui` color

### Phase Navigation
- Horizontal tab bar, full width, `gap: 2px` between tabs
- Done: dim underline `--border-dim`, muted text
- Active: `border-bottom: 2px solid var(--gold)`, `--bg3` background, gold text
- Pending: no underline, `--text-ui` text
- Inter 9px 600 uppercase throughout
- Light mode: each tab gets `border: 1px solid var(--border-dim)` outline

### Debate Header Card
- `background: var(--bg2)`, `border: 1px solid var(--border-dim)`, `border-top: 2px solid var(--gold)` (3px in light)
- Eyebrow "Motion Before the House" — Inter 10px gold
- Motion title — Playfair 700 22px `--text`
- Live pill: `background: var(--gold-dim)`, `border: 1px solid var(--border)`, gold text, blinking dot (`animation: blink 1.4s ease-in-out infinite`)

### Score Row
- CSS grid `1fr 1px 1fr`, `background: var(--bg3)`, same border as header (minus top border)
- Pro side left-aligned, Con side right-aligned
- Badge: Inter 9px 700 uppercase — Pro: `--gold`, Con: `--blue-lt` (light: `--blue`)
- Persona name: Playfair 700 16px `--text`
- Persona role: Lora italic 13px `--text-ui`
- Score number: Playfair 900 34px — Pro: `--gold-lt` (light: `--gold`), Con: `--blue-lt` (light: `--blue`)
- The "badge" is text-only (no background fill) — just the colored uppercase label above the name

### Argument Cards (split-screen — layout unchanged)
- Two equal columns, Pro left / Con right
- Column header: Inter 10px 700 uppercase, `padding-bottom: 10px`, `border-bottom: 2px solid` — Pro: `--gold`, Con: `--blue`
- Card border: `border: 1px solid var(--border-dim)`, `border-left: 3px solid` — Pro: `--gold`, Con: `--blue`
- Card header: avatar + name + phase label, `border-bottom: 1px solid var(--border-dim)`
  - Pro header tint: `rgba(201,168,76,0.05)`, Con: `rgba(42,109,181,0.05)`
- Avatar: 34px circle, Playfair 900 15px initial — Pro fill: `--gold-dim`, Pro ring: `1px solid var(--border)`, Con fill: `--blue-dim`, Con ring: `1px solid rgba(42,109,181,0.3)`
- Phase label: Inter 9px 600 uppercase — Pro: `--gold`, Con: `--blue-lt` (light: `--blue`)
- **Card body: `background: var(--bg2)` (dark) / `#ffffff` (light)**
- **Body text: Lora 400 16px, `--text-2`, line-height 1.85, letter-spacing 0.01em**
- **Bold spans within body text: Lora 700 16px, `--text` (one step brighter)**

### Citation Badge (`CitationBadge.tsx`)
- Replace current cyan with gold tones: border `1px solid var(--border)`, background `var(--gold-dim)`, text `--gold-lt` (dark) / `--gold` (light)
- Hover popup: `background: var(--bg3)`, border `var(--border)`
- "🌐 Verified Source" label: Inter 10px `--text-ui`

### Strategic Analysis Panel (`StrategicAnalysisPanel.tsx`)
- Pro panel: border/accent `--gold`, header background `var(--gold-dim)`
- Con panel: border/accent `--blue`, header background `var(--blue-dim)`
- Replace current cyan/fuchsia with gold/blue respectively

### Streaming Cursor (`StreamingText.tsx`)
- Pro streaming cursor: `background: var(--gold)` (replaces `bg-cyan-400`)
- Con streaming cursor: `background: var(--blue-lt)` (replaces `bg-fuchsia-400`)
- Bold text within streamed content: `color: var(--text)` (replaces `text-white`)

### History Card (`HistoryCard.tsx`)
- Winner badge: `background: var(--gold-dim)`, text `--gold-lt` (Pro wins) / `background: var(--blue-dim)`, text `--blue-lt` (Con wins)
- Score dots: Pro `--gold`, Con `--blue-lt`
- Card border hover: `--border`
- Topic title: Playfair Display 700

### Phase Nav Completed Checkmarks
- Replace `text-cyan-300` with `var(--gold)` for completed phase indicators

---

## Full Pro/Con Color Assignment

| Element | Pro (Gold) | Con (Sapphire) |
|---------|-----------|----------------|
| Argument card left-border | `--gold` | `--blue` |
| Column header underline | `--gold` | `--blue` |
| Score number | `--gold-lt` | `--blue-lt` |
| Phase label (in card) | `--gold` | `--blue-lt` |
| Avatar fill | `--gold-dim` | `--blue-dim` |
| Avatar ring | `var(--border)` | `rgba(42,109,181,0.3)` |
| Card header tint | `rgba(201,168,76,0.05)` | `rgba(42,109,181,0.05)` |
| Column header text | `--gold` | `--blue-lt` |
| Score badge label | `--gold` | `--blue-lt` |
| Streaming cursor | `--gold` | `--blue-lt` |
| Strategic panel accent | `--gold` + `--gold-dim` | `--blue` + `--blue-dim` |
| History card winner badge | `--gold-dim` fill / `--gold-lt` text | `--blue-dim` fill / `--blue-lt` text |
| History card score dot | `--gold` | `--blue-lt` |
| Background glow | Gold (top-left) | Blue (bottom-right) |

---

## What Does Not Change

- Component file structure and names
- Zustand store shape
- SSE streaming logic and event handling
- Split-screen layout (Pro left, Con right)
- Phase navigation order and gating behavior
- Route structure
- All backend code

---

## Implementation Scope

Files to update:

**Core styles:**
- `frontend/src/app/globals.css` — CSS custom property tokens, keyframe animations, base body styles, ornament/eyebrow CSS classes. Remove Geist font variables.

**Layout:**
- `frontend/src/app/layout.tsx` — Replace Geist font imports with Playfair Display + Lora + Inter. Add masthead-rule `<div>` and theme-init `<script>` (reads localStorage, sets `data-theme` before first paint to avoid flash).

**Pages:**
- `frontend/src/app/page.tsx` — Landing hero (centered, new type), ornament divider
- `frontend/src/app/debates/[id]/page.tsx` — Debate view: phase nav, header card, score row, split-screen columns, background layers
- `frontend/src/app/debates/new/page.tsx` — New debate wizard: apply token-based colors, Inter/Playfair type
- `frontend/src/app/browse/page.tsx` — Browse page styling
- `frontend/src/app/dashboard/page.tsx` — Dashboard styling
- `frontend/src/app/auth/page.tsx` — Auth page styling

**Components:**
- `frontend/src/components/debate/ArgumentCard.tsx` — Card layout, avatar, header, body text (Lora)
- `frontend/src/components/debate/PhaseNav.tsx` — Phase nav styling, completed indicator color
- `frontend/src/components/debate/StreamingText.tsx` — Cursor color, bold text color
- `frontend/src/components/debate/CitationBadge.tsx` — Gold/neutral palette replacing cyan
- `frontend/src/components/debate/StrategicAnalysisPanel.tsx` — Gold/blue replacing cyan/fuchsia
- `frontend/src/components/dashboard/HistoryCard.tsx` — Winner badge, score dots
