---
trigger: always_on
glob: "**/*"
description: PRD, mockup, and UX references for DebateMeBro.
---

## PRD & Design References

This rule file tells AI assistants **which product and design documents to consult first** and how to align implementation with them. Before making any non-trivial change to the UI, debate flow, or API behavior, assistants **must**:

1. Load the PRD.
2. Load the relevant GitHub Issue(s).
3. Load the UI mockups / prototype.

### 1. Primary References

- **PRD**
  - Path: `Docs/debatemebro-prd.md` (or `docs/PRD.md` in some environments).
  - Use cases:
    - Understanding **problem statement**, **target users**, and **user stories** (US-1 … US-10).
    - Confirming **debate phases**, **judging rubric**, and **success metrics**.
    - Checking **tech stack** and **architecture overview** before proposing new patterns.

- **GitHub Issues Spec**
  - Path: `Docs/Github_Issues.md`.
  - Use cases:
    - Mapping work to specific issues and acceptance criteria (e.g. Issue #8 for landing page).
    - Understanding sprint priorities (Sprint 1 vs Sprint 2).
    - Verifying that tests and CI expectations are met per issue.

- **Mockups / Prototypes**
  - High-fidelity React prototype:
    - Path: `Docs/debatemebro-mockup.tsx`.
  - (Optional) Screenshot folder:
    - Path: `docs/mockup-screenshots/` (if present).
  - Use cases:
    - Pixel-level and interaction-level reference for UI (layout, typography, colors, animations).
    - Copywriting reference for headings, taglines, button labels, helper text.

### 2. Key Screens and Components

When working on the frontend, assistants should treat the mockup as the **source of truth** for layout and interactions, and the PRD + issues as the **source of truth** for behavior / acceptance criteria.

- **Landing Page (`frontend/app/page.tsx`)**
  - Reference:
    - PRD: US-1 "Preset Topic Debate", US-2 "Live Debate Streaming".
    - Issue: `Docs/Github_Issues.md` → Issue #8.
    - Mockup: `Docs/debatemebro-mockup.tsx` → `screen === "home"` branch.
  - Key expectations:
    - Title and tagline match the mockup ("See Both Sides. For Real." etc.).
    - Topic input with clear placeholder and keyboard "Enter" handling.
    - 3 preset topics surfaced as chips/buttons with copy matching the PRD.
    - "How it works" section shows the five-phase flow:
      - 🔍 Research → 📖 Opening → ⚔️ Rebuttal → 🏁 Closing → 📊 Judging.
    - Styling uses TailwindCSS and the dark gradient style from the prototype.

- **Live Debate View (`frontend/app/debates/[id]/page.tsx`, `components/debate/*`)**
  - Reference:
    - PRD: US-2, US-6, US-7; Debate Structure (§5).
    - Issues: #9 (live debate view), #10, #13, #14 (judging + voting).
    - Mockup: `Docs/debatemebro-mockup.tsx` → `screen === "debate"` branch.
  - Key expectations:
    - Split-screen layout: Pro (left, blue), Con (right, red).
    - Phase navigation bar at top with icons, clickable completed phases.
    - Streaming text with cursor animation (`StreamingText` behavior).
    - Inline `CitationBadge` components that expand to show source info.
    - Phase transition messages (e.g., "Analyzing Con's opening argument…").
    - Judging panel with rubric bars, judge reasoning, and human voting controls.

- **Custom Topic & Research Upload (`frontend/app/debates/new/page.tsx`, `components/topics/*`)**
  - Reference:
    - PRD: US-5, US-8; Research Strategy (§4).
    - Issues: #11, #12.
  - Key expectations:
    - Flow: enter topic → see generated research prompts → upload Pro/Con research → start debate.
    - Clear differentiation between preset topics vs. custom topics with uploaded research.

### 3. User Flows to Follow

Assistants must preserve these high-level flows when implementing or refactoring features:

1. **Preset Topic Debate (Sprint 1 core flow)**
   - Landing page:
     - Display app title, tagline, and topic input.
     - Display preset topic cards (driven by `GET /topics/presets` in final implementation).
   - On selecting a preset topic:
     - Navigate to the debate route (`/debates/[id]`), using the backend-generated debate ID.
   - Debate view:
     - Show research display → opening arguments → rebuttals → closing statements → judging.
     - Maintain the Pro-left / Con-right split and phase navigation.

2. **Custom Topic with User-Supplied Research (Sprint 2)**
   - User enters a custom topic and requests prompts.
   - Backend (via `POST /topics/analyze` and `GET /research/prompt/{topic_id}`) generates structured research prompts.
   - User runs prompts in external tools, then uploads resulting docs via `POST /research/upload`.
   - Debate agents consume uploaded evidence in the same format as preset evidence.

3. **Judging and Human Voting**
   - After debate completes, show AI judge rubric breakdown and reasoning (3 judges × 4 criteria).
   - Allow authenticated users to vote (Pro vs Con).
   - Display combined AI + human result as specified in PRD and Issue #14.

### 4. How Assistants Should Use These References

When implementing any non-trivial feature:

1. **Locate the relevant user story** in `Docs/debatemebro-prd.md` and copy its acceptance criteria into your working notes.
2. **Locate the matching GitHub Issue** in `Docs/Github_Issues.md` and respect its acceptance criteria and testing requirements.
3. **Inspect the mockup / prototype** (`Docs/debatemebro-mockup.tsx` and/or screenshots) and mirror:
   - Layout structure and information hierarchy.
   - Visual style (dark theme, gradients, chip styles, typography).
   - Interaction details (hover states, streaming animations, badges).
4. **Only propose deviations** from PRD / mockup when:
   - There is a clear inconsistency between documents, or
   - A change is required to fix a bug or satisfy acceptance criteria.
   In such cases, clearly explain the trade-offs in comments or PR description, and reference the relevant sections of the PRD/issues.

