import { Router, Request, Response } from 'express';

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

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getTopicalMapMock(niche);
  res.json(data);
});

export default router;
