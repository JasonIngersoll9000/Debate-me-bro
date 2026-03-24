# UI Redesign — Ink, Gold & Sapphire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic cyan/fuchsia vibe-coded aesthetic with an editorial-meets-theatrical design system (Ink, Gold & Sapphire) across all frontend pages and components.

**Architecture:** Pure styling change — CSS custom property tokens defined in `globals.css`, consumed via Tailwind arbitrary values and inline styles throughout components. Dark mode default via `data-theme="dark"` on `<html>`, toggled by JS and persisted to `localStorage`. No component structure, routing, or state changes.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Google Fonts (Playfair Display, Lora, Inter), CSS custom properties

**Spec:** `Docs/superpowers/specs/2026-03-24-ui-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/src/app/globals.css` | Modify | CSS tokens (both themes), keyframe animations, base utility classes |
| `frontend/src/app/layout.tsx` | Modify | Font imports, masthead rule div, theme-init script |
| `frontend/src/app/page.tsx` | Modify | Landing hero (centered, new type), ornament divider |
| `frontend/src/app/debates/[id]/page.tsx` | Modify | Background layers, phase nav, debate header, score row, split columns |
| `frontend/src/app/debates/new/page.tsx` | Modify | Token-based colors, typography |
| `frontend/src/app/browse/page.tsx` | Modify | Token-based colors, typography |
| `frontend/src/app/dashboard/page.tsx` | Modify | Token-based colors, typography |
| `frontend/src/app/auth/page.tsx` | Modify | Token-based colors, typography |
| `frontend/src/components/debate/ArgumentCard.tsx` | Modify | Card layout, avatar, header, Lora body text |
| `frontend/src/components/debate/PhaseNav.tsx` | Modify | Phase nav styling, completed indicator color |
| `frontend/src/components/debate/StreamingText.tsx` | Modify | Cursor color, bold text color |
| `frontend/src/components/debate/CitationBadge.tsx` | Modify | Gold/neutral palette replacing cyan |
| `frontend/src/components/debate/StrategicAnalysisPanel.tsx` | Modify | Gold/blue replacing cyan/fuchsia |
| `frontend/src/components/dashboard/HistoryCard.tsx` | Modify | Winner badge, score dots |
| `frontend/tests/components/Home.test.tsx` | Modify | Update snapshot if needed |
| `frontend/tests/components/Dashboard.test.tsx` | Modify | Update snapshot if needed |

---

## Task 1: CSS Foundation — Tokens, Keyframes & Base Styles

**Files:**
- Modify: `frontend/src/app/globals.css`

This is the foundation everything else depends on. Do this first.

- [ ] **Step 1: Replace globals.css entirely**

Replace the full contents of `frontend/src/app/globals.css` with:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* ─── DARK MODE TOKENS ─── */
[data-theme="dark"] {
  --bg:         #0c0c10;
  --bg2:        #13131a;
  --bg3:        #1c1c26;
  --gold:       #c9a84c;
  --gold-lt:    #e8c97a;
  --gold-dim:   rgba(201, 168, 76, 0.13);
  --blue:       #2a6db5;
  --blue-lt:    #5a9fe0;
  --blue-dim:   rgba(42, 109, 181, 0.13);
  --text:       #f2ead6;
  --text-2:     #d4c9ae;
  --text-ui:    #8a7a60;
  --border:     rgba(255, 255, 255, 0.1);
  --border-dim: rgba(255, 255, 255, 0.07);
}

/* ─── LIGHT MODE TOKENS ─── */
[data-theme="light"] {
  --bg:         #ffffff;
  --bg2:        #f7f7f5;
  --bg3:        #eeeeea;
  --gold:       #8a5e0a;
  --gold-lt:    #a87214;
  --gold-dim:   rgba(138, 94, 10, 0.08);
  --blue:       #0f4080;
  --blue-lt:    #1a5aa8;
  --blue-dim:   rgba(15, 64, 128, 0.08);
  --text:       #0a0a0a;
  --text-2:     #1a1a1a;
  --text-ui:    #767676;
  --border:     rgba(0, 0, 0, 0.15);
  --border-dim: rgba(0, 0, 0, 0.08);
}

/* ─── BASE ─── */
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', Arial, sans-serif;
  transition: background 0.5s, color 0.5s;
}

/* ─── BACKGROUND ANIMATIONS (dark only) ─── */
[data-theme="light"] .bg-breathe,
[data-theme="light"] .bg-grain,
[data-theme="light"] .bg-vignette {
  opacity: 0 !important;
  pointer-events: none;
}

@keyframes breathe-gold {
  0%,  100% { transform: scale(1)    translate(0,      0);       opacity: 0.8; }
  33%        { transform: scale(1.2)  translate(1.5vw,  1vw);     opacity: 1;   }
  66%        { transform: scale(0.9)  translate(-1vw,  -0.5vw);   opacity: 0.5; }
}
@keyframes breathe-blue {
  0%,  100% { transform: scale(1)    translate(0,      0);        opacity: 0.7; }
  40%        { transform: scale(1.25) translate(-1.5vw, 1vw);     opacity: 1;   }
  70%        { transform: scale(0.85) translate(1vw,   -1.5vw);   opacity: 0.4; }
}
@keyframes breathe-mid {
  0%,  100% { transform: scale(1);    opacity: 0.35; }
  50%        { transform: scale(1.35); opacity: 0.7;  }
}
@keyframes grain-shift {
  0%   { transform: translate(0,      0);      }
  12%  { transform: translate(-1.5%, -2%);     }
  25%  { transform: translate(2%,    -1%);     }
  37%  { transform: translate(-1%,    2.5%);   }
  50%  { transform: translate(2.5%,   1%);     }
  62%  { transform: translate(-2%,    1.5%);   }
  75%  { transform: translate(1%,    -2.5%);   }
  87%  { transform: translate(-1.5%,  0.5%);   }
  100% { transform: translate(0,      0);      }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.15; }
}

/* ─── BACKGROUND LAYER CLASSES ─── */
.bg-breathe {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  transform-origin: center;
  transition: opacity 0.5s;
}
.bg-gold-glow {
  width: 80vw; height: 80vw;
  top: -30vw; left: -15vw;
  background: radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.05) 45%, transparent 70%);
  animation: breathe-gold 11s ease-in-out infinite;
}
.bg-blue-glow {
  width: 65vw; height: 65vw;
  bottom: -20vw; right: -10vw;
  background: radial-gradient(circle, rgba(42,109,181,0.2) 0%, rgba(42,109,181,0.05) 45%, transparent 70%);
  animation: breathe-blue 15s ease-in-out infinite;
}
.bg-mid-glow {
  width: 45vw; height: 45vw;
  top: 45%; left: 30%;
  background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%);
  animation: breathe-mid 19s ease-in-out infinite;
}
.bg-grain {
  position: fixed;
  inset: -50%;
  width: 200%; height: 200%;
  opacity: 0.045;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  animation: grain-shift 8s steps(8) infinite;
  transition: opacity 0.5s;
}
.bg-vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(0,0,0,0.65) 100%);
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.5s;
}

/* ─── ORNAMENT DIVIDER ─── */
.ornament {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 32px;
  opacity: 0.35;
}
[data-theme="light"] .ornament { opacity: 0.6; }
.ornament-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
.ornament-mark {
  color: var(--gold);
  font-size: 12px;
}

/* ─── EYEBROW ─── */
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: var(--gold);
}
.eyebrow::before,
.eyebrow::after {
  content: '';
  display: block;
  width: 28px;
  height: 1px;
  background: var(--gold);
  opacity: 0.6;
}

/* ─── MASTHEAD RULE (light mode only) ─── */
.masthead-rule {
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  height: 3px;
  background: var(--text);
  z-index: 20;
}
[data-theme="light"] .masthead-rule { display: block; }

/* ─── THEME TRANSITION ─── */
*, *::before, *::after {
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: build succeeds (may have warnings, no errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "feat(frontend): add design system tokens, keyframes, and base classes"
```

---

## Task 2: Layout — Fonts, Theme Init & Masthead Rule

**Files:**
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Read the current layout file**

Read `frontend/src/app/layout.tsx` in full before editing.

- [ ] **Step 2: Replace font imports and add theme infrastructure**

Make these changes to `layout.tsx`:

**a) Replace the Geist font imports** at the top of the file. Remove any `next/font/google` imports for Geist. Replace with:

```tsx
import { Playfair_Display, Lora, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})
```

**b) Update the `<html>` tag** — add `data-theme="dark"` as default and include font variables:

```tsx
<html lang="en" data-theme="dark" className={`${playfair.variable} ${lora.variable} ${inter.variable}`}>
```

**c) Add theme-init script and masthead rule** as the first children inside `<body>`:

```tsx
<body>
  {/* Prevent flash of wrong theme on load */}
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          var saved = localStorage.getItem('theme') || 'dark';
          document.documentElement.setAttribute('data-theme', saved);
        })();
      `,
    }}
  />
  <div className="masthead-rule" />
  {children}
</body>
```

**d) Update globals.css** to use the font CSS variable — **replace** the existing `body { font-family: ... }` rule written in Task 1 (do not add a second one):

```css
/* Replace the Task 1 body rule with this: */
body {
  font-family: var(--font-inter), Arial, sans-serif;
}
```

There should be exactly one `body` block in globals.css. The `next/font` variable `var(--font-inter)` is correct; the literal string `'Inter'` from Task 1 should be removed.

- [ ] **Step 3: Verify build passes**

```bash
cd frontend && npm run build 2>&1 | tail -20
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/src/app/globals.css
git commit -m "feat(frontend): add Playfair/Lora/Inter fonts and theme-init script"
```

---

## Task 3: Shared Toggle Component & Theme Hook

**Files:**
- Create: `frontend/src/components/ui/ThemeToggle.tsx`

The toggle must be usable on any page. Create it once, import it where needed.

- [ ] **Step 1: Create the ThemeToggle component**

Create `frontend/src/components/ui/ThemeToggle.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
    setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 30,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        color: 'var(--text-ui)',
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        padding: '8px 18px',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        ;(e.target as HTMLButtonElement).style.color = 'var(--gold)'
        ;(e.target as HTMLButtonElement).style.borderColor = 'var(--gold)'
      }}
      onMouseLeave={e => {
        ;(e.target as HTMLButtonElement).style.color = 'var(--text-ui)'
        ;(e.target as HTMLButtonElement).style.borderColor = 'var(--border)'
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'} &nbsp; Mode
    </button>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/ThemeToggle.tsx
git commit -m "feat(frontend): add ThemeToggle component"
```

---

## Task 4: Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Read the current landing page**

Read `frontend/src/app/page.tsx` in full.

- [ ] **Step 2: Rewrite the hero section**

The hero section currently has a dark gradient background, cyan/fuchsia headline, and generic layout. Replace it with the centered editorial hero. Key changes:

**Remove:** All `bg-gradient-to-*`, `from-cyan-*`, `from-fuchsia-*`, `blur-[*]`, `mix-blend-screen`, glassmorphism classes, animated blob divs.

**Add ThemeToggle** at the top of the page JSX (import from `@/components/ui/ThemeToggle`).

**Add background layers** (dark-mode breathing glows) as fixed-position divs at the start of the returned JSX, before main content:

```tsx
{/* Background layers */}
<div className="bg-breathe bg-gold-glow" />
<div className="bg-breathe bg-blue-glow" />
<div className="bg-breathe bg-mid-glow" />
<div className="bg-grain" />
<div className="bg-vignette" />
```

**Replace the hero headline block** with:

```tsx
<div style={{ textAlign: 'center', padding: '80px 32px 60px', maxWidth: '740px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
  <div className="eyebrow" style={{ marginBottom: '28px' }}>DebateMeBro</div>
  <h1 style={{
    fontFamily: 'var(--font-playfair), Georgia, serif',
    fontWeight: 900,
    fontSize: 'clamp(52px, 9vw, 96px)',
    lineHeight: 1.0,
    color: 'var(--text)',
    letterSpacing: '-2px',
    marginBottom: '8px',
  }}>
    Two minds.
  </h1>
  <span style={{
    display: 'block',
    fontFamily: 'var(--font-playfair), Georgia, serif',
    fontSize: 'clamp(26px, 4vw, 44px)',
    fontWeight: 700,
    fontStyle: 'italic',
    color: 'var(--gold)',   /* --gold resolves correctly in both dark and light mode */
    letterSpacing: '-0.5px',
    marginBottom: '26px',
  }}>
    One argument.
  </span>
  <p style={{
    fontFamily: 'var(--font-lora), Georgia, serif',
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.8,
    color: 'var(--text-ui)',
    maxWidth: '460px',
    margin: '0 auto 36px',
  }}>
    Watch two AI agents argue the greatest questions of our time — then decide who made the stronger case.
  </p>
  {/* Keep existing CTA buttons but update colors — see Step 3 */}
</div>
```

- [ ] **Step 3: Update CTA button colors**

Find the primary CTA button(s). Replace `from-cyan-500 to-blue-600` gradient classes and any `shadow-[*cyan*]` glow with:

```tsx
style={{
  background: 'var(--gold)',
  color: '#0c0c10',
  fontFamily: 'var(--font-inter), sans-serif',
  fontWeight: 700,
  letterSpacing: '1px',
  border: 'none',
  padding: '14px 32px',
  borderRadius: '2px',
  cursor: 'pointer',
  fontSize: '14px',
}}
```

Secondary/ghost buttons: `background: transparent`, `border: 1px solid var(--border)`, `color: var(--text)`.

- [ ] **Step 4: Add ornament divider**

Between the hero and the next section (feature cards / debate list), add:

```tsx
<div className="ornament" style={{ margin: '0 0 40px' }}>
  <div className="ornament-line" />
  <span className="ornament-mark">✦</span>
  <div className="ornament-line" />
</div>
```

- [ ] **Step 5: Replace remaining cyan/fuchsia/purple colors**

Search the file for any remaining `text-cyan-*`, `text-fuchsia-*`, `text-purple-*`, `bg-cyan-*`, `bg-fuchsia-*`, `border-cyan-*`, `border-fuchsia-*` classes. Replace with token equivalents:
- Cyan → `var(--gold)` or `var(--blue-lt)`
- Fuchsia/purple → `var(--blue)` or `var(--text-ui)`
- `text-white` in body copy → `var(--text)`
- `text-gray-400` → `var(--text-ui)`

- [ ] **Step 6: Verify build and lint**

```bash
cd frontend && npm run build 2>&1 | tail -20 && npm run lint 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat(frontend): redesign landing page with Ink/Gold/Sapphire system"
```

---

## Task 5: Argument Card Component

**Files:**
- Modify: `frontend/src/components/debate/ArgumentCard.tsx`

This is the most-read component. Get it right.

- [ ] **Step 1: Read the current component**

Read `frontend/src/components/debate/ArgumentCard.tsx` in full.

- [ ] **Step 2: Update card structure and styling**

The card receives a `side` prop (`'pro' | 'con'`). Apply these styles:

**Card wrapper:**
```tsx
style={{
  borderRadius: '2px',
  border: '1px solid var(--border-dim)',
  borderLeft: `3px solid ${side === 'pro' ? 'var(--gold)' : 'var(--blue)'}`,
  overflow: 'hidden',
  transition: 'border-color 0.25s',
  marginBottom: '14px',
}}
```

**Card header** (contains avatar + name + phase label):
```tsx
style={{
  padding: '14px 18px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid var(--border-dim)',
  background: side === 'pro' ? 'rgba(201,168,76,0.05)' : 'rgba(42,109,181,0.05)',
}}
```

**Avatar** (circular initial):
```tsx
style={{
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: '15px',
  fontWeight: 900,
  flexShrink: 0,
  background: side === 'pro' ? 'var(--gold-dim)' : 'var(--blue-dim)',
  color: side === 'pro' ? 'var(--gold-lt)' : 'var(--blue-lt)',
  border: side === 'pro' ? '1px solid var(--border)' : '1px solid rgba(42,109,181,0.3)',
}}
```

The avatar initial is the first character of the persona name (e.g., `name[0].toUpperCase()`).

**Persona name:**
```tsx
style={{
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text)',
}}
```

**Phase label:**
```tsx
style={{
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: side === 'pro' ? 'var(--gold)' : 'var(--blue-lt)',
  marginTop: '2px',
}}
```

**Card body:**
```tsx
style={{
  padding: '18px 20px 20px',
  background: 'var(--bg2)',
}}
```

**Body text — the primary reading surface:**
```tsx
style={{
  fontFamily: 'var(--font-lora), Georgia, serif',
  fontSize: '16px',
  lineHeight: 1.85,
  color: 'var(--text-2)',
  fontWeight: 400,
  letterSpacing: '0.01em',
}}
```

Remove all old `text-cyan-*`, `text-fuchsia-*`, `bg-slate-*`, `backdrop-blur-*`, `border-cyan-*` Tailwind classes.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/debate/ArgumentCard.tsx
git commit -m "feat(frontend): redesign ArgumentCard with Lora body text and gold/blue system"
```

---

## Task 6: Phase Navigation Component

**Files:**
- Modify: `frontend/src/components/debate/PhaseNav.tsx`

- [ ] **Step 1: Read the current component**

Read `frontend/src/components/debate/PhaseNav.tsx` in full.

- [ ] **Step 2: Update phase nav styling**

**Nav container:**
```tsx
style={{
  display: 'flex',
  gap: '2px',
  width: '100%',
}}
```

**Each phase tab** (receives `status: 'done' | 'active' | 'pending'`):
```tsx
style={{
  flex: 1,
  padding: '11px 4px',
  textAlign: 'center',
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  background: status === 'active' ? 'var(--bg3)' : 'var(--bg2)',
  color: status === 'active' ? 'var(--gold)' : 'var(--text-ui)',
  borderBottom: status === 'active'
    ? '2px solid var(--gold)'
    : status === 'done'
    ? '2px solid var(--border-dim)'
    : '2px solid transparent',
  transition: 'all 0.2s',
}}
```

**Completed phase checkmark/indicator:** Replace `text-cyan-300` with `color: 'var(--gold)'`.

Remove all `text-cyan-*`, `text-fuchsia-*`, `bg-slate-*` classes.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/debate/PhaseNav.tsx
git commit -m "feat(frontend): redesign PhaseNav with gold active state"
```

---

## Task 7: StreamingText, CitationBadge & StrategicAnalysisPanel

**Files:**
- Modify: `frontend/src/components/debate/StreamingText.tsx`
- Modify: `frontend/src/components/debate/CitationBadge.tsx`
- Modify: `frontend/src/components/debate/StrategicAnalysisPanel.tsx`

- [ ] **Step 1: Read all three components**

Read each file in full before editing.

- [ ] **Step 2: Update StreamingText**

In `StreamingText.tsx`:
- Find the streaming cursor element. Replace `bg-cyan-400` (pro) / `bg-fuchsia-400` (con) with:
  - Pro cursor: `background: 'var(--gold)'`
  - Con cursor: `background: 'var(--blue-lt)'`
  - If cursor uses a single class without side awareness, check how `side` prop is passed; use it to conditionally apply the token.
- Find any `font-bold text-white` on `<strong>` elements inside rendered markdown. Replace `text-white` with `color: 'var(--text)'`.
- Remove any `text-cyan-*`, `text-fuchsia-*` classes.

- [ ] **Step 3: Update CitationBadge**

In `CitationBadge.tsx`:
- Badge button: replace cyan classes with:
  ```tsx
  style={{
    background: 'var(--gold-dim)',
    border: '1px solid var(--border)',
    color: 'var(--gold-lt)',
    borderRadius: '3px',
    padding: '1px 6px',
    fontSize: '11px',
    cursor: 'pointer',
  }}
  ```
- Popup tooltip container: `background: 'var(--bg3)'`, `border: '1px solid var(--border)'`, `color: 'var(--text)'`
- "🌐 Verified Source" label: `color: 'var(--text-ui)'`, Inter font.

- [ ] **Step 4: Update StrategicAnalysisPanel**

In `StrategicAnalysisPanel.tsx`:
- Pro panel accent: replace `border-cyan-*`, `bg-cyan-*`, `text-cyan-*` with:
  - border: `var(--gold)`
  - background fill: `var(--gold-dim)`
  - text: `var(--gold-lt)`
- Con panel accent: replace `border-fuchsia-*`, `bg-fuchsia-*`, `text-fuchsia-*` with:
  - border: `var(--blue)`
  - background fill: `var(--blue-dim)`
  - text: `var(--blue-lt)`

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/debate/StreamingText.tsx \
        frontend/src/components/debate/CitationBadge.tsx \
        frontend/src/components/debate/StrategicAnalysisPanel.tsx
git commit -m "feat(frontend): update streaming, citation, and analysis panel colors"
```

---

## Task 8: Debate View Page

**Files:**
- Modify: `frontend/src/app/debates/[id]/page.tsx`

This is the main debate experience page. It contains the debate header, score row, and split-screen layout.

- [ ] **Step 1: Read the current page**

Read `frontend/src/app/debates/[id]/page.tsx` in full.

- [ ] **Step 2: Add background layers and ThemeToggle**

Import `ThemeToggle` from `@/components/ui/ThemeToggle`. At the top of the returned JSX (before main content wrapper):

```tsx
<ThemeToggle />
<div className="bg-breathe bg-gold-glow" />
<div className="bg-breathe bg-blue-glow" />
<div className="bg-breathe bg-mid-glow" />
<div className="bg-grain" />
<div className="bg-vignette" />
```

All content below must have `position: relative; z-index: 2` to sit above the background.

- [ ] **Step 3: Update debate header card**

Find the topic/motion title block. Apply:
```tsx
// Motion header card wrapper
style={{
  background: 'var(--bg2)',
  border: '1px solid var(--border-dim)',
  borderTop: '2px solid var(--gold)',
  padding: '24px 28px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '20px',
}}

// "Motion Before the House" eyebrow
style={{
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '4px',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  marginBottom: '8px',
}}

// Motion title
style={{
  fontFamily: 'var(--font-playfair), Georgia, serif',
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text)',
  lineHeight: 1.25,
}}

// Live badge
style={{
  background: 'var(--gold-dim)',
  border: '1px solid var(--border)',
  color: 'var(--gold)',
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  padding: '6px 14px',
  borderRadius: '2px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}}
```

Add a blinking dot inside the live badge: `<span style={{ width: '6px', height: '6px', background: 'var(--gold)', borderRadius: '50%', animation: 'blink 1.4s ease-in-out infinite', display: 'inline-block' }} />`.

- [ ] **Step 4: Update score row**

Find the Pro/Con score display below the header. Apply:

```tsx
// Score row grid
style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1px 1fr',
  background: 'var(--bg3)',
  border: '1px solid var(--border-dim)',
  borderTop: 'none',
  marginBottom: '32px',
}}

// Pro side
style={{ padding: '16px 26px' }}
// Badge: Inter 9px 700, color: 'var(--gold)'
// Name: Playfair 700 16px, color: 'var(--text)'
// Role: Lora italic 13px, color: 'var(--text-ui)'
// Score number: Playfair 900 34px, color: 'var(--gold-lt)'

// Con side — right-aligned (textAlign: 'right')
// Badge: color: 'var(--blue-lt)'
// Score number: color: 'var(--blue-lt)'
```

The divider column: `background: 'var(--border-dim)'`.

- [ ] **Step 5: Update split-screen column headers**

The two column labels above the argument cards:
```tsx
// Pro column label
style={{
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '4px',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  paddingBottom: '10px',
  borderBottom: '2px solid var(--gold)',
}}

// Con column label
style={{
  // same as above but:
  color: 'var(--blue-lt)',
  borderBottom: '2px solid var(--blue)',
}}
```

- [ ] **Step 6: Update judging results section**

Find any `ScoreBar`, judge cards, or judging result displays. Replace:
- `bg-cyan-*` / `text-cyan-*` → gold tokens
- `bg-fuchsia-*` / `text-fuchsia-*` → blue tokens
- Progress bars: Pro bar `background: 'var(--gold)'`, Con bar `background: 'var(--blue-lt)'`

- [ ] **Step 7: Replace all remaining legacy colors**

Scan the file for any remaining `slate-`, `cyan-`, `fuchsia-`, `purple-` Tailwind classes and convert to token equivalents.

- [ ] **Step 8: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

- [ ] **Step 9: Commit**

```bash
git add "frontend/src/app/debates/[id]/page.tsx"
git commit -m "feat(frontend): redesign debate view page with new design system"
```

---

## Task 9: History Card & Dashboard

**Files:**
- Modify: `frontend/src/components/dashboard/HistoryCard.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`

- [ ] **Step 1: Read both files**

Read `frontend/src/components/dashboard/HistoryCard.tsx` and `frontend/src/app/dashboard/page.tsx` in full.

- [ ] **Step 2: Update HistoryCard**

- **Winner badge:** Replace cyan/fuchsia classes with:
  - Pro wins: `background: 'var(--gold-dim)'`, `color: 'var(--gold-lt)'`, `border: '1px solid var(--border)'`
  - Con wins: `background: 'var(--blue-dim)'`, `color: 'var(--blue-lt)'`, `border: '1px solid rgba(42,109,181,0.25)'`
- **Score dots:** Pro dot `background: 'var(--gold)'`, Con dot `background: 'var(--blue-lt)'`
- **Topic title:** Add `fontFamily: 'var(--font-playfair), Georgia, serif'`, `fontWeight: 700`
- **Card border hover:** `border: '1px solid var(--border-dim)'`, hover → `var(--border)`
- **Card background:** `background: 'var(--bg2)'`

- [ ] **Step 3: Update dashboard page**

Replace any remaining legacy colors with token equivalents. Add `ThemeToggle` if not already present on a parent layout.

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/dashboard/HistoryCard.tsx frontend/src/app/dashboard/page.tsx
git commit -m "feat(frontend): redesign history card and dashboard page"
```

---

## Task 10: Remaining Pages — Browse, Auth, New Debate

**Files:**
- Modify: `frontend/src/app/browse/page.tsx`
- Modify: `frontend/src/app/auth/page.tsx`
- Modify: `frontend/src/app/debates/new/page.tsx`

- [ ] **Step 1: Read all three files**

Read each in full before editing.

- [ ] **Step 2: Apply token-based styling to Browse page**

In `browse/page.tsx`:
- Add `ThemeToggle` import and render it.
- Add background layers (same pattern as landing page).
- Replace all `slate-*`, `cyan-*`, `fuchsia-*` color classes with token equivalents.
- Heading: Playfair Display, `color: 'var(--text)'`
- Cards: `background: 'var(--bg2)'`, `border: '1px solid var(--border-dim)'`
- Sort tabs / filters: Inter font, gold for active state

- [ ] **Step 3: Apply token-based styling to Auth page**

In `auth/page.tsx`:
- Add `ThemeToggle`.
- Replace all legacy color classes.
- Form inputs: `background: 'var(--bg2)'`, `border: '1px solid var(--border-dim)'`, `color: 'var(--text)'`
- Input focus ring: `outline: '2px solid var(--gold)'`
- Submit button: gold background (same style as landing CTA)
- Error text: keep red but update to `color: '#ef4444'` (explicit, not Tailwind class)

- [ ] **Step 4: Apply token-based styling to New Debate page**

In `debates/new/page.tsx`:
- Add `ThemeToggle`.
- Replace all legacy color classes.
- Wizard step indicators: active step `color: 'var(--gold)'`, completed `var(--text-ui)`, pending `var(--border-dim)`
- Step heading: Playfair Display 700
- Upload area / textarea borders: `var(--border-dim)` → hover `var(--border)`
- Action buttons: gold primary, neutral secondary

- [ ] **Step 5: Verify build and lint**

```bash
cd frontend && npm run build 2>&1 | tail -20 && npm run lint 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/browse/page.tsx \
        frontend/src/app/auth/page.tsx \
        "frontend/src/app/debates/new/page.tsx"
git commit -m "feat(frontend): apply design system to browse, auth, and new debate pages"
```

---

## Task 11: Fix Jest Snapshots & Final Verification

**Files:**
- Modify: `frontend/tests/components/Home.test.tsx` (if snapshot fails)
- Modify: `frontend/tests/components/Dashboard.test.tsx` (if snapshot fails)

- [ ] **Step 1: Run the Jest test suite**

```bash
cd frontend && npm test -- --watchAll=false 2>&1 | tail -30
```

- [ ] **Step 2: Update snapshots if needed**

If any snapshot tests fail due to the styling changes (expected — the HTML structure changed):

```bash
cd frontend && npm test -- --watchAll=false --updateSnapshot 2>&1 | tail -20
```

Review the diff output to confirm the snapshot changes are expected (styling changes only, no structural regressions).

- [ ] **Step 3: Run full build + lint one final time**

```bash
cd frontend && npm run build 2>&1 | tail -20 && npm run lint 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 4: Add `.superpowers/` to `.gitignore` if not already present**

```bash
grep -q '.superpowers' /mnt/c/Users/Jason\ Ingersoll/dev/Debate-me-bro/.gitignore \
  || echo '.superpowers/' >> /mnt/c/Users/Jason\ Ingersoll/dev/Debate-me-bro/.gitignore
```

- [ ] **Step 5: Final commit**

```bash
git add frontend/tests/ .gitignore
git commit -m "chore(frontend): update snapshots for UI redesign; add .superpowers to gitignore"
```

---

## Verification Checklist (Manual)

After all tasks are complete, visually verify the following in a browser (`npm run dev`):

- [ ] Dark mode loads by default on first visit (no flash of light mode)
- [ ] Light mode toggle switches correctly and persists on refresh
- [ ] Landing page: centered hero, "Two minds." in large Playfair, "One argument." in italic gold
- [ ] Background breathing animations visible in dark mode, gone in light mode
- [ ] Masthead rule (3px black line) appears at top in light mode only
- [ ] Debate page: gold top-border on debate header, gold/blue score numbers
- [ ] Pro arguments: gold left-border, gold labels
- [ ] Con arguments: blue left-border, blue labels
- [ ] Argument body text is Lora serif, visibly larger and more readable than before
- [ ] Light mode argument cards: white background, near-black body text
- [ ] Citation badges: gold tones (no cyan)
- [ ] Phase nav: gold active underline
- [ ] Dashboard history cards: gold/blue winner badges
