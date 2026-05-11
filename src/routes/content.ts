import { Router, Request, Response } from 'express';
import { getContentMock } from '../mock-data/content.mock';
import { generateSEOContent } from '../lib/gemini';
import { query } from '../lib/db';

const router = Router();

interface ContentRequestBody {
  keyword: string;
  intent?: string;
  wordCount?: number;
  language?: 'vi' | 'en';
}

interface ContentHistoryRow {
  id: string;
  keyword: string;
  title: string;
  language: string;
  created_at: string;
}

router.post('/generate', async (req: Request<object, object, ContentRequestBody>, res: Response) => {
  const { keyword, wordCount, intent, language } = req.body;

  if (!keyword) {
    res.status(400).json({ error: 'keyword is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  let parsed: Record<string, unknown>;

  try {
    const geminiResult = await generateSEOContent({
      keyword,
      intent: intent || 'commercial',
      wordCount: wordCount || 2500,
      language: language || 'vi',
    });
    const cleaned = geminiResult.replace(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const mock = getContentMock(keyword, wordCount);
    parsed = mock as unknown as Record<string, unknown>;
  }

  const title = typeof parsed['title'] === 'string' ? parsed['title'] : '';
  const content = typeof parsed['content'] === 'string' ? parsed['content'] : '';
  const meta = typeof parsed['metaDescription'] === 'string' ? parsed['metaDescription'] : '';
  const lang = language || 'vi';

  // Save to DB
  try {
    await query(
      `INSERT INTO generated_content (user_id, keyword, title, content, meta, language)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, keyword, title, content, meta, lang]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  res.json({ keyword, ...parsed });
});

router.get('/history', async (req: Request, res: Response) => {
  const limit = parseInt(req.query['limit'] as string) || 10;

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.query['userId'] as string) ||
    'guest';

  try {
    const rows = await query<ContentHistoryRow>(
      `SELECT id, keyword, title, language, created_at
       FROM generated_content
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    res.json({ history: rows });
  } catch {
    res.json({ history: [] });
  }
});

export default router;
