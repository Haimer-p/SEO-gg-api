import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('POST /api/content/generate', () => {
  it('should generate content for a valid keyword', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini', intent: 'commercial', wordCount: 2500 });

    expect(res.status).toBe(200);
    expect(res.body.keyword).toBeDefined();
    expect(typeof res.body.title).toBe('string');
    expect(res.body.title.length).toBeGreaterThan(0);
  });

  it('should include SEO meta description', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini' });

    expect(typeof res.body.metaDescription).toBe('string');
    expect(res.body.metaDescription.length).toBeGreaterThan(0);
    expect(res.body.metaDescription.length).toBeLessThanOrEqual(160);
  });

  it('should return a structured outline', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini' });

    expect(Array.isArray(res.body.outline)).toBe(true);
    expect(res.body.outline.length).toBeGreaterThan(0);
    const firstHeading = res.body.outline[0];
    expect(firstHeading.level).toBeDefined();
    expect(firstHeading.text).toBeDefined();
  });

  it('should include NLP entities array', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini' });

    expect(Array.isArray(res.body.nlpEntities)).toBe(true);
    expect(res.body.nlpEntities.length).toBeGreaterThan(0);
  });

  it('should include FAQ schema', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini' });

    expect(Array.isArray(res.body.faqSchema)).toBe(true);
    if (res.body.faqSchema.length > 0) {
      expect(res.body.faqSchema[0].question).toBeDefined();
      expect(res.body.faqSchema[0].answer).toBeDefined();
    }
  });

  it('should include internal link suggestions', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({ keyword: 'máy lọc nước mini' });

    expect(Array.isArray(res.body.internalLinkSuggestions)).toBe(true);
  });

  it('should return 400 when keyword is missing', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('keyword');
  });
});
