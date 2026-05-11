import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('GET /api/crawler/scan', () => {
  it('should return crawl results for a valid URL', async () => {
    const res = await request(app)
      .get('/api/crawler/scan')
      .query({ url: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com');
    expect(Array.isArray(res.body.pages)).toBe(true);
  });

  it('should return page objects with SEO fields', async () => {
    const res = await request(app)
      .get('/api/crawler/scan')
      .query({ url: 'https://example.com' });

    const page = res.body.pages[0];
    expect(page.url).toBeDefined();
    expect(page.title).toBeDefined();
    expect(typeof page.wordCount).toBe('number');
    expect(typeof page.internalLinks).toBe('number');
  });

  it('should include crawl summary', async () => {
    const res = await request(app)
      .get('/api/crawler/scan')
      .query({ url: 'https://example.com' });

    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.totalPages).toBe('number');
    expect(typeof res.body.summary.totalIssues).toBe('number');
    expect(typeof res.body.summary.avgLoadTime).toBe('number');
  });

  it('should return 400 when url is missing', async () => {
    const res = await request(app).get('/api/crawler/scan');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('url');
  });
});
