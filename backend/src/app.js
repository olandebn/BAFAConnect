import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import sejourRoutes from './routes/sejours.js';
import profileRoutes from './routes/profiles.js';
import candidatureRoutes from './routes/candidatures.js';
import recrutementRoutes from './routes/recrutement.js'; // AJOUT : Import des routes directeur

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
app.use('/recrutement', recrutementRoutes); // AJOUT : Enregistrement des routes de recrutement

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});