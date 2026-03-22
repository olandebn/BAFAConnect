import { useEffect, useState } from 'react';
import api from './api/axios';

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AdminPanel() {
  const [tab, setTab] = useState('diplomes'); // 'stats' | 'users' | 'sejours' | 'diplomes'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sejours, setSejours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination + filtres users
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  // Pagination + filtres séjours
  const [sejourPage, setSejourPage] = useState(1);
  const [sejourPages, setSejourPages] = useState(1);
  const [sejourTotal, setSejourTotal] = useState(0);
  const [sejourSearch, setSejourSearch] = useState('');

  // Diplômes
  const [diplomes, setDiplomes] = useState([]);
  const [diplomeStatutFiltre, setDiplomeStatutFiltre] = useState('en_attente');
  const [diplomeTotal, setDiplomeTotal] = useState(0);
  const [diplomePage, setDiplomePage] = useState(1);
  const [diplomePages, setDiplomePages] = useState(1);
  const [actionDiplome, setActionDiplome] = useState(null); // { id, statut en cours }
  const [commentaire, setCommentaire] = useState('');
  const [confirmDiplome, setConfirmDiplome] = useState(null); // { id, action: 'validé'|'refusé', type, nom }

  // Actions
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingSejour, setDeletingSejour] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id }

  useEffect(() => {
    if (tab === 'stats') fetchStats();
    if (tab === 'users') fetchUsers(1);
    if (tab === 'sejours') fetchSejours(1);
    if (tab === 'diplomes') fetchDiplomes(1, diplomeStatutFiltre);
  }, [tab]);

  const fetchDiplomes = async (page = 1, statut = diplomeStatutFiltre) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/diplomes', { params: { statut, page, limit: 20 } });
      setDiplomes(res.data.diplomes);
      setDiplomeTotal(res.data.total);
      setDiplomePage(res.data.page);
      setDiplomePages(res.data.pages);
    } catch { setError('Impossible de charger les diplômes.'); }
    finally { setLoading(false); }
  };

  const handleDiplomeAction = async (id, statut) => {
    setActionDiplome(id);
    try {
      await api.patch(`/admin/diplomes/${id}`, { statut, commentaire: commentaire || undefined });
      setDiplomes(prev => prev.filter(d => d.id !== id));
      setDiplomeTotal(t => t - 1);
      setCommentaire('');
      setConfirmDiplome(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally { setActionDiplome(null); }
  };

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch { setError('Impossible de charger les statistiques.'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async (page = 1, search = userSearch, role = userRole) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 20, search, role } });
      setUsers(res.data.users);
      setUserPage(res.data.page);
      setUserPages(res.data.pages);
      setUserTotal(res.data.total);
    } catch { setError('Impossible de charger les utilisateurs.'); }
    finally { setLoading(false); }
  };

  const fetchSejours = async (page = 1, search = sejourSearch) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/sejours', { params: { page, limit: 20, search } });
      setSejours(res.data.sejours);
      setSejourPage(res.data.page);
      setSejourPages(res.data.pages);
      setSejourTotal(res.data.total);
    } catch { setError('Impossible de charger les séjours.'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    setDeletingUser(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setUserTotal(t => t - 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression.');
    } finally { setDeletingUser(null); setConfirmDelete(null); }
  };

  const handleDeleteSejour = async (id) => {
    setDeletingSejour(id);
    try {
      await api.delete(`/admin/sejours/${id}`);
      setSejours(prev => prev.filter(s => s.id !== id));
      setSejourTotal(t => t - 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression.');
    } finally { setDeletingSejour(null); setConfirmDelete(null); }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, userSearch, userRole);
  };

  const handleSejourSearch = (e) => {
    e.preventDefault();
    fetchSejours(1, sejourSearch);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2 className="admin-title">🛡️ Panel Administrateur</h2>
        <p className="admin-subtitle">Gestion globale de la plateforme BafaConnect</p>
      </div>

      {/* Onglets */}
      <div className="admin-tabs">
        {[
          { id: 'diplomes', label: `🎓 Diplômes${diplomeStatutFiltre === 'en_attente' && diplomeTotal > 0 ? ` (${diplomeTotal})` : ''}` },
          { id: 'stats', label: '📊 Statistiques' },
          { id: 'users', label: '👥 Utilisateurs' },
          { id: 'sejours', label: '🏕️ Séjours' },
        ].map(t => (
          <button
            key={t.id}
            className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="profile-alert profile-alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="admin-confirm-overlay">
          <div className="admin-confirm-box">
            <p>⚠️ Confirmer la suppression ?<br />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {confirmDelete.type === 'user' ? 'Cet utilisateur et toutes ses données seront supprimés.' : 'Ce séjour et toutes ses candidatures seront supprimés.'}
              </span>
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                className="btn-danger"
                disabled={deletingUser === confirmDelete.id || deletingSejour === confirmDelete.id}
                onClick={() => confirmDelete.type === 'user'
                  ? handleDeleteUser(confirmDelete.id)
                  : handleDeleteSejour(confirmDelete.id)
                }
              >
                {(deletingUser === confirmDelete.id || deletingSejour === confirmDelete.id) ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="candidatures-empty">Chargement...</p>}

      {/* ── STATS ── */}
      {!loading && tab === 'stats' && stats && (
        <div>
          <div className="stats-grid">
            <StatCard icon="👥" value={stats.users.total} label="Utilisateurs" sub={`+${stats.users.nouveaux_30j} ce mois`} />
            <StatCard icon="🎒" value={stats.users.animateurs} label="Animateurs" />
            <StatCard icon="🏕️" value={stats.users.directeurs} label="Directeurs" />
            <StatCard icon="📋" value={stats.sejours.total} label="Séjours publiés" sub={`+${stats.sejours.nouveaux_30j} ce mois`} />
            <StatCard icon="📩" value={stats.candidatures.total} label="Candidatures" />
            <StatCard icon="✅" value={stats.candidatures.acceptees} label="Acceptées" color="#22c55e" />
            <StatCard icon="⏳" value={stats.candidatures.en_attente} label="En attente" color="#f59e0b" />
            <StatCard icon="💬" value={stats.messages.total} label="Messages envoyés" />
            <StatCard
              icon="⭐"
              value={stats.avis.moyenne ? parseFloat(stats.avis.moyenne).toFixed(1) : '—'}
              label="Note moyenne"
              sub={`${stats.avis.total} avis`}
              color="#f59e0b"
            />
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {!loading && tab === 'users' && (
        <div>
          <form className="admin-search-bar" onSubmit={handleUserSearch}>
            <input
              className="filtres-input"
              placeholder="🔍 Rechercher par email ou nom..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
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
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{u.nom || '—'}</span>
                        <span className="admin-user-email">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-role-badge ${u.role}`}>
                        {u.role === 'animateur' ? '🎒 Animateur' : '🏕️ Directeur'}
                      </span>
                    </td>
                    <td>{u.ville || u.ville_structure || '—'}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn-danger-sm"
                        onClick={() => setConfirmDelete({ type: 'user', id: u.id })}
                      >
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {userPages > 1 && (
            <div className="pagination-wrapper">
              <button className="pagination-btn" disabled={userPage <= 1} onClick={() => fetchUsers(userPage - 1)}>← Précédent</button>
              <span className="pagination-info">Page {userPage} / {userPages}</span>
              <button className="pagination-btn" disabled={userPage >= userPages} onClick={() => fetchUsers(userPage + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ── SÉJOURS ── */}
      {!loading && tab === 'sejours' && (
        <div>
          <form className="admin-search-bar" onSubmit={handleSejourSearch}>
            <input
              className="filtres-input"
              placeholder="🔍 Rechercher par titre ou lieu..."
              value={sejourSearch}
              onChange={e => setSejourSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Rechercher</button>
            {sejourSearch && (
              <button type="button" className="filtres-reset" onClick={() => { setSejourSearch(''); fetchSejours(1, ''); }}>
                ✕ Réinitialiser
              </button>
            )}
            <span className="filtres-count">{sejourTotal} séjour{sejourTotal !== 1 ? 's' : ''}</span>
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Lieu</th>
                  <th>Directeur</th>
                  <th>Dates</th>
                  <th>Publié le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sejours.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.titre}</strong></td>
                    <td>{s.lieu || '—'}</td>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-nom">{s.directeur_nom}</span>
                        <span className="admin-user-email">{s.directeur_email}</span>
                      </div>
                    </td>
                    <td>
                      {s.date_debut ? new Date(s.date_debut).toLocaleDateString('fr-FR') : '—'}
                      {s.date_fin ? ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}` : ''}
                    </td>
                    <td>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn-danger-sm"
                        onClick={() => setConfirmDelete({ type: 'sejour', id: s.id })}
                      >
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sejourPages > 1 && (
            <div className="pagination-wrapper">
              <button className="pagination-btn" disabled={sejourPage <= 1} onClick={() => fetchSejours(sejourPage - 1)}>← Précédent</button>
              <span className="pagination-info">Page {sejourPage} / {sejourPages}</span>
              <button className="pagination-btn" disabled={sejourPage >= sejourPages} onClick={() => fetchSejours(sejourPage + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ── DIPLÔMES ── */}
      {!loading && tab === 'diplomes' && (
        <div>
          {/* Modale confirmation */}
          {confirmDiplome && (
            <div className="admin-confirm-overlay">
              <div className="admin-confirm-box">
                <p>
                  {confirmDiplome.action === 'validé' ? '✅' : '❌'}{' '}
                  {confirmDiplome.action === 'validé' ? 'Valider' : 'Refuser'} le diplôme{' '}
                  <strong>{confirmDiplome.type}</strong> de <strong>{confirmDiplome.nom}</strong> ?
                </p>
                {confirmDiplome.action === 'refusé' && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                      Motif du refus (optionnel)
                    </label>
                    <input
                      type="text"
                      className="filtres-input"
                      style={{ width: '100%' }}
                      placeholder="Ex : document illisible, mauvais type..."
                      value={commentaire}
                      onChange={e => setCommentaire(e.target.value)}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                  <button className="btn-secondary" onClick={() => { setConfirmDiplome(null); setCommentaire(''); }}>
                    Annuler
                  </button>
                  <button
                    className={confirmDiplome.action === 'validé' ? 'btn-primary' : 'btn-danger'}
                    disabled={actionDiplome === confirmDiplome.id}
                    onClick={() => handleDiplomeAction(confirmDiplome.id, confirmDiplome.action)}
                  >
                    {actionDiplome === confirmDiplome.id ? 'En cours...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filtres statut */}
          <div className="diplomes-admin-filtres">
            {['en_attente', 'validé', 'refusé'].map(s => (
              <button
                key={s}
                className={`diplome-filtre-btn ${diplomeStatutFiltre === s ? 'active' : ''}`}
                onClick={() => {
                  setDiplomeStatutFiltre(s);
                  fetchDiplomes(1, s);
                }}
              >
                {s === 'en_attente' && '⏳ En attente'}
                {s === 'validé' && '✅ Validés'}
                {s === 'refusé' && '❌ Refusés'}
                {' '}
                {diplomeStatutFiltre === s && diplomeTotal > 0 && (
                  <span className="diplome-filtre-count">{diplomeTotal}</span>
                )}
              </button>
            ))}
          </div>

          {diplomes.length === 0 ? (
            <div className="diplomes-empty">
              <span>🎓</span>
              <p>Aucun diplôme {diplomeStatutFiltre === 'en_attente' ? 'en attente' : diplomeStatutFiltre === 'validé' ? 'validé' : 'refusé'} pour le moment.</p>
            </div>
          ) : (
            <div className="diplomes-admin-list">
              {diplomes.map(d => (
                <div key={d.id} className="diplome-admin-card">
                  <div className="diplome-admin-info">
                    <div className="diplome-admin-user">
                      <span className="diplome-type-badge">{d.type}</span>
                      <span className="admin-user-nom">{d.user_nom}</span>
                      <span className={`admin-role-badge ${d.user_role}`}>
                        {d.user_role === 'animateur' ? '🎒' : '🏕️'} {d.user_role}
                      </span>
                    </div>
                    <span className="admin-user-email">{d.user_email}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <a
                        href={d.fichier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="diplome-fichier-link"
                      >
                        📄 {d.fichier_nom}
                      </a>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {d.commentaire_admin && (
                      <p className="diplome-commentaire">💬 {d.commentaire_admin}</p>
                    )}
                  </div>

                  {diplomeStatutFiltre === 'en_attente' && (
                    <div className="diplome-admin-actions">
                      <button
                        className="btn-accepter"
                        disabled={actionDiplome === d.id}
                        onClick={() => setConfirmDiplome({ id: d.id, action: 'validé', type: d.type, nom: d.user_nom })}
                      >
                        ✅ Valider
                      </button>
                      <button
                        className="btn-refuser"
                        disabled={actionDiplome === d.id}
                        onClick={() => setConfirmDiplome({ id: d.id, action: 'refusé', type: d.type, nom: d.user_nom })}
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {diplomePages > 1 && (
            <div className="pagination-wrapper">
              <button className="pagination-btn" disabled={diplomePage <= 1} onClick={() => fetchDiplomes(diplomePage - 1)}>← Précédent</button>
              <span className="pagination-info">Page {diplomePage} / {diplomePages}</span>
              <button className="pagination-btn" disabled={diplomePage >= diplomePages} onClick={() => fetchDiplomes(diplomePage + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
