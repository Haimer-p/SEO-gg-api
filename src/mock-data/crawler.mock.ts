export interface CrawledPage {
  url: string;
  title: string;
  h1: string;
  metaDescription: string;
  issues: string[];
  wordCount: number;
  internalLinks: number;
  images: number;
  imagesWithAlt: number;
}

export interface CrawlerSummary {
  totalPages: number;
  totalIssues: number;
  avgLoadTime: number;
}

export interface CrawlerResponse {
  url: string;
  pages: CrawledPage[];
  summary: CrawlerSummary;
}

export function getCrawlerMock(url: string): CrawlerResponse {
  return {
    url,
    pages: [
      {
        url: '/',
        title: 'Trang Chủ | Example',
        h1: 'Welcome to Example',
        metaDescription: 'Example website description',
        issues: ['missing_schema', 'slow_speed'],
        wordCount: 450,
        internalLinks: 12,
        images: 8,
        imagesWithAlt: 5,
      },
      {
        url: '/may-loc-nuoc-mini',
        title: 'Máy Lọc Nước Mini | Example',
        h1: 'Top Máy Lọc Nước Mini',
        metaDescription: 'Hướng dẫn chọn máy lọc nước mini tốt nhất',
        issues: ['missing_alt'],
        wordCount: 2100,
        internalLinks: 8,
        images: 15,
        imagesWithAlt: 10,
      },
      {
        url: '/may-loc-nuoc-ro',
        title: 'Máy Lọc Nước RO | Example',
        h1: 'Máy Lọc Nước RO Công Nghệ Mới',
        metaDescription: 'Tìm hiểu về công nghệ lọc nước RO',
        issues: [],
        wordCount: 1800,
        internalLinks: 6,
        images: 10,
        imagesWithAlt: 10,
      },
    ],
    summary: {
      totalPages: 48,
      totalIssues: 134,
      avgLoadTime: 3.8,
    },
  };
}
