import { useEffect, useState } from 'react';
import api from './api/axios';

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TauxBar({ taux }) {
  const color = taux >= 60 ? '#22c55e' : taux >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="taux-bar-wrapper">
      <div className="taux-bar-track">
        <div
          className="taux-bar-fill"
          style={{ width: `${taux}%`, background: color }}
        />
      </div>
      <span className="taux-bar-label" style={{ color }}>{taux}%</span>
    </div>
  );
}

function DashboardDirecteur() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voirTout, setVoirTout] = useState(false);

  useEffect(() => {
    api.get('/sejours/stats')
      .then(res => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="candidatures-empty">Chargement du tableau de bord...</p>;
  if (error) return <div className="profile-alert profile-alert-error">{error}</div>;
  if (!stats) return null;

  const annonces = stats.candidatures_par_annonce || [];
  const affichees = voirTout ? annonces : annonces.slice(0, 5);

  return (
    <div className="dashboard-v2">

      {/* ── Chiffres clés ── */}
      <div className="stats-grid">
        <StatCard icon="📋" value={stats.nb_annonces} label="Annonce publiée" />
        <StatCard icon="📩" value={stats.nb_candidatures} label="Candidature reçue" />
        <StatCard
          icon="✅"
          value={stats.nb_acceptees}
          label="Acceptée"
          color="#22c55e"
        />
        <StatCard
          icon="⏳"
          value={stats.nb_en_attente}
          label="En attente"
          color="#f59e0b"
        />
        <StatCard
          icon="💬"
          value={stats.nb_animateurs_contactes ?? '—'}
          label="Animateur contacté"
          color="#6366f1"
        />
        <StatCard
          icon="❤️"
          value={stats.nb_favoris ?? '—'}
          label="Favori"
          color="#ec4899"
        />
      </div>

      {/* ── Taux d'acceptation ── */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">Taux d'acceptation global</h3>
          <span className="dashboard-section-hint">
            {stats.nb_acceptees} accepté{stats.nb_acceptees !== 1 ? 's' : ''} sur {stats.nb_candidatures} candidature{stats.nb_candidatures !== 1 ? 's' : ''}
          </span>
        </div>
        <TauxBar taux={stats.taux_acceptation} />
      </div>

      {/* ── Séjours à venir ── */}
      {stats.nb_sejours_a_venir > 0 && (
        <div className="dashboard-banner-avenir">
          <span className="dashboard-banner-icon">📅</span>
          <span>
            <strong>{stats.nb_sejours_a_venir}</strong> séjour{stats.nb_sejours_a_venir > 1 ? 's' : ''} à venir — pensez à vérifier vos candidatures en attente !
          </span>
        </div>
      )}

      {/* ── Candidatures par annonce ── */}
      {annonces.length > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Candidatures par annonce</h3>
          </div>
          <div className="annonces-stats-list">
            {affichees.map(a => {
              const taux = a.nb_total > 0 ? Math.round((a.nb_acceptees / a.nb_total) * 100) : 0;
              const color = taux >= 60 ? '#22c55e' : taux >= 30 ? '#f59e0b' : '#94a3b8';
              return (
                <div key={a.id} className="annonce-stats-row">
                  <div className="annonce-stats-left">
                    <span className="annonce-stats-titre">{a.titre}</span>
                    <div className="annonce-stats-meta">
                      {a.lieu && <span>📍 {a.lieu}</span>}
                      {a.date_debut && (
                        <span>🗓️ {new Date(a.date_debut).toLocaleDateString('fr-FR')}</span>
                      )}
                      {a.type && <span className="annonce-item-type">{a.type}</span>}
                    </div>
                  </div>
                  <div className="annonce-stats-right">
                    <span className="annonce-stats-count">
                      {a.nb_total} candidature{a.nb_total !== 1 ? 's' : ''}
                    </span>
                    {a.nb_en_attente > 0 && (
                      <span className="annonce-stats-attente">⏳ {a.nb_en_attente} en attente</span>
                    )}
                    {a.nb_total > 0 && (
                      <span className="annonce-stats-taux" style={{ color }}>
                        {taux}% acceptés
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {annonces.length > 5 && (
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: '0.85rem' }}
              onClick={() => setVoirTout(v => !v)}>
              {voirTout ? 'Réduire' : `Voir les ${annonces.length - 5} autres annonces`}
            </button>
          )}
        </div>
      )}

      {annonces.length === 0 && (
        <div className="empty-state">
          <span>📋</span>
          <p>Publiez votre première annonce pour commencer à recevoir des candidatures.</p>
        </div>
      )}
    </div>
  );
}

export default DashboardDirecteur;
