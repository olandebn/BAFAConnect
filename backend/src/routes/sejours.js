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
             JOIN structures_directeurs ON sejours.directeur_id = structures_directeurs.user_id 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("ERREUR RÉCUPÉRATION SÉJOURS :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;