import http from 'http';
import app from './app';
import { initSocket } from './socket';
import { testConnection } from './lib/db';

const PORT = process.env['PORT'] || 3001;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, async () => {
  console.log(`🚀 SEO API Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  await testConnection();
});

export default app;
