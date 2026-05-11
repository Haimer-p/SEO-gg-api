import { Router, Request, Response } from 'express';
import { getKeywordsMock } from '../mock-data/keywords.mock';

const router = Router();

router.get('/research', (req: Request, res: Response) => {
  const query = req.query['query'] as string;
  const limit = parseInt(req.query['limit'] as string) || 5;

  if (!query) {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }

  const data = getKeywordsMock(query, limit);
  res.json(data);
});

export default router;
