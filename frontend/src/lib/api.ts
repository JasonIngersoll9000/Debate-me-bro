const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface PresetTopic {
  id: string;
  title: string;
  description: string;
  pro_position: string;
  con_position: string;
}

export async function fetchPresetTopics(): Promise<PresetTopic[]> {
  const response = await fetch(`${API_BASE_URL}/topics/presets`, {
    // Next.js cache configuration for presets (revalidate periodically if needed, or static)
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch preset topics");
  }
  return response.json();
}

export interface DebateData {
  id: string;
  topic: string;
  resolution: string;
  pro_position: string;
  con_position: string;
  status: string;
  personas: {
    pro: { name: string; identity: string; expertise_areas?: string[]; core_values?: string[]; rhetorical_approach?: string };
    con: { name: string; identity: string; expertise_areas?: string[]; core_values?: string[]; rhetorical_approach?: string };
  };
  turns: Array<{
    phase: string;
    side: string;
    text: string;
    is_internal: boolean;
  }>;
  judging_results?: {
    winner: string;
    scores: {
      pro: { logic: number; evidence: number; refutation: number; steelman: number; weighted_total?: number };
      con: { logic: number; evidence: number; refutation: number; steelman: number; weighted_total?: number };
    };
    judges?: Array<{ name: string; reasoning: string }>;
    summary?: string;
  };
  evidence?: {
    citations: Record<string, unknown>;
    pro_arguments?: unknown[];
    con_arguments?: unknown[];
  };
  created_at: string;
}

export async function fetchDebate(debateId: string): Promise<DebateData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/debates/${debateId}`, {
      cache: "no-store",
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch debate: ${response.status}`);
    }
    return response.json();
  } catch {
    return null;
  }
}
