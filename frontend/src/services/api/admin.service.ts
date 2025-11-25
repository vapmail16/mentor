import { fetchWithAuth, parseJsonResponse } from './http';

export interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  activeMentors: number;
  activeSubscriptions: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'guest' | 'mentee' | 'mentor' | 'admin';
  phone: string | null;
  email_confirmed: boolean;
  subscription_status: 'inactive' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  last_login_at: string | null;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_verified: boolean;
  started_at: string;
  expires_at: string;
  created_at: string;
}

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await fetchWithAuth('/admin/stats');
    return await parseJsonResponse<AdminStats>(response);
  }

  /**
   * Get all users with filters and pagination
   */
  async getUsers(params?: {
    search?: string;
    role?: string;
    subscription_status?: string;
    email_confirmed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: AdminUser[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.subscription_status) queryParams.append('subscription_status', params.subscription_status);
    if (params?.email_confirmed !== undefined) queryParams.append('email_confirmed', params.email_confirmed.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const response = await fetchWithAuth(`/admin/users${queryString ? `?${queryString}` : ''}`);
    return await parseJsonResponse<{ users: AdminUser[]; total: number; limit: number; offset: number }>(response);
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, updates: {
    role?: string;
    subscription_status?: string;
    email_confirmed?: boolean;
  }): Promise<AdminUser> {
    const response = await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return await parseJsonResponse<AdminUser>(response);
  }

  /**
   * Get all subscriptions with filters
   */
  async getSubscriptions(params?: {
    status?: string;
    plan_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ subscriptions: AdminSubscription[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.plan_type) queryParams.append('plan_type', params.plan_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const response = await fetchWithAuth(`/admin/subscriptions${queryString ? `?${queryString}` : ''}`);
    return await parseJsonResponse<{ subscriptions: AdminSubscription[]; total: number; limit: number; offset: number }>(response);
  }

  /**
   * Update session publish status (admin only)
   */
  async updateSession(sessionId: string, updates: {
    is_published?: boolean;
    title?: string;
    description?: string;
  }): Promise<any> {
    const response = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return await parseJsonResponse<any>(response);
  }

  /**
   * Delete session (admin only)
   */
  async deleteSession(sessionId: string): Promise<void> {
    await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update mentor verification status (admin only)
   */
  async updateMentorVerification(mentorId: string, verification_status: 'pending' | 'verified' | 'rejected'): Promise<any> {
    const response = await fetchWithAuth(`/mentors/${mentorId}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ verification_status }),
    });
    return await parseJsonResponse<any>(response);
  }
}

export default new AdminService();

