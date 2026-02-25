import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route pour récupérer son propre profil
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user; // Récupéré grâce au middleware !

        let query = '';
        
        // On adapte la requête SQL en fonction du rôle
        if (role === 'animateur') {
            query = `SELECT * FROM animateurs_profiles WHERE user_id = $1`;
        } else if (role === 'directeur') {
            query = `SELECT * FROM structures_directeurs WHERE user_id = $1`;
        }

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Profil non trouvé. Veuillez le compléter." });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Erreur récupération profil :", err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour créer ou mettre à jour son profil
router.post('/me', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user; // Toujours grâce au middleware !
        
        if (role === 'animateur') {
            // On récupère les champs envoyés par l'animateur
            const { nom, age, ville, diplomes, competences, experiences, disponibilites } = req.body;

            const query = `
                INSERT INTO animateurs_profiles (user_id, nom, age, ville, diplomes, competences, experiences, disponibilites)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) DO UPDATE SET
                    nom = EXCLUDED.nom,
                    age = EXCLUDED.age,
                    ville = EXCLUDED.ville,
                    diplomes = EXCLUDED.diplomes,
                    competences = EXCLUDED.competences,
                    experiences = EXCLUDED.experiences,
                    disponibilites = EXCLUDED.disponibilites
                RETURNING *;
            `;
            
            const values = [id, nom, age, ville, diplomes || [], competences || [], experiences || [], disponibilites || {}];
            const result = await pool.query(query, values);
            return res.json({ message: "Profil animateur mis à jour", profil: result.rows[0] });

        } else if (role === 'directeur') {
            // On récupère les champs envoyés par le directeur
            const { nom_structure, type_structure, ville, description } = req.body;

            const query = `
                INSERT INTO structures_directeurs (user_id, nom_structure, type_structure, ville, description)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET
                    nom_structure = EXCLUDED.nom_structure,
                    type_structure = EXCLUDED.type_structure,
                    ville = EXCLUDED.ville,
                    description = EXCLUDED.description
                RETURNING *;
            `;
            
            const values = [id, nom_structure, type_structure, ville, description];
            const result = await pool.query(query, values);
            return res.json({ message: "Profil structure mis à jour", profil: result.rows[0] });
        }

    } catch (err) {
        console.error("Erreur mise à jour profil :", err);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
    }
});

export default router;