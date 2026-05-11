export interface TopKeyword {
  keyword: string;
  position: number;
  volume: number;
}

export interface TopPage {
  url: string;
  traffic: number;
  keywords: number;
}

export interface CompetitorAnalysis {
  estimatedTraffic: number;
  trafficTrend: string;
  domainRating: number;
  totalKeywords: number;
  topKeywords: TopKeyword[];
  contentStrategy: string;
  topPages: TopPage[];
  contentGaps: string[];
  aiInsight: string;
}

export interface CompetitorsResponse {
  domain: string;
  analysis: CompetitorAnalysis;
}

export function getCompetitorsMock(domain: string): CompetitorsResponse {
  return {
    domain,
    analysis: {
      estimatedTraffic: 145000,
      trafficTrend: '+23% last 3 months',
      domainRating: 52,
      totalKeywords: 3240,
      topKeywords: [
        { keyword: 'máy lọc nước', position: 3, volume: 8100 },
        { keyword: 'máy lọc nước mini', position: 1, volume: 6600 },
      ],
      contentStrategy: 'Họ có 120 bài cluster về chủ đề máy lọc nước',
      topPages: [
        { url: '/may-loc-nuoc-mini', traffic: 12000, keywords: 45 },
        { url: '/may-loc-nuoc-ro', traffic: 8500, keywords: 32 },
      ],
      contentGaps: [
        'máy lọc nước mini văn phòng',
        'máy lọc nước du lịch',
        'so sánh máy lọc nước',
      ],
      aiInsight:
        'Đối thủ tăng traffic chủ yếu nhờ 120 bài cluster về X. Bạn cần tạo ít nhất 80 bài tương tự.',
    },
  };
}
