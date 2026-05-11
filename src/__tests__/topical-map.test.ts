import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('POST /api/topical-map/generate', () => {
  it('should generate a topical map for a niche', async () => {
    const res = await request(app)
      .post('/api/topical-map/generate')
      .send({ niche: 'fitness' });

    expect(res.status).toBe(200);
    expect(res.body.niche).toBe('fitness');
    expect(Array.isArray(res.body.pillarPages)).toBe(true);
    expect(res.body.pillarPages.length).toBeGreaterThan(0);
  });

  it('should include cluster articles under each pillar', async () => {
    const res = await request(app)
      .post('/api/topical-map/generate')
      .send({ niche: 'fitness' });

    const pillar = res.body.pillarPages[0];
    expect(pillar.title).toBeDefined();
    expect(Array.isArray(pillar.clusterArticles)).toBe(true);
    expect(pillar.clusterArticles.length).toBeGreaterThan(0);
  });

  it('should return cluster articles with status field', async () => {
    const res = await request(app)
      .post('/api/topical-map/generate')
      .send({ niche: 'fitness' });

    const article = res.body.pillarPages[0].clusterArticles[0];
    expect(article.title).toBeDefined();
    expect(article.url).toBeDefined();
    expect(['exists', 'missing', 'draft']).toContain(article.status);
  });

  it('should include coverage statistics', async () => {
    const res = await request(app)
      .post('/api/topical-map/generate')
      .send({ niche: 'fitness' });

    expect(typeof res.body.totalArticlesNeeded).toBe('number');
    expect(typeof res.body.totalArticlesExisting).toBe('number');
    expect(typeof res.body.coveragePercent).toBe('number');
    expect(res.body.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(res.body.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('should return 400 when niche is missing', async () => {
    const res = await request(app)
      .post('/api/topical-map/generate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('niche');
  });
});
