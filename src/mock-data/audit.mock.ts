export interface AuditIssue {
  type: string;
  message: string;
  page?: string;
  count?: number;
  value?: number;
}

export interface AuditPassedItem {
  type: string;
  message: string;
}

export interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
}

export interface AuditMetrics {
  pageSpeed: number;
  mobileFriendly: number;
  coreWebVitals: CoreWebVitals;
  totalPages: number;
  indexedPages: number;
  brokenLinks: number;
}

export interface AuditResponse {
  url: string;
  score: number;
  grade: string;
  scannedAt: string;
  issues: {
    critical: AuditIssue[];
    warnings: AuditIssue[];
    passed: AuditPassedItem[];
  };
  metrics: AuditMetrics;
  recommendations: string[];
}

export function getAuditMock(url: string): AuditResponse {
  return {
    url,
    score: 72,
    grade: 'C+',
    scannedAt: new Date().toISOString(),
    issues: {
      critical: [
        { type: 'missing_h1', message: 'Trang chủ thiếu thẻ H1', page: '/' },
        { type: 'duplicate_title', message: '24 trang có title trùng nhau', count: 24 },
      ],
      warnings: [
        { type: 'missing_alt', message: '38 ảnh thiếu thẻ alt', count: 38 },
        { type: 'slow_page', message: 'Tốc độ tải trang: 4.2s (nên < 2s)', value: 4.2 },
        { type: 'missing_schema', message: 'Thiếu Schema markup', page: '/' },
      ],
      passed: [
        { type: 'canonical', message: 'Canonical URL được cấu hình đúng' },
        { type: 'robots', message: 'robots.txt hợp lệ' },
        { type: 'sitemap', message: 'Sitemap XML tồn tại' },
      ],
    },
    metrics: {
      pageSpeed: 42,
      mobileFriendly: 78,
      coreWebVitals: { lcp: 3.8, fid: 120, cls: 0.15 },
      totalPages: 48,
      indexedPages: 41,
      brokenLinks: 7,
    },
    recommendations: [
      'Thêm H1 cho trang chủ',
      'Tối ưu ảnh để giảm dung lượng',
      'Thêm schema Article cho các bài blog',
      'Cải thiện tốc độ trang (dưới 2 giây)',
    ],
  };
}
