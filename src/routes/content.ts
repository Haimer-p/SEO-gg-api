import { Router, Request, Response } from 'express';
import { getContentMock } from '../mock-data/content.mock';
import { generateSEOContent } from '../lib/gemini';

const router = Router();

interface ContentRequestBody {
  keyword: string;
  intent?: string;
  wordCount?: number;
  language?: 'vi' | 'en';
}

router.post('/generate', async (req: Request<object, object, ContentRequestBody>, res: Response) => {
  const { keyword, wordCount, intent, language } = req.body;

  if (!keyword) {
    res.status(400).json({ error: 'keyword is required' });
    return;
  }

  // Try Gemini AI first, fall back to mock data
  try {
    const geminiResult = await generateSEOContent({
      keyword,
      intent: intent || 'commercial',
      wordCount: wordCount || 2500,
      language: language || 'vi',
    });
    const parsed = JSON.parse(geminiResult.replace(/```json\n?|\n?```/g, '')) as Record<string, unknown>;
    res.json({ keyword, ...parsed });
    return;
  } catch {
    // Fall through to mock data
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const data = getContentMock(keyword, wordCount);
  res.json(data);
});

export default router;
