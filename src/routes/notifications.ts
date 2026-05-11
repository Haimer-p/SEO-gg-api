import { Router, Request, Response } from 'express';
import { query } from '../lib/db';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationOut {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

function dbToOut(n: DbNotification): NotificationOut {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.created_at,
    read: n.read,
  };
}

function generateMockNotifications(): NotificationOut[] {
  return [
    {
      id: '1',
      type: 'audit_complete',
      title: 'SEO Audit hoàn thành',
      message: 'thuonghieuviet.com đã được audit. Điểm SEO: 82/100',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'content_ready',
      title: 'Nội dung AI đã sẵn sàng',
      message: 'Bài viết "Top 10 máy lọc nước mini" đã được tạo xong',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'keyword_update',
      title: 'Cập nhật từ khóa',
      message: 'Từ khóa "seo tổng thể" tăng từ #8 lên #5',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'competitor_alert',
      title: 'Đối thủ cập nhật',
      message: 'competitor.com vừa publish 5 bài mới về từ khóa mục tiêu',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'info',
      title: 'Mẹo SEO hôm nay',
      message: 'Cải thiện Core Web Vitals có thể tăng ranking lên 15%',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      read: true,
    },
  ];
}

// GET /api/notifications
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id ?? (req.query['userId'] as string | undefined) ?? 'guest';

  if (userId === 'guest') {
    const notifications = generateMockNotifications();
    res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    return;
  }

  try {
    const rows = await query<DbNotification>(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    const notifications = rows.map(dbToOut);
    res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  } catch (dbErr) {
    console.warn('[notifications] DB query failed, using mock:', (dbErr as Error).message);
    const notifications = generateMockNotifications();
    res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', optionalAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id ?? (req.body['userId'] as string | undefined) ?? 'guest';
  const { id } = req.params;

  if (userId === 'guest') {
    res.json({ success: true });
    return;
  }

  try {
    await query('UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2', [id, userId]);
  } catch (dbErr) {
    console.warn('[notifications] DB update failed:', (dbErr as Error).message);
  }

  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/read-all', optionalAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id ?? (req.body['userId'] as string | undefined) ?? 'guest';

  if (userId === 'guest') {
    res.json({ success: true });
    return;
  }

  try {
    await query('UPDATE notifications SET read=true WHERE user_id=$1', [userId]);
  } catch (dbErr) {
    console.warn('[notifications] DB update-all failed:', (dbErr as Error).message);
  }

  res.json({ success: true });
});

export async function saveNotification(
  userId: string,
  notif: { type: string; title: string; message: string }
): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)`,
      [userId, notif.type, notif.title, notif.message]
    );
  } catch (dbErr) {
    console.warn('[notifications] saveNotification failed:', (dbErr as Error).message);
  }
}

export default router;
