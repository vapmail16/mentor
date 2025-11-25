import { fetchWithAuth, parseJsonResponse } from './http';

export interface SearchResult {
  sessions?: any[];
  mentors?: any[];
  total: number;
}

export interface SessionSearchParams {
  q: string;
  mentor_id?: string;
  language?: string;
  difficulty_level?: string;
  topic_id?: string;
  limit?: number;
  offset?: number;
}

export interface MentorSearchParams {
  q: string;
  domain?: string;
  limit?: number;
  offset?: number;
}

const searchService = {
  async globalSearch(
    query: string,
    options: { type?: string; limit?: number } = {}
  ): Promise<SearchResult> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetchWithAuth(`/search?${params.toString()}`);
    return parseJsonResponse<SearchResult>(response);
  },

  async searchSessions(params: SessionSearchParams): Promise<any[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.mentor_id) searchParams.append('mentor_id', params.mentor_id);
    if (params.language) searchParams.append('language', params.language);
    if (params.difficulty_level) searchParams.append('difficulty_level', params.difficulty_level);
    if (params.topic_id) searchParams.append('topic_id', params.topic_id);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetchWithAuth(`/search/sessions?${searchParams.toString()}`);
    return parseJsonResponse<any[]>(response);
  },

  async searchMentors(params: MentorSearchParams): Promise<any[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.domain) searchParams.append('domain', params.domain);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetchWithAuth(`/search/mentors?${searchParams.toString()}`);
    return parseJsonResponse<any[]>(response);
  },
};

export default searchService;

