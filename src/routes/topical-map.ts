import { Router, Request, Response } from 'express';
import { query } from '../lib/db';

const router = Router();

interface TopicalMapRequestBody {
  niche: string;
}

interface ClusterArticle {
  title: string;
  url: string;
  status: 'exists' | 'missing' | 'draft';
}

interface PillarPage {
  title: string;
  url: string;
  clusterArticles: ClusterArticle[];
}

interface TopicalMapResponse {
  niche: string;
  pillarPages: PillarPage[];
  totalArticlesNeeded: number;
  totalArticlesExisting: number;
  coveragePercent: number;
}

interface MapRow {
  map_data: TopicalMapResponse;
}

function getTopicalMapMock(niche: string): TopicalMapResponse {
  return {
    niche,
    pillarPages: [
      {
        title: 'Hướng Dẫn Tập Gym Toàn Diện Cho Người Mới',
        url: '/gym-cho-nguoi-moi',
        clusterArticles: [
          { title: 'Bài Tập Gym Cho Người Mới Bắt Đầu', url: '/bai-tap-gym-nguoi-moi', status: 'missing' },
          { title: 'Chế Độ Ăn Cho Người Tập Gym', url: '/che-do-an-tap-gym', status: 'missing' },
          { title: 'Whey Protein Là Gì', url: '/whey-protein-la-gi', status: 'exists' },
        ],
      },
      {
        title: 'Dinh Dưỡng Thể Thao Toàn Diện',
        url: '/dinh-duong-the-thao',
        clusterArticles: [
          { title: 'Thực Phẩm Bổ Sung Cho Vận Động Viên', url: '/thuc-pham-bo-sung', status: 'exists' },
          { title: 'Creatine Có Tác Dụng Gì', url: '/creatine-tac-dung', status: 'missing' },
          { title: 'Kế Hoạch Ăn Uống 7 Ngày Cho Gym', url: '/ke-hoach-an-uong-gym', status: 'draft' },
        ],
      },
    ],
    totalArticlesNeeded: 45,
    totalArticlesExisting: 8,
    coveragePercent: 18,
  };
}

router.post('/generate', async (req: Request<object, object, TopicalMapRequestBody>, res: Response) => {
  const { niche } = req.body;

  if (!niche) {
    res.status(400).json({ error: 'niche is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  // Check cache (24 hours)
  try {
    const cached = await query<MapRow>(
      `SELECT map_data FROM topical_maps
       WHERE user_id = $1 AND niche = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [userId, niche]
    );
    if (cached.length > 0 && cached[0].map_data) {
      res.json({ ...cached[0].map_data, cached: true });
      return;
    }
  } catch {
    // DB not available, continue
  }

  const data = getTopicalMapMock(niche);

  // Save to DB
  try {
    await query(
      `INSERT INTO topical_maps (user_id, niche, map_data) VALUES ($1, $2, $3)`,
      [userId, niche, JSON.stringify(data)]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  res.json(data);
});

export default router;
