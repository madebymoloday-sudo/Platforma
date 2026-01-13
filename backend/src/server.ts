import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import authRoutes from './routes/auth';
import learningRoutes from './routes/learning';
import learningCategoriesRoutes from './routes/learning-categories';
import workspaceRoutes from './routes/workspace';
import communityRoutes from './routes/community';
import chatRoutes from './routes/chat';
import leisureRoutes from './routes/leisure';
import conferenceRoutes from './routes/conference';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });
  socket.on('call-user', (data) => {
    socket.to(data.to).emit('incoming-call', data);
  });
  
  // WebRTC сигналинг для конференций
  socket.on('conference-join', (data) => {
    socket.join(`conference-${data.conferenceId}`);
    socket.to(`conference-${data.conferenceId}`).emit('user-joined', data);
  });
  
  socket.on('conference-leave', (data) => {
    socket.leave(`conference-${data.conferenceId}`);
    socket.to(`conference-${data.conferenceId}`).emit('user-left', data);
  });
  
  socket.on('conference-offer', (data) => {
    socket.to(`conference-${data.targetId}`).emit('conference-offer', data);
  });
  
  socket.on('conference-answer', (data) => {
    socket.to(`conference-${data.targetId}`).emit('conference-answer', data);
  });
  
  socket.on('conference-ice-candidate', (data) => {
    socket.to(`conference-${data.targetId}`).emit('conference-ice-candidate', data);
  });
  
  socket.on('conference-reaction', (data) => {
    socket.to(`conference-${data.conferenceId}`).emit('conference-reaction', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/learning/categories', learningCategoriesRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leisure', leisureRoutes);
app.use('/api/conference', conferenceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Platforma API is running' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { io };
