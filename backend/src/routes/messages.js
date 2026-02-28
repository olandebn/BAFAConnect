import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. ENVOYER UN MESSAGE
router.post('/', authenticateToken, async (req, res) => {
    const { id: expediteur_id } = req.user;
    const { destinataire_id, contenu } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO messages (expediteur_id, destinataire_id, contenu) VALUES ($1, $2, $3) RETURNING *',
            [expediteur_id, destinataire_id, contenu]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
});

// 2. RÉCUPÉRER MES MESSAGES
router.get('/', authenticateToken, async (req, res) => {
    const { id } = req.user;

    try {
        const result = await pool.query(
            `SELECT messages.*, users.email as expediteur_email 
             FROM messages 
             JOIN users ON messages.expediteur_id = users.id 
             WHERE destinataire_id = $1 
             ORDER BY envoye_le DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des messages" });
    }
});

export default router;