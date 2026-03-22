import { useEffect, useState, useRef } from 'react';
import { io as socketIo } from 'socket.io-client';
import api from './api/axios';

const SUPABASE_URL = 'https://rzjfhucnftglbdvgosld.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amZodWNuZnRnbGJkdmdvc2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzMwNjMsImV4cCI6MjA4NzU0OTA2M30.qLsPBLmRwMU8-lfmZzcPdRGjvGGa8mBrF51xSRrvAw8';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

function getFileIcon(nom) {
  if (!nom) return '📎';
  const ext = nom.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼️';
  if (['zip','rar','7z'].includes(ext)) return '🗜️';
  return '📎';
}

function Messagerie({ destinataireInitial = null, onNewMessage, onVoirProfil }) {
  const [conversations, setConversations] = useState([]);
  const [interlocuteurActif, setInterlocuteurActif] = useState(destinataireInitial);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [fichierEnAttente, setFichierEnAttente] = useState(null); // { nom, url }
  const [isUploading, setIsUploading] = useState(false);
  const [deletingConv, setDeletingConv] = useState(null); // id de la conv en cours de suppression
  const [confirmSuppr, setConfirmSuppr] = useState(null); // id interlocuteur à confirmer
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const filRef = useRef(null);

  const monId = localStorage.getItem('userId');
  const socketRef = useRef(null);

  // Connexion Socket.io
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketIo(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Réception d'un nouveau message en temps réel
    socket.on('nouveau_message', (msg) => {
      // Mettre à jour le fil si la conv est ouverte
      setInterlocuteurActif(prev => {
        if (prev && prev.id === msg.expediteur_id) {
          setMessages(msgs => {
            // Éviter les doublons
            if (msgs.some(m => m.id === msg.id)) return msgs;
            return [...msgs, msg];
          });
        }
        return prev;
      });
      // Mettre à jour la liste des conversations
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Charger les conversations à l'ouverture + polling toutes les 30s (fallback)
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger les messages quand l'interlocuteur change + polling toutes les 20s (fallback si socket KO)
  useEffect(() => {
    if (!interlocuteurActif) return;
    fetchMessages(interlocuteurActif.id);
    const interval = setInterval(() => fetchMessages(interlocuteurActif.id), 20000);
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

  const handleFichierChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Fichier trop lourd (max 10 Mo).'); return; }
    setIsUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `messages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/message-files/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload échoué');
      const url = `${SUPABASE_URL}/storage/v1/object/public/message-files/${path}`;
      setFichierEnAttente({ nom: file.name, url });
    } catch {
      setError("Erreur lors de l'upload du fichier.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleEnvoyer = async (e) => {
    e.preventDefault();
    if ((!nouveauMessage.trim() && !fichierEnAttente) || !interlocuteurActif) return;

    setIsSending(true);
    try {
      const res = await api.post('/messages', {
        destinataire_id: interlocuteurActif.id,
        contenu: nouveauMessage.trim() || null,
        fichier_url: fichierEnAttente?.url || null,
        fichier_nom: fichierEnAttente?.nom || null,
      });
      setMessages(prev => [...prev, { ...res.data, expediteur_nom: 'Moi' }]);
      setNouveauMessage('');
      setFichierEnAttente(null);
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  const ouvrirConversation = (conv) => {
    setInterlocuteurActif({ id: conv.interlocuteur_id, nom: conv.interlocuteur_nom, role: conv.interlocuteur_role });
    setError('');
    setConfirmSuppr(null);
  };

  const demanderSuppressionConv = (e, interlocuteurId) => {
    e.stopPropagation();
    setConfirmSuppr(interlocuteurId);
  };

  const supprimerConversation = async (interlocuteurId) => {
    setDeletingConv(interlocuteurId);
    try {
      await api.delete(`/messages/conversation/${interlocuteurId}`);
      setConversations(prev => prev.filter(c => c.interlocuteur_id !== interlocuteurId));
      if (interlocuteurActif?.id === interlocuteurId) {
        setInterlocuteurActif(null);
        setMessages([]);
      }
    } catch {
      setError('Impossible de supprimer la conversation.');
    } finally {
      setDeletingConv(null);
      setConfirmSuppr(null);
    }
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
                  {confirmSuppr === conv.interlocuteur_id ? (
                    <div className="conv-suppr-confirm" onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Supprimer ?</span>
                      <button
                        className="conv-suppr-btn conv-suppr-oui"
                        onClick={() => supprimerConversation(conv.interlocuteur_id)}
                        disabled={deletingConv === conv.interlocuteur_id}
                      >
                        {deletingConv === conv.interlocuteur_id ? '...' : 'Oui'}
                      </button>
                      <button
                        className="conv-suppr-btn conv-suppr-non"
                        onClick={e => { e.stopPropagation(); setConfirmSuppr(null); }}
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <p className="conv-apercu">{conv.dernier_message}</p>
                  )}
                </div>
                <div className="conv-right" onClick={e => e.stopPropagation()}>
                  {Number(conv.non_lus) > 0 && (
                    <span className="badge-nonlus">{conv.non_lus}</span>
                  )}
                  <button
                    className="conv-delete-btn"
                    title="Supprimer cette conversation"
                    onClick={e => demanderSuppressionConv(e, conv.interlocuteur_id)}
                  >
                    🗑
                  </button>
                </div>
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

              {messages.map((m) => {
                const estMoi = String(m.expediteur_id) === String(monId);
                return (
                  <div key={m.id} className={`message-bulle ${estMoi ? 'moi' : 'eux'}`}>
                    {m.contenu && <p className="message-contenu">{m.contenu}</p>}
                    {m.fichier_url && (() => {
                      const ext = m.fichier_nom?.split('.').pop().toLowerCase();
                      const isImage = ['png','jpg','jpeg','gif','webp'].includes(ext);
                      return isImage ? (
                        <a href={m.fichier_url} target="_blank" rel="noopener noreferrer" className="message-image-wrapper">
                          <img src={m.fichier_url} alt={m.fichier_nom} className="message-image" />
                        </a>
                      ) : (
                        <a href={m.fichier_url} target="_blank" rel="noopener noreferrer" className="message-fichier">
                          <span className="message-fichier-icon">{getFileIcon(m.fichier_nom)}</span>
                          <span className="message-fichier-nom">{m.fichier_nom || 'Fichier'}</span>
                          <span className="message-fichier-dl">↓</span>
                        </a>
                      );
                    })()}
                    <span className="message-heure">{formatHeure(m.envoye_le)}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="messagerie-input-zone" onSubmit={handleEnvoyer}>
              {error && (
                <div className="messagerie-error-bar">
                  ⚠️ {error}
                  <button type="button" onClick={() => setError('')} className="messagerie-fichier-remove">✕</button>
                </div>
              )}
              {fichierEnAttente && (
                <div className="messagerie-fichier-preview">
                  <span>{getFileIcon(fichierEnAttente.nom)}</span>
                  <span className="messagerie-fichier-preview-nom">{fichierEnAttente.nom}</span>
                  <button type="button" className="messagerie-fichier-remove" onClick={() => setFichierEnAttente(null)}>✕</button>
                </div>
              )}
              <div className="messagerie-input-row">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFichierChange} />
                <button
                  type="button"
                  className="messagerie-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || isUploading}
                  title="Joindre un fichier"
                >
                  {isUploading ? '⏳' : '📎'}
                </button>
                <input
                  type="text"
                  className="messagerie-input"
                  placeholder="Écrire un message..."
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  disabled={isSending}
                />
                <button type="submit" className="btn-primary messagerie-send-btn" disabled={isSending || isUploading || (!nouveauMessage.trim() && !fichierEnAttente)}>
                  {isSending ? '...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messagerie;
