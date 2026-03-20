import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sendCandidatureNotification } from '../emailService.js';

const router = express.Router();

// 1. Voir toutes les candidatures pour les séjours créés par le directeur connecté
router.get('/candidats-recus', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé aux directeurs" });

        const query = `
            SELECT c.id as candidature_id, c.statut, c.animateur_id, p.nom as candidat_nom, s.titre as sejour_titre
            FROM candidatures c
            JOIN animateurs_profiles p ON c.animateur_id = p.user_id
            JOIN sejours s ON c.sejour_id = s.id
            WHERE s.directeur_id = $1
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. AJOUT : Mettre à jour le statut d'une candidature (Accepter/Refuser)
router.patch('/candidatures/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // L'ID de la candidature
        const { statut } = req.body; // Le nouveau statut envoyé par le front ("acceptée" ou "refusée")
        const { role } = req.user;

        if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé" });

        const query = `
            UPDATE candidatures 
            SET statut = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [statut, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Candidature non trouvée" });
        }

        // Envoyer un email de notification à l'animateur
        try {
            const cand = result.rows[0];
            const infoResult = await pool.query(
                `SELECT u.email, p.nom, s.titre AS sejour_titre
                 FROM candidatures c
                 JOIN users u ON u.id = c.animateur_id
                 LEFT JOIN animateurs_profiles p ON p.user_id = c.animateur_id
                 JOIN sejours s ON s.id = c.sejour_id
                 WHERE c.id = $1`,
                [id]
            );
            if (infoResult.rows.length > 0) {
                const { email, nom, sejour_titre } = infoResult.rows[0];
                await sendCandidatureNotification({ email, animateurNom: nom, sejourTitre: sejour_titre, statut });
            }
        } catch (emailErr) {
            console.error('Erreur envoi notif email :', emailErr.message);
        }

        res.json({ message: "Statut mis à jour !", candidature: result.rows[0] });
    } catch (err) {
        console.error("Erreur PATCH statut :", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;