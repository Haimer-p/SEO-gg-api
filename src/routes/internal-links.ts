import { Router, Request, Response } from 'express';
import { query } from '../lib/db';

const router = Router();

interface InternalLinksRequestBody {
  siteUrl: string;
}

interface LinkSuggestion {
  sourcePage: string;
  targetPage: string;
  anchorText: string;
  relevanceScore: number;
  reason: string;
}

interface InternalLinksResponse {
  siteUrl: string;
  suggestions: LinkSuggestion[];
  orphanPages: string[];
  topLinkedPages: string[];
}

interface CacheRow {
  suggestions: LinkSuggestion[];
  orphan_pages: string[];
}

function getInternalLinksMock(siteUrl: string): InternalLinksResponse {
  return {
    siteUrl,
    suggestions: [
      {
        sourcePage: '/may-loc-nuoc-mini',
        targetPage: '/cach-chon-may-loc-nuoc',
        anchorText: 'cách chọn máy lọc nước phù hợp',
        relevanceScore: 0.92,
        reason: 'Cùng cluster chủ đề máy lọc nước',
      },
      {
        sourcePage: '/may-loc-nuoc-ro',
        targetPage: '/may-loc-nuoc-mini',
        anchorText: 'máy lọc nước mini giá rẻ',
        relevanceScore: 0.87,
        reason: 'Commercial intent overlap',
      },
      {
        sourcePage: '/blog/loi-loc-nuoc',
        targetPage: '/may-loc-nuoc-ro',
        anchorText: 'máy lọc nước RO công nghệ cao',
        relevanceScore: 0.81,
        reason: 'Product + educational content link',
      },
    ],
    orphanPages: ['/ve-chung-toi', '/lien-he'],
    topLinkedPages: ['/may-loc-nuoc-mini', '/may-loc-nuoc-ro'],
  };
}

router.post('/analyze', async (req: Request<object, object, InternalLinksRequestBody>, res: Response) => {
  const { siteUrl } = req.body;

  if (!siteUrl) {
    res.status(400).json({ error: 'siteUrl is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  // Check cache (24 hours)
  try {
    const cached = await query<CacheRow>(
      `SELECT suggestions, orphan_pages FROM internal_links_analysis
       WHERE user_id = $1 AND site_url = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [userId, siteUrl]
    );
    if (cached.length > 0) {
      const row = cached[0];
      const suggestions = Array.isArray(row.suggestions) ? row.suggestions : [];
      const orphanPages = Array.isArray(row.orphan_pages) ? row.orphan_pages : [];
      const topLinkedPages = suggestions.map((s) => s.targetPage).slice(0, 5);
      res.json({ siteUrl, suggestions, orphanPages, topLinkedPages, cached: true });
      return;
    }
  } catch {
    // DB not available, continue
  }

  const data = getInternalLinksMock(siteUrl);

  // Save to DB
  try {
    await query(
      `INSERT INTO internal_links_analysis (user_id, site_url, suggestions, orphan_pages)
       VALUES ($1, $2, $3, $4)`,
      [userId, siteUrl, JSON.stringify(data.suggestions), JSON.stringify(data.orphanPages)]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  res.json(data);
});

export default router;
