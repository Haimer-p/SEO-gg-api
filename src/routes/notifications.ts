import { Router, Request, Response } from 'express';

const router = Router();

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// Mock notification store (in production this would be a database)
const notificationStore: Record<string, Notification[]> = {};

// GET /api/notifications?userId=xxx
router.get('/', (req: Request, res: Response) => {
  const userId = (req.query['userId'] as string) || 'guest';
  const notifications = notificationStore[userId] || generateMockNotifications();
  notificationStore[userId] = notifications;
  res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
});

// POST /api/notifications/:id/read
router.post('/:id/read', (req: Request, res: Response) => {
  const userId = (req.body['userId'] as string) || 'guest';
  const { id } = req.params;
  const notifications = notificationStore[userId] || [];
  const notif = notifications.find((n) => n.id === id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/read-all', (req: Request, res: Response) => {
  const userId = (req.body['userId'] as string) || 'guest';
  const notifications = notificationStore[userId] || [];
  notifications.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true });
});

function generateMockNotifications(): Notification[] {
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

export default router;
