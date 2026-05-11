import { Router, Request, Response } from 'express';
import { chatWithAgent } from '../lib/gemini';
import { getKeywordsMock } from '../mock-data/keywords.mock';
import { getAuditMock } from '../mock-data/audit.mock';
import { getCompetitorsMock } from '../mock-data/competitors.mock';
import { query } from '../lib/db';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface ChatHistoryRow {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function generateFallbackResponse(message: string): string {
  const responses = [
    'Tôi là AI SEO Agent. Tôi có thể giúp bạn:\n- **Audit website**: "Audit https://example.com"\n- **Nghiên cứu từ khóa**: "Tìm từ khóa về máy lọc nước"\n- **Phân tích đối thủ**: "Phân tích đối thủ competitor.com"\n- **Tạo content**: Đi đến trang AI Content\n\nBạn muốn tôi giúp gì?',
    `Câu hỏi hay! Về "${message}" trong SEO, tôi khuyên bạn nên:\n1. Tối ưu On-page SEO trước (title, H1, meta description)\n2. Xây dựng internal linking\n3. Cải thiện tốc độ trang\n4. Tạo content chất lượng cao`,
    'Để tôi phân tích yêu cầu của bạn... Vui lòng cung cấp thêm thông tin cụ thể để tôi có thể hỗ trợ tốt hơn!',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// POST /api/agent/chat
router.post('/chat', async (req: Request, res: Response) => {
  const { message, sessionId = 'default' } = req.body as {
    message: string;
    sessionId?: string;
  };

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  // Load recent history from DB
  let historyContext = '';
  try {
    const historyRows = await query<ChatHistoryRow>(
      `SELECT role, content FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );
    historyContext = historyRows
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
  } catch {
    // DB not available, continue without history
  }

  // Save user message to DB
  try {
    await query(
      `INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)`,
      [userId, 'user', message]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  let aiResponse: string;
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('audit') || lowerMsg.includes('phân tích website')) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const mockAudit = getAuditMock(urlMatch[0]);
      aiResponse =
        `Tôi đã phân tích **${urlMatch[0]}**:\n\n` +
        `**Điểm SEO: ${mockAudit.score}/100 (${mockAudit.grade})**\n\n` +
        `**Vấn đề chính:**\n` +
        `${mockAudit.issues.critical.map((i: { message: string }) => `- 🔴 ${i.message}`).join('\n')}\n` +
        `${mockAudit.issues.warnings.map((i: { message: string }) => `- 🟡 ${i.message}`).join('\n')}\n\n` +
        `**Khuyến nghị ưu tiên:**\n` +
        `${mockAudit.recommendations.slice(0, 3).map((r: string) => `- ${r}`).join('\n')}`;
    } else {
      aiResponse =
        'Vui lòng cung cấp URL website bạn muốn audit. Ví dụ: "Audit https://example.com"';
    }
  } else if (lowerMsg.includes('keyword') || lowerMsg.includes('từ khóa')) {
    const queryMatch =
      message.match(/"([^"]+)"|'([^']+)'/) || message.match(/về\s+(\S+)/);
    const kw = queryMatch ? (queryMatch[1] ?? queryMatch[2] ?? 'seo') : 'seo';
    const keywords = getKeywordsMock(kw, 5);
    aiResponse =
      `Tôi tìm được **${keywords.results.length} từ khóa** cho "${kw}":\n\n` +
      `${keywords.results
        .slice(0, 5)
        .map(
          (k) =>
            `- **${k.keyword}** — Vol: ${k.volume.toLocaleString()}, Khó: ${k.difficulty}/100, Intent: ${k.intent}`
        )
        .join('\n')}\n\n` +
      `💡 Top cơ hội: **${keywords.seoScore.topOpportunity}**`;
  } else if (lowerMsg.includes('competitor') || lowerMsg.includes('đối thủ')) {
    const domainMatch = message.match(/[\w-]+\.(com|vn|net|org|io)/);
    const domain = domainMatch ? domainMatch[0] : 'competitor.com';
    const comp = getCompetitorsMock(domain);
    aiResponse =
      `**Phân tích đối thủ ${domain}:**\n\n` +
      `📊 Traffic ước tính: **${comp.analysis.estimatedTraffic.toLocaleString()}** lượt/tháng\n` +
      `⭐ Domain Rating: **${comp.analysis.domainRating}/100**\n` +
      `🔑 Keywords đang rank: **${comp.analysis.totalKeywords}**\n\n` +
      `💡 ${comp.analysis.aiInsight}`;
  } else {
    try {
      aiResponse = await chatWithAgent(message, historyContext);
    } catch {
      aiResponse = generateFallbackResponse(message);
    }
  }

  // Save assistant response to DB
  try {
    await query(
      `INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)`,
      [userId, 'assistant', aiResponse]
    );
  } catch {
    // Ignore: FK violation for guest or DB unavailable
  }

  res.json({ message: aiResponse, sessionId, timestamp: new Date().toISOString() });
});

// GET /api/agent/history
router.get('/history', async (req: Request, res: Response) => {
  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.query['userId'] as string) ||
    'guest';

  try {
    const rows = await query<ChatHistoryRow>(
      `SELECT role, content, created_at FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [userId]
    );
    const history: ChatMessage[] = rows.map((r) => ({
      role: r.role,
      content: r.content,
      created_at: r.created_at,
    }));
    res.json({ history });
  } catch {
    res.json({ history: [] });
  }
});

// DELETE /api/agent/history
router.delete('/history', async (req: Request, res: Response) => {
  const userId: string =
    (req.user as { id?: string } | undefined)?.id ||
    (req.body as { userId?: string }).userId ||
    'guest';

  try {
    await query(`DELETE FROM chat_history WHERE user_id = $1`, [userId]);
    res.json({ success: true });
  } catch {
    res.json({ success: false, error: 'Failed to clear history' });
  }
});

export default router;
