import request from 'supertest';
import app from '../app';

describe('GET /api/ranking/predict', () => {
  it('should return rank prediction for a keyword', async () => {
    const res = await request(app)
      .get('/api/ranking/predict')
      .query({ keyword: 'máy pha cafe' });

    expect(res.status).toBe(200);
    expect(res.body.keyword).toBe('máy pha cafe');
    expect(typeof res.body.rankProbability).toBe('number');
    expect(res.body.rankProbability).toBeGreaterThanOrEqual(0);
    expect(res.body.rankProbability).toBeLessThanOrEqual(100);
    expect(res.body.needed).toBeDefined();
    expect(res.body.needed.backlinks).toBeDefined();
  });

  it('should return 400 when keyword is missing', async () => {
    const res = await request(app).get('/api/ranking/predict');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('keyword');
  });
});
