import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../helpers/testServer.js';

describe('System Tests - API Endpoints', () => {
  describe('Health Endpoint', () => {
    it('should respond to health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('API Routes Availability', () => {
    it('should have auth routes', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test', password: 'test' });

      // Should get validation error, not 404
      expect(res.status).not.toBe(404);
    });

    it('should have mentors routes', async () => {
      const res = await request(app).get('/api/mentors');
      expect(res.status).not.toBe(404);
    });

    it('should have sessions routes', async () => {
      const res = await request(app).get('/api/sessions');
      expect(res.status).not.toBe(404);
    });

    it('should have payments routes', async () => {
      const res = await request(app)
        .post('/api/payments/create-order');
      // Should require auth, not 404
      expect(res.status).not.toBe(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173');

      // Check for CORS headers
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

