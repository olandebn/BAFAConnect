import { useEffect, useState } from 'react';
import api from './api/axios';

function GestionCandidatures({ onContacter }) {
  const [candidats, setCandidats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCandidats = () => {
    setIsLoading(true);
    api.get('/recrutement/candidats-recus')
      .then(res => setCandidats(res.data))
      .catch(err => {
        console.error("Erreur", err);
        setError("Impossible de charger les candidatures.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCandidats();
  }, []);

  const handleAction = async (id, nouveauStatut) => {
    setActionLoading(id);
    setError('');
    try {
      await api.patch(`/recrutement/candidatures/${id}`, { statut: nouveauStatut });
      fetchCandidats();
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoading(null);
    }
  };

  const statutLabel = (statut) => {
    if (statut === 'acceptée' || statut === 'acceptee') return { label: 'Acceptée', cls: 'statut-accepte' };
    if (statut === 'refusée' || statut === 'refusee') return { label: 'Refusée', cls: 'statut-refuse' };
    return { label: 'En attente', cls: 'statut-attente' };
  };

  return (
    <div className="candidatures-section">
      <h2 className="candidatures-title">📩 Candidatures reçues</h2>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}

      {isLoading ? (
        <p className="candidatures-empty">Chargement...</p>
      ) : candidats.length === 0 ? (
        <p className="candidatures-empty">Aucune candidature reçue pour le moment.</p>
      ) : (
        <div className="candidatures-list">
          {candidats.map(c => {
            const { label, cls } = statutLabel(c.statut);
            const loading = actionLoading === c.candidature_id;

            return (
              <div key={c.candidature_id} className="candidature-item candidature-item-directeur">
                <div className="candidature-info">
                  <h4 className="candidature-titre">{c.candidat_nom || 'Anonyme'}</h4>
                  <p className="candidature-lieu">Postule pour : <em>{c.sejour_titre}</em></p>
                  <span className={`candidature-statut-tag ${cls}`}>{label}</span>
                </div>

                <div className="candidature-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleAction(c.candidature_id, 'acceptée')}
                    disabled={loading || c.statut === 'acceptée' || c.statut === 'acceptee'}
                  >
                    {loading ? '...' : 'Accepter'}
                  </button>
                  <button
                    className="btn-refuse"
                    onClick={() => handleAction(c.candidature_id, 'refusée')}
                    disabled={loading || c.statut === 'refusée' || c.statut === 'refusee'}
                  >
                    {loading ? '...' : 'Refuser'}
                  </button>
                  {onContacter && (
                    <button
                      className="btn-contacter"
                      onClick={() => onContacter({ id: c.animateur_id, nom: c.candidat_nom, role: 'animateur' })}
                    >
                      💬 Contacter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GestionCandidatures;
