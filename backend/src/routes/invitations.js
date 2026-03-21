import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /invitations — directeur invite un animateur sur un séjour
router.post('/', authenticateToken, async (req, res) => {
    const { role, id: directeurId } = req.user;
    if (role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs.' });

    const { animateur_id, sejour_id, message } = req.body;
    if (!animateur_id || !sejour_id) return res.status(400).json({ error: 'animateur_id et sejour_id requis.' });

    try {
        // Vérifier que le séjour appartient au directeur
        const sejourRes = await pool.query(
            'SELECT titre FROM sejours WHERE id = $1 AND directeur_id = $2',
            [sejour_id, directeurId]
        );
        if (sejourRes.rows.length === 0) return res.status(403).json({ error: 'Séjour introuvable.' });

        const sejourTitre = sejourRes.rows[0].titre;

        // Récupérer le nom du directeur
        const dirRes = await pool.query(
            `SELECT COALESCE(dp.nom, u.email) AS nom
             FROM users u LEFT JOIN directeurs_profiles dp ON dp.user_id = u.id
             WHERE u.id = $1`,
            [directeurId]
        );
        const dirNom = dirRes.rows[0]?.nom || 'Un directeur';

        // Insérer invitation (ignore doublon)
        await pool.query(
            `INSERT INTO invitations (directeur_id, animateur_id, sejour_id, message)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [directeurId, animateur_id, sejour_id, message || null]
        );

        // Envoyer un message automatique à l'animateur
        const contenu = message
            ? `💌 Invitation : ${message}\n\n— Pour le séjour : "${sejourTitre}"`
            : `💌 Bonjour ! Je vous invite à postuler à mon séjour "${sejourTitre}". N'hésitez pas à me contacter si vous avez des questions.`;

        await pool.query(
            `INSERT INTO messages (expediteur_id, destinataire_id, contenu) VALUES ($1, $2, $3)`,
            [directeurId, animateur_id, contenu]
        );

        res.status(201).json({ message: 'Invitation envoyée !' });
    } catch (err) {
        console.error('Erreur invitation :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /invitations — animateur voit ses invitations reçues
router.get('/', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    if (role !== 'animateur') return res.status(403).json({ error: 'Accès réservé aux animateurs.' });

    try {
        const result = await pool.query(
            `SELECT i.id, i.created_at, i.message,
                    s.id AS sejour_id, s.titre AS sejour_titre, s.lieu, s.date_debut, s.date_fin,
                    COALESCE(dp.nom, u.email) AS directeur_nom
             FROM invitations i
             JOIN sejours s ON s.id = i.sejour_id
             JOIN users u ON u.id = i.directeur_id
             LEFT JOIN directeurs_profiles dp ON dp.user_id = i.directeur_id
             WHERE i.animateur_id = $1
             ORDER BY i.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
