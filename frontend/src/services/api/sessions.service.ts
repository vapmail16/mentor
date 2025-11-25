import { fetchWithAuth, parseJsonResponse } from './http';

export interface Session {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  main_video_url: string | null;
  audio_file_url: string | null;
  language: string;
  difficulty_level: string;
  duration_minutes: number;
  is_published: boolean;
  download_allowed: boolean;
  created_at: string;
  updated_at: string;
  mentor?: {
    id: string;
    full_name: string;
    photo_url?: string;
  };
}

export interface SessionFilters {
  mentor_id?: string;
  language?: string;
  difficulty_level?: string;
  topic_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AIContent {
  transcript_original?: { text: string; segments?: any[] };
  transcript_english?: { text: string };
  summary?: { text: string };
  key_learnings?: { learnings: string[] };
  chapters?: Array<{
    id: string;
    title: string;
    start_time: number;
    end_time: number;
    order_index: number;
  }>;
  auto_tags?: { tags: string[] };
}

const sessionsService = {
  async getAllSessions(filters: SessionFilters = {}): Promise<Session[]> {
    const params = new URLSearchParams();
    if (filters.mentor_id) params.append('mentor_id', filters.mentor_id);
    if (filters.language) params.append('language', filters.language);
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.topic_id) params.append('topic_id', filters.topic_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await fetchWithAuth(`/sessions?${params.toString()}`);
    return parseJsonResponse<Session[]>(response);
  },

  async getSessionById(id: string): Promise<Session & { ai_content?: AIContent }> {
    const response = await fetchWithAuth(`/sessions/${id}`);
    return parseJsonResponse<Session & { ai_content?: AIContent }>(response);
  },

  async getAIContent(sessionId: string): Promise<AIContent> {
    const response = await fetchWithAuth(`/ai/sessions/${sessionId}/content`);
    return parseJsonResponse<AIContent>(response);
  },

  async trackWatchProgress(sessionId: string, watchedSeconds: number): Promise<void> {
    await fetchWithAuth(`/sessions/${sessionId}/watch`, {
      method: 'POST',
      body: JSON.stringify({ watched_seconds: watchedSeconds }),
    });
  },
};

export default sessionsService;

