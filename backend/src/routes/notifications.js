import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import webpush from 'web-push';

// Configurer web-push si les clés VAPID sont présentes
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:contact@bafaconnect.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const router = express.Router();

// ── Helper exporté pour créer une notif depuis d'autres routes ──
export async function createNotif(userId, type, contenu) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, contenu) VALUES ($1, $2, $3)`,
      [userId, type, contenu]
    );
  } catch (err) {
    console.error('Erreur création notification :', err.message);
  }
}

// GET /notifications — mes notifications (20 dernières)
router.get('/', authenticateToken, async (req, res) => {
  const { id } = req.user;
  try {
    const result = await pool.query(
      `SELECT id, type, contenu, lu, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [id]
    );
    const nonLues = result.rows.filter(n => !n.lu).length;
    res.json({ notifications: result.rows, nonLues });
  } catch (err) {
    console.error('Erreur GET notifications :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /notifications/read — marquer toutes comme lues
router.put('/read', authenticateToken, async (req, res) => {
  const { id } = req.user;
  try {
    await pool.query(
      `UPDATE notifications SET lu = true WHERE user_id = $1 AND lu = false`,
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur PUT notifications/read :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /notifications/push-subscribe — enregistrer une subscription push
router.post('/push-subscribe', authenticateToken, async (req, res) => {
  const { id } = req.user;
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Subscription invalide.' });

  try {
    // Créer la table si elle n'existe pas (migration inline simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        subscription JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Upsert la subscription
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET subscription = $3, user_id = $1`,
      [id, subscription.endpoint, JSON.stringify(subscription)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur push-subscribe :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /notifications/push-unsubscribe — supprimer une subscription
router.post('/push-unsubscribe', authenticateToken, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Endpoint requis.' });
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction helper pour envoyer un push à un utilisateur
export async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // Push non configuré
  try {
    const result = await pool.query(
      'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    for (const row of result.rows) {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 410) {
          // Subscription expirée → la supprimer
          await pool.query('DELETE FROM push_subscriptions WHERE subscription = $1', [JSON.stringify(row.subscription)]);
        }
      }
    }
  } catch (err) {
    console.error('Erreur sendPushToUser :', err.message);
  }
}

// DELETE /notifications/:id — supprimer une notif
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.user;
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
