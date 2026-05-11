import request from 'supertest';
import app from '../app';

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should include a valid ISO timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('GET /api/unknown-route', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });
});
