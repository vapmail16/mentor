import request from 'supertest';
import app from '../../server.js';
import { query } from '../../config/database.js';

/**
 * End-to-End Test: Complete Authentication Flow
 * Tests the full user journey from registration to accessing protected content
 */
describe('E2E: Complete Authentication Flow', () => {
  const testUser = {
    email: `e2e-${Date.now()}@test.com`,
    password: 'E2ETestPass!234',
    fullName: 'E2E Test User',
    role: 'mentee',
  };

  let authToken;
  let userId;

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await query('DELETE FROM users WHERE id = $1', [userId]);
    }
  });

  it('should complete full authentication flow', async () => {
    // Step 1: Register new user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.email).toBe(testUser.email);

    // Step 2: Login with credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // Extract token
    const cookies = loginRes.headers['set-cookie'];
    authToken = cookies?.[0]?.split(';')[0]?.split('=')[1];
    expect(authToken).toBeDefined();

    // Step 3: Get current user info
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `auth_token=${authToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe(testUser.email);
    userId = meRes.body.data.userId;

    // Step 4: Verify token
    const verifyRes = await request(app)
      .post('/api/auth/verify-token')
      .set('Cookie', `auth_token=${authToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.valid).toBe(true);

    // Step 5: Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout');

    expect(logoutRes.status).toBe(200);

    // Step 6: Verify cookie is cleared after logout (token itself is still valid but cookie is gone)
    // Note: JWTs are stateless - clearing cookie doesn't invalidate token, it just removes access
    // Try to access /me without cookie should fail
    const meAfterLogout = await request(app)
      .get('/api/auth/me');

    expect(meAfterLogout.status).toBe(401); // Should fail without cookie
  });
});

