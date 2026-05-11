import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('POST /api/internal-links/analyze', () => {
  it('should return internal link suggestions', async () => {
    const res = await request(app)
      .post('/api/internal-links/analyze')
      .send({ siteUrl: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body.siteUrl).toBe('https://example.com');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('should return suggestions with required fields', async () => {
    const res = await request(app)
      .post('/api/internal-links/analyze')
      .send({ siteUrl: 'https://example.com' });

    const suggestion = res.body.suggestions[0];
    expect(suggestion.sourcePage).toBeDefined();
    expect(suggestion.targetPage).toBeDefined();
    expect(typeof suggestion.anchorText).toBe('string');
    expect(typeof suggestion.relevanceScore).toBe('number');
    expect(suggestion.relevanceScore).toBeGreaterThanOrEqual(0);
    expect(suggestion.relevanceScore).toBeLessThanOrEqual(1);
    expect(typeof suggestion.reason).toBe('string');
  });

  it('should return orphan pages array', async () => {
    const res = await request(app)
      .post('/api/internal-links/analyze')
      .send({ siteUrl: 'https://example.com' });

    expect(Array.isArray(res.body.orphanPages)).toBe(true);
  });

  it('should return top linked pages', async () => {
    const res = await request(app)
      .post('/api/internal-links/analyze')
      .send({ siteUrl: 'https://example.com' });

    expect(Array.isArray(res.body.topLinkedPages)).toBe(true);
  });

  it('should return 400 when siteUrl is missing', async () => {
    const res = await request(app)
      .post('/api/internal-links/analyze')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('siteUrl');
  });
});
