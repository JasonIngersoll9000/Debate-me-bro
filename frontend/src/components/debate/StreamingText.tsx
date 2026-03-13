"use client";
import { useState, useMemo, ReactNode } from "react";
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

/** Parse inline markdown: citations [Source](url) and **bold** */
function parseInline(
  line: string,
  citations: Citation[],
  expandedCitation: string | null,
  setExpandedCitation: (id: string | null) => void,
  keyPrefix: string,
): ReactNode[] {
  const regex = /\[(?:Source:\s*)?([^\]]+)\](?:\(([^)]+)\))?/gi;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let partIdx = 0;

  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...parseBold(line.slice(lastIndex, match.index), `${keyPrefix}-${partIdx++}`));
    }
    const title = match[1];
    const rawUrl = match[2];
    const url = rawUrl ? sanitizeCitationUrl(rawUrl) : undefined;
    const tempCitations = [...citations];
    if (url && !tempCitations.find(c => c.id === title)) {
      tempCitations.push({ id: title, url });
    }
    parts.push(
      <CitationBadge
        key={`${keyPrefix}-cit-${partIdx++}`}
        citationId={title}
        citations={tempCitations}
        isExpanded={expandedCitation === title}
        onClick={() => setExpandedCitation(expandedCitation === title ? null : title)}
      />
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    parts.push(...parseBold(line.slice(lastIndex), `${keyPrefix}-${partIdx}`));
  }
  return parts;
}

/** Parse **bold** segments within a text string */
function parseBold(text: string, keyPrefix: string): ReactNode[] {
  const segments = text.split(/(\*\*.*?\*\*)/g);
  return segments.map((seg, j) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={`${keyPrefix}-b${j}`} className="font-bold text-white tracking-normal">{seg.slice(2, -2)}</strong>;
    }
    return seg ? <span key={`${keyPrefix}-t${j}`}>{seg}</span> : null;
  }).filter(Boolean);
}

export function StreamingText({ text, citations, isStreaming, side }: Props) {
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const blocks = useMemo(() => {
    return text.split("\n");
  }, [text]);

  const cursorColor = side === "pro" ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]";

  return (
    <div className="text-base leading-relaxed text-gray-200 font-medium tracking-wide space-y-1">
      {blocks.map((line, i) => {
        const trimmed = line.trimStart();

        // Horizontal rule
        if (/^-{3,}\s*$/.test(trimmed)) {
          return <hr key={`hr-${i}`} className="border-white/10 my-4" />;
        }

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={`h3-${i}`} className="text-base font-black text-white mt-4 mb-1 tracking-tight">
              {parseInline(trimmed.slice(4), citations, expandedCitation, setExpandedCitation, `h3-${i}`)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={`h2-${i}`} className="text-lg font-black text-white mt-5 mb-1.5 tracking-tight">
              {parseInline(trimmed.slice(3), citations, expandedCitation, setExpandedCitation, `h2-${i}`)}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={`h1-${i}`} className="text-xl font-black text-white mt-6 mb-2 tracking-tight">
              {parseInline(trimmed.slice(2), citations, expandedCitation, setExpandedCitation, `h1-${i}`)}
            </h2>
          );
        }

        // List items
        if (/^[-*]\s/.test(trimmed)) {
          return (
            <div key={`li-${i}`} className="flex gap-2 pl-2">
              <span className="text-gray-500 select-none shrink-0">•</span>
              <span>{parseInline(trimmed.slice(2), citations, expandedCitation, setExpandedCitation, `li-${i}`)}</span>
            </div>
          );
        }

        // Numbered list items
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s/);
          const num = numMatch ? numMatch[1] : "";
          const rest = trimmed.replace(/^\d+\.\s/, "");
          return (
            <div key={`ol-${i}`} className="flex gap-2 pl-2">
              <span className="text-gray-500 select-none shrink-0">{num}.</span>
              <span>{parseInline(rest, citations, expandedCitation, setExpandedCitation, `ol-${i}`)}</span>
            </div>
          );
        }

        // Blank line
        if (trimmed === "") {
          return <div key={`br-${i}`} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={`p-${i}`}>
            {parseInline(line, citations, expandedCitation, setExpandedCitation, `p-${i}`)}
          </p>
        );
      })}
      {isStreaming && (
        <span className={`inline-block w-2.5 h-4 ml-1 align-middle animate-pulse rounded-sm ${cursorColor}`}></span>
      )}
    </div>
  );
}
