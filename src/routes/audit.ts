import { Router, Request, Response } from 'express';
import { getAuditMock } from '../mock-data/audit.mock';
import { sendNotification } from '../socket';

const router = Router();

interface AuditRequestBody {
  url: string;
}

router.post('/', async (req: Request<object, object, AuditRequestBody>, res: Response) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getAuditMock(url);
  res.json(data);

  sendNotification('guest', {
    type: 'audit_complete',
    title: 'SEO Audit hoàn thành',
    message: `${url} đã được audit. Điểm SEO: ${data.score}/100`,
    data: { url, score: data.score },
  });
});

export default router;
