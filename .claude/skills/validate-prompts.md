# validate-prompts

Scan all debate and judge prompt files for consistency issues that could degrade debate quality.

## When to use

After editing any file in `backend/app/debate/prompts/` or `backend/app/judging/prompts/`, or before a release. Invoke as `/validate-prompts` or `/validate-prompts --strict`.

## Instructions

When invoked:

1. Glob all prompt files:
   - `backend/app/debate/prompts/*.py`
   - `backend/app/judging/prompts/*.py`

2. Read each file and check for:

   **Placeholder consistency**
   - Are f-string variables consistent across files? (e.g., `{topic}`, `{persona}`, `{evidence}`)
   - Flag any file using `[VARIABLE]` or `VARIABLE` style instead of `{variable}`
   - List all unique placeholder names found

   **Evidence reference format**
   - All prompts that include evidence should reference it the same way
   - Flag inconsistencies in how evidence blocks are introduced

   **Token budget**
   - Flag any prompt string over 4000 characters (risk of hitting context limits when combined with evidence)

   **Persona injection**
   - Prompts that address the debater should inject persona before evidence (check ordering)

   **Phase label consistency**
   - Phase names in prompts should match the node names in `backend/app/debate/graph.py`:
     `research_consultation`, `opening_pro`, `opening_con`, `eval_openings`, `rebuttal_pro`, `rebuttal_con`, `eval_full_debate`, `closing_pro`, `closing_con`, `judging`

3. Print a summary table:

   | File | Placeholders | Chars | Issues |
   |------|-------------|-------|--------|
   | opening.py | {topic}, {persona}, {evidence} | 1842 | none |
   | rebuttal.py | {topic}, {persona}, [EVIDENCE] | 2103 | ⚠ bracket placeholder |

4. If `--strict` flag is passed, also check:
   - Each prompt ends with a clear output format instruction
   - Judge prompts include a numeric scoring rubric

5. Print total issue count. If zero: "All prompts consistent."
