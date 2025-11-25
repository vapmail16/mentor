import { fetchWithAuth, parseJsonResponse } from './http';
import { CreateOrderResponse } from './types';

export interface CreateOrderRequest {
  plan_type: 'monthly' | 'annual' | 'student' | 'corporate';
  amount: number;
}

class PaymentService {
  /**
   * Create a payment order for subscription
   */
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await fetchWithAuth('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseJsonResponse<CreateOrderResponse>(response);
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const response = await fetchWithAuth('/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        payment_id: paymentId,
        signature,
      }),
    });
    const result = await parseJsonResponse<{ verified: boolean }>(response);
    return result.verified;
  }
}

export default new PaymentService();

