# debug-stream

Connect to a live SSE debate stream and pretty-print all events with timing, schema validation, and per-phase summaries.

## When to use

When debugging SSE streaming issues, testing a new debate generation, or verifying frontend event consumption. Invoke as `/debug-stream <debate-id>`.

## Instructions

When invoked with a debate ID:

1. Check for a JWT token:
   - Look for `DEBATE_JWT` environment variable
   - If not set, check if the user is logged in: `curl -s http://localhost:8000/api/auth/me -H "Authorization: Bearer $TOKEN"`
   - If no token available, remind the user: "Set DEBATE_JWT=<your token> or log in first"

2. Build the SSE URL:
   ```
   http://localhost:8000/api/debates/<debate-id>/stream?token=<jwt>
   ```
   (JWT passed as query param — required for EventSource, per CLAUDE.md)

3. Connect and consume the stream using Python:

   ```python
   import httpx, json, time, sys

   url = f"http://localhost:8000/api/debates/{debate_id}/stream?token={token}"
   last_event_time = time.time()

   with httpx.stream("GET", url, timeout=None) as r:
       for line in r.iter_lines():
           if line.startswith("data:"):
               now = time.time()
               delta_ms = int((now - last_event_time) * 1000)
               last_event_time = now
               payload = json.loads(line[5:].strip())
               event_type = payload.get("type", "unknown")
               # pretty print with color coding
   ```

4. For each event, print:
   ```
   [+142ms] phase_transition  → opening_pro
   [+891ms] content           → "The evidence clearly shows..." (47 chars)
   [+12ms]  content           → " Universal Basic Income would..." (38 chars)
   [+2341ms] phase_transition → opening_con
   ```

5. Color coding (use ANSI codes):
   - `phase_transition` → **bold blue**
   - `error` → **bold red** + print full payload
   - `complete` → **bold green**
   - `internal_content` → dim gray
   - `judging_results` → bold yellow

6. Warn if gap between events exceeds 5 seconds.

7. On completion, print a summary:
   ```
   Stream complete.
   Total time: 47.3s | Events: 142 | Phases: 10
   Slowest phase: rebuttal_pro (+12.1s)
   Errors: 0
   ```

8. Validate event JSON against expected shapes:
   - `content`: must have `{type, phase, side, text}`
   - `judging_results`: must have `{logic, evidence, engagement}` scores
   - Flag any event missing required fields

## Example invocation

```
/debug-stream abc123-debate-uuid
```
