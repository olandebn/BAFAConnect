import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Voir toutes les candidatures pour les séjours créés par le directeur connecté
router.get('/candidats-recus', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé aux directeurs" });

        const query = `
            SELECT c.id as candidature_id, c.statut, p.nom as candidat_nom, s.titre as sejour_titre
            FROM candidatures c
            JOIN animateurs_profiles p ON c.user_id = p.user_id
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

        res.json({ message: "Statut mis à jour !", candidature: result.rows[0] });
    } catch (err) {
        console.error("Erreur PATCH statut :", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;