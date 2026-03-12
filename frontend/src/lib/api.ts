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
