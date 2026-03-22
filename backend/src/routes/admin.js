import express from 'express';
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

// 1. STATISTIQUES GLOBALES
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users, sejours, candidatures, messages, avis] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS total,
                SUM(CASE WHEN role='animateur' THEN 1 ELSE 0 END) AS animateurs,
                SUM(CASE WHEN role='directeur' THEN 1 ELSE 0 END) AS directeurs,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS nouveaux_30j
                FROM users WHERE role != 'admin'`),
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
        ]);

        res.json({
            users: users.rows[0],
            sejours: sejours.rows[0],
            candidatures: candidatures.rows[0],
            messages: messages.rows[0],
            avis: avis.rows[0],
        });
    } catch (err) {
        console.error('Erreur stats admin :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 2. LISTE DES UTILISATEURS (avec pagination + recherche)
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
             ${where}`,
            params
        );

        params.push(limit, offset);
        const usersRes = await pool.query(
            `SELECT u.id, u.email, u.role, u.created_at,
                COALESCE(ap.nom, sd.nom_structure) AS nom,
                ap.ville, sd.ville AS ville_structure
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

// 3. SUPPRIMER UN UTILISATEUR
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Vérifier que ce n'est pas un admin
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

// 4. LISTE DES SÉJOURS (avec pagination)
router.get('/sejours', authenticateToken, requireAdmin, async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const params = search ? [`%${search}%`] : [];
        const where = search ? 'WHERE s.titre ILIKE $1 OR s.lieu ILIKE $1' : '';

        const countRes = await pool.query(`SELECT COUNT(*) FROM sejours s LEFT JOIN users u ON u.id = s.directeur_id LEFT JOIN structures_directeurs sd ON sd.user_id = u.id ${where}`, params);
        params.push(limit, offset);
        const sejoursRes = await pool.query(
            `SELECT s.id, s.titre, s.lieu, s.date_debut, s.date_fin, s.created_at,
                COALESCE(sd.nom_structure, u.email) AS directeur_nom,
                u.email AS directeur_email
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

// 5. SUPPRIMER UN SÉJOUR
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

// 6. LISTE DES DIPLÔMES À VALIDER (admin)
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

// 7. VALIDER OU REFUSER UN DIPLÔME
router.patch('/diplomes/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { statut, commentaire } = req.body;

    if (!['validé', 'refusé'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées : validé, refusé.' });
    }

    try {
        const result = await pool.query(
            `UPDATE diplomes
             SET statut = $1, commentaire_admin = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *, (SELECT email FROM users WHERE id = user_id) AS user_email`,
            [statut, commentaire || null, id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Diplôme introuvable.' });
        }

        const diplome = result.rows[0];

        // Notif in-app pour l'utilisateur
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

export default router;
