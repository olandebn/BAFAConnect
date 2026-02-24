import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('API BAFAConnect opérationnelle');
});

app.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});
