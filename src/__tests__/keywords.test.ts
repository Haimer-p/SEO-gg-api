import request from 'supertest';
import app from '../app';

describe('GET /api/keywords/research', () => {
  it('should return keyword results for a valid query', async () => {
    const res = await request(app)
      .get('/api/keywords/research')
      .query({ query: 'máy lọc nước', limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('máy lọc nước');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('should return keywords with required fields', async () => {
    const res = await request(app)
      .get('/api/keywords/research')
      .query({ query: 'seo', limit: 3 });

    const keyword = res.body.results[0];
    expect(keyword.keyword).toBeDefined();
    expect(typeof keyword.volume).toBe('number');
    expect(typeof keyword.difficulty).toBe('number');
    expect(typeof keyword.cpc).toBe('number');
    expect(['up', 'down', 'stable']).toContain(keyword.trend);
    expect(['commercial', 'informational', 'navigational', 'transactional']).toContain(keyword.intent);
  });

  it('should respect the limit parameter', async () => {
    const res = await request(app)
      .get('/api/keywords/research')
      .query({ query: 'fitness', limit: 3 });

    expect(res.body.results.length).toBeLessThanOrEqual(3);
  });

  it('should include SEO score formula', async () => {
    const res = await request(app)
      .get('/api/keywords/research')
      .query({ query: 'test' });

    expect(res.body.seoScore).toBeDefined();
    expect(res.body.seoScore.formula).toBeDefined();
  });

  it('should return 400 when query parameter is missing', async () => {
    const res = await request(app).get('/api/keywords/research');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('query');
  });
});
