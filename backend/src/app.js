import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import sejourRoutes from './routes/sejours.js';
import profileRoutes from './routes/profiles.js';
import candidatureRoutes from './routes/candidatures.js';
import recrutementRoutes from './routes/recrutement.js';
import messageRoutes from './routes/messages.js';
import avisRoutes from './routes/avis.js';
import favorisRoutes from './routes/favoris.js';
import invitationsRoutes from './routes/invitations.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { startRapportMensuel } from './cron/rapportMensuel.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io — autoriser le front (Vite dev sur 5173 + prod)
export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Map userId → socketId pour les notifications ciblées
const connectedUsers = new Map();

// Authentification Socket.io via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Non authentifié'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  connectedUsers.set(socket.userId, socket.id);

  // Rejoindre une room personnelle pour les notifs
  socket.join(`user:${socket.userId}`);

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.userId);
  });
});

// Exposer la map pour l'utiliser dans les routes
export { connectedUsers };

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/sejours', sejourRoutes);
app.use('/profiles', profileRoutes);
app.use('/candidatures', candidatureRoutes);
app.use('/recrutement', recrutementRoutes);
app.use('/messages', messageRoutes);
app.use('/avis', avisRoutes);
app.use('/favoris', favorisRoutes);
app.use('/invitations', invitationsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/admin', adminRoutes);

// Démarrer le cron du rapport mensuel
startRapportMensuel();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});