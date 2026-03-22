import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { createNotif } from './notifications.js';
import { sendNouvellePostulation } from '../emailService.js';

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

        // Notification in-app + email pour le directeur
        try {
            const infoRes = await pool.query(
                `SELECT s.directeur_id, s.titre AS sejour_titre,
                        COALESCE(ap.nom, u.email) AS animateur_nom,
                        ud.email AS directeur_email
                 FROM sejours s
                 JOIN users u ON u.id = $1
                 JOIN users ud ON ud.id = s.directeur_id
                 LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
                 WHERE s.id = $2`,
                [id, sejour_id]
            );
            if (infoRes.rows.length > 0) {
                const { directeur_id, sejour_titre, animateur_nom, directeur_email } = infoRes.rows[0];
                await createNotif(directeur_id, 'candidature', `📬 ${animateur_nom} a postulé à "${sejour_titre}"`);
                sendNouvellePostulation({
                    emailDirecteur: directeur_email,
                    animateurNom: animateur_nom,
                    sejourTitre: sejour_titre,
                    appUrl: process.env.APP_URL
                }).catch(() => {});
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

// GÉNÉRER UN CONTRAT (candidature acceptée uniquement)
router.get('/:id/contrat', authenticateToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { id: candidatureId } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                c.id AS candidature_id,
                c.statut,
                c.date_candidature,

                -- Animateur
                u_anim.id       AS animateur_user_id,
                u_anim.email    AS animateur_email,
                ap.nom          AS animateur_nom,
                ap.ville        AS animateur_ville,
                ap.diplomes     AS animateur_diplomes,
                ap.photo_url    AS animateur_photo,

                -- Directeur / Structure
                u_dir.id        AS directeur_user_id,
                u_dir.email     AS directeur_email,
                sd.nom_structure,
                sd.type_structure,
                sd.ville        AS structure_ville,
                sd.description  AS structure_description,

                -- Séjour
                s.id            AS sejour_id,
                s.titre         AS sejour_titre,
                s.type          AS sejour_type,
                s.lieu          AS sejour_lieu,
                s.date_debut,
                s.date_fin,
                s.description   AS sejour_description,
                s.nombre_postes

             FROM candidatures c
             JOIN users u_anim ON u_anim.id = c.animateur_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u_anim.id
             JOIN sejours s ON s.id = c.sejour_id
             JOIN users u_dir ON u_dir.id = s.directeur_id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u_dir.id
             WHERE c.id = $1`,
            [candidatureId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Candidature introuvable.' });
        }

        const contrat = result.rows[0];

        // Vérifier que l'utilisateur est bien le directeur ou l'animateur concerné
        if (contrat.animateur_user_id !== userId && contrat.directeur_user_id !== userId && role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        // Vérifier que la candidature est acceptée
        if (!['acceptée', 'acceptee'].includes(contrat.statut)) {
            return res.status(400).json({ error: 'Le contrat n\'est disponible que pour les candidatures acceptées.' });
        }

        res.json(contrat);
    } catch (err) {
        console.error('Erreur génération contrat :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;