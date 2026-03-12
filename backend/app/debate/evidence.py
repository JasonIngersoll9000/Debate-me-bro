import re
import os
import anyio
from typing import Dict, Tuple
from app.models.schemas import EvidenceBundle, CitationDetail

class EvidenceLoader:
    def __init__(self, evidence_dir: str = "evidence"):
        self.evidence_dir = evidence_dir
        # Matches standard Markdown links: [Title](URL)
        self.link_pattern = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')

    def parse_markdown(self, content: str) -> Tuple[str, Dict[str, CitationDetail]]:
        """
        Parses Markdown content, extracts citations, and returns the raw text 
        along with a dictionary of citations.
        """
        citations: Dict[str, CitationDetail] = {}
        
        # Find all markdown links
        for match in self.link_pattern.finditer(content):
            title = match.group(1).strip()
            url = match.group(2).strip()
            
            # Simple context extraction (grabbing ~100 chars around the link)
            start_idx = max(0, match.start() - 50)
            end_idx = min(len(content), match.end() + 50)
            context = content[start_idx:end_idx].replace('\n', ' ').strip()
            
            citations[title] = CitationDetail(
                title=title,
                url=url,
                source_context=context
            )
            
        return content, citations

    async def load_preset_evidence(self, topic_id: str) -> EvidenceBundle:
        """
        Loads the pro and con research documents for a preset topic and 
        combines them into a single EvidenceBundle.
        """
        topic_path = os.path.join(self.evidence_dir, topic_id)
        pro_path = anyio.Path(os.path.join(topic_path, "pro_research.md"))
        con_path = anyio.Path(os.path.join(topic_path, "con_research.md"))
        
        combined_content = ""
        all_citations: Dict[str, CitationDetail] = {}
        
        # Read and parse Pro
        if await pro_path.exists():
            pro_text = await pro_path.read_text(encoding='utf-8')
            combined_content += "### PRO RESEARCH\n\n" + pro_text + "\n\n"
            _, pro_cites = self.parse_markdown(pro_text)
            all_citations.update(pro_cites)
                
        # Read and parse Con 
        if await con_path.exists():
            con_text = await con_path.read_text(encoding='utf-8')
            combined_content += "### CON RESEARCH\n\n" + con_text + "\n\n"
            _, con_cites = self.parse_markdown(con_text)
            all_citations.update(con_cites)
                
        if not combined_content:
            raise FileNotFoundError(f"No research found for topic {topic_id}")
            
        return EvidenceBundle(
            raw_content=combined_content,
            citations=all_citations
        )
