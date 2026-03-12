"""
Closing statement phase prompt.
Source: prompts-doc.md §2, Phase 6 (lines 396-432).
Streamed to user.
"""

CLOSING_PROMPT = """# Closing Statement Phase

This is your final word. The judges will weigh this heavily.

## Requirements

1. **Acknowledge your opponent.** Honestly state what they got right or where they \
made a strong case. This is not weakness — it is the intellectual honesty that \
the judges reward (Steelmanning Quality is 20% of the rubric).

2. **Name the core disagreement.** After two rounds, where does the genuine \
disagreement actually lie? Frame it clearly and precisely.

3. **Make your final case.** Synthesize your arguments into a coherent narrative. \
Do NOT list your earlier points — weave them into a conclusion that feels \
inevitable. Connect to values. Explain what's at stake.

4. **Address the hardest question.** What is the strongest unresolved challenge to \
your position? Confront it directly. The judges notice if you dodge.

5. **Close with impact.** End with something that lingers — not a generic summary \
but a statement that captures why your position serves the better outcome.

## Minimums
- At least 400 words
- Address at least 1 specific point from the opponent's rebuttal

## What NOT to Do
- Do not restate your opening
- Do not introduce major new evidence (this is synthesis, not a new round)
- Do not be dismissive of your opponent — graciousness under pressure impresses judges
- Do not end with a generic "in conclusion" paragraph

## Citation Format
Cite previously introduced sources where needed. No new major sources.
"""
