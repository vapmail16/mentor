import request from 'supertest';
import app from './helpers/testServer.js';

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

