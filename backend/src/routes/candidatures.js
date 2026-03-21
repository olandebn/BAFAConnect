import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { createNotif } from './notifications.js';

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

        // Notification in-app pour le directeur
        try {
            const infoRes = await pool.query(
                `SELECT s.directeur_id, s.titre AS sejour_titre,
                        COALESCE(ap.nom, u.email) AS animateur_nom
                 FROM sejours s
                 JOIN users u ON u.id = $1
                 LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
                 WHERE s.id = $2`,
                [id, sejour_id]
            );
            if (infoRes.rows.length > 0) {
                const { directeur_id, sejour_titre, animateur_nom } = infoRes.rows[0];
                await createNotif(directeur_id, 'candidature', `📬 ${animateur_nom} a postulé à "${sejour_titre}"`);
            }
        } catch {}

        res.status(201).json({ message: "Candidature envoyée !", candidature: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la candidature" });
    }
});

// 2. VOIR MES CANDIDATURES (Pour l'animateur) — routes /me et /mes-candidatures
const getMesCandidatures = async (req, res) => {
    const { id } = req.user;
    try {
        const result = await pool.query(
            `SELECT candidatures.*, sejours.titre AS sejour_titre, sejours.lieu, sejours.directeur_id
             FROM candidatures
             JOIN sejours ON candidatures.sejour_id = sejours.id
             WHERE animateur_id = $1
             ORDER BY candidatures.date_candidature DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

router.get('/me', authenticateToken, getMesCandidatures);
router.get('/mes-candidatures', authenticateToken, getMesCandidatures);

// 3. STATS ANIMATEUR — tableau de bord perso
router.get('/stats', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    if (role !== 'animateur') return res.status(403).json({ error: 'Accès réservé aux animateurs.' });

    try {
        const [statsRes, avisRes, dernieresRes] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(*) AS nb_total,
                    COUNT(*) FILTER (WHERE statut = 'acceptée' OR statut = 'acceptee') AS nb_acceptees,
                    COUNT(*) FILTER (WHERE statut = 'refusée' OR statut = 'refusee') AS nb_refusees,
                    COUNT(*) FILTER (WHERE statut = 'en attente') AS nb_en_attente
                FROM candidatures WHERE animateur_id = $1
            `, [id]),

            pool.query(`
                SELECT ROUND(AVG(note)::numeric, 1) AS moyenne, COUNT(*) AS total
                FROM avis WHERE cible_id = $1
            `, [id]),

            pool.query(`
                SELECT c.statut, c.date_candidature, s.titre AS sejour_titre, s.lieu
                FROM candidatures c
                JOIN sejours s ON s.id = c.sejour_id
                WHERE c.animateur_id = $1
                ORDER BY c.date_candidature DESC LIMIT 5
            `, [id])
        ]);

        const s = statsRes.rows[0];
        const nb_total = parseInt(s.nb_total);
        const nb_acceptees = parseInt(s.nb_acceptees);

        res.json({
            nb_total,
            nb_acceptees,
            nb_refusees: parseInt(s.nb_refusees),
            nb_en_attente: parseInt(s.nb_en_attente),
            taux_acceptation: nb_total > 0 ? Math.round((nb_acceptees / nb_total) * 100) : 0,
            moyenne_avis: avisRes.rows[0].moyenne ? parseFloat(avisRes.rows[0].moyenne) : null,
            nb_avis: parseInt(avisRes.rows[0].total),
            dernieres_candidatures: dernieresRes.rows
        });
    } catch (err) {
        console.error('Erreur stats animateur :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;