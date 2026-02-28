import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. POSTULER À UN SÉJOUR (Réservé aux animateurs)
router.post('/', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    const { sejour_id } = req.body;

    if (role !== 'animateur') {
        return res.status(403).json({ error: "Seuls les animateurs peuvent postuler." });
    }

    try {
        // Vérifier si l'animateur n'a pas déjà postulé
        const checkDuplicate = await pool.query(
            'SELECT * FROM candidatures WHERE sejour_id = $1 AND animateur_id = $2',
            [sejour_id, id]
        );

        if (checkDuplicate.rows.length > 0) {
            return res.status(400).json({ error: "Vous avez déjà postulé à ce séjour." });
        }

        const result = await pool.query(
            'INSERT INTO candidatures (sejour_id, animateur_id) VALUES ($1, $2) RETURNING *',
            [sejour_id, id]
        );

        res.status(201).json({ message: "Candidature envoyée !", candidature: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la candidature" });
    }
});

// 2. VOIR MES CANDIDATURES (Pour l'animateur)
router.get('/mes-candidatures', authenticateToken, async (req, res) => {
    const { id } = req.user;

    try {
        const result = await pool.query(
            `SELECT candidatures.*, sejours.titre, sejours.lieu 
             FROM candidatures 
             JOIN sejours ON candidatures.sejour_id = sejours.id 
             WHERE animateur_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;