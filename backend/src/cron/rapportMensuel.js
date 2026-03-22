/**
 * Rapport mensuel automatique pour les directeurs
 * Déclenché le 1er de chaque mois à 8h00
 *
 * Envoie un email récapitulatif avec :
 *  - Nombre d'annonces actives
 *  - Nombre de candidatures reçues ce mois
 *  - Taux d'acceptation
 *  - Nombre de places pourvues
 */

import cron from 'node-cron';
import { pool } from '../db.js';
import { sendMail } from '../emailService.js';

async function genererRapport(directeurId, email, nomDirecteur) {
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
  const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 0, 23, 59, 59);
  const moisLabel = debutMois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  try {
    // Stats séjours actifs
    const sejoursRes = await pool.query(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN date_fin IS NULL OR date_fin >= NOW() THEN 1 ELSE 0 END) AS actifs
       FROM sejours WHERE directeur_id = $1`,
      [directeurId]
    );

    // Candidatures reçues ce mois
    const candRes = await pool.query(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN c.statut = 'acceptée' OR c.statut = 'acceptee' THEN 1 ELSE 0 END) AS acceptees,
        SUM(CASE WHEN c.statut = 'refusée' OR c.statut = 'refusee' THEN 1 ELSE 0 END) AS refusees,
        SUM(CASE WHEN c.statut = 'en attente' THEN 1 ELSE 0 END) AS en_attente
       FROM candidatures c
       JOIN sejours s ON s.id = c.sejour_id
       WHERE s.directeur_id = $1
         AND c.date_candidature BETWEEN $2 AND $3`,
      [directeurId, debutMois, finMois]
    );

    // Top séjours (les plus candidatés ce mois)
    const topRes = await pool.query(
      `SELECT s.titre, COUNT(c.id) AS nb_candidatures
       FROM sejours s
       LEFT JOIN candidatures c ON c.sejour_id = s.id
         AND c.date_candidature BETWEEN $2 AND $3
       WHERE s.directeur_id = $1
       GROUP BY s.id, s.titre
       ORDER BY nb_candidatures DESC
       LIMIT 5`,
      [directeurId, debutMois, finMois]
    );

    const stats = sejoursRes.rows[0];
    const cand = candRes.rows[0];
    const top = topRes.rows;
    const taux = cand.total > 0 ? Math.round((cand.acceptees / cand.total) * 100) : 0;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const topTableRows = top.map(s => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${s.titre}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:600;color:#6366f1;">${s.nb_candidatures}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:16px;">
        <div style="background:#6366f1;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
          <h2 style="color:white;margin:0;font-size:1.4rem;">📊 Rapport mensuel BafaConnect</h2>
          <p style="color:#c7d2fe;margin:8px 0 0;font-size:0.95rem;">
            ${moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1)}
          </p>
        </div>

        <p style="color:#475569;margin:0 0 24px;">Bonjour ${nomDirecteur || 'Directeur'} 👋,</p>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
          Voici le résumé de votre activité sur BafaConnect pour le mois de ${moisLabel}.
        </p>

        <!-- Chiffres clés -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:white;border-radius:10px;padding:18px;text-align:center;border:1px solid #e2e8f0;">
            <div style="font-size:1.8rem;font-weight:800;color:#6366f1;">${stats.actifs ?? 0}</div>
            <div style="font-size:0.82rem;color:#64748b;margin-top:4px;">Séjours actifs</div>
          </div>
          <div style="background:white;border-radius:10px;padding:18px;text-align:center;border:1px solid #e2e8f0;">
            <div style="font-size:1.8rem;font-weight:800;color:#0ea5e9;">${cand.total ?? 0}</div>
            <div style="font-size:0.82rem;color:#64748b;margin-top:4px;">Candidatures reçues</div>
          </div>
          <div style="background:white;border-radius:10px;padding:18px;text-align:center;border:1px solid #e2e8f0;">
            <div style="font-size:1.8rem;font-weight:800;color:#22c55e;">${cand.acceptees ?? 0}</div>
            <div style="font-size:0.82rem;color:#64748b;margin-top:4px;">Candidatures acceptées</div>
          </div>
          <div style="background:white;border-radius:10px;padding:18px;text-align:center;border:1px solid #e2e8f0;">
            <div style="font-size:1.8rem;font-weight:800;color:${taux >= 60 ? '#22c55e' : taux >= 30 ? '#f59e0b' : '#ef4444'};">${taux}%</div>
            <div style="font-size:0.82rem;color:#64748b;margin-top:4px;">Taux d'acceptation</div>
          </div>
        </div>

        <!-- Top séjours -->
        ${top.length > 0 ? `
        <div style="background:white;border-radius:10px;padding:18px;margin-bottom:24px;border:1px solid #e2e8f0;">
          <h3 style="margin:0 0 12px;font-size:0.95rem;color:#0f172a;">🏕️ Séjours les plus demandés ce mois</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;text-align:left;font-size:0.78rem;color:#64748b;font-weight:600;">Séjour</th>
                <th style="padding:8px 12px;text-align:center;font-size:0.78rem;color:#64748b;font-weight:600;">Candidatures</th>
              </tr>
            </thead>
            <tbody>${topTableRows}</tbody>
          </table>
        </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align:center;margin:28px 0;">
          <a href="${appUrl}"
             style="display:inline-block;background:#6366f1;color:white;padding:13px 32px;
                    border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;">
            Voir mon espace directeur →
          </a>
        </div>

        <p style="color:#94a3b8;font-size:0.8rem;text-align:center;margin:0;">
          BafaConnect · Ce rapport est envoyé automatiquement le 1er de chaque mois.<br>
          Pour vous désabonner, modifiez vos préférences dans les Paramètres.
        </p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: `📊 BafaConnect — Votre rapport ${moisLabel}`,
      html,
    });

    console.log(`✅ Rapport mensuel envoyé à ${email} (${moisLabel})`);
  } catch (err) {
    console.error(`❌ Erreur rapport mensuel pour ${email} :`, err.message);
  }
}

export function startRapportMensuel() {
  // Déclencher le 1er de chaque mois à 8h00
  cron.schedule('0 8 1 * *', async () => {
    console.log('📅 Lancement du rapport mensuel BafaConnect...');

    try {
      // Récupérer tous les directeurs qui ont au moins un séjour
      const directeursRes = await pool.query(
        `SELECT DISTINCT u.id, u.email,
            COALESCE(sd.nom_structure, u.email) AS nom
         FROM users u
         JOIN sejours s ON s.directeur_id = u.id
         LEFT JOIN structures_directeurs sd ON sd.user_id = u.id
         WHERE u.role = 'directeur'`
      );

      for (const directeur of directeursRes.rows) {
        await genererRapport(directeur.id, directeur.email, directeur.nom);
        // Pause entre les envois pour éviter le spam
        await new Promise(r => setTimeout(r, 500));
      }

      console.log(`📧 Rapports mensuels envoyés à ${directeursRes.rows.length} directeur(s).`);
    } catch (err) {
      console.error('Erreur cron rapport mensuel :', err.message);
    }
  }, {
    timezone: 'Europe/Paris',
  });

  console.log('⏰ Cron rapport mensuel initialisé (1er de chaque mois à 8h00)');
}

// Export pour tests/déclenchement manuel
export { genererRapport };
