export interface User {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'guest' | 'mentee' | 'mentor' | 'admin';
  emailConfirmed: boolean;
  subscriptionStatus: 'inactive' | 'active' | 'expired' | 'cancelled';
  createdAt: string;
}

export interface AuthResponse {
  user: User | null;
  session: { user: User } | null;
  error: Error | null;
}

export interface Subscription {
  id: string;
  userId: string;
  planType: 'monthly' | 'annual' | 'student' | 'corporate';
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentVerified: boolean;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentSessionId: string;
  subscriptionId?: string;
}

