import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// INSCRIPTION
router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, verification_token, email_verified)
             VALUES ($1, $2, $3, $4, false) RETURNING id, email, role`,
            [email, hashed, role, verificationToken]
        );

        const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}?verify=${verificationToken}`;
        sendVerificationEmail({ email, verifyUrl }).catch(err =>
            console.error('[register] Erreur email vérification :', err.message)
        );

        res.json({ ...result.rows[0], emailSent: true });
    } catch (err) {
        console.error("ERREUR SQL :", err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// VÉRIFICATION EMAIL
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const result = await pool.query(
            `UPDATE users SET email_verified = true, verification_token = NULL
             WHERE verification_token = $1 RETURNING id, email, role`,
            [token]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Lien invalide ou déjà utilisé.' });
        }
        res.json({ message: 'Email vérifié avec succès !', user: result.rows[0] });
    } catch (err) {
        console.error('Erreur verify-email :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// RENVOYER L'EMAIL DE VÉRIFICATION
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis.' });
    try {
        const userRes = await pool.query(
            `SELECT id, email_verified FROM users WHERE email = $1`, [email]
        );
        if (userRes.rows.length === 0 || userRes.rows[0].email_verified) {
            return res.json({ message: 'Si ce compte existe et n\'est pas vérifié, un nouvel email a été envoyé.' });
        }
        const newToken = crypto.randomBytes(32).toString('hex');
        await pool.query(`UPDATE users SET verification_token = $1 WHERE email = $2`, [newToken, email]);
        const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}?verify=${newToken}`;
        sendVerificationEmail({ email, verifyUrl }).catch(() => {});
        res.json({ message: 'Email de vérification renvoyé !' });
    } catch (err) {
        console.error('Erreur resend-verification :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// CONNEXION
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Utilisateur introuvable' });
        }

        const user = result.rows[0];

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            emailVerified: user.email_verified === true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("ERREUR LOGIN :", err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// MOT DE PASSE OUBLIÉ — demande de réinitialisation
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis.' });

    try {
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        // On répond toujours la même chose (sécurité : éviter l'énumération d'emails)
        if (result.rows.length === 0) {
            return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [token, expires, email]
        );

        const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}?reset=${token}`;

        // Envoi email non-bloquant : l'erreur n'interrompt pas la réponse
        sendPasswordResetEmail({ email, resetUrl }).catch(err =>
            console.error('[forgot-password] Erreur email non-bloquante :', err.message)
        );

        // En mode dev (sans SMTP configuré), on affiche le lien dans les logs serveur
        if (!process.env.SMTP_USER || process.env.SMTP_USER === 'votre@gmail.com') {
            console.log(`\n🔑 [DEV] Lien de réinitialisation pour ${email} :\n${resetUrl}\n`);
        }

        res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    } catch (err) {
        console.error('Erreur forgot-password :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// MOT DE PASSE OUBLIÉ — réinitialisation avec token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token et nouveau mot de passe requis.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });

    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Lien invalide ou expiré. Recommencez la demande.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [hashed, result.rows[0].id]
        );

        res.json({ message: 'Mot de passe mis à jour avec succès !' });
    } catch (err) {
        console.error('Erreur reset-password :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// CHANGER SON MOT DE PASSE (connecté)
router.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
        res.json({ message: 'Mot de passe mis à jour avec succès !' });
    } catch (err) {
        console.error('Erreur change-password :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// CHANGER SON EMAIL (connecté)
router.put('/change-email', authenticateToken, async (req, res) => {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) return res.status(400).json({ error: 'Champs requis.' });

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!isValid) return res.status(400).json({ error: 'Mot de passe incorrect.' });

        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, req.user.id]);
        res.json({ message: 'Email mis à jour avec succès !', email: newEmail });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        console.error('Erreur change-email :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
