import request from 'supertest';
import app from '../../server.js';

describe('Health Check Integration Tests', () => {
  it('should return health status with database connection', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(['connected', 'disconnected']).toContain(res.body.database);
  });
});

