import { useEffect, useState } from 'react';
import api from './api/axios';

const EMPTY_FORM = {
  titre: '', type: '', lieu: '',
  date_debut: '', date_fin: '',
  description: '', nombre_postes: ''
};

function MesAnnonces({ onAnnonceChanged }) {
  const [sejours, setSejours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // ID du séjour en cours d'édition
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // ID à confirmer avant suppression

  useEffect(() => {
    fetchMesSejours();
  }, []);

  const fetchMesSejours = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sejours/mes-sejours');
      setSejours(res.data);
    } catch (err) {
      setError('Impossible de charger vos annonces.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      titre: s.titre || '',
      type: s.type || '',
      lieu: s.lieu || '',
      date_debut: s.date_debut ? s.date_debut.slice(0, 10) : '',
      date_fin: s.date_fin ? s.date_fin.slice(0, 10) : '',
      description: s.description || '',
      nombre_postes: s.nombre_postes || '',
    });
    setError('');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/sejours/${editingId}`, {
        ...formData,
        nombre_postes: formData.nombre_postes ? parseInt(formData.nombre_postes) : null,
      });
      setEditingId(null);
      await fetchMesSejours();
      if (onAnnonceChanged) onAnnonceChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sejours/${id}`);
      setConfirmDelete(null);
      await fetchMesSejours();
      if (onAnnonceChanged) onAnnonceChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  if (isLoading) return <p className="candidatures-empty">Chargement de vos annonces...</p>;

  return (
    <div className="mes-annonces">
      <h2 className="candidatures-title">🗂️ Mes annonces publiées</h2>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}

      {sejours.length === 0 ? (
        <p className="candidatures-empty">Vous n'avez pas encore publié d'annonce.</p>
      ) : (
        <div className="mes-annonces-list">
          {sejours.map(s => (
            <div key={s.id} className="annonce-item">
              {editingId === s.id ? (
                /* ── Formulaire de modification ── */
                <form onSubmit={handleSave} className="annonce-edit-form">
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Titre *</label>
                      <input name="titre" value={formData.titre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select name="type" value={formData.type} onChange={handleChange} className="profile-select">
                        <option value="">— Sélectionner —</option>
                        <option value="Séjour de vacances">Séjour de vacances</option>
                        <option value="Accueil de loisirs">Accueil de loisirs</option>
                        <option value="Colonie">Colonie</option>
                        <option value="Séjour sportif">Séjour sportif</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Lieu *</label>
                      <input name="lieu" value={formData.lieu} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Nombre de postes</label>
                      <input name="nombre_postes" type="number" min="1" value={formData.nombre_postes} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Date de début</label>
                      <input name="date_debut" type="date" value={formData.date_debut} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Date de fin</label>
                      <input name="date_fin" type="date" value={formData.date_fin} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="profile-textarea" rows="4" required />
                  </div>

                  <div className="profile-actions">
                    <button type="submit" className="btn-primary profile-action-btn" disabled={saving}>
                      {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                    </button>
                    <button type="button" className="btn-secondary profile-action-btn" onClick={() => setEditingId(null)}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Affichage normal ── */
                <div className="annonce-item-content">
                  <div className="annonce-item-info">
                    <div className="annonce-item-header">
                      <h4 className="annonce-item-titre">{s.titre}</h4>
                      {s.type && <span className="annonce-item-type">{s.type}</span>}
                    </div>

                    <div className="annonce-item-meta">
                      <span>📍 {s.lieu}</span>
                      {s.date_debut && (
                        <span>🗓️ {formatDate(s.date_debut)}{s.date_fin && ` → ${formatDate(s.date_fin)}`}</span>
                      )}
                      {s.nombre_postes && <span>👥 {s.nombre_postes} poste{s.nombre_postes > 1 ? 's' : ''}</span>}
                      <span className="annonce-candidatures-count">
                        📩 {s.nb_candidatures} candidature{s.nb_candidatures != 1 ? 's' : ''}
                      </span>
                    </div>

                    {s.description && (
                      <p className="annonce-item-desc">{s.description.slice(0, 120)}{s.description.length > 120 ? '…' : ''}</p>
                    )}
                  </div>

                  <div className="annonce-item-actions">
                    <button className="btn-edit" onClick={() => openEdit(s)}>✏️ Modifier</button>

                    {confirmDelete === s.id ? (
                      <div className="confirm-delete">
                        <span>Confirmer la suppression ?</span>
                        <button className="btn-refuse" onClick={() => handleDelete(s.id)}>Oui, supprimer</button>
                        <button className="btn-secondary-sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
                      </div>
                    ) : (
                      <button className="btn-delete" onClick={() => setConfirmDelete(s.id)}>🗑️ Supprimer</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesAnnonces;
