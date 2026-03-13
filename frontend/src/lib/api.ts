const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PresetTopic {
  id: string;
  title: string;
  description: string;
  pro_position: string;
  con_position: string;
}

export async function fetchPresetTopics(): Promise<PresetTopic[]> {
  const response = await fetch(`${API_BASE_URL}/api/topics/presets`, {
    // Next.js cache configuration for presets (revalidate periodically if needed, or static)
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch preset topics");
  }
  return response.json();
}

export interface DebateSummary {
  id: string;
  topic: string;
  resolution: string;
  pro_position: string;
  con_position: string;
  status: string;
  created_at: string;
  created_by: string;
  winner: string;
  pro_score: number;
  con_score: number;
  turn_count: number;
  like_count?: number;
  user_liked?: boolean;
}

export async function fetchDebates(): Promise<DebateSummary[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/api/debates/`, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch debates: ${response.status}`);
  }
  return response.json();
}

export async function likeDebate(debateId: string): Promise<{ liked: boolean; like_count: number }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API_BASE_URL}/api/debates/${debateId}/like`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to like debate: ${response.status}`);
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

export async function fetchDebateMode(): Promise<"demo" | "live"> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/debates/mode`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      if (data.mode === "live") return "live";
    }
  } catch {
    // Fall back to demo if backend is unreachable
  }
  return "demo";
}

export async function fetchDebate(debateId: string): Promise<DebateData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/debates/${debateId}`, {
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

export interface VoteTally {
  pro_votes: number;
  con_votes: number;
  total_votes: number;
  user_vote: string | null;
}

export async function fetchVoteTally(debateId: string, token: string | null): Promise<VoteTally | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/votes/${debateId}`, {
      headers,
      cache: "no-store",
    });
    
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching vote tally:", error);
    return null;
  }
}

export async function castVote(debateId: string, side: "pro" | "con", token: string): Promise<VoteTally> {
  const response = await fetch(`${API_BASE_URL}/api/votes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ debate_id: debateId, side }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to cast vote");
  }

  return response.json();
}
