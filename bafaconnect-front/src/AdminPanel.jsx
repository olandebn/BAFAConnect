import { useEffect, useState, useCallback } from 'react';
import api from './api/axios';

// ─── Mini barre de progression ───
function MiniBar({ value, max, color = 'var(--primary)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width .4s' }} />
    </div>
  );
}

// ─── Carte stat ───
function StatCard({ icon, value, label, sub, color, trend }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-value" style={color ? { color } : {}}>{value ?? '—'}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: '0.75rem', marginTop: 4, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ─── Graphique barres CSS ───
function BarChart({ data, color = 'var(--primary)', label = 'total' }) {
  if (!data?.length) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune donnée.</p>;
  const max = Math.max(...data.map(d => parseInt(d[label] || 0)), 1);
  return (
    <div className="admin-chart">
      {data.map((d, i) => (
        <div key={i} className="admin-chart-col">
          <div className="admin-chart-bar-wrap">
            <div
              className="admin-chart-bar"
              style={{ height: `${Math.max(4, (parseInt(d[label] || 0) / max) * 100)}%`, background: color }}
              title={`${d[label]}`}
            />
          </div>
          <div className="admin-chart-val">{d[label]}</div>
          <div className="admin-chart-mois">{d.mois}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Badge statut ───
function StatutBadge({ statut }) {
  const map = {
    'en attente':  { label: '⏳ En attente', cls: 'badge-warning' },
    'acceptée':    { label: '✅ Acceptée',   cls: 'badge-success' },
    'acceptee':    { label: '✅ Acceptée',   cls: 'badge-success' },
    'refusée':     { label: '❌ Refusée',    cls: 'badge-danger'  },
    'refusee':     { label: '❌ Refusée',    cls: 'badge-danger'  },
  };
  const b = map[statut] || { label: statut, cls: 'badge-neutral' };
  return <span className={`admin-badge ${b.cls}`}>{b.label}</span>;
}

// ─── Pagination ───
function Pagination({ page, pages, onPrev, onNext }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination-wrapper">
      <button className="pagination-btn" disabled={page <= 1} onClick={onPrev}>← Précédent</button>
      <span className="pagination-info">Page {page} / {pages}</span>
      <button className="pagination-btn" disabled={page >= pages} onClick={onNext}>Suivant →</button>
    </div>
  );
}

// ════════════════════════════════════════
//  PANEL PRINCIPAL
// ════════════════════════════════════════
function AdminPanel() {
  const [tab, setTab] = useState('activite');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [confirmBox, setConfirmBox] = useState(null); // { label, onConfirm, danger? }

  // — Stats —
  const [stats, setStats] = useState(null);

  // — Activité —
  const [activite, setActivite] = useState(null);

  // — Users —
  const [users, setUsers]         = useState([]);
  const [userPage, setUserPage]   = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole]     = useState('');
  const [changingRole, setChangingRole] = useState(null);

  // — Séjours —
  const [sejours, setSejours]           = useState([]);
  const [sejourPage, setSejourPage]     = useState(1);
  const [sejourPages, setSejourPages]   = useState(1);
  const [sejourTotal, setSejourTotal]   = useState(0);
  const [sejourSearch, setSejourSearch] = useState('');

  // — Candidatures —
  const [candidatures, setCandidatures]       = useState([]);
  const [candidPage, setCandidPage]           = useState(1);
  const [candidPages, setCandidPages]         = useState(1);
  const [candidTotal, setCandidTotal]         = useState(0);
  const [candidStatut, setCandidStatut]       = useState('');
  const [candidSearch, setCandidSearch]       = useState('');

  // — Avis —
  const [avis, setAvis]           = useState([]);
  const [avisPage, setAvisPage]   = useState(1);
  const [avisPages, setAvisPages] = useState(1);
  const [avisTotal, setAvisTotal] = useState(0);

  // — Diplômes —
  const [diplomes, setDiplomes]               = useState([]);
  const [diplomeStatut, setDiplomeStatut]     = useState('en_attente');
  const [diplomePage, setDiplomePage]         = useState(1);
  const [diplomePages, setDiplomePages]       = useState(1);
  const [diplomeTotal, setDiplomeTotal]       = useState(0);
  const [diplomeAction, setDiplomeAction]     = useState(null);
  const [diplomeCommentaire, setDiplomeCommentaire] = useState('');
  const [diplomeConfirm, setDiplomeConfirm]   = useState(null);

  // — Profil modal —
  const [profilModal, setProfilModal]     = useState(null); // données du profil ouvert
  const [profilLoading, setProfilLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // ── Fetch helpers ──
  const load = async (fn) => { setLoading(true); setError(''); try { await fn(); } catch (e) { setError(e.response?.data?.error || 'Erreur serveur.'); } finally { setLoading(false); } };

  const fetchStats     = useCallback(() => load(async () => { const r = await api.get('/admin/stats');    setStats(r.data); }), []);
  const fetchActivite  = useCallback(() => load(async () => { const r = await api.get('/admin/activite'); setActivite(r.data); }), []);

  const fetchUsers = useCallback((page = 1, search = userSearch, role = userRole) => load(async () => {
    const r = await api.get('/admin/users', { params: { page, limit: 20, search, role } });
    setUsers(r.data.users); setUserPage(r.data.page); setUserPages(r.data.pages); setUserTotal(r.data.total);
  }), [userSearch, userRole]);

  const fetchSejours = useCallback((page = 1, search = sejourSearch) => load(async () => {
    const r = await api.get('/admin/sejours', { params: { page, limit: 20, search } });
    setSejours(r.data.sejours); setSejourPage(r.data.page); setSejourPages(r.data.pages); setSejourTotal(r.data.total);
  }), [sejourSearch]);

  const fetchCandidatures = useCallback((page = 1, statut = candidStatut, search = candidSearch) => load(async () => {
    const r = await api.get('/admin/candidatures', { params: { page, limit: 20, statut, search } });
    setCandidatures(r.data.candidatures); setCandidPage(r.data.page); setCandidPages(r.data.pages); setCandidTotal(r.data.total);
  }), [candidStatut, candidSearch]);

  const fetchAvis = useCallback((page = 1) => load(async () => {
    const r = await api.get('/admin/avis', { params: { page, limit: 20 } });
    setAvis(r.data.avis); setAvisPage(r.data.page); setAvisPages(r.data.pages); setAvisTotal(r.data.total);
  }), []);

  const fetchDiplomes = useCallback((page = 1, statut = diplomeStatut) => load(async () => {
    const r = await api.get('/admin/diplomes', { params: { statut, page, limit: 20 } });
    setDiplomes(r.data.diplomes); setDiplomePage(r.data.page); setDiplomePages(r.data.pages); setDiplomeTotal(r.data.total);
  }), [diplomeStatut]);

  useEffect(() => {
    if (tab === 'activite')     fetchActivite();
    if (tab === 'stats')        fetchStats();
    if (tab === 'users')        fetchUsers(1);
    if (tab === 'sejours')      fetchSejours(1);
    if (tab === 'candidatures') fetchCandidatures(1);
    if (tab === 'avis')         fetchAvis(1);
    if (tab === 'diplomes')     fetchDiplomes(1);
  }, [tab]);

  // ── Actions ──
  const deleteUser = async (id) => {
    try { await api.delete(`/admin/users/${id}`); setUsers(p => p.filter(u => u.id !== id)); setUserTotal(t => t - 1); }
    catch (e) { setError(e.response?.data?.error || 'Erreur.'); }
    finally { setConfirmBox(null); }
  };

  const deleteSejour = async (id) => {
    try { await api.delete(`/admin/sejours/${id}`); setSejours(p => p.filter(s => s.id !== id)); setSejourTotal(t => t - 1); }
    catch (e) { setError(e.response?.data?.error || 'Erreur.'); }
    finally { setConfirmBox(null); }
  };

  const deleteAvis = async (id) => {
    try { await api.delete(`/admin/avis/${id}`); setAvis(p => p.filter(a => a.id !== id)); setAvisTotal(t => t - 1); }
    catch (e) { setError(e.response?.data?.error || 'Erreur.'); }
    finally { setConfirmBox(null); }
  };

  const changeRole = async (id, role) => {
    setChangingRole(id);
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
    } catch (e) { setError(e.response?.data?.error || 'Erreur.'); }
    finally { setChangingRole(null); }
  };

  const openProfil = async (userId) => {
    setProfilLoading(true);
    setProfilModal(null);
    try {
      const r = await api.get(`/admin/users/${userId}/profile`);
      setProfilModal(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur chargement profil.');
    } finally {
      setProfilLoading(false);
    }
  };

  const handleImpersonate = async (user) => {
    setImpersonating(user.id);
    try {
      const r = await api.post(`/admin/users/${user.id}/impersonate`);
      // Sauvegarder le contexte admin pour pouvoir revenir
      localStorage.setItem('adminToken', localStorage.getItem('token'));
      localStorage.setItem('adminUserId', localStorage.getItem('userId'));
      localStorage.setItem('adminEmail', localStorage.getItem('userEmail') || '');
      localStorage.setItem('adminRole', localStorage.getItem('role') || 'admin');
      // Définir le contexte du compte cible
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('userId', r.data.user.id);
      localStorage.setItem('userEmail', r.data.user.email);
      localStorage.setItem('role', r.data.user.role);
      // Recharger sur la page d'accueil du rôle
      window.location.href = '/?impersonate=1';
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur impersonification.');
    } finally {
      setImpersonating(false);
    }
  };

  const handleDiplomeAction = async (id, statut) => {
    setDiplomeAction(id);
    try {
      await api.patch(`/admin/diplomes/${id}`, { statut, commentaire: diplomeCommentaire || undefined });
      setDiplomes(p => p.filter(d => d.id !== id));
      setDiplomeTotal(t => t - 1);
      setDiplomeCommentaire('');
      setDiplomeConfirm(null);
    } catch (e) { setError(e.response?.data?.error || 'Erreur.'); }
    finally { setDiplomeAction(null); }
  };

  const TABS = [
    { id: 'activite',     label: '⚡ Activité' },
    { id: 'stats',        label: '📊 Statistiques' },
    { id: 'users',        label: `👥 Utilisateurs${userTotal ? ` (${userTotal})` : ''}` },
    { id: 'sejours',      label: `🏕️ Séjours${sejourTotal ? ` (${sejourTotal})` : ''}` },
    { id: 'candidatures', label: `📩 Candidatures${candidTotal ? ` (${candidTotal})` : ''}` },
    { id: 'avis',         label: `⭐ Avis${avisTotal ? ` (${avisTotal})` : ''}` },
    { id: 'diplomes',     label: `🎓 Diplômes${diplomeStatut === 'en_attente' && diplomeTotal > 0 ? ` (${diplomeTotal})` : ''}` },
  ];

  return (
    <div className="admin-panel">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h2 className="admin-title">🛡️ Panel Administrateur</h2>
          <p className="admin-subtitle">Gestion globale de BAFAConnect</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="profile-alert profile-alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ══ MODALE PROFIL UTILISATEUR ══ */}
      {(profilLoading || profilModal) && (
        <div className="admin-confirm-overlay" onClick={() => setProfilModal(null)}>
          <div className="admin-profil-modal" onClick={e => e.stopPropagation()}>
            {profilLoading && <div className="admin-loading"><span>⏳</span> Chargement du profil…</div>}
            {profilModal && (
              <>
                <div className="admin-profil-header">
                  {profilModal.photo_url && (
                    <img src={profilModal.photo_url} alt="Photo" className="admin-profil-avatar" />
                  )}
                  <div>
                    <h3 className="admin-profil-nom">
                      {profilModal.nom || profilModal.nom_structure || profilModal.email}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{profilModal.email}</div>
                    <span className={`admin-badge ${profilModal.role === 'animateur' ? 'badge-animateur' : 'badge-directeur'}`} style={{ marginTop: 8, display: 'inline-block' }}>
                      {profilModal.role === 'animateur' ? '🎒 Animateur' : '🏕️ Directeur'}
                    </span>
                    {profilModal.email_verified
                      ? <span style={{ marginLeft: 8, color: '#22c55e', fontSize: '0.82rem' }}>✅ Email vérifié</span>
                      : <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: '0.82rem' }}>⏳ Email non vérifié</span>}
                  </div>
                  <button className="admin-profil-close" onClick={() => setProfilModal(null)}>✕</button>
                </div>

                <div className="admin-profil-body">
                  {/* Infos générales */}
                  <div className="admin-profil-section">
                    <div className="admin-profil-section-title">Informations</div>
                    <div className="admin-profil-grid">
                      {profilModal.role === 'animateur' ? <>
                        <div><span className="admin-profil-label">Âge</span> {profilModal.age ?? '—'}</div>
                        <div><span className="admin-profil-label">Ville</span> {profilModal.ville ?? '—'}</div>
                        <div><span className="admin-profil-label">Diplômes BAFA</span>
                          {profilModal.diplomes?.length ? profilModal.diplomes.join(', ') : '—'}
                        </div>
                        <div><span className="admin-profil-label">Compétences</span>
                          {profilModal.competences?.length ? profilModal.competences.join(', ') : '—'}
                        </div>
                        {profilModal.cv_url && (
                          <div><span className="admin-profil-label">CV</span>
                            <a href={profilModal.cv_url} target="_blank" rel="noreferrer" className="admin-profil-link">📄 Voir le CV</a>
                          </div>
                        )}
                      </> : <>
                        <div><span className="admin-profil-label">Structure</span> {profilModal.nom_structure ?? '—'}</div>
                        <div><span className="admin-profil-label">Type</span> {profilModal.type_structure ?? '—'}</div>
                        <div><span className="admin-profil-label">Ville</span> {profilModal.ville_structure ?? '—'}</div>
                        {profilModal.description_structure && (
                          <div style={{ gridColumn: '1/-1' }}>
                            <span className="admin-profil-label">Description</span>
                            <p style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text)' }}>{profilModal.description_structure}</p>
                          </div>
                        )}
                        {profilModal.flyer_url && (
                          <div><span className="admin-profil-label">Flyer</span>
                            <a href={profilModal.flyer_url} target="_blank" rel="noreferrer" className="admin-profil-link">🖼 Voir le flyer</a>
                          </div>
                        )}
                      </>}
                      <div><span className="admin-profil-label">Inscrit le</span> {new Date(profilModal.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>

                  {/* Candidatures (animateur) */}
                  {profilModal.role === 'animateur' && (
                    <div className="admin-profil-section">
                      <div className="admin-profil-section-title">Candidatures ({profilModal.candidatures?.length ?? 0})</div>
                      {profilModal.candidatures?.length === 0
                        ? <p className="admin-empty">Aucune candidature.</p>
                        : <table className="admin-table" style={{ marginTop: 8 }}>
                            <thead><tr><th>Séjour</th><th>Lieu</th><th>Statut</th><th>Date</th></tr></thead>
                            <tbody>
                              {profilModal.candidatures.map(c => (
                                <tr key={c.id}>
                                  <td>{c.titre}</td>
                                  <td>{c.lieu || '—'}</td>
                                  <td><StatutBadge statut={c.statut} /></td>
                                  <td style={{ fontSize: '0.82rem' }}>{new Date(c.date_candidature).toLocaleDateString('fr-FR')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      }
                    </div>
                  )}

                  {/* Séjours (directeur) */}
                  {profilModal.role === 'directeur' && (
                    <div className="admin-profil-section">
                      <div className="admin-profil-section-title">Séjours publiés ({profilModal.sejours?.length ?? 0})</div>
                      {profilModal.sejours?.length === 0
                        ? <p className="admin-empty">Aucun séjour publié.</p>
                        : <table className="admin-table" style={{ marginTop: 8 }}>
                            <thead><tr><th>Titre</th><th>Lieu</th><th>Dates</th><th>Postes</th></tr></thead>
                            <tbody>
                              {profilModal.sejours.map(s => (
                                <tr key={s.id}>
                                  <td>{s.titre}</td>
                                  <td>{s.lieu || '—'}</td>
                                  <td style={{ fontSize: '0.82rem' }}>
                                    {s.date_debut ? new Date(s.date_debut).toLocaleDateString('fr-FR') : '—'}
                                  </td>
                                  <td>{s.nombre_postes ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      }
                    </div>
                  )}

                  {/* Avis reçus */}
                  <div className="admin-profil-section">
                    <div className="admin-profil-section-title">Avis reçus ({profilModal.avis_recus?.length ?? 0})</div>
                    {profilModal.avis_recus?.length === 0
                      ? <p className="admin-empty">Aucun avis.</p>
                      : profilModal.avis_recus.map((a, i) => (
                          <div key={i} className="admin-profil-avis">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#f59e0b' }}>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{a.auteur_nom}</span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', marginLeft: 'auto' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {a.commentaire && <p style={{ fontSize: '0.85rem', margin: '6px 0 0', color: 'var(--text)' }}>{a.commentaire}</p>}
                          </div>
                        ))
                    }
                  </div>
                </div>

                <div className="admin-profil-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setProfilModal(null)}
                  >Fermer</button>
                  <button
                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => {
                      setProfilModal(null);
                      setConfirmBox({
                        label: `🔐 Se connecter en tant que "${profilModal.nom || profilModal.nom_structure || profilModal.email}" ?`,
                        onConfirm: () => handleImpersonate(profilModal),
                      });
                    }}
                  >🔐 Se connecter en tant que cet utilisateur</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modale confirmation générique */}
      {confirmBox && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-box">
            <p>{confirmBox.label}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn-secondary" onClick={() => setConfirmBox(null)}>Annuler</button>
              <button className={confirmBox.danger ? 'btn-danger' : 'btn-primary'} onClick={confirmBox.onConfirm}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale diplôme */}
      {diplomeConfirm && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-box">
            <p>
              {diplomeConfirm.action === 'validé' ? '✅ Valider' : '❌ Refuser'} le diplôme{' '}
              <strong>{diplomeConfirm.type}</strong> de <strong>{diplomeConfirm.nom}</strong> ?
            </p>
            {diplomeConfirm.action === 'refusé' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Motif (optionnel)</label>
                <input type="text" className="filtres-input" style={{ width: '100%' }}
                  placeholder="Ex : document illisible…"
                  value={diplomeCommentaire}
                  onChange={e => setDiplomeCommentaire(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn-secondary" onClick={() => { setDiplomeConfirm(null); setDiplomeCommentaire(''); }}>Annuler</button>
              <button
                className={diplomeConfirm.action === 'validé' ? 'btn-primary' : 'btn-danger'}
                disabled={diplomeAction === diplomeConfirm.id}
                onClick={() => handleDiplomeAction(diplomeConfirm.id, diplomeConfirm.action)}
              >
                {diplomeAction === diplomeConfirm.id ? 'En cours…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="admin-loading"><span>⏳</span> Chargement…</div>}

      {/* ══ ACTIVITÉ ══ */}
      {!loading && tab === 'activite' && activite && (
        <div className="admin-activite">
          <div className="admin-activite-col">
            <h4 className="admin-section-title">🆕 Dernières inscriptions</h4>
            <div className="admin-activite-list">
              {activite.inscriptions.length === 0 && <p className="admin-empty">Aucune inscription récente.</p>}
              {activite.inscriptions.map(u => (
                <div key={u.id} className="admin-activite-item">
                  <span className="admin-activite-icon">{u.role === 'animateur' ? '🎒' : '🏕️'}</span>
                  <div>
                    <div className="admin-activite-nom">{u.nom || u.email}</div>
                    <div className="admin-activite-meta">{u.email} · {new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <span className={`admin-badge ${u.role === 'animateur' ? 'badge-animateur' : 'badge-directeur'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-activite-col">
            <h4 className="admin-section-title">🏕️ Derniers séjours publiés</h4>
            <div className="admin-activite-list">
              {activite.sejours.length === 0 && <p className="admin-empty">Aucun séjour récent.</p>}
              {activite.sejours.map(s => (
                <div key={s.id} className="admin-activite-item">
                  <span className="admin-activite-icon">🏕️</span>
                  <div>
                    <div className="admin-activite-nom">{s.titre}</div>
                    <div className="admin-activite-meta">{s.directeur_nom} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-activite-col">
            <h4 className="admin-section-title">📩 Dernières candidatures</h4>
            <div className="admin-activite-list">
              {activite.candidatures.length === 0 && <p className="admin-empty">Aucune candidature récente.</p>}
              {activite.candidatures.map(c => (
                <div key={c.id} className="admin-activite-item">
                  <span className="admin-activite-icon">📩</span>
                  <div>
                    <div className="admin-activite-nom">{c.animateur_nom}</div>
                    <div className="admin-activite-meta">→ {c.sejour_titre} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <StatutBadge statut={c.statut} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ STATS ══ */}
      {!loading && tab === 'stats' && stats && (
        <div>
          <div className="admin-stats-grid">
            <StatCard icon="👥" value={stats.users.total}          label="Utilisateurs"     sub={`+${stats.users.nouveaux_30j} ce mois`} color="var(--primary)" />
            <StatCard icon="🎒" value={stats.users.animateurs}     label="Animateurs" />
            <StatCard icon="🏕️" value={stats.users.directeurs}     label="Directeurs" />
            <StatCard icon="📋" value={stats.sejours.total}        label="Séjours publiés"  sub={`+${stats.sejours.nouveaux_30j} ce mois`} />
            <StatCard icon="📩" value={stats.candidatures.total}   label="Candidatures totales" />
            <StatCard icon="✅" value={stats.candidatures.acceptees}  label="Acceptées"   color="#22c55e" />
            <StatCard icon="⏳" value={stats.candidatures.en_attente} label="En attente"  color="#f59e0b" />
            <StatCard icon="❌" value={stats.candidatures.refusees}   label="Refusées"    color="#ef4444" />
            <StatCard icon="💬" value={stats.messages.total}  label="Messages envoyés" />
            <StatCard icon="⭐" value={stats.avis.moyenne ? parseFloat(stats.avis.moyenne).toFixed(1) : '—'} label="Note moyenne" sub={`${stats.avis.total} avis`} color="#f59e0b" />
          </div>

          {/* Taux d'acceptation */}
          {stats.candidatures.total > 0 && (
            <div className="admin-stats-taux">
              <div className="admin-taux-item">
                <span>Taux d'acceptation</span>
                <strong style={{ color: '#22c55e' }}>
                  {Math.round((stats.candidatures.acceptees / stats.candidatures.total) * 100)}%
                </strong>
                <MiniBar value={stats.candidatures.acceptees} max={stats.candidatures.total} color="#22c55e" />
              </div>
              <div className="admin-taux-item">
                <span>Taux de refus</span>
                <strong style={{ color: '#ef4444' }}>
                  {Math.round((stats.candidatures.refusees / stats.candidatures.total) * 100)}%
                </strong>
                <MiniBar value={stats.candidatures.refusees} max={stats.candidatures.total} color="#ef4444" />
              </div>
              <div className="admin-taux-item">
                <span>En attente</span>
                <strong style={{ color: '#f59e0b' }}>
                  {Math.round((stats.candidatures.en_attente / stats.candidatures.total) * 100)}%
                </strong>
                <MiniBar value={stats.candidatures.en_attente} max={stats.candidatures.total} color="#f59e0b" />
              </div>
            </div>
          )}

          {/* Graphiques */}
          <div className="admin-charts-row">
            <div className="admin-chart-card">
              <h4 className="admin-section-title">📈 Inscriptions / 6 mois</h4>
              <BarChart data={stats.inscriptions_par_mois} color="var(--primary)" />
            </div>
            <div className="admin-chart-card">
              <h4 className="admin-section-title">📩 Candidatures / 6 mois</h4>
              <BarChart data={stats.candidatures_par_mois} color="#10b981" />
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS ══ */}
      {!loading && tab === 'users' && (
        <div>
          <form className="admin-search-bar" onSubmit={e => { e.preventDefault(); fetchUsers(1); }}>
            <input className="filtres-input" placeholder="🔍 Rechercher par email ou nom…"
              value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <select className="filtres-select" value={userRole} onChange={e => setUserRole(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="animateur">Animateur</option>
              <option value="directeur">Directeur</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Rechercher</button>
            {(userSearch || userRole) && (
              <button type="button" className="filtres-reset" onClick={() => { setUserSearch(''); setUserRole(''); fetchUsers(1, '', ''); }}>
                ✕ Réinitialiser
              </button>
            )}
            <span className="filtres-count">{userTotal} utilisateur{userTotal !== 1 ? 's' : ''}</span>
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom / Email</th>
                  <th>Rôle</th>
                  <th>Ville</th>
                  <th>Activité</th>
                  <th>Inscrit le</th>
                  <th>Vérifié</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={7} className="admin-empty">Aucun résultat.</td></tr>}
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{u.nom || '—'}</span>
                        <span className="admin-user-email">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span className={`admin-badge ${u.role === 'animateur' ? 'badge-animateur' : 'badge-directeur'}`}>
                          {u.role === 'animateur' ? '🎒 Animateur' : '🏕️ Directeur'}
                        </span>
                        <button
                          className="admin-btn-role"
                          disabled={changingRole === u.id}
                          onClick={() => setConfirmBox({
                            label: `Changer le rôle de "${u.nom || u.email}" en ${u.role === 'animateur' ? 'Directeur' : 'Animateur'} ?`,
                            onConfirm: () => changeRole(u.id, u.role === 'animateur' ? 'directeur' : 'animateur'),
                          })}
                        >
                          {changingRole === u.id ? '…' : `→ ${u.role === 'animateur' ? 'Directeur' : 'Animateur'}`}
                        </button>
                      </div>
                    </td>
                    <td>{u.ville || u.ville_structure || '—'}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {u.role === 'animateur'
                          ? <>{u.nb_candidatures} candidature{u.nb_candidatures !== 1 ? 's' : ''}</>
                          : <>{u.nb_sejours} séjour{u.nb_sejours !== 1 ? 's' : ''}</>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {u.email_verifie
                        ? <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅ Oui</span>
                        : <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>⏳ Non</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          className="admin-btn-role"
                          style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
                          onClick={() => openProfil(u.id)}
                        >👁 Voir profil</button>
                        <button
                          className="admin-btn-role"
                          style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}
                          disabled={impersonating === u.id}
                          onClick={() => setConfirmBox({
                            label: `🔐 Se connecter en tant que "${u.nom || u.email}" (${u.email}) ?`,
                            onConfirm: () => handleImpersonate(u),
                          })}
                        >{impersonating === u.id ? '…' : '🔐 Accéder'}</button>
                        <button className="btn-danger-sm" onClick={() => setConfirmBox({
                          label: `⚠️ Supprimer "${u.nom || u.email}" et toutes ses données ?`,
                          danger: true,
                          onConfirm: () => deleteUser(u.id),
                        })}>🗑 Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={userPage} pages={userPages} onPrev={() => fetchUsers(userPage - 1)} onNext={() => fetchUsers(userPage + 1)} />
        </div>
      )}

      {/* ══ SÉJOURS ══ */}
      {!loading && tab === 'sejours' && (
        <div>
          <form className="admin-search-bar" onSubmit={e => { e.preventDefault(); fetchSejours(1); }}>
            <input className="filtres-input" placeholder="🔍 Rechercher par titre ou lieu…"
              value={sejourSearch} onChange={e => setSejourSearch(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Rechercher</button>
            {sejourSearch && (
              <button type="button" className="filtres-reset" onClick={() => { setSejourSearch(''); fetchSejours(1, ''); }}>✕</button>
            )}
            <span className="filtres-count">{sejourTotal} séjour{sejourTotal !== 1 ? 's' : ''}</span>
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Titre</th><th>Lieu</th><th>Directeur</th><th>Dates</th><th>Postes</th><th>Candidatures</th><th>Publié le</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {sejours.length === 0 && <tr><td colSpan={8} className="admin-empty">Aucun séjour.</td></tr>}
                {sejours.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.titre}</strong>{s.type && <span className="admin-badge badge-neutral" style={{ marginLeft: 6 }}>{s.type}</span>}</td>
                    <td>{s.lieu || '—'}</td>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{s.directeur_nom}</span>
                        <span className="admin-user-email">{s.directeur_email}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.83rem' }}>
                      {s.date_debut ? new Date(s.date_debut).toLocaleDateString('fr-FR') : '—'}
                      {s.date_fin ? <><br />→ {new Date(s.date_fin).toLocaleDateString('fr-FR')}</> : ''}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {s.postes_pourvus ?? 0}/{s.nombre_postes ?? '?'}
                      {s.nombre_postes > 0 && <MiniBar value={s.postes_pourvus || 0} max={s.nombre_postes} color="#22c55e" />}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.nb_candidatures}</td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button className="btn-danger-sm" onClick={() => setConfirmBox({
                        label: `⚠️ Supprimer le séjour "${s.titre}" et toutes ses candidatures ?`,
                        danger: true,
                        onConfirm: () => deleteSejour(s.id),
                      })}>🗑 Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={sejourPage} pages={sejourPages} onPrev={() => fetchSejours(sejourPage - 1)} onNext={() => fetchSejours(sejourPage + 1)} />
        </div>
      )}

      {/* ══ CANDIDATURES ══ */}
      {!loading && tab === 'candidatures' && (
        <div>
          <div className="admin-search-bar">
            <input className="filtres-input" placeholder="🔍 Rechercher animateur ou séjour…"
              value={candidSearch} onChange={e => setCandidSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchCandidatures(1)} />
            <select className="filtres-select" value={candidStatut}
              onChange={e => { setCandidStatut(e.target.value); fetchCandidatures(1, e.target.value); }}>
              <option value="">Tous les statuts</option>
              <option value="en attente">⏳ En attente</option>
              <option value="acceptée">✅ Acceptées</option>
              <option value="refusée">❌ Refusées</option>
            </select>
            <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={() => fetchCandidatures(1)}>Rechercher</button>
            {(candidSearch || candidStatut) && (
              <button className="filtres-reset" onClick={() => { setCandidSearch(''); setCandidStatut(''); fetchCandidatures(1, '', ''); }}>✕ Réinitialiser</button>
            )}
            <span className="filtres-count">{candidTotal} candidature{candidTotal !== 1 ? 's' : ''}</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Animateur</th><th>Séjour</th><th>Directeur</th><th>Statut</th><th>Date</th></tr>
              </thead>
              <tbody>
                {candidatures.length === 0 && <tr><td colSpan={5} className="admin-empty">Aucune candidature.</td></tr>}
                {candidatures.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{c.animateur_nom}</span>
                        <span className="admin-user-email">{c.animateur_email}</span>
                      </div>
                    </td>
                    <td><strong>{c.sejour_titre}</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {c.sejour_lieu}</span></td>
                    <td>{c.directeur_nom}</td>
                    <td><StatutBadge statut={c.statut} /></td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={candidPage} pages={candidPages} onPrev={() => fetchCandidatures(candidPage - 1)} onNext={() => fetchCandidatures(candidPage + 1)} />
        </div>
      )}

      {/* ══ AVIS ══ */}
      {!loading && tab === 'avis' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="filtres-count">{avisTotal} avis au total</span>
            <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => fetchAvis(1)}>🔄 Actualiser</button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Note</th><th>Auteur</th><th>Concernant</th><th>Commentaire</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {avis.length === 0 && <tr><td colSpan={6} className="admin-empty">Aucun avis.</td></tr>}
                {avis.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '1.1rem', color: '#f59e0b' }}>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                        <strong>{a.note}/5</strong>
                      </div>
                    </td>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{a.auteur_nom}</span>
                        <span className="admin-user-email">{a.auteur_email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{a.cible_nom}</span>
                        <span className="admin-user-email">{a.cible_email}</span>
                        <span className={`admin-badge ${a.cible_role === 'animateur' ? 'badge-animateur' : 'badge-directeur'}`}>{a.cible_role}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 260, fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {a.commentaire || <em>Aucun commentaire</em>}
                    </td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button className="btn-danger-sm" onClick={() => setConfirmBox({
                        label: `⚠️ Supprimer cet avis (${a.note}/5 de ${a.auteur_nom}) ?`,
                        danger: true,
                        onConfirm: () => deleteAvis(a.id),
                      })}>🗑 Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={avisPage} pages={avisPages} onPrev={() => fetchAvis(avisPage - 1)} onNext={() => fetchAvis(avisPage + 1)} />
        </div>
      )}

      {/* ══ DIPLÔMES ══ */}
      {!loading && tab === 'diplomes' && (
        <div>
          <div className="diplomes-admin-filtres">
            {['en_attente', 'validé', 'refusé'].map(s => (
              <button key={s} className={`diplome-filtre-btn ${diplomeStatut === s ? 'active' : ''}`}
                onClick={() => { setDiplomeStatut(s); fetchDiplomes(1, s); }}>
                {s === 'en_attente' && '⏳ En attente'}
                {s === 'validé'     && '✅ Validés'}
                {s === 'refusé'     && '❌ Refusés'}
                {diplomeStatut === s && diplomeTotal > 0 && <span className="diplome-filtre-count">{diplomeTotal}</span>}
              </button>
            ))}
          </div>

          {diplomes.length === 0
            ? <div className="diplomes-empty"><span>🎓</span><p>Aucun diplôme {diplomeStatut === 'en_attente' ? 'en attente' : diplomeStatut === 'validé' ? 'validé' : 'refusé'}.</p></div>
            : (
              <div className="diplomes-admin-list">
                {diplomes.map(d => (
                  <div key={d.id} className="diplome-admin-card">
                    <div className="diplome-admin-info">
                      <div className="diplome-admin-user">
                        <span className="diplome-type-badge">{d.type}</span>
                        <span className="admin-user-nom">{d.user_nom}</span>
                        <span className={`admin-badge ${d.user_role === 'animateur' ? 'badge-animateur' : 'badge-directeur'}`}>
                          {d.user_role === 'animateur' ? '🎒' : '🏕️'} {d.user_role}
                        </span>
                      </div>
                      <span className="admin-user-email">{d.user_email}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                        <a href={d.fichier_url} target="_blank" rel="noopener noreferrer" className="diplome-fichier-link">
                          📄 {d.fichier_nom}
                        </a>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {d.commentaire_admin && <p className="diplome-commentaire">💬 {d.commentaire_admin}</p>}
                    </div>
                    {diplomeStatut === 'en_attente' && (
                      <div className="diplome-admin-actions">
                        <button className="btn-accepter" disabled={diplomeAction === d.id}
                          onClick={() => setDiplomeConfirm({ id: d.id, action: 'validé', type: d.type, nom: d.user_nom })}>
                          ✅ Valider
                        </button>
                        <button className="btn-refuser" disabled={diplomeAction === d.id}
                          onClick={() => setDiplomeConfirm({ id: d.id, action: 'refusé', type: d.type, nom: d.user_nom })}>
                          ❌ Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          <Pagination page={diplomePage} pages={diplomePages} onPrev={() => fetchDiplomes(diplomePage - 1)} onNext={() => fetchDiplomes(diplomePage + 1)} />
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
