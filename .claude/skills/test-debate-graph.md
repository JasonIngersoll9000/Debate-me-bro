# test-debate-graph

Run the LangGraph debate pipeline locally with mocked Claude calls to validate all phase transitions without spending API quota.

## When to use

After modifying `backend/app/debate/graph.py`, `agents.py`, any prompt file, or `stream.py`. Invoke as `/test-debate-graph` or `/test-debate-graph <topic>`.

## Instructions

When invoked:

1. Determine the topic to test:
   - If a topic is given (e.g., `/test-debate-graph healthcare`), use it
   - Default to `healthcare` if no argument provided

2. Write and run a Python test script that:

   ```python
   # Mock the Anthropic client BEFORE importing the graph
   from unittest.mock import AsyncMock, patch, MagicMock

   MOCK_RESPONSE = "This is a mock debate argument for testing phase transitions."

   # Patch anthropic.AsyncAnthropic so no real API calls are made
   with patch("anthropic.AsyncAnthropic") as mock_anthropic:
       mock_client = MagicMock()
       mock_stream = AsyncMock()
       mock_stream.__aenter__ = AsyncMock(return_value=mock_stream)
       mock_stream.__aexit__ = AsyncMock(return_value=None)
       mock_stream.__aiter__ = lambda self: iter([MagicMock(type="content_block_delta", delta=MagicMock(text=MOCK_RESPONSE))])
       mock_client.messages.stream.return_value = mock_stream
       mock_anthropic.return_value = mock_client

       from backend.app.debate.graph import build_graph
       from backend.app.debate.evidence import load_evidence

       graph = build_graph()
       evidence = load_evidence("<topic>")
       # Initialize DebateState and invoke graph
       # Capture all phase transitions
   ```

3. Validate the output:
   - All 10 nodes fired in correct order
   - `debate_turns` contains entries for each streamed phase
   - `internal_analysis` populated for eval nodes
   - `judging_results` has scores from all 3 judges
   - No node raised an exception

4. Print a phase-by-phase summary:
   ```
   ✓ research_consultation  — 1 internal turn
   ✓ opening_pro            — 312 chars
   ✓ opening_con            — 298 chars
   ✓ eval_openings          — 1 internal turn
   ✓ rebuttal_pro           — 287 chars
   ✓ rebuttal_con           — 301 chars
   ✓ eval_full_debate       — 1 internal turn
   ✓ closing_pro            — 245 chars
   ✓ closing_con            — 231 chars
   ✓ judging                — logic: 72, evidence: 68, engagement: 81

   All 10 phases completed. 0 errors.
   ```

5. If any phase fails, print the full exception and the DebateState at the point of failure.

## Example invocation

```
/test-debate-graph
/test-debate-graph ubi
/test-debate-graph nuclear
```
