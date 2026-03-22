import { useEffect, useState, useRef } from 'react';
import api from './api/axios';

const SUPABASE_URL = 'https://rzjfhucnftglbdvgosld.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amZodWNuZnRnbGJkdmdvc2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzMwNjMsImV4cCI6MjA4NzU0OTA2M30.qLsPBLmRwMU8-lfmZzcPdRGjvGGa8mBrF51xSRrvAw8';

const TYPES_DIPLOMES = ['BAFA', 'BAFD', 'BPJEPS', 'DEUST', 'Licence STAPS', 'PSC1', 'Autre'];

const STATUT_CONFIG = {
  'en_attente': { label: 'En cours de vérification', color: '#f59e0b', bg: '#fef9c3', icon: '⏳' },
  'validé':     { label: 'Validé',                   color: '#16a34a', bg: '#dcfce7', icon: '✅' },
  'refusé':     { label: 'Refusé',                   color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

function MesDiplomes() {
  const [diplomes, setDiplomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeSel, setTypeSel] = useState('BAFA');
  const [fichier, setFichier] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchDiplomes(); }, []);

  const fetchDiplomes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diplomes/mes');
      setDiplomes(res.data);
    } catch { setError('Impossible de charger vos diplômes.'); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('Fichier trop lourd (max 10 Mo).'); return; }
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setError('Format accepté : PDF, JPG, PNG uniquement.');
      return;
    }
    setFichier(f);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fichier) { setError('Veuillez sélectionner un fichier.'); return; }
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Upload vers Supabase Storage
      const ext = fichier.name.split('.').pop();
      const path = `diplomes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/message-files/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': fichier.type,
        },
        body: fichier,
      });
      if (!uploadRes.ok) throw new Error('Échec de l\'upload');
      const fichier_url = `${SUPABASE_URL}/storage/v1/object/public/message-files/${path}`;

      // 2. Enregistrer en base
      await api.post('/diplomes', {
        type: typeSel,
        fichier_url,
        fichier_nom: fichier.name,
      });

      setSuccess(`✅ Diplôme "${typeSel}" soumis ! Un admin le vérifiera sous peu.`);
      setFichier(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDiplomes();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi du diplôme.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/diplomes/${id}`);
      setDiplomes(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression.');
    } finally { setDeletingId(null); }
  };

  // Types déjà soumis et non refusés
  const typesDejaEnvoyes = diplomes
    .filter(d => d.statut !== 'refusé')
    .map(d => d.type);

  return (
    <div className="diplomes-wrapper">
      <div className="diplomes-header">
        <h2 className="diplomes-title">🎓 Mes diplômes</h2>
        <p className="diplomes-subtitle">
          Soumettez vos diplômes pour obtenir un badge "Vérifié" sur votre profil.
          Formats acceptés : PDF, JPG, PNG — 10 Mo max.
        </p>
      </div>

      {/* Formulaire d'ajout */}
      <form className="diplomes-form" onSubmit={handleSubmit}>
        <div className="diplomes-form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Type de diplôme</label>
            <select
              className="filtres-select"
              style={{ width: '100%', padding: '10px 12px' }}
              value={typeSel}
              onChange={e => setTypeSel(e.target.value)}
            >
              {TYPES_DIPLOMES.map(t => (
                <option key={t} value={t} disabled={typesDejaEnvoyes.includes(t)}>
                  {t}{typesDejaEnvoyes.includes(t) ? ' (déjà soumis)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label>Fichier (PDF, JPG ou PNG)</label>
            <div className="diplomes-file-row">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📎 Choisir un fichier
              </button>
              {fichier ? (
                <span className="diplomes-filename">
                  {fichier.name}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    onClick={() => { setFichier(null); fileInputRef.current.value = ''; }}
                  >✕</button>
                </span>
              ) : (
                <span className="diplomes-filename muted">Aucun fichier sélectionné</span>
              )}
            </div>
          </div>
        </div>

        {error && <div className="profile-alert profile-alert-error">{error}</div>}
        {success && <div className="profile-alert profile-alert-success">{success}</div>}

        <button
          type="submit"
          className="btn-primary"
          disabled={uploading || !fichier}
          style={{ alignSelf: 'flex-start' }}
        >
          {uploading ? '⏳ Envoi en cours...' : '📤 Soumettre le diplôme'}
        </button>
      </form>

      {/* Liste des diplômes */}
      {loading ? (
        <p className="candidatures-empty">Chargement...</p>
      ) : diplomes.length === 0 ? (
        <div className="diplomes-empty">
          <span>🎓</span>
          <p>Vous n'avez encore soumis aucun diplôme.</p>
        </div>
      ) : (
        <div className="diplomes-list">
          {diplomes.map(d => {
            const config = STATUT_CONFIG[d.statut] || STATUT_CONFIG['en_attente'];
            return (
              <div key={d.id} className="diplome-card">
                <div className="diplome-card-left">
                  <div className="diplome-type">{d.type}</div>
                  <a
                    href={d.fichier_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="diplome-fichier-link"
                  >
                    📄 {d.fichier_nom}
                  </a>
                  <span className="diplome-date">
                    Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="diplome-card-right">
                  <span
                    className="diplome-statut-badge"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {config.icon} {config.label}
                  </span>
                  {d.commentaire_admin && (
                    <p className="diplome-commentaire">💬 {d.commentaire_admin}</p>
                  )}
                  {d.statut !== 'validé' && (
                    <button
                      className="btn-danger-sm"
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                    >
                      {deletingId === d.id ? '...' : '🗑 Supprimer'}
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

export default MesDiplomes;
