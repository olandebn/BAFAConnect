import { useEffect, useState } from 'react';
import api from './api/axios';

const statutColor = (statut) => {
  if (statut === 'acceptée' || statut === 'acceptee') return 'var(--color-success, #22c55e)';
  if (statut === 'refusée' || statut === 'refusee') return 'var(--color-danger, #ef4444)';
  return 'var(--color-warning, #f59e0b)';
};

const isEnAttenteLong = (c) => {
  if (c.statut !== 'en attente') return false;
  const date = new Date(c.date_candidature);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
};

function MesCandidatures({ onContacter }) {
  const [candidatures, setCandidatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [relanceLoading, setRelanceLoading] = useState(null);
  const [relanceMsg, setRelanceMsg] = useState({});

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

  const handleRelancer = async (c) => {
    if (!c.directeur_id) return;
    setRelanceLoading(c.id);
    try {
      const contenu = `Bonjour, je me permets de relancer ma candidature pour le séjour "${c.sejour_titre || 'votre séjour'}". Je reste disponible et très intéressé(e). Merci d'avance pour votre retour.`;
      await api.post('/messages', {
        destinataire_id: c.directeur_id,
        contenu
      });
      setRelanceMsg(prev => ({ ...prev, [c.id]: { type: 'success', text: '📬 Message de relance envoyé !' } }));
    } catch (err) {
      setRelanceMsg(prev => ({ ...prev, [c.id]: { type: 'error', text: 'Erreur lors de l\'envoi.' } }));
    } finally {
      setRelanceLoading(null);
      setTimeout(() => setRelanceMsg(prev => { const next = { ...prev }; delete next[c.id]; return next; }), 5000);
    }
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
          {candidatures.map(c => {
            const peutRelancer = isEnAttenteLong(c);
            const msg = relanceMsg[c.id];
            return (
              <div key={c.id} className="candidature-item">
                <div className="candidature-info">
                  <h4 className="candidature-titre">{c.sejour_titre || c.titre || '—'}</h4>
                  {c.lieu && (
                    <span className="candidature-lieu">📍 {c.lieu}</span>
                  )}
                  {c.date_candidature && (
                    <span className="candidature-date-hint">
                      Postulé le {new Date(c.date_candidature).toLocaleDateString('fr-FR')}
                      {peutRelancer && <span style={{ color: 'var(--warning, #d97706)', marginLeft: 6 }}>· En attente depuis +7 jours</span>}
                    </span>
                  )}
                  {c.vue_le
                    ? <span className="candidature-vue-badge">👁️ Vu le {new Date(c.vue_le).toLocaleDateString('fr-FR')}</span>
                    : c.statut === 'en attente' && <span className="candidature-non-vue-badge">⏳ Pas encore consulté</span>
                  }
                </div>
                <div className="candidature-actions">
                  <div className="candidature-statut-badge" style={{ color: statutColor(c.statut) }}>
                    {(c.statut || '').toUpperCase()}
                  </div>
                  {peutRelancer && (
                    <button
                      className="btn-relancer"
                      onClick={() => handleRelancer(c)}
                      disabled={relanceLoading === c.id}
                      title="Envoyer un message de relance au directeur"
                    >
                      {relanceLoading === c.id ? '...' : '📬 Relancer'}
                    </button>
                  )}
                  {onContacter && c.directeur_id && (
                    <button
                      className="btn-contacter"
                      onClick={() => onContacter({ id: c.directeur_id, nom: 'Directeur', role: 'directeur' })}
                    >
                      💬 Contacter
                    </button>
                  )}
                </div>
                {msg && (
                  <div className={`relance-toast ${msg.type}`}>{msg.text}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MesCandidatures;
