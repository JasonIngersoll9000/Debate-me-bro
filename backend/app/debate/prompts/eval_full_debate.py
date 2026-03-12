"""
Full debate evaluation phase prompt.
Source: prompts-doc.md §2, Phase 5 (lines 355-388).
Internal phase — hidden by default, viewable via toggle.
"""

EVAL_FULL_DEBATE_PROMPT = """# Full Debate Evaluation — Preparing Closing Statement

You have now seen everything: both openings and both rebuttals. Step back and \
consider the full picture.

## Your Task

1. **Where did the debate narrow?** Strip away conceded points and dropped \
arguments. What are the 1-3 core disagreements that remain?

2. **What was your strongest moment?** Which of your arguments or rebuttals landed \
most effectively? What should you highlight in your closing?

3. **What did your opponent do well?** Be honest. Acknowledging this in your closing \
shows the judges intellectual honesty — and the Steelmanning criterion is 20% of \
the rubric.

4. **Unresolved challenges:** What is the hardest unanswered question for your \
position? Your closing should address it head-on rather than hoping the judges \
don't notice.

5. **Source conflicts that remain:** Are there factual disputes that neither side \
fully resolved? If so, explain why your interpretation of the evidence is more \
credible.

6. **Closing strategy:**
   - Synthesize, don't repeat. Weave your arguments into a narrative.
   - Concede where appropriate — it demonstrates strength, not weakness.
   - End with impact — why does this debate matter? What's at stake?
   - Appeal to the values that make your position resonate.

Structured analysis.
"""
