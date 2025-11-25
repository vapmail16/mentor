import { fetchWithAuth, parseJsonResponse } from './http';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_hours: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  sessions?: Array<{
    id: string;
    title: string;
    duration_minutes: number;
    order_index: number;
  }>;
  user_progress?: {
    completed_sessions: number;
    total_sessions: number;
    progress_percentage: number;
    last_accessed_at: string;
  };
}

export interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  learning_path_id: string;
  learning_path_title: string;
  issued_at: string;
  qr_code_url: string | null;
  pdf_url: string | null;
}

const learningPathsService = {
  async getAllLearningPaths(filters: {
    is_published?: boolean;
    difficulty_level?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<LearningPath[]> {
    const params = new URLSearchParams();
    if (filters.is_published !== undefined) params.append('is_published', filters.is_published.toString());
    if (filters.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await fetchWithAuth(`/learning-paths?${params.toString()}`);
    return parseJsonResponse<LearningPath[]>(response);
  },

  async getLearningPathById(id: string): Promise<LearningPath> {
    const response = await fetchWithAuth(`/learning-paths/${id}`);
    return parseJsonResponse<LearningPath>(response);
  },

  async updateProgress(learningPathId: string, sessionId: string): Promise<any> {
    const response = await fetchWithAuth(`/learning-paths/${learningPathId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
    return parseJsonResponse(response);
  },

  async getProgress(learningPathId: string): Promise<any> {
    const response = await fetchWithAuth(`/learning-paths/${learningPathId}/progress`);
    return parseJsonResponse(response);
  },

  async getUserCertificates(): Promise<Certificate[]> {
    const response = await fetchWithAuth('/learning-paths/certificates/my');
    return parseJsonResponse<Certificate[]>(response);
  },
};

export default learningPathsService;

