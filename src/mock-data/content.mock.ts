export interface OutlineItem {
  level: 'H1' | 'H2' | 'H3' | 'H4';
  text: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContentResponse {
  keyword: string;
  title: string;
  metaDescription: string;
  outline: OutlineItem[];
  wordCount: number;
  readingTime: string;
  nlpEntities: string[];
  internalLinkSuggestions: string[];
  faqSchema: FaqItem[];
}

export function getContentMock(keyword: string, wordCount = 2500): ContentResponse {
  const readingMinutes = Math.ceil(wordCount / 250);

  return {
    keyword,
    title: `Top 10 Máy Lọc Nước Mini Tốt Nhất 2026 – Review Chi Tiết`,
    metaDescription:
      'So sánh top 10 máy lọc nước mini tốt nhất 2026. Đánh giá chi tiết ưu nhược điểm, giá bán và hướng dẫn chọn mua phù hợp.',
    outline: [
      { level: 'H1', text: 'Top 10 Máy Lọc Nước Mini Tốt Nhất 2026' },
      { level: 'H2', text: 'Tại Sao Nên Dùng Máy Lọc Nước Mini?' },
      { level: 'H2', text: 'Tiêu Chí Đánh Giá Máy Lọc Nước Mini' },
      { level: 'H2', text: 'Top 10 Máy Lọc Nước Mini Tốt Nhất' },
      { level: 'H3', text: '1. Máy Lọc Nước Mini ABC – Tốt Nhất Cho Gia Đình Nhỏ' },
      { level: 'H2', text: 'Bảng So Sánh Các Loại Máy Lọc Nước Mini' },
      { level: 'H2', text: 'Hướng Dẫn Chọn Mua Máy Lọc Nước Mini' },
      { level: 'H2', text: 'FAQ – Câu Hỏi Thường Gặp' },
    ],
    wordCount,
    readingTime: `${readingMinutes} phút`,
    nlpEntities: ['máy lọc nước', 'RO', 'UF', 'nano silver', 'chất lượng nước', 'tiết kiệm điện'],
    internalLinkSuggestions: [
      'https://example.com/may-loc-nuoc-ro',
      'https://example.com/cach-chon-may-loc-nuoc',
    ],
    faqSchema: [
      {
        question: 'Máy lọc nước mini có lọc được vi khuẩn không?',
        answer:
          'Có, các máy lọc nước mini hiện đại sử dụng màng lọc RO hoặc UF có thể loại bỏ 99.9% vi khuẩn...',
      },
      {
        question: 'Bao lâu thì thay lõi lọc?',
        answer:
          'Thông thường 6-12 tháng một lần tùy thuộc vào lưu lượng sử dụng...',
      },
    ],
  };
}
