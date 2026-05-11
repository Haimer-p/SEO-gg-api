import { Router, Request, Response } from 'express';
import { getCrawlerMock } from '../mock-data/crawler.mock';

const router = Router();

router.get('/scan', async (req: Request, res: Response) => {
  const url = req.query['url'] as string;

  if (!url) {
    res.status(400).json({ error: 'url query parameter is required' });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getCrawlerMock(url);
  res.json(data);
});

export default router;
