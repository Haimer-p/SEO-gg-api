import { Router, Request, Response } from 'express';
import { chatWithAgent } from '../lib/gemini';
import { getContentMock } from '../mock-data/content.mock';
import { getKeywordsMock } from '../mock-data/keywords.mock';
import { getAuditMock } from '../mock-data/audit.mock';
import { getCompetitorsMock } from '../mock-data/competitors.mock';

// Suppress unused import warning — kept for future tool expansions
void getContentMock;

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const chatHistory: Record<string, ChatMessage[]> = {};

// POST /api/agent/chat
router.post('/chat', async (req: Request, res: Response) => {
  const { message, sessionId = 'default', userId = 'guest' } = req.body as {
    message: string;
    sessionId?: string;
    userId?: string;
  };

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const key = `${userId}-${sessionId}`;
  if (!chatHistory[key]) chatHistory[key] = [];

  // Build context from conversation history
  const historyContext = chatHistory[key]
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  chatHistory[key].push({ role: 'user', content: message, timestamp: new Date().toISOString() });

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
    const query = queryMatch ? queryMatch[1] || queryMatch[2] : 'seo';
    const keywords = getKeywordsMock(query, 5);
    aiResponse =
      `Tôi tìm được **${keywords.results.length} từ khóa** cho "${query}":\n\n` +
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

  chatHistory[key].push({
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString(),
  });

  res.json({ message: aiResponse, sessionId, timestamp: new Date().toISOString() });
});

// GET /api/agent/history?sessionId=xxx&userId=xxx
router.get('/history', (req: Request, res: Response) => {
  const { sessionId = 'default', userId = 'guest' } = req.query as {
    sessionId: string;
    userId: string;
  };
  const key = `${userId}-${sessionId}`;
  res.json({ history: chatHistory[key] || [] });
});

// DELETE /api/agent/history
router.delete('/history', (req: Request, res: Response) => {
  const { sessionId = 'default', userId = 'guest' } = req.body as {
    sessionId?: string;
    userId?: string;
  };
  const key = `${userId}-${sessionId}`;
  chatHistory[key] = [];
  res.json({ success: true });
});

function generateFallbackResponse(message: string): string {
  const responses = [
    'Tôi là AI SEO Agent. Tôi có thể giúp bạn:\n- **Audit website**: "Audit https://example.com"\n- **Nghiên cứu từ khóa**: "Tìm từ khóa về máy lọc nước"\n- **Phân tích đối thủ**: "Phân tích đối thủ competitor.com"\n- **Tạo content**: Đi đến trang AI Content\n\nBạn muốn tôi giúp gì?',
    `Câu hỏi hay! Về "${message}" trong SEO, tôi khuyên bạn nên:\n1. Tối ưu On-page SEO trước (title, H1, meta description)\n2. Xây dựng internal linking\n3. Cải thiện tốc độ trang\n4. Tạo content chất lượng cao`,
    'Để tôi phân tích yêu cầu của bạn... Vui lòng cung cấp thêm thông tin cụ thể để tôi có thể hỗ trợ tốt hơn!',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export default router;
