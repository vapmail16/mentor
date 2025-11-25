import { fetchWithAuth, parseJsonResponse } from './http';
import type { AuthResponse, User } from './types';

const USER_STORAGE_KEY = 'mentor_user';

const persistUser = (user: User | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const buildAuthResponse = (user: User | null, error: Error | null = null): AuthResponse => ({
  user,
  session: user ? { user } : null,
  error,
});

export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: 'guest' | 'mentee' | 'mentor' | 'admin' = 'mentee',
    phone?: string,
    mentorProfileData?: {
      bio?: string;
      domains?: string[];
      specialties?: string[];
      languages?: string[];
      achievements?: string[];
    }
  ): Promise<AuthResponse> {
    try {
      const response = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          phone,
          mentorProfileData: role === 'mentor' ? mentorProfileData : undefined,
        }),
      });

      const result = await parseJsonResponse<{ user: User }>(response, 'Registration failed');

      const user = result.user ?? null;
      persistUser(user);

      if (user) {
        window.dispatchEvent(new CustomEvent('user-login', { detail: user }));
      }

      return buildAuthResponse(user, null);
    } catch (error) {
      return buildAuthResponse(null, error as Error);
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const result = await parseJsonResponse<{ user: User }>(response, 'Login failed');

      const user = result.user ?? null;
      persistUser(user);

      if (user) {
        window.dispatchEvent(new CustomEvent('user-login', { detail: user }));
      }

      return buildAuthResponse(user, null);
    } catch (error) {
      return buildAuthResponse(null, error as Error);
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      persistUser(null);
      window.dispatchEvent(new CustomEvent('user-logout'));
    }

    return { error: null };
  },

  async getSession(): Promise<AuthResponse> {
    try {
      const response = await fetchWithAuth('/auth/me');
      const result = await parseJsonResponse<User>(response, 'Failed to fetch session');

      const user = result ?? null;
      persistUser(user);

      return buildAuthResponse(user, null);
    } catch (error) {
      persistUser(null);
      return buildAuthResponse(null, error as Error);
    }
  },

  async getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
    const stored = readStoredUser();
    if (stored) {
      return { user: stored, error: null };
    }

    const session = await this.getSession();
    return { user: session.user, error: session.error };
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetchWithAuth('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      await parseJsonResponse(response, 'Password update failed');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async confirmEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await fetchWithAuth('/auth/confirm-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      const result = await parseJsonResponse<{ user: User }>(response, 'Email confirmation failed');

      const user = result.user ?? null;
      persistUser(user);

      if (user) {
        window.dispatchEvent(new CustomEvent('user-login', { detail: user }));
      }

      return buildAuthResponse(user, null);
    } catch (error) {
      return buildAuthResponse(null, error as Error);
    }
  },

  async resendEmailConfirmation(email: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetchWithAuth('/auth/resend-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      await parseJsonResponse(response, 'Failed to resend confirmation');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  onAuthStateChange(callback: (user: User | null, session: any) => void) {
    const handleChange = () => {
      const user = readStoredUser();
      callback(user, user ? { user } : null);
    };

    handleChange();
    const interval = setInterval(handleChange, 5000);

    const handleLogin = () => handleChange();
    const handleLogout = () => handleChange();

    window.addEventListener('user-login', handleLogin);
    window.addEventListener('user-logout', handleLogout);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            clearInterval(interval);
            window.removeEventListener('user-login', handleLogin);
            window.removeEventListener('user-logout', handleLogout);
          },
        },
      },
    };
  },
};

