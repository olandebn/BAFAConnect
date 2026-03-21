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

// 4. STATS DIRECTEUR — tableau de bord enrichi
router.get('/stats', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    if (role !== 'directeur') return res.status(403).json({ error: "Accès réservé aux directeurs." });

    try {
        const [annonceRes, candidaturesRes, contactsRes, favorisRes, avenirRes, parAnnonceRes] = await Promise.all([
            // Nb annonces totales
            pool.query('SELECT COUNT(*) AS nb FROM sejours WHERE directeur_id = $1', [id]),

            // Stats globales candidatures
            pool.query(`
                SELECT
                    COUNT(*) AS nb_total,
                    COUNT(*) FILTER (WHERE statut = 'acceptée' OR statut = 'acceptee') AS nb_acceptees,
                    COUNT(*) FILTER (WHERE statut = 'refusée' OR statut = 'refusee') AS nb_refusees,
                    COUNT(*) FILTER (WHERE statut = 'en attente') AS nb_en_attente
                FROM candidatures
                WHERE sejour_id IN (SELECT id FROM sejours WHERE directeur_id = $1)
            `, [id]),

            // Nb animateurs contactés (conversations distinctes avec des animateurs)
            pool.query(`
                SELECT COUNT(DISTINCT interlocuteur) AS nb
                FROM (
                    SELECT CASE WHEN m.expediteur_id = $1 THEN m.destinataire_id ELSE m.expediteur_id END AS interlocuteur
                    FROM messages m
                    WHERE (m.expediteur_id = $1 OR m.destinataire_id = $1)
                ) sub
                JOIN users u ON u.id = sub.interlocuteur
                WHERE u.role = 'animateur'
            `, [id]),

            // Nb favoris
            pool.query('SELECT COUNT(*) AS nb FROM favoris WHERE directeur_id = $1', [id]),

            // Nb séjours à venir
            pool.query(`
                SELECT COUNT(*) AS nb FROM sejours
                WHERE directeur_id = $1 AND date_debut > NOW()
            `, [id]),

            // Stats par annonce (toutes)
            pool.query(`
                SELECT s.id, s.titre, s.lieu, s.type, s.date_debut, s.date_fin, s.nombre_postes,
                    COUNT(c.id) AS nb_total,
                    COUNT(c.id) FILTER (WHERE c.statut = 'acceptée' OR c.statut = 'acceptee') AS nb_acceptees,
                    COUNT(c.id) FILTER (WHERE c.statut = 'en attente') AS nb_en_attente
                FROM sejours s
                LEFT JOIN candidatures c ON c.sejour_id = s.id
                WHERE s.directeur_id = $1
                GROUP BY s.id
                ORDER BY s.date_debut DESC NULLS LAST
            `, [id])
        ]);

        const nb_annonces = parseInt(annonceRes.rows[0].nb);
        const c = candidaturesRes.rows[0];
        const nb_total = parseInt(c.nb_total);
        const nb_acceptees = parseInt(c.nb_acceptees);

        res.json({
            nb_annonces,
            nb_candidatures: nb_total,
            nb_acceptees,
            nb_refusees: parseInt(c.nb_refusees),
            nb_en_attente: parseInt(c.nb_en_attente),
            taux_acceptation: nb_total > 0 ? Math.round((nb_acceptees / nb_total) * 100) : 0,
            nb_animateurs_contactes: parseInt(contactsRes.rows[0].nb),
            nb_favoris: parseInt(favorisRes.rows[0].nb),
            nb_sejours_a_venir: parseInt(avenirRes.rows[0].nb),
            candidatures_par_annonce: parAnnonceRes.rows.map(r => ({
                ...r,
                nb_total: parseInt(r.nb_total),
                nb_acceptees: parseInt(r.nb_acceptees),
                nb_en_attente: parseInt(r.nb_en_attente),
            })),
            // Compat ancienne version
            annonces_recentes: parAnnonceRes.rows.slice(0, 3).map(r => ({
                ...r, nb_candidatures: parseInt(r.nb_total)
            }))
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