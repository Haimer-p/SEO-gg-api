/**
 * Open PageRank API — free tier: 100 requests/day
 * Register for a free key at: https://www.domainiq.com/openpagerank
 * Set env var: OPR_API_KEY=your-key
 */

const OPR_API_KEY = process.env['OPR_API_KEY'] || '';
const OPR_BASE = 'https://openpagerank.com/api/v1.0/getPageRank';

export interface OPRResult {
  domain: string;
  pageRankDecimal: number;   // 0–10 float
  pageRank: number;          // 0–10 integer
  rank: number | null;       // global Alexa-style rank
}

export async function getPageRank(domains: string[]): Promise<OPRResult[]> {
  if (!OPR_API_KEY) {
    throw new Error('OPR_API_KEY not configured');
  }

  const params = domains.map((d) => `domains[]=${encodeURIComponent(d)}`).join('&');
  const url = `${OPR_BASE}?${params}`;

  const res = await fetch(url, {
    headers: { 'API-OPR': OPR_API_KEY },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`OPR API error: ${res.status}`);
  }

  const json = await res.json() as {
    response: Array<{
      domain: string;
      page_rank_decimal: number;
      page_rank_integer: number;
      rank: string | null;
    }>;
  };

  return json.response.map((item) => ({
    domain: item.domain,
    pageRankDecimal: item.page_rank_decimal ?? 0,
    pageRank: item.page_rank_integer ?? 0,
    rank: item.rank ? parseInt(item.rank, 10) : null,
  }));
}

/**
 * Convert Open PageRank score (0–10) to a Domain Rating (0–100) estimate.
 * OPR and Ahrefs DR are not the same scale — this is a rough mapping.
 */
export function oprToDR(opr: number): number {
  // OPR 0–10 → DR 0–100 (exponential-ish mapping)
  const mapping: Record<number, number> = {
    0: 0, 1: 5, 2: 12, 3: 22, 4: 33,
    5: 45, 6: 57, 7: 68, 8: 78, 9: 88, 10: 95,
  };
  const floor = Math.floor(opr);
  const ceil = Math.min(10, floor + 1);
  const frac = opr - floor;
  const drFloor = mapping[floor] ?? 0;
  const drCeil = mapping[ceil] ?? 100;
  return Math.round(drFloor + (drCeil - drFloor) * frac);
}
