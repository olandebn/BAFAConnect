import { useEffect, useState, useRef } from 'react';
import api from './api/axios';

function Messagerie({ destinataireInitial = null, onNewMessage, onVoirProfil }) {
  const [conversations, setConversations] = useState([]);
  const [interlocuteurActif, setInterlocuteurActif] = useState(destinataireInitial);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const filRef = useRef(null);

  const monId = localStorage.getItem('userId');

  // Charger les conversations à l'ouverture + polling toutes les 10s
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Charger les messages quand l'interlocuteur change + polling toutes les 5s
  useEffect(() => {
    if (!interlocuteurActif) return;
    fetchMessages(interlocuteurActif.id);
    const interval = setInterval(() => fetchMessages(interlocuteurActif.id), 5000);
    return () => clearInterval(interval);
  }, [interlocuteurActif?.id]);

  // Scroll automatique vers le bas uniquement si déjà tout en bas
  useEffect(() => {
    const fil = filRef.current;
    if (!fil) return;
    const isAtBottom = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 80;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      // Si on a un destinataire initial et qu'il n'est pas encore dans les conversations, on l'ouvre quand même
      if (destinataireInitial && !interlocuteurActif) {
        setInterlocuteurActif(destinataireInitial);
      }
    } catch (err) {
      console.error('Erreur conversations :', err);
    }
  };

  const fetchMessages = async (userId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      // Mettre à jour le nb non lus dans la liste
      setConversations(prev =>
        prev.map(c => c.interlocuteur_id === userId ? { ...c, non_lus: 0 } : c)
      );
    } catch (err) {
      setError('Impossible de charger les messages.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !interlocuteurActif) return;

    setIsSending(true);
    try {
      const res = await api.post('/messages', {
        destinataire_id: interlocuteurActif.id,
        contenu: nouveauMessage.trim(),
      });
      setMessages(prev => [...prev, { ...res.data, expediteur_nom: 'Moi' }]);
      setNouveauMessage('');
      fetchConversations(); // Rafraîchir la liste
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  const ouvrirConversation = (conv) => {
    setInterlocuteurActif({ id: conv.interlocuteur_id, nom: conv.interlocuteur_nom, role: conv.interlocuteur_role });
    setError('');
  };

  const formatHeure = (dateStr) => {
    const d = new Date(dateStr);
    const maintenant = new Date();
    const hier = new Date(maintenant);
    hier.setDate(hier.getDate() - 1);

    if (d.toDateString() === maintenant.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (d.toDateString() === hier.toDateString()) {
      return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const totalNonLus = conversations.reduce((sum, c) => sum + Number(c.non_lus || 0), 0);

  return (
    <div className="messagerie-wrapper">
      {/* Panneau gauche : liste des conversations */}
      <div className="messagerie-sidebar">
        <div className="messagerie-sidebar-header">
          <h3>Messages {totalNonLus > 0 && <span className="badge-nonlus">{totalNonLus}</span>}</h3>
        </div>

        {conversations.length === 0 ? (
          <p className="messagerie-empty">Aucune conversation pour l'instant.</p>
        ) : (
          <ul className="messagerie-conv-list">
            {conversations.map(conv => (
              <li
                key={conv.interlocuteur_id}
                className={`messagerie-conv-item ${interlocuteurActif?.id === conv.interlocuteur_id ? 'active' : ''}`}
                onClick={() => ouvrirConversation(conv)}
              >
                <div className="conv-avatar">
                  {conv.interlocuteur_role === 'directeur' ? '🏕️' : '🎒'}
                </div>
                <div className="conv-info">
                  <div className="conv-top">
                    <strong className="conv-nom">{conv.interlocuteur_nom}</strong>
                    <span className="conv-heure">{formatHeure(conv.dernier_envoi)}</span>
                  </div>
                  <p className="conv-apercu">{conv.dernier_message}</p>
                </div>
                {Number(conv.non_lus) > 0 && (
                  <span className="badge-nonlus">{conv.non_lus}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Panneau droit : fil de messages */}
      <div className="messagerie-main">
        {!interlocuteurActif ? (
          <div className="messagerie-placeholder">
            <span>💬</span>
            <p>Sélectionnez une conversation ou contactez quelqu'un depuis vos candidatures.</p>
          </div>
        ) : (
          <>
            <div className="messagerie-header">
              <div className="conv-avatar">
                {interlocuteurActif.role === 'directeur' ? '🏕️' : '🎒'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>{interlocuteurActif.nom}</strong>
                <span className="messagerie-role">
                  {interlocuteurActif.role === 'directeur' ? 'Directeur de structure' : 'Animateur'}
                </span>
              </div>
              {onVoirProfil && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => onVoirProfil(interlocuteurActif.id, interlocuteurActif.role || 'animateur')}
                >
                  👤 Voir le profil
                </button>
              )}
            </div>

            <div className="messagerie-fil" ref={filRef}>
              {isLoading && <p className="messagerie-empty">Chargement...</p>}
              {error && <div className="profile-alert profile-alert-error">{error}</div>}

              {messages.map((m) => {
                const estMoi = m.expediteur_id !== interlocuteurActif.id;
                return (
                  <div key={m.id} className={`message-bulle ${estMoi ? 'moi' : 'eux'}`}>
                    <p className="message-contenu">{m.contenu}</p>
                    <span className="message-heure">{formatHeure(m.envoye_le)}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="messagerie-input-zone" onSubmit={handleEnvoyer}>
              <input
                type="text"
                className="messagerie-input"
                placeholder="Écrire un message..."
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                disabled={isSending}
              />
              <button type="submit" className="btn-primary messagerie-send-btn" disabled={isSending || !nouveauMessage.trim()}>
                {isSending ? '...' : 'Envoyer'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messagerie;
