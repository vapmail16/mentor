import { fetchWithAuth, parseJsonResponse } from './http';

export interface Question {
  id: string;
  session_id: string;
  user_id: string;
  question: string;
  is_answered: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  answers?: Answer[];
  user_vote?: 'upvote' | 'downvote' | null;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_mentor_answer: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  user_vote?: 'upvote' | 'downvote' | null;
}

const qaService = {
  async getSessionQuestions(
    sessionId: string,
    options: { is_answered?: boolean; limit?: number; offset?: number } = {}
  ): Promise<Question[]> {
    const params = new URLSearchParams();
    if (options.is_answered !== undefined) params.append('is_answered', options.is_answered.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await fetchWithAuth(`/qa/session/${sessionId}?${params.toString()}`);
    return parseJsonResponse<Question[]>(response);
  },

  async getQuestionById(id: string): Promise<Question> {
    const response = await fetchWithAuth(`/qa/${id}`);
    return parseJsonResponse<Question>(response);
  },

  async createQuestion(sessionId: string, question: string): Promise<Question> {
    const response = await fetchWithAuth('/qa', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        question,
      }),
    });
    return parseJsonResponse<Question>(response);
  },

  async answerQuestion(questionId: string, answer: string): Promise<Answer> {
    const response = await fetchWithAuth(`/qa/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
    return parseJsonResponse<Answer>(response);
  },

  async vote(
    questionId?: string,
    answerId?: string,
    voteType: 'upvote' | 'downvote' = 'upvote'
  ): Promise<any> {
    const response = await fetchWithAuth('/qa/vote', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId || null,
        answer_id: answerId || null,
        vote_type: voteType,
      }),
    });
    return parseJsonResponse(response);
  },
};

export default qaService;

