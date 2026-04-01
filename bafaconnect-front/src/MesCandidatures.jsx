import { useEffect, useState } from 'react';
import api from './api/axios';
import ContratModal from './ContratModal';

const isEnAttenteLong = (c) => {
  if (c.statut !== 'en attente') return false;
  const date = new Date(c.date_candidature);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : null;

// ─── Timeline visuelle : Envoyée → Vue → Décision ───────────────────
function CandidatureTimeline({ candidature: c }) {
  const isAcceptee = c.statut === 'acceptée' || c.statut === 'acceptee';
  const isRefusee  = c.statut === 'refusée'  || c.statut === 'refusee';
  const hasDecision = isAcceptee || isRefusee;
  const isVue = !!c.vue_le;

  const steps = [
    {
      key: 'envoyee',
      icon: '📩',
      label: 'Envoyée',
      date: fmtDate(c.date_candidature),
      done: true,
      color: 'green',
    },
    {
      key: 'vue',
      icon: isVue ? '👁️' : '⏳',
      label: isVue ? 'Consultée' : 'En attente',
      date: isVue ? fmtDate(c.vue_le) : null,
      done: isVue,
      color: isVue ? 'blue' : 'gray',
    },
    {
      key: 'decision',
      icon: isAcceptee ? '✅' : isRefusee ? '❌' : '⏳',
      label: isAcceptee ? 'Acceptée' : isRefusee ? 'Refusée' : 'En attente',
      date: null,
      done: hasDecision,
      color: isAcceptee ? 'green' : isRefusee ? 'red' : 'gray',
    },
  ];

  return (
    <div className="candidature-timeline">
      {steps.map((step, i) => (
        <div key={step.key} className="timeline-step-wrapper">
          <div className={`timeline-step timeline-step--${step.color}`}>
            <div className="timeline-icon">{step.icon}</div>
            <div className="timeline-label">{step.label}</div>
            {step.date && <div className="timeline-date">{step.date}</div>}
          </div>
          {i < steps.length - 1 && (
            <div className={`timeline-connector ${steps[i + 1].done ? 'timeline-connector--done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function MesCandidatures({ onContacter }) {
  const [candidatures, setCandidatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [relanceLoading, setRelanceLoading] = useState(null);
  const [relanceMsg, setRelanceMsg] = useState({});
  const [contratId, setContratId] = useState(null);

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
    <>
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
            const isAcceptee = c.statut === 'acceptée' || c.statut === 'acceptee';
            return (
              <div key={c.id} className="candidature-item">
                <div className="candidature-info">
                  <h4 className="candidature-titre">{c.sejour_titre || c.titre || '—'}</h4>
                  {c.lieu && <span className="candidature-lieu">📍 {c.lieu}</span>}
                  {peutRelancer && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning, #d97706)', marginTop: 2 }}>
                      ⚠️ En attente depuis +7 jours
                    </span>
                  )}
                </div>

                {/* ─── TIMELINE ─── */}
                <CandidatureTimeline candidature={c} />

                <div className="candidature-actions">
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
                  {isAcceptee && (
                    <button
                      className="btn-contrat"
                      onClick={() => setContratId(c.id)}
                    >
                      📄 Contrat
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

    {contratId && (
      <ContratModal
        candidatureId={contratId}
        onClose={() => setContratId(null)}
      />
    )}
    </>
  );
}

export default MesCandidatures;
