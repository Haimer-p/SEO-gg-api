import { Router, Request, Response } from 'express';
import { getKeywordsMock, KeywordResult } from '../mock-data/keywords.mock';
import { analyzeKeywords } from '../lib/gemini';
import { query } from '../lib/db';

const router = Router();

interface KeywordResultRow {
  results: KeywordResult[];
}

router.get('/research', async (req: Request, res: Response) => {
  const queryParam = req.query['query'] as string;
  const limit = parseInt(req.query['limit'] as string) || 5;

  if (!queryParam) {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.query['userId'] as string) ||
    'guest';

  // Check cache first
  try {
    const cached = await query<KeywordResultRow>(
      `SELECT results FROM keyword_results
       WHERE user_id = $1 AND query = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [userId, queryParam]
    );
    if (cached.length > 0 && cached[0].results) {
      const results = cached[0].results;
      const topOpportunity = results[0]?.keyword ?? '';
      res.json({ results, query: queryParam, total: results.length, seoScore: { topOpportunity }, cached: true });
      return;
    }
  } catch {
    // DB not available, continue to generate
  }

  // Generate from Gemini
  let results: KeywordResult[];
  try {
    const geminiResult = await analyzeKeywords(queryParam);
    const cleaned = geminiResult.replace(/```json\n?|\n?```/g, '').trim();
    results = JSON.parse(cleaned) as KeywordResult[];
    if (!Array.isArray(results)) throw new Error('Expected array');
    results = results.slice(0, limit);
  } catch {
    results = getKeywordsMock(queryParam, limit).results;
  }

  // Save to DB (ignore FK errors for guest)
  try {
    await query(
      `INSERT INTO keyword_results (user_id, query, results) VALUES ($1, $2, $3)`,
      [userId, queryParam, JSON.stringify(results)]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  const topOpportunity = results[0]?.keyword ?? '';
  res.json({ results, query: queryParam, total: results.length, seoScore: { topOpportunity } });
});

export default router;
