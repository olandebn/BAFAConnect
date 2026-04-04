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

function Avatar({ nom, size = 40 }) {
  const initiale = nom ? nom.charAt(0).toUpperCase() : '?';
  const palettes = [
    ['#dbeafe','#1d4ed8'], ['#dcfce7','#15803d'], ['#fef3c7','#b45309'],
    ['#fce7f3','#9d174d'], ['#ede9fe','#6d28d9'], ['#cffafe','#0e7490'],
    ['#ffedd5','#c2410c'], ['#f0fdf4','#166534'],
  ];
  const idx = nom ? nom.charCodeAt(0) % palettes.length : 0;
  const [bg, fg] = palettes[idx];
  return (
    <div className="msg-avatar" style={{ width: size, height: size, minWidth: size, background: bg, color: fg, fontSize: size * 0.42 }}>
      {initiale}
    </div>
  );
}

function Messagerie({ destinataireInitial = null, onNewMessage, onVoirProfil }) {
  const [conversations, setConversations] = useState([]);
  const [interlocuteurActif, setInterlocuteurActif] = useState(destinataireInitial);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [fichierEnAttente, setFichierEnAttente] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingConv, setDeletingConv] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [mobileVue, setMobileVue] = useState(destinataireInitial ? 'chat' : 'liste');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const filRef = useRef(null);
  const inputRef = useRef(null);
  const monId = localStorage.getItem('userId');
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = socketIo(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('nouveau_message', (msg) => {
      setInterlocuteurActif(prev => {
        if (prev && prev.id === msg.expediteur_id) {
          setMessages(msgs => msgs.some(m => m.id === msg.id) ? msgs : [...msgs, msg]);
        }
        return prev;
      });
      fetchConversations();
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!interlocuteurActif) return;
    fetchMessages(interlocuteurActif.id);
    const interval = setInterval(() => fetchMessages(interlocuteurActif.id), 20000);
    return () => clearInterval(interval);
  }, [interlocuteurActif?.id]);

  useEffect(() => {
    const fil = filRef.current;
    if (!fil) return;
    const isAtBottom = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 80;
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      if (destinataireInitial && !interlocuteurActif) setInterlocuteurActif(destinataireInitial);
    } catch (err) { console.error('Erreur conversations :', err); }
  };

  const fetchMessages = async (userId) => {
    setIsLoading(true); setError('');
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      setConversations(prev => prev.map(c => c.interlocuteur_id === userId ? { ...c, non_lus: 0 } : c));
    } catch { setError('Impossible de charger les messages.'); }
    finally { setIsLoading(false); }
  };

  const handleFichierChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Fichier trop lourd (max 10 Mo).'); return; }
    setIsUploading(true); setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `messages/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/message-files/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload échoué');
      setFichierEnAttente({ nom: file.name, url: `${SUPABASE_URL}/storage/v1/object/public/message-files/${path}` });
    } catch { setError("Erreur lors de l'upload du fichier."); }
    finally { setIsUploading(false); e.target.value = ''; }
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
      setNouveauMessage(''); setFichierEnAttente(null);
      fetchConversations();
      inputRef.current?.focus();
    } catch (err) { setError(err.response?.data?.error || "Erreur lors de l'envoi."); }
    finally { setIsSending(false); }
  };

  const ouvrirConversation = (conv) => {
    setInterlocuteurActif({ id: conv.interlocuteur_id, nom: conv.interlocuteur_nom, role: conv.interlocuteur_role });
    setError(''); setConfirmSuppr(null); setMobileVue('chat');
  };

  const demanderSuppressionConv = (e, interlocuteurId) => { e.stopPropagation(); setConfirmSuppr(interlocuteurId); };

  const supprimerConversation = async (interlocuteurId) => {
    setDeletingConv(interlocuteurId);
    try {
      await api.delete(`/messages/conversation/${interlocuteurId}`);
      setConversations(prev => prev.filter(c => c.interlocuteur_id !== interlocuteurId));
      if (interlocuteurActif?.id === interlocuteurId) { setInterlocuteurActif(null); setMessages([]); setMobileVue('liste'); }
    } catch { setError('Impossible de supprimer la conversation.'); }
    finally { setDeletingConv(null); setConfirmSuppr(null); }
  };

  const formatHeure = (dateStr) => {
    const d = new Date(dateStr), now = new Date(), hier = new Date(now);
    hier.setDate(hier.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === hier.toDateString()) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const totalNonLus = conversations.reduce((sum, c) => sum + Number(c.non_lus || 0), 0);

  // Grouper par date
  const messagesAvecDates = messages.reduce((acc, m, i) => {
    const d = new Date(m.envoye_le).toDateString();
    if (i === 0 || d !== new Date(messages[i-1].envoye_le).toDateString()) {
      acc.push({ type: 'date', label: new Date(m.envoye_le).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), key: `date-${d}` });
    }
    acc.push({ type: 'msg', ...m });
    return acc;
  }, []);

  return (
    <div className={`msg-wrapper msg-vue-${mobileVue}`}>

      {/* ─── Sidebar ─── */}
      <aside className="msg-sidebar">
        <div className="msg-sidebar-header">
          <h3 className="msg-sidebar-title">
            💬 Messages
            {totalNonLus > 0 && <span className="msg-badge">{totalNonLus}</span>}
          </h3>
        </div>

        {conversations.length === 0 ? (
          <div className="msg-sidebar-empty">
            <span>📭</span>
            <p>Aucune conversation pour l'instant</p>
          </div>
        ) : (
          <ul className="msg-conv-list">
            {conversations.map(conv => (
              <li
                key={conv.interlocuteur_id}
                className={`msg-conv-item${interlocuteurActif?.id === conv.interlocuteur_id ? ' active' : ''}${Number(conv.non_lus) > 0 ? ' unread' : ''}`}
                onClick={() => ouvrirConversation(conv)}
              >
                <Avatar nom={conv.interlocuteur_nom} size={46} />
                <div className="msg-conv-body">
                  <div className="msg-conv-top">
                    <span className="msg-conv-nom">{conv.interlocuteur_nom}</span>
                    <span className="msg-conv-heure">{formatHeure(conv.dernier_envoi)}</span>
                  </div>
                  {confirmSuppr === conv.interlocuteur_id ? (
                    <div className="msg-suppr-confirm" onClick={e => e.stopPropagation()}>
                      <span>Supprimer ?</span>
                      <button className="msg-suppr-oui" onClick={() => supprimerConversation(conv.interlocuteur_id)} disabled={deletingConv === conv.interlocuteur_id}>
                        {deletingConv === conv.interlocuteur_id ? '…' : 'Oui'}
                      </button>
                      <button className="msg-suppr-non" onClick={e => { e.stopPropagation(); setConfirmSuppr(null); }}>Non</button>
                    </div>
                  ) : (
                    <p className="msg-conv-apercu">{conv.dernier_message}</p>
                  )}
                </div>
                <div className="msg-conv-actions" onClick={e => e.stopPropagation()}>
                  {Number(conv.non_lus) > 0 && <span className="msg-badge">{conv.non_lus}</span>}
                  <button className="msg-delete-btn" title="Supprimer" onClick={e => demanderSuppressionConv(e, conv.interlocuteur_id)}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ─── Chat ─── */}
      <div className="msg-main">
        {!interlocuteurActif ? (
          <div className="msg-placeholder">
            <div className="msg-placeholder-icon">💬</div>
            <strong>Vos messages</strong>
            <p>Sélectionnez une conversation ou contactez quelqu'un depuis une annonce.</p>
          </div>
        ) : (
          <>
            <div className="msg-header">
              <button className="msg-back-btn" onClick={() => setMobileVue('liste')} aria-label="Retour">‹</button>
              <Avatar nom={interlocuteurActif.nom} size={42} />
              <div className="msg-header-info">
                <span className="msg-header-nom">{interlocuteurActif.nom}</span>
                <span className="msg-header-role">
                  {interlocuteurActif.role === 'directeur' ? '🏕️ Directeur' : '🎒 Animateur'}
                </span>
              </div>
              {onVoirProfil && (
                <button className="msg-profil-btn" onClick={() => onVoirProfil(interlocuteurActif.id, interlocuteurActif.role || 'animateur')}>
                  👤 Profil
                </button>
              )}
            </div>

            <div className="msg-fil" ref={filRef}>
              {isLoading && (
                <div className="msg-typing">
                  <span/><span/><span/>
                </div>
              )}

              {messagesAvecDates.map(item => {
                if (item.type === 'date') return (
                  <div key={item.key} className="msg-date-sep"><span>{item.label}</span></div>
                );
                const estMoi = String(item.expediteur_id) === String(monId);
                return (
                  <div key={item.id} className={`msg-row ${estMoi ? 'moi' : 'eux'}`}>
                    {!estMoi && <Avatar nom={interlocuteurActif.nom} size={30} />}
                    <div className={`msg-bulle ${estMoi ? 'moi' : 'eux'}`}>
                      {item.contenu && <p className="msg-contenu">{item.contenu}</p>}
                      {item.fichier_url && (() => {
                        const ext = item.fichier_nom?.split('.').pop().toLowerCase();
                        const isImage = ['png','jpg','jpeg','gif','webp'].includes(ext);
                        return isImage
                          ? <a href={item.fichier_url} target="_blank" rel="noopener noreferrer"><img src={item.fichier_url} alt={item.fichier_nom} className="msg-img" /></a>
                          : <a href={item.fichier_url} target="_blank" rel="noopener noreferrer" className="msg-file-link">
                              <span>{getFileIcon(item.fichier_nom)}</span>
                              <span className="msg-file-name">{item.fichier_nom || 'Fichier'}</span>
                              <span>↓</span>
                            </a>;
                      })()}
                      <time className="msg-heure">{formatHeure(item.envoye_le)}</time>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="msg-input-zone" onSubmit={handleEnvoyer}>
              {error && (
                <div className="msg-error-bar">⚠️ {error}<button type="button" onClick={() => setError('')}>✕</button></div>
              )}
              {fichierEnAttente && (
                <div className="msg-file-preview">
                  <span>{getFileIcon(fichierEnAttente.nom)}</span>
                  <span className="msg-file-preview-nom">{fichierEnAttente.nom}</span>
                  <button type="button" onClick={() => setFichierEnAttente(null)}>✕</button>
                </div>
              )}
              <div className="msg-input-row">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFichierChange} />
                <button type="button" className="msg-attach-btn" onClick={() => fileInputRef.current?.click()} disabled={isSending || isUploading} title="Joindre un fichier">
                  {isUploading ? '⏳' : '📎'}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="msg-input"
                  placeholder="Écrire un message…"
                  value={nouveauMessage}
                  onChange={e => setNouveauMessage(e.target.value)}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="msg-send-btn"
                  disabled={isSending || isUploading || (!nouveauMessage.trim() && !fichierEnAttente)}
                >
                  {isSending ? '…' : '➤'}
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
