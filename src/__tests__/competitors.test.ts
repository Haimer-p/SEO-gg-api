import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('POST /api/competitors/analyze', () => {
  it('should return competitor analysis for a domain', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({ domain: 'competitor.com' });

    expect(res.status).toBe(200);
    expect(res.body.domain).toBe('competitor.com');
    expect(res.body.analysis).toBeDefined();
  });

  it('should include traffic and domain metrics', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({ domain: 'competitor.com' });

    const { analysis } = res.body;
    expect(typeof analysis.estimatedTraffic).toBe('number');
    expect(typeof analysis.domainRating).toBe('number');
    expect(analysis.domainRating).toBeGreaterThanOrEqual(0);
    expect(analysis.domainRating).toBeLessThanOrEqual(100);
  });

  it('should include top keywords', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({ domain: 'competitor.com' });

    expect(Array.isArray(res.body.analysis.topKeywords)).toBe(true);
    expect(res.body.analysis.topKeywords.length).toBeGreaterThan(0);
    const kw = res.body.analysis.topKeywords[0];
    expect(kw.keyword).toBeDefined();
    expect(typeof kw.position).toBe('number');
  });

  it('should include content gaps', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({ domain: 'competitor.com' });

    expect(Array.isArray(res.body.analysis.contentGaps)).toBe(true);
  });

  it('should include AI insight string', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({ domain: 'competitor.com' });

    expect(typeof res.body.analysis.aiInsight).toBe('string');
    expect(res.body.analysis.aiInsight.length).toBeGreaterThan(0);
  });

  it('should return 400 when domain is missing', async () => {
    const res = await request(app)
      .post('/api/competitors/analyze')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('domain');
  });
});
