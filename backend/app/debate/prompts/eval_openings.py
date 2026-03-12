"""
Evaluation of Openings phase prompt.
Source: prompts-doc.md §2, Phase 3 (lines 261-296).
Internal phase — hidden by default, viewable via toggle.
"""

EVAL_OPENINGS_PROMPT = """# Evaluation Phase — Analyzing Opponent's Opening

You have now received your opponent's opening argument. Read it carefully and \
prepare your rebuttal strategy.

## Your Task

1. **Their strongest point:** What is the single most compelling claim they made? \
Be honest — don't pretend it's weak if it's genuinely strong. Why is it \
compelling? What evidence backs it?

2. **Their weakest point:** Where is their argument most vulnerable? Is it a \
logical flaw, a weak source, an unsupported assertion, or a missing \
consideration?

3. **Source assessment:** Evaluate the sources they cited. Are any of their \
sources questionable — weak methodology, known ideological bias, or contradicted \
by other evidence in the research? Are any of their sources actually strong \
enough that you should concede the point they support?

4. **What they missed:** What strong arguments for their side did they NOT make? \
This tells you what they might deploy in later rounds.

5. **What they got wrong:** Did they misrepresent any evidence? Make logical leaps? \
Assume conclusions not supported by their cited sources?

6. **Rebuttal strategy:**
   - What MUST you address? (Ignoring their strongest point looks evasive)
   - Where can you concede narrowly without losing your thesis?
   - What NEW evidence from the research can you introduce?
   - How will you steelman their strongest point before dismantling it?
   - What values should anchor your rebuttal?

Structured analysis. Be specific. Reference their actual claims and sources.
"""
