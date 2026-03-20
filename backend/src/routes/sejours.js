import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. CRÉER UN SÉJOUR (Réservé aux directeurs)
router.post('/', authenticateToken, async (req, res) => {
    const { id, role } = req.user;

    // Sécurité : Seul un directeur peut créer un séjour
    if (role !== 'directeur') {
        return res.status(403).json({ error: "Accès refusé. Seuls les directeurs peuvent créer des séjours." });
    }

    const { titre, type, lieu, date_debut, date_fin, description, nombre_postes } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO sejours (directeur_id, titre, type, lieu, date_debut, date_fin, description, nombre_postes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [id, titre, type, lieu, date_debut, date_fin, description, nombre_postes]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("ERREUR CRÉATION SÉJOUR :", err);
        res.status(500).json({ error: "Erreur lors de la création du séjour" });
    }
});

// 2. VOIR TOUS LES SÉJOURS (Pour les animateurs)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT sejours.*, structures_directeurs.nom_structure
             FROM sejours
             LEFT JOIN structures_directeurs ON sejours.directeur_id = structures_directeurs.user_id
             ORDER BY sejours.date_debut ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("ERREUR RÉCUPÉRATION SÉJOURS :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 3. MES SÉJOURS — séjours publiés par le directeur connecté
router.get('/mes-sejours', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé aux directeurs." });

    try {
        const result = await pool.query(
            `SELECT sejours.*,
                (SELECT COUNT(*) FROM candidatures WHERE sejour_id = sejours.id) AS nb_candidatures
             FROM sejours
             WHERE directeur_id = $1
             ORDER BY sejours.date_debut ASC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("ERREUR MES SÉJOURS :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 4. MODIFIER UN SÉJOUR
router.put('/:id', authenticateToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { id: sejourId } = req.params;
    if (role !== 'directeur') return res.status(403).json({ error: "Accès refusé." });

    const { titre, type, lieu, date_debut, date_fin, description, nombre_postes } = req.body;

    try {
        // Vérifier que le séjour appartient bien à ce directeur
        const check = await pool.query('SELECT id FROM sejours WHERE id = $1 AND directeur_id = $2', [sejourId, userId]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Séjour introuvable ou accès refusé." });

        const result = await pool.query(
            `UPDATE sejours SET titre=$1, type=$2, lieu=$3, date_debut=$4, date_fin=$5, description=$6, nombre_postes=$7
             WHERE id=$8 RETURNING *`,
            [titre, type, lieu, date_debut || null, date_fin || null, description, nombre_postes || null, sejourId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("ERREUR MODIFICATION SÉJOUR :", err);
        res.status(500).json({ error: "Erreur lors de la modification" });
    }
});

// 5. SUPPRIMER UN SÉJOUR
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { id: sejourId } = req.params;
    if (role !== 'directeur') return res.status(403).json({ error: "Accès refusé." });

    try {
        const check = await pool.query('SELECT id FROM sejours WHERE id = $1 AND directeur_id = $2', [sejourId, userId]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Séjour introuvable ou accès refusé." });

        await pool.query('DELETE FROM sejours WHERE id = $1', [sejourId]);
        res.json({ message: "Séjour supprimé." });
    } catch (err) {
        console.error("ERREUR SUPPRESSION SÉJOUR :", err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
});

export default router;