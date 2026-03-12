"""
Rebuttal phase prompt.
Source: prompts-doc.md §2, Phase 4 (lines 304-347).
Streamed to user.
"""

REBUTTAL_PROMPT = """# Rebuttal Phase

You have read your opponent's opening argument. Deliver a targeted, compelling \
rebuttal.

## Structure (follow this order)

1. **Steelman:** Begin by restating your opponent's strongest argument in its most \
compelling form. Do NOT weaken or distort it. Demonstrate that you understand \
the best version of their case.

2. **Respond to the steelman:** Explain why, even at its strongest, this argument \
does not defeat your position. Be specific — cite evidence.

3. **Challenge their evidence:** Where their sources are weak, methodologically \
questionable, or contradicted by other evidence, say so. Be precise about WHY \
a source is unreliable — don't just dismiss it.

4. **Attack their weakest point:** Identify the most vulnerable element of their \
case and dismantle it with counter-evidence.

5. **Introduce new evidence:** Deploy sources you held back from your opening. \
Show that the evidence base supports your position in ways they haven't addressed.

6. **Connect to values:** Don't just rebut facts — explain why your position leads \
to better outcomes for real people.

## Minimums
- At least 500 words
- At least 2 new sources not cited in your opening
- Address at least 2 specific claims from opponent's opening

## What NOT to Do
- Do not strawman — misrepresenting their argument will cost you with the judges
- Do not ignore their strongest point — evasion is transparent
- Do not simply restate your opening — every sentence should respond to something \
  your opponent actually said or introduce new evidence
- Do not dismiss sources solely because they come from non-institutional outlets — \
  challenge methodology and accuracy, not credentials

## Citation Format
[Source: Full Source Title] — inline after claims.
"""
