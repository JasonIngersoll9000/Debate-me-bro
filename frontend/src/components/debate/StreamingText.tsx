"use client";
import { useState, useMemo } from "react";
import { CitationBadge } from "./CitationBadge";
import { Citation } from "@/lib/store";

interface Props {
  text: string;
  citations: Citation[];
  isStreaming: boolean;
  side: "pro" | "con";
}

/** Allow only http/https URLs to prevent javascript:/data: XSS from streamed LLM output. */
function sanitizeCitationUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : "";
  } catch {
    return "";
  }
}

export function StreamingText({ text, citations, isStreaming, side }: Props) {
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const parsedContent = useMemo(() => {
    // Matches backend LLM Markdown format "[Source: Title](URL)" or simply "[Source Title]" or "[Title](URL)"
    const regex = /\[(?:Source:\s*)?([^\]]+)\](?:\(([^)]+)\))?/gi;
    const parts: Array<
      | { type: 'text'; content: string }
      | { type: 'citation'; citationId: string; defaultUrl: string | undefined }
    > = [];
    let lastIndex = 0;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      
      const title = match[1];
      // Sanitize the URL from LLM output — only http/https allowed
      const rawUrl = match[2];
      const url = rawUrl ? sanitizeCitationUrl(rawUrl) : undefined;
      
      parts.push({ 
        type: 'citation', 
        citationId: title,
        defaultUrl: url
      });
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }
    
    return parts;
  }, [text]);

  const cursorColor = side === "pro" ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]";

  return (
    <div className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap font-medium tracking-wide">
      {parsedContent.map((part, i) => {
        if (part.type === 'citation') {
          const tempCitations = [...citations];
          if (part.defaultUrl && !tempCitations.find(c => c.id === part.citationId)) {
            tempCitations.push({ id: part.citationId, url: part.defaultUrl });
          }
          return (
            <CitationBadge 
              key={`cit-${i}`} 
              citationId={part.citationId} 
              citations={tempCitations}
              isExpanded={expandedCitation === part.citationId}
              onClick={() => setExpandedCitation(expandedCitation === part.citationId ? null : part.citationId)}
            />
          );
        }
        
        // Render bold text
        const textParts = part.content.split(/(\*\*.*?\*\*)/g);
        return textParts.map((t, j) => {
          if (t.startsWith('**') && t.endsWith('**')) {
            return <strong key={`txt-${i}-${j}`} className="font-bold text-white tracking-normal">{t.slice(2, -2)}</strong>;
          }
          return <span key={`txt-${i}-${j}`}>{t}</span>;
        });
      })}
      {isStreaming && (
        <span className={`inline-block w-2.5 h-4 ml-1 align-middle animate-pulse rounded-sm ${cursorColor}`}></span>
      )}
    </div>
  );
}
