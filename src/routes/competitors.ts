import { Router, Request, Response } from 'express';
import { getCompetitorsMock, CompetitorAnalysis } from '../mock-data/competitors.mock';
import { query } from '../lib/db';

const router = Router();

interface CompetitorsRequestBody {
  domain: string;
}

interface AnalysisRow {
  analysis: CompetitorAnalysis;
}

router.post('/analyze', async (req: Request<object, object, CompetitorsRequestBody>, res: Response) => {
  const { domain } = req.body;

  if (!domain) {
    res.status(400).json({ error: 'domain is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  // Check cache (6 hours)
  try {
    const cached = await query<AnalysisRow>(
      `SELECT analysis FROM competitors_analysis
       WHERE user_id = $1 AND domain = $2
         AND created_at > NOW() - INTERVAL '6 hours'
       LIMIT 1`,
      [userId, domain]
    );
    if (cached.length > 0 && cached[0].analysis) {
      res.json({ domain, analysis: cached[0].analysis, cached: true });
      return;
    }
  } catch {
    // DB not available, continue
  }

  const data = getCompetitorsMock(domain);

  // Save to DB
  try {
    await query(
      `INSERT INTO competitors_analysis (user_id, domain, analysis) VALUES ($1, $2, $3)`,
      [userId, domain, JSON.stringify(data.analysis)]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  res.json(data);
});

export default router;
