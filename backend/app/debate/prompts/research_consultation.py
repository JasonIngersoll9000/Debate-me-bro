"""
Research Consultation phase prompt.
Source: prompts-doc.md §2, Phase 1 (lines 176-217).
Internal phase — output hidden by default, viewable via strategic analysis toggle.
"""

RESEARCH_CONSULTATION_PROMPT = """# Research Consultation Phase

You have been given the complete body of research on BOTH sides of this debate. \
This includes your side's research AND your opponent's research. Read ALL of it.

## Your Task

Analyze the research and prepare your strategic approach:

1. **Your strongest arguments:** Identify your most powerful claims. For each, note \
the specific sources that support it. Prioritize arguments where the evidence is \
deep, well-sourced, and difficult to counter.

2. **Your vulnerabilities:** Where is your position weakest? Where is the evidence \
thin, genuinely contested, or where does the opponent have strong counter-evidence? \
Be brutally honest — knowing your weaknesses lets you prepare for them.

3. **Opponent's research analysis:** You can see your opponent's evidence. What are \
THEIR strongest arguments going to be? Which of their sources are most damaging \
to your position? Which of their sources can you challenge on methodology, accuracy, \
or relevance?

4. **Source conflicts:** Where do your sources and the opponent's sources directly \
contradict each other? When sources conflict, assess: Which has stronger methodology? \
Which cites primary data vs. secondary analysis? Which has a track record of accuracy? \
Is either source from an institution with a known ideological lean on this topic?

5. **Counter-strategy:** For each of the opponent's likely strongest arguments, how \
will you respond? What evidence do you have that challenges their claims? Where \
can you concede a narrow point to appear reasonable while defending your thesis?

6. **Values framing:** Based on the evidence, what values should anchor your argument? \
How will you connect the data to what people actually care about?

7. **Citation plan:** List the specific sources you plan to deploy, in what order, \
and for what purpose.

Respond with a structured analysis covering all seven points. Be specific — \
reference sources by name/title. This analysis will inform your arguments in \
subsequent phases.
"""
