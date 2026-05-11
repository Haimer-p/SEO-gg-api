import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env['GEMINI_API_KEY'] || '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

export async function generateSEOContent(params: {
  keyword: string;
  intent: string;
  wordCount: number;
  language: 'vi' | 'en';
}): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Bạn là chuyên gia SEO content writer. Hãy tạo outline bài viết SEO cho:
Keyword: "${params.keyword}"
Search intent: ${params.intent}
Độ dài mục tiêu: ${params.wordCount} từ
Ngôn ngữ: ${params.language === 'vi' ? 'Tiếng Việt' : 'English'}

Trả về JSON với format:
{
  "title": "CTR-optimized title",
  "metaDescription": "meta description < 160 chars",
  "outline": [{"level": "H2", "text": "..."}, {"level": "H3", "text": "..."}],
  "nlpEntities": ["entity1", "entity2"],
  "faqSchema": [{"question": "...", "answer": "..."}],
  "internalLinkSuggestions": ["/url1", "/url2"]
}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function analyzeKeywords(
  query: string,
  language: 'vi' | 'en' = 'vi'
): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Bạn là SEO keyword research expert. Hãy phân tích từ khóa liên quan đến "${query}" ${language === 'vi' ? 'tiếng Việt' : 'in English'}.
  
Trả về JSON array với 10 keyword opportunities:
[{
  "keyword": "...",
  "volume": 1000-50000,
  "difficulty": 10-90,
  "cpc": 0.1-5.0,
  "trend": "up|down|stable",
  "intent": "commercial|informational|transactional|navigational",
  "reason": "why this keyword is valuable"
}]`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function analyzeSEOAudit(url: string, issues: string[]): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Bạn là SEO expert. Website ${url} có các vấn đề sau: ${issues.join(', ')}.
  
Hãy đưa ra phân tích và gợi ý sửa lỗi chi tiết. Trả về JSON:
{
  "aiSummary": "overall assessment",
  "priorityActions": [{"action": "...", "impact": "high|medium|low", "effort": "easy|medium|hard", "details": "..."}],
  "estimatedImpact": "traffic increase estimate"
}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function analyzeCompetitor(domain: string): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Bạn là SEO analyst chuyên nghiệp. Hãy phân tích website "${domain}" dựa trên kiến thức của bạn về website này.

Trả về JSON (chỉ JSON, không có markdown):
{
  "estimatedTraffic": <số nguyên, lượt truy cập/tháng ước tính>,
  "trafficTrend": "<ví dụ: +15% last 3 months hoặc -5% last 3 months>",
  "domainRating": <số 1-100, uy tín domain>,
  "totalKeywords": <số từ khóa ước tính đang rank>,
  "topKeywords": [
    {"keyword": "...", "position": <1-20>, "volume": <lượt tìm/tháng>}
  ],
  "contentStrategy": "<mô tả ngắn chiến lược content của họ>",
  "topPages": [
    {"url": "/path", "traffic": <lượt/tháng>, "keywords": <số kw>}
  ],
  "contentGaps": ["keyword gap 1", "keyword gap 2", "keyword gap 3", "keyword gap 4", "keyword gap 5"],
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "aiInsight": "<phân tích tổng hợp và gợi ý cách vượt qua đối thủ này, 2-3 câu>"
}

Lưu ý: Nếu không biết chính xác về domain này, hãy đưa ra ước tính hợp lý dựa trên loại website (news, ecommerce, blog...) và tên miền.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function chatWithAgent(message: string, context: string = ''): Promise<string> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: `Bạn là AI SEO Agent thông minh. Bạn giúp người dùng phân tích và tối ưu SEO website. 
Bạn có thể: phân tích website, nghiên cứu từ khóa, tạo content, đưa ra chiến lược SEO.
Trả lời ngắn gọn, có thể dùng markdown để format. ${context}`,
  });

  const result = await model.generateContent(message);
  return result.response.text();
}
