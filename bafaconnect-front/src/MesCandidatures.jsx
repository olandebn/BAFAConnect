import { useEffect, useState } from 'react';
import api from './api/axios';

const statutColor = (statut) => {
  if (statut === 'acceptée' || statut === 'acceptee') return 'var(--color-success, #22c55e)';
  if (statut === 'refusée' || statut === 'refusee') return 'var(--color-danger, #ef4444)';
  return 'var(--color-warning, #f59e0b)';
};

function MesCandidatures({ onContacter }) {
  const [candidatures, setCandidatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMesCandidatures();
  }, []);

  const fetchMesCandidatures = () => {
    setIsLoading(true);
    api.get('/candidatures/me')
      .then(res => setCandidatures(res.data))
      .catch(err => {
        console.error("Erreur récup candidatures :", err);
        setError("Impossible de charger vos candidatures.");
      })
      .finally(() => setIsLoading(false));
  };

  if (isLoading) {
    return (
      <div className="candidatures-section">
        <h2 className="candidatures-title">📂 Mes candidatures</h2>
        <p className="candidatures-empty">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="candidatures-section">
      <h2 className="candidatures-title">📂 Mes candidatures</h2>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}

      {candidatures.length === 0 ? (
        <p className="candidatures-empty">Vous n'avez pas encore postulé à des séjours.</p>
      ) : (
        <div className="candidatures-list">
          {candidatures.map(c => (
            <div key={c.id} className="candidature-item">
              <div className="candidature-info">
                <h4 className="candidature-titre">{c.sejour_titre || c.titre || '—'}</h4>
                {c.lieu && (
                  <span className="candidature-lieu">📍 {c.lieu}</span>
                )}
              </div>
              <div className="candidature-actions">
                <div className="candidature-statut-badge" style={{ color: statutColor(c.statut) }}>
                  {(c.statut || '').toUpperCase()}
                </div>
                {onContacter && c.directeur_id && (
                  <button
                    className="btn-contacter"
                    onClick={() => onContacter({ id: c.directeur_id, nom: 'Directeur', role: 'directeur' })}
                  >
                    💬 Contacter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesCandidatures;
