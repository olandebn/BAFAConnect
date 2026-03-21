import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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
