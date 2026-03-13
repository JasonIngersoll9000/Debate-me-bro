# DebateMeBro Demo Video Script

**Duration:** ~12 minutes
**Presenters:** Jason Ingersoll (J) and Shuai Ren (S)
**Format:** Split between on-camera talking heads and live screen share of the application and code

---

## Section 1: Introduction (~1 minute)

**[ON CAMERA - Both Jason and Shuai visible]**

**J:** Hey everyone, I'm Jason Ingersoll.

**S:** And I'm Shuai Ren. We're graduate students at Northeastern, and this is our project for CS 7180: AI-Assisted Coding.

**J:** We built DebateMeBro, an AI-powered debate platform where two AI agents argue any topic in real time, with each side required to steelman the other before rebutting. Three AI judges score both sides on a transparent rubric, and users can cast their own vote on who won.

**S:** The idea came from a simple frustration: online discourse is broken. People strawman each other, argue in bad faith, and nobody ever engages with the strongest version of the other side's argument. We wanted to show what genuinely good-faith debate looks like.

**J:** Let's walk you through the app, how we built it, what went wrong along the way, and how we used AI not just in the product, but in building it.

---

## Section 2: The Problem and Design Philosophy (~1 minute)

**[ON CAMERA - Jason]**

**J:** Before we show the app, let me explain the core design decision that drives everything. Most AI debate tools either refuse controversial topics or produce watered-down "both sides have merit" responses. We took the opposite approach.

**J:** Our design philosophy is: no topic is off limits. The premise is that bad ideas lose when they're forced to defend themselves against the strongest possible counterarguments in a structured format. The debate structure and the judging rubric are the quality control, not content moderation.

**J:** The second key decision is steelmanning. In every rebuttal, each agent is required to articulate the strongest version of the opponent's argument before responding to it. This forces intellectual honesty. You can't attack a strawman when you've just demonstrated you understand the real argument.

**J:** And both sides get the same research. We deliberately give both agents access to all evidence, Pro and Con. Just like real competitive debate, both teams research the same topic. The skill is in how you use the evidence, not in having exclusive access to it.

---

## Section 3: Live Demo - Landing Page and Topic Selection (~1 minute)

**[SCREEN SHARE - Browser showing DebateMeBro landing page]**

**S:** Alright, let's look at the app. This is the landing page. You can see our dark-themed UI, everything is built with Next.js 15 and TailwindCSS.

**S:** At the top, we have preset debate topics. Right now we have the healthcare topic ready to go. Each card shows the resolution, the pro and con positions, and a "Debate It" button.

**S:** Users can also type any custom topic into this search bar. When they do, they're taken to our custom topic flow where Claude Haiku analyzes the resolution and generates research prompts. The user can then run those prompts in any AI research tool, upload the results, and start a debate on literally any topic they want.

**S:** You'll also notice the navigation bar with authentication built in. That's JWT-based auth with bcrypt password hashing. Once logged in, users can access the dashboard to see past debates and the browse page to see all public debates.

**S:** Let me click on the healthcare topic and show you what happens.

---

## Section 4: Live Demo - Persona Generation and Reveal (~1 minute)

**[SCREEN SHARE - Debate page loading, persona reveal overlay appearing]**

**J:** So when you click a topic, the backend immediately starts working. First, it generates two unique AI personas using Claude Haiku. These aren't generic labels. Each persona gets a name, identity, areas of expertise, core values, and a specific rhetorical approach.

**J:** Watch, here's the persona reveal overlay. You can see the Pro advocate on the left and the Con advocate on the right. Each one has a completely different personality and argumentation style, tailored to this specific topic.

**J:** This overlay gates the experience. You have to click "Start Debate" to proceed. It sets the stage and gives users context about who's arguing before they dive into the substance.

**J:** Now I'll click Start Debate, and the actual 7-phase pipeline begins.

---

## Section 5: Live Demo - The Debate Phases (~2.5 minutes)

**[SCREEN SHARE - Debate streaming in real time]**

**J:** Here we go. The first thing that happens is the research consultation phase. Both agents are reading through the evidence. You can see the research phase view here, which shows the evidence bundle that both sides received.

**S:** Notice the phase navigation bar at the top. It shows all the phases: Research, Opening, Eval, Rebuttal, Eval, Closing, and Judging. As the debate progresses, you can click on any completed phase to go back and review it.

**J:** Now we're in the opening arguments. Watch the left side, that's the Pro agent streaming its opening statement token by token. You can see the markdown rendering: headings, bold text, numbered lists, and citation badges that reference specific evidence from the research.

**J:** And now the Con agent responds on the right. Each opening is comprehensive. They lay out their core thesis, present supporting evidence, and structure their argument with clear claims and warrants.

**S:** After both openings, we hit the evaluation phase. This is one of my favorite features. Each agent privately reads and analyzes the opponent's opening argument. Users can toggle this panel to see the strategic analysis. You can literally see the AI thinking about how to respond.

**J:** Now the rebuttals. This is where steelmanning happens. Watch the opening of the Pro rebuttal. It starts by articulating the strongest point the Con side made, demonstrating genuine understanding. Only then does it pivot to the counter-argument. This is enforced in the system prompts.

**S:** The same thing happens on the Con side. It's a completely different experience from typical AI "debates" where each side just talks past the other.

**J:** After another evaluation phase, we get the closing statements. Each agent synthesizes everything, acknowledging where the opponent was strong, identifying where real disagreement remains, and making their final case.

---

## Section 6: Live Demo - AI Judging Panel (~1.5 minutes)

**[SCREEN SHARE - Judging results displayed]**

**S:** And now the judging phase. Three independent AI judges evaluate the complete debate transcript. Let me walk through what you're seeing.

**S:** At the top, we have the winner banner and overall score bars. These show the weighted totals for each side. Below that, the verdict summary explains why the winner was chosen, referencing specific arguments from the debate.

**S:** Now let me expand these judge cards. Each judge focuses on different criteria. The Logic Judge evaluates logical validity, soundness of reasoning, and identifies fallacies. The Evidence Judge looks at source quality, citation accuracy, and how well data supports claims. The Engagement Judge evaluates steelmanning quality and rhetorical effectiveness.

**S:** Each card shows the per-side scores, the judge's reasoning, and their analysis of strongest and weakest moves from each side. The transparency here is key. You can trace exactly why each score was given.

**J:** And down here, authenticated users can cast their own vote, Pro or Con. The vote tallies display alongside the AI judge scores. In a full production version, we'd implement dynamic weighting, AI-heavy scoring with few votes, shifting to human-heavy as more votes come in.

---

## Section 7: Architecture Deep Dive (~1.5 minutes)

**[SCREEN SHARE - Code editor / architecture diagram]**

**J:** Let me show you how this is built under the hood. We use a three-layer architecture.

**J:** The frontend is Next.js 15 with TailwindCSS for styling and Zustand for state management. The debate view page is over 1,500 lines of TypeScript. It manages the SSE connection, phase gating, persona reveals, all nine event types, and the judging display. Zustand gives us a single store that the SSE handler writes to directly, and React components subscribe to slices using useShallow.

**J:** The backend is FastAPI with LangGraph for orchestration. Here's the key file, graph.py. This defines the debate as a state machine with 10 nodes. LangGraph manages the transitions: research consultation flows to opening pro, then opening con, then evaluation of openings, and that evaluation runs pro and con concurrently using asyncio.gather.

**J:** The streaming happens through stream.py. This file handles both cache replay and live LangGraph streaming through a single SSE endpoint. It checks the cache first. If a debate already exists, it replays instantly at zero cost. If not, it runs the full LangGraph pipeline and streams events in real time.

**S:** On the intelligence layer, we use two tiers of Claude. Haiku for fast, cheap operations like topic analysis and persona generation. Sonnet for the debate agents and judges where quality matters most. We also implemented Anthropic prompt caching. Since the same evidence bundle is referenced across multiple LLM calls in a single debate, caching reduces repeated input token costs significantly.

---

## Section 8: AI in Our Development Process (~1.5 minutes)

**[SCREEN SHARE - Windsurf IDE with conversation history visible]**

**S:** One of the things that makes this project unique is that we built an AI product using AI tools. Let me show you how.

**S:** This is Windsurf with Cascade, our primary development IDE. We used it as a pair programmer throughout the entire project. You can see conversation threads here where Cascade helped us build features across multiple files simultaneously.

**S:** For example, the SSE streaming handler required coordinating changes across the backend event emission in stream.py, the frontend event parser in the debate page, the Zustand store definitions, and React component rendering. Cascade could hold the full context across all these files and suggest coherent changes.

**J:** Cascade was also critical for debugging. We had this really tricky bug where all evaluation phases showed "computing strategy" instead of actual content. The Pro eval was stuck. Cascade identified that LangGraph event tags could carry role information. We just needed to add config tags with the role to our llm.ainvoke calls and read those tags in the stream handler. A one-line fix, but it took Cascade's cross-file understanding to find it.

**J:** We also used GitHub Copilot heavily for inline code generation, especially for async patterns, test fixtures, and Pydantic models. Copilot actually caught a context leak bug where evaluation phase notes were leaking to opponent agents, suggesting the is_internal filter before we'd even noticed the problem in testing.

**S:** And of course, Claude itself generated the pre-loaded research documents for our preset topics, 8 to 15 pages of sourced evidence per side.

---

## Section 9: Challenges and Lessons Learned (~1 minute)

**[ON CAMERA - Both Jason and Shuai]**

**J:** We hit some interesting challenges. The first was a passlib/bcrypt version conflict. Modern bcrypt crashes passlib because of an internal 255-byte hash test. Took hours to diagnose, and the fix was literally one line: pin bcrypt to version 3.2.2.

**S:** On my side, the authentication flow had subtle issues with redirect parameters. We needed safe URL validation on the returnTo parameter to prevent open redirect vulnerabilities, making sure it starts with a slash but not double slashes.

**J:** The biggest ongoing challenge was phase gating. When should the UI advance to the next phase? Initially we only gated on phase_transition events, but content for new phases sometimes arrived without a preceding transition event, bypassing the gate entirely. We added lastContentPhase tracking and a userNavigatedRef to prevent SSE events from overriding manual navigation.

**S:** And then there were merge conflicts. Jason and I were working on different features in parallel. I was building the voting system while Jason was doing the UX overhaul. We had to resolve conflicts across 4 files when merging, but our architectural separation made it manageable.

**J:** The biggest lesson: start with real data earlier. Most of our Sprint 2 bugs only appeared when running real Claude debates, not mock data. Demo mode gave us false confidence.

---

## Section 10: Team Process (~30 seconds)

**[ON CAMERA - Shuai]**

**S:** Our development process was structured into two sprints. Sprint 1 was core infrastructure: 10 issues, all completed. That gave us the backend debate pipeline, SSE streaming, landing page, and demo mode.

**S:** Sprint 2 was live API integration. We completed 3 major issues including Issue #23, which was a massive 7-sub-issue UX overhaul plus a follow-up bugfix pass of 6 additional fixes. We used GitHub Issues with detailed acceptance criteria for every feature, and documented retrospectives after each sprint.

**S:** Jason handled the backend pipeline and the frontend debate experience. I built the auth system, voting, dashboard, and browse page. Our architectural separation meant we could work in parallel most of the time.

---

## Section 11: Wrap-Up and Future Vision (~30 seconds)

**[ON CAMERA - Both Jason and Shuai]**

**J:** So what's next for DebateMeBro? We have a backlog of improvements. Per-criterion judge scoring with justifications, position-swapped judging for bias elimination, a "How It Works" explanation page, and eventually an automated research pipeline so users don't have to supply their own research.

**J:** But the core vision is already working. You can pick any topic, watch two AI agents argue it with genuine intellectual honesty, see transparent judging, and form your own opinion based on the strongest arguments both sides have to offer.

**S:** The app is live at debatemebro.vercel.app. Try it out. Pick a topic you care about and see what happens when AI is forced to argue in good faith.

**J:** Thanks for watching.

**S:** Thanks everyone.

---

## Production Notes

- **Total estimated time:** 11-12 minutes with natural pacing
- **Screen recordings needed:** Landing page, persona reveal, debate streaming (can use cached replay for consistent demo), judging panel, code walkthrough (graph.py, stream.py, page.tsx, store.ts), Windsurf IDE
- **On-camera sections:** Intro, Challenges, Team Process, Wrap-Up (roughly 4 minutes on camera, 8 minutes screen share)
- **Tip:** For the debate demo, use a cached/completed debate for reliability. Live debates take 3-5 minutes and could have API issues during recording.
- **Speaker balance:** Jason speaks ~55%, Shuai speaks ~45%. Both appear in all on-camera sections.