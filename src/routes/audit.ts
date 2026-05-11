import { Router, Request, Response } from 'express';
import { getAuditMock, AuditResponse } from '../mock-data/audit.mock';
import { sendNotification } from '../socket';
import { query } from '../lib/db';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';
import { saveNotification } from './notifications';

const router = Router();

interface AuditRequestBody {
  url: string;
}

// POST /api/audit
router.post('/', optionalAuth, async (req: Request<object, object, AuditRequestBody>, res: Response) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data: AuditResponse = getAuditMock(url);
  res.json(data);

  const userId = req.user?.id ?? 'guest';

  try {
    await query(
      `INSERT INTO audits (user_id, url, score, issues, result)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId === 'guest' ? null : userId,
        url,
        data.score,
        JSON.stringify(data.issues),
        JSON.stringify(data),
      ]
    );
  } catch (dbErr) {
    console.warn('[audit] DB insert failed:', (dbErr as Error).message);
  }

  const notifPayload = {
    type: 'audit_complete' as const,
    title: 'SEO Audit hoàn thành',
    message: `${url} đã được audit. Điểm SEO: ${data.score}/100`,
  };

  if (userId !== 'guest') {
    await saveNotification(userId, notifPayload);
  }

  sendNotification(userId, {
    ...notifPayload,
    data: { url, score: data.score },
  });
});

// GET /api/audit/history
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const rows = await query<{ id: string; url: string; score: number; created_at: string }>(
      'SELECT id, url, score, created_at FROM audits WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ history: rows });
  } catch (dbErr) {
    console.warn('[audit] DB history query failed:', (dbErr as Error).message);
    res.json({ history: [] });
  }
});

export default router;
