import { fetchWithAuth, parseJsonResponse } from './http';

export interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
  domains: string[];
  specialties: string[];
  languages: string[];
  achievements: string[];
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MentorAnalytics {
  totalSessions: number;
  publishedSessions: number;
  totalViews: number;
  totalEngagement: number;
}

const mentorsService = {
  async getAllMentors(filters: {
    domain?: string;
    verification_status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Mentor[]> {
    const params = new URLSearchParams();
    if (filters.domain) params.append('domain', filters.domain);
    if (filters.verification_status) params.append('verification_status', filters.verification_status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await fetchWithAuth(`/mentors?${params.toString()}`);
    return parseJsonResponse<Mentor[]>(response);
  },

  async getMentorById(id: string): Promise<Mentor> {
    const response = await fetchWithAuth(`/mentors/${id}`);
    return parseJsonResponse<Mentor>(response);
  },

  async getMentorProfile(): Promise<Mentor> {
    const response = await fetchWithAuth('/mentors/profile/me');
    return parseJsonResponse<Mentor>(response);
  },

  async updateMentorProfile(data: {
    bio?: string;
    domains?: string[];
    specialties?: string[];
    languages?: string[];
    achievements?: string[];
    photo_url?: string;
  }): Promise<Mentor> {
    const response = await fetchWithAuth('/mentors/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseJsonResponse<Mentor>(response);
  },

  async getMentorAnalytics(id: string): Promise<MentorAnalytics> {
    const response = await fetchWithAuth(`/mentors/${id}/analytics`);
    return parseJsonResponse<MentorAnalytics>(response);
  },
};

export default mentorsService;

