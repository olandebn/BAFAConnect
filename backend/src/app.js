import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import sejourRoutes from './routes/sejours.js';
import profileRoutes from './routes/profiles.js';
import candidatureRoutes from './routes/candidatures.js';
import recrutementRoutes from './routes/recrutement.js';
import messageRoutes from './routes/messages.js';
import avisRoutes from './routes/avis.js';
import favorisRoutes from './routes/favoris.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/sejours', sejourRoutes);
app.use('/profiles', profileRoutes);
app.use('/candidatures', candidatureRoutes);
app.use('/recrutement', recrutementRoutes);
app.use('/messages', messageRoutes);
app.use('/avis', avisRoutes);
app.use('/favoris', favorisRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});