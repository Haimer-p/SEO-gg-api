import express, { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './middleware/cors';
import { optionalAuth } from './middleware/authMiddleware';
import auditRouter from './routes/audit';
import keywordsRouter from './routes/keywords';
import contentRouter from './routes/content';
import competitorsRouter from './routes/competitors';
import crawlerRouter from './routes/crawler';
import internalLinksRouter from './routes/internal-links';
import topicalMapRouter from './routes/topical-map';
import notificationsRouter from './routes/notifications';
import authRouter from './routes/auth';
import aiAgentRouter from './routes/ai-agent';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Apply optional auth globally so req.user is populated on all routes
app.use(optionalAuth);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ranking/predict', (req: Request, res: Response) => {
  const keyword = req.query['keyword'] as string;

  if (!keyword) {
    res.status(400).json({ error: 'keyword query parameter is required' });
    return;
  }

  res.json({
    keyword,
    rankProbability: 72,
    currentPosition: null,
    needed: {
      backlinks: 13,
      contentDepth: 'Tăng từ 800 lên 2500 từ',
      ctrImprovement: 'Cải thiện title tag CTR',
    },
  });
});

app.use('/api/audit', auditRouter);
app.use('/api/keywords', keywordsRouter);
app.use('/api/content', contentRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/crawler', crawlerRouter);
app.use('/api/internal-links', internalLinksRouter);
app.use('/api/topical-map', topicalMapRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/agent', aiAgentRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
