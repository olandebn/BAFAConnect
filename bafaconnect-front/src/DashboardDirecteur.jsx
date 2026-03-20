import { useEffect, useState } from 'react';
import api from './api/axios';

function DashboardDirecteur() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/sejours/stats')
      .then(res => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="candidatures-empty">Chargement des statistiques...</p>;
  if (error) return <div className="profile-alert profile-alert-error">{error}</div>;
  if (!stats) return null;

  const tauxColor =
    stats.taux_acceptation >= 50
      ? 'var(--green)'
      : stats.taux_acceptation > 0
        ? 'var(--warning)'
        : 'var(--muted)';

  return (
    <div className="dashboard-stats">
      <h2 className="candidatures-title">📊 Tableau de bord</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.nb_annonces}</div>
          <div className="stat-label">
            Annonce{stats.nb_annonces !== 1 ? 's' : ''} publiée{stats.nb_annonces !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📩</div>
          <div className="stat-value">{stats.nb_candidatures}</div>
          <div className="stat-label">
            Candidature{stats.nb_candidatures !== 1 ? 's' : ''} reçue{stats.nb_candidatures !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.nb_acceptees}</div>
          <div className="stat-label">Acceptée{stats.nb_acceptees !== 1 ? 's' : ''}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value" style={{ color: tauxColor }}>{stats.taux_acceptation}%</div>
          <div className="stat-label">Taux d'acceptation</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.nb_en_attente}</div>
          <div className="stat-label">En attente</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.nb_refusees}</div>
          <div className="stat-label">Refusée{stats.nb_refusees !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {stats.annonces_recentes.length > 0 && (
        <div className="stats-recentes">
          <h3 className="stats-recentes-title">Dernières annonces publiées</h3>
          {stats.annonces_recentes.map(a => (
            <div key={a.id} className="stats-annonce-item">
              <div className="stats-annonce-left">
                <strong>{a.titre}</strong>
                <div className="stats-annonce-meta">
                  <span>📍 {a.lieu}</span>
                  {a.type && <span className="annonce-item-type">{a.type}</span>}
                  {a.date_debut && (
                    <span>🗓️ {new Date(a.date_debut).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
              <span className="annonce-candidatures-count">
                📩 {a.nb_candidatures} candidature{a.nb_candidatures != 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardDirecteur;
