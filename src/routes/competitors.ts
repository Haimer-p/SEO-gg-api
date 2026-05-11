import { Router, Request, Response } from 'express';
import { getCompetitorsMock, CompetitorAnalysis } from '../mock-data/competitors.mock';
import { analyzeCompetitor } from '../lib/gemini';
import { getPageRank, oprToDR } from '../lib/openPageRank';
import { query } from '../lib/db';

const router = Router();

interface CompetitorsRequestBody {
  domain: string;
}

interface AnalysisRow {
  analysis: CompetitorAnalysis;
  data_source?: string;
}

// Clean domain string (strip protocol, www, trailing slash)
function cleanDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase();
}

// Parse JSON returned by Gemini (strips markdown code fences if present)
function parseGeminiJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

router.post('/analyze', async (req: Request<object, object, CompetitorsRequestBody>, res: Response) => {
  const { domain: rawDomain } = req.body;

  if (!rawDomain) {
    res.status(400).json({ error: 'domain is required' });
    return;
  }

  const domain = cleanDomain(rawDomain);

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  // ── 1. Check DB cache (6 hours) ────────────────────────────────────────────
  try {
    const cached = await query<AnalysisRow>(
      `SELECT analysis, data_source FROM competitors_analysis
       WHERE user_id = $1 AND domain = $2
         AND created_at > NOW() - INTERVAL '6 hours'
       ORDER BY created_at DESC LIMIT 1`,
      [userId, domain]
    );
    if (cached.length > 0 && cached[0].analysis) {
      res.json({
        domain,
        analysis: cached[0].analysis,
        cached: true,
        dataSource: cached[0].data_source ?? 'cache',
      });
      return;
    }
  } catch {
    // DB unavailable — proceed
  }

  let analysis: CompetitorAnalysis;
  let dataSource = 'mock';

  // ── 2. Try Gemini AI (Hướng 1) ─────────────────────────────────────────────
  let geminiAnalysis: CompetitorAnalysis | null = null;
  try {
    const raw = await analyzeCompetitor(domain);
    geminiAnalysis = parseGeminiJSON<CompetitorAnalysis>(raw);
    analysis = geminiAnalysis;
    dataSource = 'gemini';
    console.log(`[competitors] Gemini analysis for ${domain} OK`);
  } catch (err) {
    console.warn(`[competitors] Gemini failed for ${domain}:`, (err as Error).message);
    analysis = getCompetitorsMock(domain).analysis;
    dataSource = 'mock';
  }

  // ── 3. Enrich DR with Open PageRank (Hướng 3) ──────────────────────────────
  const OPR_KEY = process.env['OPR_API_KEY'];
  if (OPR_KEY) {
    try {
      const oprResults = await getPageRank([domain]);
      if (oprResults.length > 0) {
        const real = oprResults[0];
        analysis = {
          ...analysis,
          domainRating: oprToDR(real.pageRankDecimal),
        };
        dataSource = geminiAnalysis ? 'gemini+opr' : 'mock+opr';
        console.log(`[competitors] OPR for ${domain}: PR=${real.pageRankDecimal} → DR≈${analysis.domainRating}`);
      }
    } catch (err) {
      console.warn(`[competitors] OPR failed for ${domain}:`, (err as Error).message);
    }
  }

  // ── 4. Persist to DB ───────────────────────────────────────────────────────
  try {
    await query(
      `INSERT INTO competitors_analysis (user_id, domain, analysis, data_source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [userId, domain, JSON.stringify(analysis), dataSource]
    );
  } catch {
    // Ignore FK / duplicate errors
  }

  res.json({ domain, analysis, dataSource });
});

// GET /api/competitors/history — last 10 analyzed domains for this user
router.get('/history', async (req: Request, res: Response) => {
  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.query['userId'] as string) ||
    'guest';

  try {
    const rows = await query<{ domain: string; data_source: string; created_at: string }>(
      `SELECT domain, data_source, created_at
       FROM competitors_analysis
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    res.json({ history: rows });
  } catch {
    res.json({ history: [] });
  }
});

export default router;
