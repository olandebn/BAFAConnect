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

// 4. STATS DIRECTEUR — tableau de bord
router.get('/stats', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé aux directeurs." });

    try {
        const annonceResult = await pool.query(
            'SELECT COUNT(*) AS nb_annonces FROM sejours WHERE directeur_id = $1', [id]
        );

        const candidaturesResult = await pool.query(
            `SELECT
                COUNT(*) AS nb_total,
                COUNT(*) FILTER (WHERE statut = 'acceptée' OR statut = 'acceptee') AS nb_acceptees,
                COUNT(*) FILTER (WHERE statut = 'refusée' OR statut = 'refusee') AS nb_refusees,
                COUNT(*) FILTER (WHERE statut = 'en attente') AS nb_en_attente
             FROM candidatures
             WHERE sejour_id IN (SELECT id FROM sejours WHERE directeur_id = $1)`,
            [id]
        );

        const recentesResult = await pool.query(
            `SELECT sejours.id, sejours.titre, sejours.lieu, sejours.date_debut, sejours.type,
                (SELECT COUNT(*) FROM candidatures WHERE sejour_id = sejours.id) AS nb_candidatures
             FROM sejours WHERE directeur_id = $1
             ORDER BY sejours.id DESC LIMIT 3`,
            [id]
        );

        const nb_annonces = parseInt(annonceResult.rows[0].nb_annonces);
        const stats = candidaturesResult.rows[0];
        const nb_total = parseInt(stats.nb_total);
        const nb_acceptees = parseInt(stats.nb_acceptees);
        const taux_acceptation = nb_total > 0 ? Math.round((nb_acceptees / nb_total) * 100) : 0;

        res.json({
            nb_annonces,
            nb_candidatures: nb_total,
            nb_acceptees,
            nb_refusees: parseInt(stats.nb_refusees),
            nb_en_attente: parseInt(stats.nb_en_attente),
            taux_acceptation,
            annonces_recentes: recentesResult.rows
        });
    } catch (err) {
        console.error("ERREUR STATS :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 6. MODIFIER UN SÉJOUR
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

// 7. SUPPRIMER UN SÉJOUR
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