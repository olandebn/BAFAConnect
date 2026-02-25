import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// 1. Tous les imports de routes en haut
import authRoutes from './routes/auth.js';
import sejourRoutes from './routes/sejours.js';
import profileRoutes from './routes/profiles.js';

const app = express();

// 2. Les middlewares de base
app.use(cors());
app.use(express.json());

// 3. Déclaration de TOUTES les routes
app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/sejours', sejourRoutes);

app.get('/', (req, res) => {
    res.send('API BAFAConnect opérationnelle');
});

// 4. Lancement du serveur EN DERNIER
app.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});