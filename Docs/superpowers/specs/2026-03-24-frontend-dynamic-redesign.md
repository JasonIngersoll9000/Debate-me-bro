# Frontend Dynamic Redesign — Design Spec
**Date:** 2026-03-24
**Status:** Approved
**Scope:** All 5 frontend pages + shared foundation

---

## 1. Approach

**Foundation-first, then pages.** Before touching individual pages:
1. Extract a shared `<Header>` component (currently duplicated with small differences on every page)
2. Install Framer Motion and define a `motion-variants.ts` file with the shared animation vocabulary
3. Apply consistently across all pages

Animation library: **Framer Motion** — enables scroll-triggered reveals, layout transitions, stagger animations, and number counters.

---

## 2. Design System Reference

All implementation must follow `Docs/stitch/DESIGN.md` — "Intellectual Modernism / The Digital Rostrum":

- **Colors:** `--pro: #7c98ff` (Trust Blue), `--con: #ff7168` (Urgent Red), `--surface: #0e0e0e`
- **Typography:** Space Grotesk (headlines/UI), Newsreader (body/argument text), Inter (labels/metadata) — all already loaded in `globals.css`
- **Corners:** `0px` border radius everywhere — no exceptions
- **Borders:** Use surface color shifts for separation, not 1px lines. Ghost borders (`outline-variant` at low opacity) only when accessibility requires it
- **Shadows:** Ambient glow via `radial-gradient`, not drop-shadows
- **Copy:** Follow `Docs/frontend-checklist.md` — clear purpose on arrival, premium tone, strong CTAs, trust signals. Do not use Stitch mockup copy verbatim.

---

## 3. Shared Foundation

### 3a. `<Header>` Component
Extract a single `frontend/src/components/layout/Header.tsx` used by all pages. Props:
- `activePage?: 'home' | 'browse' | 'dashboard' | 'new'`
- Auth state read from localStorage (token + email)
- Logout handler

Consistent across all pages: logo, Browse link, My Debates (auth), avatar/logout (auth), Sign In (unauth).

### 3b. Motion Variants (`frontend/src/lib/motion-variants.ts`)
Shared Framer Motion animation vocabulary:

```ts
fadeUp        // opacity 0→1, y 20→0, ease out, 0.5s
staggerContainer // staggerChildren: 0.08s
slideInLeft   // x -30→0, opacity 0→1
slideInRight  // x 30→0, opacity 0→1
scaleIn       // scale 0.95→1, opacity 0→1
counter       // number increment from 0 to target over 1.2s, ease out
pageEnter     // used on every page root: opacity 0→1, 0.3s
```

All scroll-triggered variants use `whileInView` with `viewport: { once: true, margin: "-80px" }`.

---

## 4. Landing Page (`/`)

### Hero
- Headline: `"See Both Sides."` with `"See"` in `--pro` blue, rest white. Second line: `"For "` white + `"Real."` in `--con` red.
- Font: Space Grotesk, `font-black`, `tracking-tighter`, ~6xl–8xl
- Body: Newsreader, existing copy unchanged
- Animation: `fadeUp` stagger — badge → headline → body → CTA → presets
- Pulsing live indicator dot on badge (existing, keep)

### Feature Cards
- Scroll-triggered `staggerContainer` + `fadeUp` per card
- Left-accent border strip: Pro blue for first 3, Con red for last 3 (current `border-l-2` stays)
- Hover: `whileHover={{ y: -2 }}` subtle lift

### How It Works Steps
- Each step animates in with `slideInLeft` on scroll, staggered
- Internal steps retain reduced opacity treatment

### CTA Section
- `scaleIn` on scroll entry
- CTA button: `whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.98 }}`

---

## 5. Browse / The Arena (`/browse`)

### Layout: Sidebar + Main
Replace current single-column layout with a persistent sidebar + scrollable main list:

**Sidebar (260px fixed):**
- "The Arena." headline — `"The"` in `--pro` blue, Space Grotesk 900, ~2.6rem
- Italic Newsreader subtitle: *"Every argument fought at full strength."*
- Search input (full-width, surface-container bg, no four-sided border — underline focus only)
- **Browse by topic** tag cloud: Technology, Politics, Economics, Health, Environment, Society, Law & Justice, AI, Education, Foreign Policy, Science, Philosophy, Energy, Media — clickable, multi-select, highlight active with `--pro` border
- Sort options: Most Recent, Most Liked, Highest Scoring, Closest Margin

**Main list:**
- Sticky sub-header showing count + active filter label with clear button
- Scrollable debate rows (no max-height cap — natural page scroll)
- Pagination: 20 per page, page number buttons

### Debate Row
Each row is a horizontal card:
- `4px` left accent strip: `--pro` if Pro won, `--con` if Con won, pulsing `--pro` if Live, `--surface-bright` if no result
- `4px` bottom gap (background bleed) as card separator — no border
- Left: topic name (Space Grotesk 900, ~1.55rem), Newsreader resolution (2-line clamp), topic tags + winner badge + date metadata
- Right: large score numbers (Space Grotesk 900, ~2.1rem) stacked Pro over Con, like count
- Hover: `background` shifts to `surface-high`
- Topic tags on each row match the sidebar filter tags — clicking a row tag activates that filter

### Topic Tags (backend requirement)
Topics need a `tags` field. Implementation options:
1. Add tags to the `TopicAnalysis` response from the backend (AI-generated at analysis time)
2. Derive tags client-side from topic title keywords
Recommend option 1 — surfaced in the plan.

### Animation
- Sidebar animates in with `slideInLeft` on mount
- Rows stagger in with `fadeUp` (staggerContainer, 0.05s children)

---

## 6. Resolution Lab (`/debates/new`)

### Step Indicator
Replace the current circle-number stepper with a full-width horizontal progress strip:
```
STEP_01 / FRAME_TOPIC  →  STEP_02 / GENERATE_PROMPTS  →  STEP_03 / UPLOAD_RESEARCH
```
Active step: `--pro` blue label. Completed: checkmark. Inactive: muted.

### Step 1 — Frame Topic
- Large Space Grotesk label: `RESOLUTION:` as an eyebrow above the input
- Input: no box border, underline-only focus state transitioning to `--pro` blue (per design system input spec)
- Context textarea: same treatment
- Analyze button: full-width on mobile, standard on desktop, `--pro` bg

### Step 2 — Generate Prompts
- Pro/Con prompt cards: full left-accent strip (blue/red), header with copy button
- Copy button animates to "✓ Copied" with a brief scale pulse
- "Internal AI Research — Coming Soon" becomes a prominent callout block with `--con`-tinted left border and amber accent text, not a footnote

### Step 3 — Upload Research
- Drop zones: full-height, color floods to `rgba(--pro, 0.08)` on drag-over with scale micro-animation
- Uploaded state: large checkmark, color-flooded success state
- File/Paste toggle: clean tab switch within the card header

### Animation
- Step transitions: `AnimatePresence` + `slideInLeft` for forward, `slideInRight` for back
- Each step content fades up on entry

---

## 7. Debate Arena (`/debates/[id]`)

### Layout
Split-screen layout is correct — no structural changes needed.

### Phase Progress Bar
Thin bar at the very top of the viewport (below nav), full width:
- Pro phases: fills `--pro` blue
- Con phases: fills `--con` red
- Advances as phases complete
- No rounded caps — sharp block per design system

### Phase Transitions
When a new phase begins:
- Previous argument area fades out (`opacity 1→0`, 0.3s)
- New phase label slides in from top (`y -20→0`, opacity 0→1)
- New argument card slides in (`fadeUp`, 0.4s)

### Argument Cards
- Pro cards (`slideInLeft`) — left column
- Con cards (`slideInRight`) — right column
- Stagger if multiple cards visible on load

### Streaming Text
- While streaming: CSS cursor blink animation at end of text (`::after` pseudo with `animation: stream-cursor` — already in `globals.css`)
- On stream complete: cursor disappears, no other change

### Judging Reveal
- Score numbers count up from `0` to final value using Framer Motion `useMotionValue` + `useTransform` over 1.2s
- Judge cards stagger in with `fadeUp` (0.1s between each)
- Score bars animate width from `0%` to final value, 1s ease-out

---

## 8. Results / Judging (within `/debates/[id]`)

### Verdict Banner (full-width, above the fold)
- Meta strip across top: topic · date · turns · votes cast
- Left column:
  - `"Verdict"` kicker with `--pro` left rule
  - Headline: `"Pro Argument"` in `--pro`, `"Prevails."` in white — Space Grotesk 900, ~6.5rem
  - Newsreader summary (2–3 sentences, substantive)
  - Community vote bar: 8px split bar, Pro blue / Con red, percentage labels
- Right column (`340px`): `surface-container` bg, score numbers at `4.5rem`, individual bars, margin chip
- Radial glow behind winner side (CSS `radial-gradient`, no JS needed)

### AI Judging Panel
Three toggleable judge cards. Each card:

**Collapsed state (default):**
- 48px icon, judge name + description, score nums (`2rem`, Pro vs Con), winner chip
- Click anywhere on header to expand

**Expanded state:**
- Winner explanation as hero text (Newsreader, 1rem, `--on-surface` color)
- Pro/Con two-column breakdown: strongest move + weakest move per side
- Criterion breakdown: rows of `[criterion name] [pro bar] [con bar] [scores]`
- Full reasoning (Newsreader, full text, `--on-surface-variant`)
- All sections separated by `outline-variant` lines

**Animation:** `AnimatePresence` height transition on expand/collapse (no jump — smooth height tween).

### Voting + Stats (right aside)
- Vote buttons: Pro, Con, Tie — full width, color-coded
- Debate stats: turns, votes, avg score, margin, closest judge
- Shown in persistent right column alongside judge panel

---

## 9. Content Principles (from `Docs/frontend-checklist.md`)

- **Clear purpose on arrival:** Every page communicates what the app does within the first viewport
- **No DIY energy:** Every layout decision is intentional — asymmetry, whitespace, and type scale are deliberate
- **Trust signals:** Score breakdowns, judge reasoning, and real citations are the trust mechanism — surface them prominently
- **Strong CTAs:** One primary action per page, always visible
- **Premium typography:** Space Grotesk for declarations, Newsreader for substance — never mix roles
- **Reduced friction:** Animations guide, never distract. Nothing bounces, spins, or steals attention

---

## 10. Out of Scope

- Dashboard page (`/dashboard`) — not part of this redesign
- Auth page (`/auth`) — not part of this redesign
- Backend changes except: adding `tags` field to topic analysis response
- Any new debate flow steps — the 3-step wizard structure is preserved as-is
