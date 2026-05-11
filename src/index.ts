import http from 'http';
import app from './app';
import { initSocket } from './socket';

const PORT = process.env['PORT'] || 3001;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 SEO API Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});

export default app;
