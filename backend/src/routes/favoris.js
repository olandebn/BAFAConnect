import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /favoris — liste des animateurs mis en favori (directeur)
router.get('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs.' });

    try {
        const result = await pool.query(`
            SELECT f.animateur_id, ap.nom, ap.ville, ap.diplomes, ap.photo_url,
                   ap.competences, ap.disponibilites, ap.cv_url, u.email, f.created_at
            FROM favoris f
            JOIN animateurs_profiles ap ON ap.user_id = f.animateur_id
            JOIN users u ON u.id = f.animateur_id
            WHERE f.directeur_id = $1
            ORDER BY f.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET favoris :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /favoris/:animateurId — ajouter un animateur en favori
router.post('/:animateurId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs.' });

    try {
        await pool.query(`
            INSERT INTO favoris (directeur_id, animateur_id)
            VALUES ($1, $2)
            ON CONFLICT (directeur_id, animateur_id) DO NOTHING
        `, [req.user.id, req.params.animateurId]);
        res.json({ message: 'Ajouté aux favoris.' });
    } catch (err) {
        console.error('Erreur POST favori :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /favoris/:animateurId — retirer un animateur des favoris
router.delete('/:animateurId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs.' });

    try {
        await pool.query(
            'DELETE FROM favoris WHERE directeur_id = $1 AND animateur_id = $2',
            [req.user.id, req.params.animateurId]
        );
        res.json({ message: 'Retiré des favoris.' });
    } catch (err) {
        console.error('Erreur DELETE favori :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
