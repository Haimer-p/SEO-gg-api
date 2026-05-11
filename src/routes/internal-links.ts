import { Router, Request, Response } from 'express';

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

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getInternalLinksMock(siteUrl);
  res.json(data);
});

export default router;
