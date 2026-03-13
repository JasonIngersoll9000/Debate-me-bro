"""
Evidence loader — prompts-doc.md §6.
Parses research Markdown, extracts structured citations,
and returns an EvidenceBundle with separate pro/con documents.
"""
import re
import os
import logging
from typing import Dict, List, Tuple

import anyio

from app.models.schemas import EvidenceBundle, CitationDetail

logger = logging.getLogger(__name__)


class EvidenceLoader:
    def __init__(self, evidence_dir: str = "evidence"):
        self.evidence_dir = evidence_dir
        # Matches: **[Title](URL)** (Author, Year): Finding
        self.rich_pattern = re.compile(
            r'\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*'
            r'(?:\(([^)]*)\))?\s*:?\s*(.*?)(?=\n|$)'
        )
        # Fallback: standard Markdown links [Title](URL)
        self.link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
        # Extract argument headers: ## Argument N: Title
        self.argument_pattern = re.compile(
            r'^##\s+Argument\s+\d+:\s*(.+)$', re.MULTILINE)

    def parse_markdown(
            self, content: str) -> Tuple[Dict[str, CitationDetail], List[str]]:
        """
        Parses Markdown content, extracts structured citations and argument summaries.
        Returns (citations_dict, argument_titles).
        """
        citations: Dict[str, CitationDetail] = {}
        arguments: List[str] = []

        # Extract rich citations: **[Title](URL)** (Author, Year): Finding
        for match in self.rich_pattern.finditer(content):
            title = match.group(1).strip()
            url = match.group(2).strip()
            author_year = match.group(3) or ""
            finding = match.group(4).strip() if match.group(4) else ""

            # Parse author and year from "(Author, Year)"
            author, year = "", ""
            if author_year:
                parts = [p.strip() for p in author_year.rsplit(",", 1)]
                if len(parts) == 2:
                    author, year = parts[0], parts[1]
                else:
                    author = author_year.strip()

            citations[title] = CitationDetail(
                title=title, url=url, author=author, year=year,
                finding=finding,
                source_context=content[max(
                    0, match.start() - 50):match.end() + 50].replace('\n', ' ').strip(),
            )

        # Fallback: standard [Title](URL) links not already captured
        for match in self.link_pattern.finditer(content):
            title = match.group(1).strip()
            if title not in citations:
                url = match.group(2).strip()
                start_idx = max(0, match.start() - 50)
                end_idx = min(len(content), match.end() + 50)
                context = content[start_idx:end_idx].replace('\n', ' ').strip()
                citations[title] = CitationDetail(
                    title=title, url=url, source_context=context,
                )

        # Extract argument dimension titles
        for match in self.argument_pattern.finditer(content):
            arguments.append(match.group(1).strip())

        return citations, arguments

    async def load_preset_evidence(self, topic_id: str) -> EvidenceBundle:
        """
        Loads the pro and con research documents for a preset topic.
        Returns an EvidenceBundle with separate pro/con fields per prompts-doc.md §6.
        """
        topic_path = os.path.join(self.evidence_dir, topic_id)
        pro_path = anyio.Path(os.path.join(topic_path, "pro_research.md"))
        con_path = anyio.Path(os.path.join(topic_path, "con_research.md"))

        pro_text = ""
        con_text = ""
        all_citations: Dict[str, CitationDetail] = {}
        pro_arguments: List[str] = []
        con_arguments: List[str] = []

        # Read and parse Pro
        if await pro_path.exists():
            pro_text = await pro_path.read_text(encoding='utf-8')
            pro_cites, pro_args = self.parse_markdown(pro_text)
            all_citations.update(pro_cites)
            pro_arguments = pro_args
            logger.info("Loaded Pro research for '%s': %d citations, %d arguments",
                        topic_id, len(pro_cites), len(pro_args))

        # Read and parse Con
        if await con_path.exists():
            con_text = await con_path.read_text(encoding='utf-8')
            con_cites, con_args = self.parse_markdown(con_text)
            all_citations.update(con_cites)
            con_arguments = con_args
            logger.info("Loaded Con research for '%s': %d citations, %d arguments",
                        topic_id, len(con_cites), len(con_args))

        if not pro_text and not con_text:
            raise FileNotFoundError(
                f"No research found for topic '{topic_id}'")

        # Combined text for backward compatibility
        combined = ""
        if pro_text:
            combined += "### PRO RESEARCH\n\n" + pro_text + "\n\n"
        if con_text:
            combined += "### CON RESEARCH\n\n" + con_text + "\n\n"

        return EvidenceBundle(
            raw_content=combined,
            pro_research=pro_text,
            con_research=con_text,
            citations=all_citations,
            pro_arguments=pro_arguments,
            con_arguments=con_arguments,
        )
