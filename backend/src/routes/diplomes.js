import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { createNotif } from './notifications.js';

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rzjfhucnftglbdvgosld.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || '';

// Types de diplômes acceptés
const TYPES_DIPLOMES = ['BAFA', 'BAFD', 'BPJEPS', 'DEUST', 'Licence STAPS', 'PSC1', 'Autre'];

// 1. SOUMETTRE UN DIPLÔME
router.post('/', authenticateToken, async (req, res) => {
    const { id: user_id } = req.user;
    const { type, fichier_url, fichier_nom } = req.body;

    if (!type || !fichier_url || !fichier_nom) {
        return res.status(400).json({ error: 'Type, fichier_url et fichier_nom sont requis.' });
    }
    if (!TYPES_DIPLOMES.includes(type)) {
        return res.status(400).json({ error: 'Type de diplôme invalide.' });
    }

    try {
        // Vérifier si ce type est déjà soumis (en attente ou validé)
        const existing = await pool.query(
            `SELECT id, statut FROM diplomes WHERE user_id = $1 AND type = $2 AND statut != 'refusé'`,
            [user_id, type]
        );
        if (existing.rows.length > 0) {
            const statut = existing.rows[0].statut;
            return res.status(409).json({
                error: statut === 'validé'
                    ? `Votre diplôme ${type} est déjà validé.`
                    : `Votre diplôme ${type} est déjà en cours de vérification.`
            });
        }

        const result = await pool.query(
            `INSERT INTO diplomes (user_id, type, fichier_url, fichier_nom)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, type, fichier_url, fichier_nom]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur soumission diplôme :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 2. MES DIPLÔMES
router.get('/mes', authenticateToken, async (req, res) => {
    const { id: user_id } = req.user;
    try {
        const result = await pool.query(
            `SELECT * FROM diplomes WHERE user_id = $1 ORDER BY created_at DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 3. SUPPRIMER UN DIPLÔME (seulement si refusé ou en attente)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id: user_id } = req.user;
    const { id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM diplomes WHERE id = $1 AND user_id = $2 AND statut != 'validé' RETURNING id`,
            [id, user_id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Diplôme introuvable ou déjà validé.' });
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 4. DIPLÔMES VALIDÉS D'UN UTILISATEUR (public)
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT type, created_at, updated_at FROM diplomes
             WHERE user_id = $1 AND statut = 'validé'
             ORDER BY type ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
