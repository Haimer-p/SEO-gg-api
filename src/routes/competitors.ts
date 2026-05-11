import { Router, Request, Response } from 'express';
import { getCompetitorsMock } from '../mock-data/competitors.mock';

const router = Router();

interface CompetitorsRequestBody {
  domain: string;
}

router.post('/analyze', async (req: Request<object, object, CompetitorsRequestBody>, res: Response) => {
  const { domain } = req.body;

  if (!domain) {
    res.status(400).json({ error: 'domain is required' });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getCompetitorsMock(domain);
  res.json(data);
});

export default router;
