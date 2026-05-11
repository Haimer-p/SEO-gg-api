export interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  intent: 'commercial' | 'informational' | 'transactional' | 'navigational';
}

export interface KeywordsResponse {
  query: string;
  results: KeywordResult[];
  seoScore: {
    formula: string;
    topOpportunity: string;
  };
}

const keywordPool: KeywordResult[] = [
  { keyword: 'máy lọc nước mini', volume: 8100, difficulty: 32, cpc: 1.2, trend: 'up', intent: 'commercial' },
  { keyword: 'máy lọc nước gia đình', volume: 6600, difficulty: 45, cpc: 1.8, trend: 'stable', intent: 'commercial' },
  { keyword: 'máy lọc nước có tốt không', volume: 2400, difficulty: 18, cpc: 0.5, trend: 'up', intent: 'informational' },
  { keyword: 'cách chọn máy lọc nước', volume: 1900, difficulty: 15, cpc: 0.4, trend: 'up', intent: 'informational' },
  { keyword: 'máy lọc nước RO', volume: 5400, difficulty: 38, cpc: 2.1, trend: 'stable', intent: 'commercial' },
  { keyword: 'máy lọc nước loại nào tốt', volume: 3200, difficulty: 28, cpc: 0.9, trend: 'up', intent: 'commercial' },
  { keyword: 'giá máy lọc nước', volume: 4500, difficulty: 42, cpc: 1.5, trend: 'stable', intent: 'transactional' },
  { keyword: 'mua máy lọc nước', volume: 2900, difficulty: 35, cpc: 2.3, trend: 'up', intent: 'transactional' },
  { keyword: 'máy lọc nước inox', volume: 1600, difficulty: 22, cpc: 0.7, trend: 'stable', intent: 'commercial' },
  { keyword: 'lõi lọc nước', volume: 3800, difficulty: 30, cpc: 1.1, trend: 'up', intent: 'commercial' },
];

export function getKeywordsMock(query: string, limit = 5): KeywordsResponse {
  const results = keywordPool.slice(0, Math.min(limit, keywordPool.length));
  const topOpportunity = results.reduce((best, kw) =>
    (kw.volume / kw.difficulty) > (best.volume / best.difficulty) ? kw : best
  );

  return {
    query,
    results,
    seoScore: {
      formula: '(volume × ctrPotential) ÷ difficulty',
      topOpportunity: topOpportunity.keyword,
    },
  };
}
