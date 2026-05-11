import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('join-room', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`[WS] ${socket.id} joined room user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket(): SocketIOServer | null {
  return io;
}

export function sendNotification(
  userId: string,
  notification: {
    type: 'audit_complete' | 'content_ready' | 'keyword_update' | 'competitor_alert' | 'info';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  if (io) {
    io.to(`user-${userId}`).emit('notification', {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }
}

export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
}) {
  if (io) {
    io.emit('global-notification', {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }
}
