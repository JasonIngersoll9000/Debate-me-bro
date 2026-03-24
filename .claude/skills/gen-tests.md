# gen-tests

Generate pytest test stubs for a GitHub issue's acceptance criteria, matching DebateMeBro's existing test patterns.

## When to use

When implementing a feature or fix and you need to write tests tied to acceptance criteria. Invoke as `/gen-tests #<issue>` or `/gen-tests "<description>"`.

## Instructions

When invoked:

1. Get the acceptance criteria:
   - If given an issue number: `gh issue view <number> --json title,body`
   - If given free text: use it directly as the criteria

2. Read these files to understand existing test patterns:
   - `backend/tests/conftest.py` — available fixtures (`async_client`, `db_session`, `mock_store`, etc.)
   - `backend/tests/unit/test_store.py` — unit test style (AsyncMock, patch_session_factory)
   - `backend/tests/integration/test_persistence.py` — integration test style (async_client, HTTP calls)

3. Determine test placement:
   - **Unit tests** (`tests/unit/`): pure logic, mocked DB and Anthropic, fast
   - **Integration tests** (`tests/integration/`): HTTP endpoints via `async_client`, real DB flow

4. Generate test file(s) with:
   - Correct file name: `test_<module>.py`
   - `@pytest.mark.asyncio` NOT needed (project uses `asyncio_mode = auto` in pytest.ini)
   - One test function per acceptance criterion
   - Docstring on each test referencing the criterion it covers
   - Proper `AsyncMock` / `MagicMock` for Anthropic and store calls in unit tests
   - Parametrized tests where multiple input cases are obvious

5. Print the generated test code and the command to run it:
   ```bash
   pytest -v backend/tests/<type>/test_<module>.py
   ```

6. Note which acceptance criteria have no obvious test mapping and flag them.

## Example invocation

```
/gen-tests #20
/gen-tests "User cannot start more than MAX_DEBATES_PER_USER live debates"
```
