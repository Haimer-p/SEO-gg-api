import request from 'supertest';
import app from '../app';

jest.setTimeout(10000);

describe('POST /api/audit', () => {
  it('should return an audit report for a valid URL', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://example.com');
    expect(typeof res.body.score).toBe('number');
    expect(res.body.score).toBeGreaterThanOrEqual(0);
    expect(res.body.score).toBeLessThanOrEqual(100);
    expect(res.body.grade).toBeDefined();
  });

  it('should include issues (critical, warnings, passed)', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com' });

    expect(res.body.issues).toBeDefined();
    expect(Array.isArray(res.body.issues.critical)).toBe(true);
    expect(Array.isArray(res.body.issues.warnings)).toBe(true);
    expect(Array.isArray(res.body.issues.passed)).toBe(true);
  });

  it('should include page metrics', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com' });

    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.pageSpeed).toBe('number');
    expect(typeof res.body.metrics.mobileFriendly).toBe('number');
    expect(res.body.metrics.coreWebVitals).toBeDefined();
  });

  it('should include recommendations array', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com' });

    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it('should return 400 when url is missing', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('url');
  });

  it('should include a scannedAt timestamp', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ url: 'https://example.com' });

    expect(res.body.scannedAt).toBeDefined();
    expect(() => new Date(res.body.scannedAt)).not.toThrow();
  });
});
