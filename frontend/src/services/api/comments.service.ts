import { fetchWithAuth, parseJsonResponse } from './http';

export interface Comment {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  replies?: Comment[];
  user_liked?: boolean;
}

const commentsService = {
  async getSessionComments(
    sessionId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Comment[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await fetchWithAuth(`/comments/session/${sessionId}?${params.toString()}`);
    return parseJsonResponse<Comment[]>(response);
  },

  async createComment(
    sessionId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    const response = await fetchWithAuth('/comments', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        content,
        parent_id: parentId || null,
      }),
    });
    return parseJsonResponse<Comment>(response);
  },

  async toggleLike(commentId: string): Promise<{ liked: boolean; like_count: number }> {
    const response = await fetchWithAuth(`/comments/${commentId}/like`, {
      method: 'POST',
    });
    return parseJsonResponse<{ liked: boolean; like_count: number }>(response);
  },

  async reportComment(commentId: string): Promise<void> {
    await fetchWithAuth(`/comments/${commentId}/report`, {
      method: 'POST',
    });
  },
};

export default commentsService;

