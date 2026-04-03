import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware : vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }
    next();
};

// ─────────────────────────────────────────────
// 1. STATISTIQUES GLOBALES
// ─────────────────────────────────────────────
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users, sejours, candidatures, messages, avis, inscriptionsMois, candidaturesMois] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS total,
                SUM(CASE WHEN role='animateur' THEN 1 ELSE 0 END) AS animateurs,
                SUM(CASE WHEN role='directeur' THEN 1 ELSE 0 END) AS directeurs,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS nouveaux_30j
                FROM users WHERE role NOT IN ('admin')`),
            pool.query(`SELECT COUNT(*) AS total,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS nouveaux_30j
                FROM sejours`),
            pool.query(`SELECT COUNT(*) AS total,
                SUM(CASE WHEN statut='acceptée' OR statut='acceptee' THEN 1 ELSE 0 END) AS acceptees,
                SUM(CASE WHEN statut='refusée' OR statut='refusee' THEN 1 ELSE 0 END) AS refusees,
                SUM(CASE WHEN statut='en attente' THEN 1 ELSE 0 END) AS en_attente
                FROM candidatures`),
            pool.query(`SELECT COUNT(*) AS total FROM messages`),
            pool.query(`SELECT COUNT(*) AS total, ROUND(AVG(note)::numeric, 1) AS moyenne FROM avis`),
            // Inscriptions par mois (6 derniers mois)
            pool.query(`
                SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS mois,
                       EXTRACT(MONTH FROM created_at) AS mois_num,
                       EXTRACT(YEAR FROM created_at) AS annee,
                       COUNT(*) AS total
                FROM users WHERE role != 'admin'
                  AND created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at),
                         EXTRACT(MONTH FROM created_at),
                         EXTRACT(YEAR FROM created_at)
                ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)`),
            // Candidatures par mois (6 derniers mois)
            pool.query(`
                SELECT TO_CHAR(DATE_TRUNC('month', date_candidature), 'Mon') AS mois,
                       EXTRACT(MONTH FROM date_candidature) AS mois_num,
                       EXTRACT(YEAR FROM date_candidature) AS annee,
                       COUNT(*) AS total
                FROM candidatures
                WHERE date_candidature >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', date_candidature),
                         EXTRACT(MONTH FROM date_candidature),
                         EXTRACT(YEAR FROM date_candidature)
                ORDER BY EXTRACT(YEAR FROM date_candidature), EXTRACT(MONTH FROM date_candidature)`),
        ]);

        res.json({
            users: users.rows[0],
            sejours: sejours.rows[0],
            candidatures: candidatures.rows[0],
            messages: messages.rows[0],
            avis: avis.rows[0],
            inscriptions_par_mois: inscriptionsMois.rows,
            candidatures_par_mois: candidaturesMois.rows,
        });
    } catch (err) {
        console.error('Erreur stats admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 2. ACTIVITÉ RÉCENTE
// ─────────────────────────────────────────────
router.get('/activite', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [dernieresInscriptions, derniersSejours, dernieresCandidatures] = await Promise.all([
            pool.query(`
                SELECT u.id, u.email, u.role, u.created_at,
                    COALESCE(ap.nom, sd.nom_structure) AS nom
                FROM users u
                LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
                LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
                WHERE u.role != 'admin'
                ORDER BY u.created_at DESC LIMIT 8`),
            pool.query(`
                SELECT s.id, s.titre, s.lieu, s.created_at,
                    COALESCE(sd.nom_structure, u.email) AS directeur_nom
                FROM sejours s
                JOIN users u ON u.id = s.directeur_id
                LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
                ORDER BY s.created_at DESC LIMIT 8`),
            pool.query(`
                SELECT c.id, c.statut, c.date_candidature AS created_at,
                    COALESCE(ap.nom, u.email) AS animateur_nom,
                    s.titre AS sejour_titre
                FROM candidatures c
                JOIN users u ON u.id = c.animateur_id
                LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
                JOIN sejours s ON s.id = c.sejour_id
                ORDER BY c.date_candidature DESC LIMIT 8`),
        ]);

        res.json({
            inscriptions: dernieresInscriptions.rows,
            sejours: derniersSejours.rows,
            candidatures: dernieresCandidatures.rows,
        });
    } catch (err) {
        console.error('Erreur activité admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 3. LISTE DES UTILISATEURS
// ─────────────────────────────────────────────
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const conditions = ["u.role != 'admin'"];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.email ILIKE $${params.length} OR COALESCE(ap.nom, sd.nom_structure) ILIKE $${params.length})`);
        }
        if (role) {
            params.push(role);
            conditions.push(`u.role = $${params.length}`);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM users u
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             ${where}`, params
        );

        params.push(limit, offset);
        const usersRes = await pool.query(
            `SELECT u.id, u.email, u.role, u.created_at, u.email_verified AS email_verifie,
                COALESCE(ap.nom, sd.nom_structure) AS nom,
                ap.ville, sd.ville AS ville_structure,
                (SELECT COUNT(*) FROM candidatures WHERE animateur_id = u.id) AS nb_candidatures,
                (SELECT COUNT(*) FROM sejours WHERE directeur_id = u.id) AS nb_sejours
             FROM users u
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             ${where}
             ORDER BY u.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            users: usersRes.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        console.error('Erreur liste users admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 4. CHANGER LE RÔLE D'UN UTILISATEUR
// ─────────────────────────────────────────────
router.patch('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['animateur', 'directeur'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide.' });
    }
    try {
        const check = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (!check.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        if (check.rows[0].role === 'admin') return res.status(403).json({ error: 'Impossible de modifier un admin.' });
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        res.json({ message: 'Rôle mis à jour.' });
    } catch (err) {
        console.error('Erreur changement rôle :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 5. SUPPRIMER UN UTILISATEUR
// ─────────────────────────────────────────────
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        if (!check.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        if (check.rows[0].role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un admin.' });
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'Utilisateur supprimé.' });
    } catch (err) {
        console.error('Erreur suppression user admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 6. LISTE DES SÉJOURS
// ─────────────────────────────────────────────
router.get('/sejours', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const params = search ? [`%${search}%`] : [];
        const where = search ? 'WHERE s.titre ILIKE $1 OR s.lieu ILIKE $1' : '';

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM sejours s
             LEFT JOIN users u ON u.id = s.directeur_id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id ${where}`, params);

        params.push(limit, offset);
        const sejoursRes = await pool.query(
            `SELECT s.id, s.titre, s.lieu, s.type, s.date_debut, s.date_fin, s.created_at,
                s.nombre_postes,
                (SELECT COUNT(*) FROM candidatures WHERE sejour_id = s.id AND statut IN ('acceptée','acceptee')) AS postes_pourvus,
                COALESCE(sd.nom_structure, u.email) AS directeur_nom,
                u.email AS directeur_email,
                (SELECT COUNT(*) FROM candidatures WHERE sejour_id = s.id) AS nb_candidatures
             FROM sejours s
             JOIN users u ON u.id = s.directeur_id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             ${where}
             ORDER BY s.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            sejours: sejoursRes.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        console.error('Erreur liste séjours admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 7. SUPPRIMER UN SÉJOUR
// ─────────────────────────────────────────────
router.delete('/sejours/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sejours WHERE id = $1', [id]);
        res.json({ message: 'Séjour supprimé.' });
    } catch (err) {
        console.error('Erreur suppression séjour admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 8. LISTE DES CANDIDATURES
// ─────────────────────────────────────────────
router.get('/candidatures', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20, statut = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const conditions = [];
        const params = [];

        if (statut) {
            params.push(statut);
            conditions.push(`c.statut = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(COALESCE(ap.nom, ua.email) ILIKE $${params.length} OR s.titre ILIKE $${params.length})`);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM candidatures c
             JOIN users ua ON ua.id = c.animateur_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = ua.id
             JOIN sejours s ON s.id = c.sejour_id
             ${where}`, params
        );

        params.push(limit, offset);
        const result = await pool.query(
            `SELECT c.id, c.statut, c.date_candidature AS created_at,
                COALESCE(ap.nom, ua.email) AS animateur_nom,
                ua.email AS animateur_email,
                s.titre AS sejour_titre, s.lieu AS sejour_lieu,
                COALESCE(sd.nom_structure, ud.email) AS directeur_nom
             FROM candidatures c
             JOIN users ua ON ua.id = c.animateur_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = ua.id
             JOIN sejours s ON s.id = c.sejour_id
             JOIN users ud ON ud.id = s.directeur_id
             LEFT JOIN structures_directeurs sd ON sd.user_id = ud.id
             ${where}
             ORDER BY c.date_candidature DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            candidatures: result.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        console.error('Erreur liste candidatures admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 9. LISTE DES AVIS
// ─────────────────────────────────────────────
router.get('/avis', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM avis`);
        const result = await pool.query(
            `SELECT a.id, a.note, a.commentaire, a.created_at,
                COALESCE(ap_auteur.nom, u_auteur.email) AS auteur_nom,
                u_auteur.email AS auteur_email,
                COALESCE(ap_cible.nom, sd_cible.nom_structure, u_cible.email) AS cible_nom,
                u_cible.email AS cible_email,
                u_cible.role AS cible_role
             FROM avis a
             JOIN users u_auteur ON u_auteur.id = a.auteur_id
             LEFT JOIN animateurs_profiles ap_auteur ON ap_auteur.user_id = u_auteur.id
             JOIN users u_cible ON u_cible.id = a.cible_id
             LEFT JOIN animateurs_profiles ap_cible ON ap_cible.user_id = u_cible.id
             LEFT JOIN structures_directeurs sd_cible ON sd_cible.user_id = u_cible.id
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            avis: result.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        console.error('Erreur liste avis admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 10. SUPPRIMER UN AVIS
// ─────────────────────────────────────────────
router.delete('/avis/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT id FROM avis WHERE id = $1', [id]);
        if (!check.rows[0]) return res.status(404).json({ error: 'Avis introuvable.' });
        await pool.query('DELETE FROM avis WHERE id = $1', [id]);
        res.json({ message: 'Avis supprimé.' });
    } catch (err) {
        console.error('Erreur suppression avis admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 11. LISTE DES DIPLÔMES À VALIDER
// ─────────────────────────────────────────────
router.get('/diplomes', authenticateToken, requireAdmin, async (req, res) => {
    const { statut = 'en_attente', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const countRes = await pool.query(
            `SELECT COUNT(*) FROM diplomes WHERE statut = $1`, [statut]
        );
        const result = await pool.query(
            `SELECT d.*,
                u.email AS user_email,
                u.role AS user_role,
                COALESCE(ap.nom, sd.nom_structure, u.email) AS user_nom
             FROM diplomes d
             JOIN users u ON u.id = d.user_id
             LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
             LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
             WHERE d.statut = $1
             ORDER BY d.created_at ASC
             LIMIT $2 OFFSET $3`,
            [statut, limit, offset]
        );

        res.json({
            diplomes: result.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(countRes.rows[0].count / limit),
        });
    } catch (err) {
        console.error('Erreur liste diplômes admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 12. VALIDER OU REFUSER UN DIPLÔME
// ─────────────────────────────────────────────
router.patch('/diplomes/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { statut, commentaire } = req.body;

    if (!['validé', 'refusé'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide.' });
    }

    try {
        const result = await pool.query(
            `UPDATE diplomes
             SET statut = $1, commentaire_admin = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *, (SELECT email FROM users WHERE id = user_id) AS user_email`,
            [statut, commentaire || null, id]
        );

        if (!result.rows.length) return res.status(404).json({ error: 'Diplôme introuvable.' });

        const diplome = result.rows[0];
        try {
            const emoji = statut === 'validé' ? '✅' : '❌';
            const msg = statut === 'validé'
                ? `${emoji} Votre diplôme ${diplome.type} a été validé !`
                : `${emoji} Votre diplôme ${diplome.type} a été refusé.${commentaire ? ` Raison : ${commentaire}` : ''}`;
            const { createNotif } = await import('./notifications.js');
            await createNotif(diplome.user_id, 'diplome', msg);
        } catch {}

        res.json(diplome);
    } catch (err) {
        console.error('Erreur validation diplôme admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 13. PROFIL COMPLET D'UN UTILISATEUR
// ─────────────────────────────────────────────
router.get('/users/:id/profile', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query(`
            SELECT u.id, u.email, u.role, u.created_at, u.email_verified,
                ap.nom, ap.age, ap.ville, ap.diplomes, ap.competences,
                ap.experiences, ap.disponibilites, ap.photo_url, ap.cv_url,
                sd.nom_structure, sd.type_structure, sd.ville AS ville_structure,
                sd.description AS description_structure, sd.flyer_url
            FROM users u
            LEFT JOIN animateurs_profiles ap ON ap.user_id = u.id
            LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
            WHERE u.id = $1
        `, [id]);

        if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });

        const [candidaturesRes, sejoursRes, avisRes] = await Promise.all([
            pool.query(`
                SELECT c.id, c.statut, c.date_candidature, s.titre, s.lieu
                FROM candidatures c
                JOIN sejours s ON s.id = c.sejour_id
                WHERE c.animateur_id = $1
                ORDER BY c.date_candidature DESC LIMIT 10
            `, [id]),
            pool.query(`
                SELECT id, titre, lieu, date_debut, date_fin, nombre_postes, created_at
                FROM sejours WHERE directeur_id = $1
                ORDER BY created_at DESC LIMIT 10
            `, [id]),
            pool.query(`
                SELECT a.note, a.commentaire, a.created_at,
                    COALESCE(ap2.nom, ua.email) AS auteur_nom
                FROM avis a
                JOIN users ua ON ua.id = a.auteur_id
                LEFT JOIN animateurs_profiles ap2 ON ap2.user_id = ua.id
                WHERE a.cible_id = $1
                ORDER BY a.created_at DESC
            `, [id]),
        ]);

        res.json({
            ...userRes.rows[0],
            candidatures: candidaturesRes.rows,
            sejours: sejoursRes.rows,
            avis_recus: avisRes.rows,
        });
    } catch (err) {
        console.error('Erreur profil user admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ─────────────────────────────────────────────
// 14. IMPERSONATION (connexion en tant qu'un user)
// ─────────────────────────────────────────────
router.post('/users/:id/impersonate', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
        if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        if (userRes.rows[0].role === 'admin') {
            return res.status(403).json({ error: 'Impossible d\'impersonifier un admin.' });
        }

        const token = jwt.sign(
            { id: userRes.rows[0].id, email: userRes.rows[0].email, role: userRes.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: userRes.rows[0] });
    } catch (err) {
        console.error('Erreur impersonification :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
