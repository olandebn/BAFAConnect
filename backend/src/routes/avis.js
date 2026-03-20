import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. LAISSER UN AVIS
router.post('/', authenticateToken, async (req, res) => {
    const { id: auteur_id } = req.user;
    const { cible_id, note, commentaire } = req.body;

    if (!cible_id || !note) {
        return res.status(400).json({ error: 'cible_id et note sont requis.' });
    }
    if (note < 1 || note > 5) {
        return res.status(400).json({ error: 'La note doit être entre 1 et 5.' });
    }
    if (auteur_id === cible_id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas vous noter vous-même.' });
    }

    // Vérifier qu'il y a eu une relation (candidature acceptée)
    try {
        const relation = await pool.query(
            `SELECT 1 FROM candidatures c
             JOIN sejours s ON s.id = c.sejour_id
             WHERE (c.animateur_id = $1 AND s.directeur_id = $2)
                OR (c.animateur_id = $2 AND s.directeur_id = $1)
             AND (c.statut = 'acceptée' OR c.statut = 'acceptee')
             LIMIT 1`,
            [auteur_id, cible_id]
        );

        if (relation.rows.length === 0) {
            return res.status(403).json({ error: 'Vous ne pouvez noter que les personnes avec qui vous avez travaillé.' });
        }

        const result = await pool.query(
            `INSERT INTO avis (auteur_id, cible_id, note, commentaire)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (auteur_id, cible_id) DO UPDATE SET
                note = EXCLUDED.note,
                commentaire = EXCLUDED.commentaire,
                created_at = now()
             RETURNING *`,
            [auteur_id, cible_id, note, commentaire?.trim() || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur avis :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 2. VOIR LES AVIS D'UN UTILISATEUR
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT a.id, a.note, a.commentaire, a.created_at,
                    COALESCE(ap.nom, sd.nom_structure, u.email) AS auteur_nom,
                    u.role AS auteur_role
             FROM avis a
             JOIN users u ON u.id = a.auteur_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             WHERE a.cible_id = $1
             ORDER BY a.created_at DESC`,
            [userId]
        );

        const notes = result.rows.map(r => r.note);
        const moyenne = notes.length > 0
            ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
            : null;

        res.json({ avis: result.rows, moyenne, total: notes.length });
    } catch (err) {
        console.error('Erreur get avis :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 3. MON AVIS SUR QUELQU'UN (pour pré-remplir le formulaire)
router.get('/mon-avis/:cibleId', authenticateToken, async (req, res) => {
    const { id: auteur_id } = req.user;
    const { cibleId } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM avis WHERE auteur_id = $1 AND cible_id = $2',
            [auteur_id, cibleId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
