import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

// INSCRIPTION
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    // Logs de debug
    console.log("BODY REÇU :", req.body);
    console.log("INSERT :", email, password, role);

    try {
        const hashed = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role)
             VALUES ($1, $2, $3) RETURNING id, email, role`,
            [email, hashed, role]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("ERREUR SQL :", err);

        // Erreur email déjà utilisé
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// CONNEXION
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Utilisateur introuvable' });
        }

        const user = result.rows[0];

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("ERREUR LOGIN :", err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
