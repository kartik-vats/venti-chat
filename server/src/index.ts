import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config';
import { connectToDatabase } from './db';
import messagesRouter from './routes/messages';
import { setupSocket } from './socket';

async function bootstrap() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');
  } catch (error: any) {
    console.warn('MongoDB connection failed, continuing without persistence:', error?.message || error);
  }

  const app = express();
  app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: false }));
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ ok: true, name: 'venti-chat-server' });
  });

  app.use('/api/messages', messagesRouter);

  const server = http.createServer(app);
  const io = new Server(server, {
  cors: {
    origin: "https://venti-chat-1.onrender.com",  // your frontend domain
    methods: ["GET", "POST"],
    credentials: true
  }
});

  setupSocket(io);

  server.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

