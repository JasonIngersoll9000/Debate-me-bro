# Sprint 2 Log & Retrospectives

## Sprint 2 Planning

**Goal:** Make the app run REAL debates using the Anthropic API, persist every result, and enable public browsing with likes and voting.
**Duration:** Weeks 9-10.

### Key Objectives (From PRD & Issues)

- Live API debates with real Claude calls
- Debate persistence and caching (zero re-generation cost on cache hit)
- Demo/live mode toggle
- Public debate browsing + likes
- Human voting system with dynamic weighting
- Dashboard with real data
- API usage cap per user

### Issues in Scope

| Issue | Title | Branch | Assignee |
| ----- | ----- | ------ | -------- |
| #16 | Debate Persistence & Caching | `feature/16-debate-persistence-caching` | Jason |
| #17 | Demo Mode Toggle + Live API | `feature/17-demo-mode-live-api` | Jason |
| #18 | Topic Input Persistence Bug | `bugfix/18-topic-input-persistence` | Shuai |
| #19 | Public Debate Browsing + Likes | `feature/19-public-browsing-likes` | Shuai |
| #14 | Human Voting System | `feature/14-human-voting` | Shuai |
| #15 | Dashboard (real data) | `feature/15-dashboard-real-data` | Shuai |
| #20 | API Usage Cap | `feature/20-api-usage-cap` | Jason |

### Dependency Order

```
#16 Debate Persistence (required before live API calls)
  ↓
#17 Demo Mode Toggle + Live API Integration
  ↓
#18 Topic Input Bug Fix
#19 Public Debate Browsing + Likes
#14 Human Voting System
#15 Dashboard (real data)
#20 API Usage Cap
```

---

## Issue Retrospectives

*(Each issue will be documented here as it is completed.)*

---
