import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Route pour récupérer son propre profil
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;

        let query = '';
        if (role === 'animateur') {
            query = `SELECT * FROM animateurs_profiles WHERE user_id = $1`;
        } else if (role === 'directeur') {
            query = `SELECT * FROM structures_directeurs WHERE user_id = $1`;
        }

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Profil non trouvé." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erreur récupération profil :", err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 2. Route pour mettre à jour son profil (POST pour correspondre à ton Front)
router.post('/me', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        
if (role === 'animateur') {
            const { nom, prenom, bafa_status, ville, competences, experiences, dispo_debut, dispo_fin, photo_url } = req.body;

            const nomComplet = `${prenom} ${nom}`.trim();

            // competences et experiences sont envoyés comme tableaux depuis le front
            const competencesArr = Array.isArray(competences) ? competences : (competences ? [competences] : []);
            const experiencesArr = Array.isArray(experiences) ? experiences : (experiences ? [experiences] : []);

            // disponibilites stocké comme JSON { debut, fin }
            const disponibilites = (dispo_debut || dispo_fin)
                ? JSON.stringify({ debut: dispo_debut || null, fin: dispo_fin || null })
                : null;

            const query = `
                INSERT INTO animateurs_profiles (user_id, nom, diplomes, ville, competences, experiences, disponibilites, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) DO UPDATE SET
                    nom           = EXCLUDED.nom,
                    diplomes      = EXCLUDED.diplomes,
                    ville         = EXCLUDED.ville,
                    competences   = EXCLUDED.competences,
                    experiences   = EXCLUDED.experiences,
                    disponibilites = EXCLUDED.disponibilites,
                    photo_url     = COALESCE(EXCLUDED.photo_url, animateurs_profiles.photo_url)
                RETURNING *;
            `;

            const values = [id, nomComplet, [bafa_status], ville || null, competencesArr, experiencesArr, disponibilites, photo_url || null];
            const result = await pool.query(query, values);
            return res.json({ message: "Profil animateur mis à jour", profil: result.rows[0] });
        }

        else if (role === 'directeur') {
            const { nom_structure, type_structure, ville, description, photo_url } = req.body;

            const query = `
                INSERT INTO structures_directeurs (user_id, nom_structure, type_structure, ville, description, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) DO UPDATE SET
                    nom_structure  = EXCLUDED.nom_structure,
                    type_structure = EXCLUDED.type_structure,
                    ville          = EXCLUDED.ville,
                    description    = EXCLUDED.description,
                    photo_url      = COALESCE(EXCLUDED.photo_url, structures_directeurs.photo_url)
                RETURNING *;
            `;

            const values = [id, nom_structure, type_structure, ville, description, photo_url || null];
            const result = await pool.query(query, values);
            return res.json({ message: "Profil structure mis à jour", profil: result.rows[0] });
        }

    } catch (err) {
        console.error("Erreur mise à jour profil :", err);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
    }
});

// RECHERCHE D'ANIMATEURS (pour les directeurs)
router.get('/animateurs', authenticateToken, async (req, res) => {
    const { role } = req.user;
    if (role !== 'directeur') return res.status(403).json({ error: 'Accès réservé aux directeurs.' });

    const { ville, statut, q } = req.query;

    try {
        let query = `
            SELECT ap.user_id, ap.nom, ap.ville, ap.diplomes, ap.competences,
                   ap.experiences, ap.disponibilites, ap.photo_url, u.email
            FROM animateurs_profiles ap
            JOIN users u ON u.id = ap.user_id
            WHERE 1=1
        `;
        const params = [];

        if (ville) {
            params.push(`%${ville.toLowerCase()}%`);
            query += ` AND LOWER(COALESCE(ap.ville,'')) LIKE $${params.length}`;
        }
        if (statut) {
            params.push(statut);
            query += ` AND $${params.length} = ANY(ap.diplomes)`;
        }
        if (q) {
            params.push(`%${q.toLowerCase()}%`);
            const idx = params.length;
            query += ` AND (
                LOWER(ap.nom) LIKE $${idx}
                OR EXISTS (SELECT 1 FROM unnest(ap.competences) c WHERE LOWER(c) LIKE $${idx})
                OR EXISTS (SELECT 1 FROM unnest(ap.experiences) e WHERE LOWER(e) LIKE $${idx})
            )`;
        }

        query += ' ORDER BY ap.nom ASC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur recherche animateurs :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PROFIL PUBLIC ANIMATEUR (sans authentification)
router.get('/public/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const profileRes = await pool.query(`
            SELECT ap.user_id, ap.nom, ap.ville, ap.diplomes, ap.competences,
                   ap.experiences, ap.disponibilites, ap.photo_url, u.email
            FROM animateurs_profiles ap
            JOIN users u ON u.id = ap.user_id
            WHERE ap.user_id = $1 AND u.role = 'animateur'
        `, [userId]);

        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'Profil introuvable.' });
        }

        const avisRes = await pool.query(`
            SELECT a.note, a.commentaire, a.created_at,
                   COALESCE(ap2.nom, sd.nom_structure, u2.email) AS auteur_nom
            FROM avis a
            JOIN users u2 ON u2.id = a.auteur_id
            LEFT JOIN animateurs_profiles ap2 ON ap2.user_id = u2.id
            LEFT JOIN structures_directeurs sd ON sd.user_id = u2.id
            WHERE a.cible_id = $1
            ORDER BY a.created_at DESC
        `, [userId]);

        const notes = avisRes.rows.map(r => r.note);
        const moyenne = notes.length > 0
            ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10
            : null;

        res.json({
            profil: profileRes.rows[0],
            avis: avisRes.rows,
            moyenne,
            nb_avis: notes.length
        });
    } catch (err) {
        console.error('Erreur profil public :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;