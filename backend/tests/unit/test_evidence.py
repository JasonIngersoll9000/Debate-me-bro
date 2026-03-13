import pytest
from app.debate.evidence import EvidenceLoader


def test_parse_markdown():
    loader = EvidenceLoader()

    markdown_content = """
    Here is a sentence with a [First Citation](https://example.com/one) embedded in it.
    Another line might have **[Second Quote](https://test.org)** included.
    We could also have multiple: [A](http://a.com) and [B](http://b.com) and so forth.
    """

    # parse_markdown returns (citations_dict, argument_titles)
    citations, _arguments = loader.parse_markdown(markdown_content)

    # We should have extracted 4 standard markdown URL strings matching our keys
    assert len(citations) == 4

    assert "First Citation" in citations
    assert citations["First Citation"].url == "https://example.com/one"

    assert "Second Quote" in citations
    assert citations["Second Quote"].url == "https://test.org"

    assert citations["A"].title == "A"


@pytest.mark.asyncio
async def test_load_preset_evidence():
    loader = EvidenceLoader(evidence_dir="evidence")

    # We expect 'healthcare', 'ubi', and 'nuclear' to exist based on dummy
    # data or PRD
    bundle = await loader.load_preset_evidence("ubi")

    assert "### PRO RESEARCH" in bundle.raw_content
    assert "### CON RESEARCH" in bundle.raw_content
    # Known citations from our dummy data
    assert "Basic Income Earth Network" in bundle.citations
    assert "Heritage Foundation Analysis" in bundle.citations
