import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. ENVOYER UN MESSAGE
router.post('/', authenticateToken, async (req, res) => {
    const { id: expediteur_id } = req.user;
    const { destinataire_id, contenu } = req.body;

    if (!destinataire_id || !contenu?.trim()) {
        return res.status(400).json({ error: 'destinataire_id et contenu sont requis.' });
    }
    if (expediteur_id === destinataire_id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer un message.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages (expediteur_id, destinataire_id, contenu)
             VALUES ($1, $2, $3) RETURNING *`,
            [expediteur_id, destinataire_id, contenu.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur envoi message :', err);
        res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
});

// 2. LISTE DES CONVERSATIONS (interlocuteur, dernier message, nb non lus)
router.get('/conversations', authenticateToken, async (req, res) => {
    const { id } = req.user;

    try {
        const result = await pool.query(
            `WITH conv_ranked AS (
                SELECT
                    CASE WHEN expediteur_id = $1::uuid THEN destinataire_id
                         ELSE expediteur_id END                              AS interlocuteur_id,
                    contenu,
                    envoye_le,
                    CASE WHEN destinataire_id = $1::uuid AND lu = false
                         THEN 1 ELSE 0 END                                   AS est_non_lu,
                    ROW_NUMBER() OVER (
                        PARTITION BY CASE WHEN expediteur_id = $1::uuid
                                          THEN destinataire_id
                                          ELSE expediteur_id END
                        ORDER BY envoye_le DESC
                    ) AS rn
                FROM messages
                WHERE expediteur_id = $1::uuid OR destinataire_id = $1::uuid
            ),
            conv_summary AS (
                SELECT
                    interlocuteur_id,
                    MAX(envoye_le)                                   AS dernier_envoi,
                    SUM(est_non_lu)                                  AS non_lus,
                    MAX(CASE WHEN rn = 1 THEN contenu END)           AS dernier_message
                FROM conv_ranked
                GROUP BY interlocuteur_id
            )
            SELECT
                cs.interlocuteur_id,
                u.email                                              AS interlocuteur_email,
                COALESCE(ap.nom, sd.nom_structure, u.email)          AS interlocuteur_nom,
                u.role                                               AS interlocuteur_role,
                cs.dernier_message,
                cs.dernier_envoi,
                cs.non_lus
            FROM conv_summary cs
            JOIN users u ON u.id = cs.interlocuteur_id
            LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
            LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
            ORDER BY cs.dernier_envoi DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur conversations :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 3. FIL DE MESSAGES AVEC UN UTILISATEUR SPÉCIFIQUE
router.get('/:userId', authenticateToken, async (req, res) => {
    const { id } = req.user;
    const { userId } = req.params;

    try {
        // Marquer les messages reçus de cet interlocuteur comme lus
        await pool.query(
            `UPDATE messages SET lu = TRUE
             WHERE expediteur_id = $1 AND destinataire_id = $2 AND lu = FALSE`,
            [userId, id]
        );

        // Récupérer le fil de messages dans l'ordre chronologique
        const result = await pool.query(
            `SELECT m.*,
                COALESCE(ap.nom, sd.nom_structure, u.email) AS expediteur_nom
             FROM messages m
             JOIN users u ON u.id = m.expediteur_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             WHERE (m.expediteur_id = $1 AND m.destinataire_id = $2)
                OR (m.expediteur_id = $2 AND m.destinataire_id = $1)
             ORDER BY m.envoye_le ASC`,
            [id, userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur fil messages :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;