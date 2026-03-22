import { useState } from 'react';
import api from './api/axios';

const EMPTY_FORM = { titre: '', type: '', lieu: '', date_debut: '', date_fin: '', description: '', nombre_postes: '' };

function validate(formData) {
  const errors = {};
  if (!formData.titre.trim()) errors.titre = 'Le titre est obligatoire.';
  else if (formData.titre.trim().length < 5) errors.titre = 'Le titre doit faire au moins 5 caractères.';
  if (!formData.lieu.trim()) errors.lieu = 'Le lieu est obligatoire.';
  if (!formData.description.trim()) errors.description = 'La description est obligatoire.';
  else if (formData.description.trim().length < 20) errors.description = 'La description doit faire au moins 20 caractères.';
  if (formData.date_debut && formData.date_fin && formData.date_fin < formData.date_debut)
    errors.date_fin = 'La date de fin ne peut pas être avant la date de début.';
  if (formData.nombre_postes && (parseInt(formData.nombre_postes) < 1 || parseInt(formData.nombre_postes) > 100))
    errors.nombre_postes = 'Entre 1 et 100 postes.';
  return errors;
}

function CreerAnnonce({ onAnnonceCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    if (touched[e.target.name]) {
      setFieldErrors(validate(newData));
    }
  };

  const handleBlur = (e) => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
    setFieldErrors(validate(formData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const allTouched = { titre: true, lieu: true, description: true, date_fin: true, nombre_postes: true };
    setTouched(allTouched);
    const errors = validate(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      await api.post('/sejours', {
        ...formData,
        nombre_postes: formData.nombre_postes ? parseInt(formData.nombre_postes) : null,
      });
      setFormData(EMPTY_FORM);
      setFieldErrors({});
      setTouched({});
      setShowForm(false);
      if (onAnnonceCreated) onAnnonceCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la publication de l'annonce.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError('');
    setFieldErrors({});
    setTouched({});
    setFormData(EMPTY_FORM);
  };

  return (
    <div>
      {!showForm ? (
        <div className="action-card-header">
          <h3>Publier une annonce</h3>
          <p>Créez une nouvelle offre visible par tous les animateurs inscrits sur BafaConnect.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            ➕ Nouvelle annonce
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="annonce-form">
          <h3 className="annonce-form-title">Nouvelle annonce de recrutement</h3>

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="titre">Titre du séjour *</label>
              <input
                id="titre"
                name="titre"
                type="text"
                placeholder="Ex : Animateur colo été – Ardèche"
                value={formData.titre}
                onChange={handleChange}
                onBlur={handleBlur}
                style={fieldErrors.titre ? { borderColor: 'var(--danger)' } : {}}
              />
              {fieldErrors.titre && <span className="field-error">{fieldErrors.titre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="type">Type de séjour</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className="profile-select">
                <option value="">— Sélectionner —</option>
                <option value="Séjour de vacances">Séjour de vacances</option>
                <option value="Accueil de loisirs">Accueil de loisirs</option>
                <option value="Colonie">Colonie</option>
                <option value="Séjour sportif">Séjour sportif</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lieu">Lieu *</label>
            <input
              id="lieu"
              name="lieu"
              type="text"
              placeholder="Ex : Ardèche (07)"
              value={formData.lieu}
              onChange={handleChange}
              onBlur={handleBlur}
              style={fieldErrors.lieu ? { borderColor: 'var(--danger)' } : {}}
            />
            {fieldErrors.lieu && <span className="field-error">{fieldErrors.lieu}</span>}
          </div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="date_debut">Date de début</label>
              <input id="date_debut" name="date_debut" type="date" value={formData.date_debut} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="date_fin">Date de fin</label>
              <input
                id="date_fin"
                name="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={handleChange}
                onBlur={handleBlur}
                style={fieldErrors.date_fin ? { borderColor: 'var(--danger)' } : {}}
              />
              {fieldErrors.date_fin && <span className="field-error">{fieldErrors.date_fin}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nombre_postes">Nombre de postes</label>
            <input
              id="nombre_postes"
              name="nombre_postes"
              type="number"
              min="1"
              max="100"
              placeholder="Ex : 3"
              value={formData.nombre_postes}
              onChange={handleChange}
              onBlur={handleBlur}
              style={fieldErrors.nombre_postes ? { borderColor: 'var(--danger)' } : {}}
            />
            {fieldErrors.nombre_postes && <span className="field-error">{fieldErrors.nombre_postes}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description du poste *
              <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 8, fontSize: '0.8rem' }}>
                {formData.description.length} caractères
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Décrivez les missions, le profil recherché, les conditions..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className="profile-textarea"
              rows="5"
              style={fieldErrors.description ? { borderColor: 'var(--danger)' } : {}}
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>

          {error && <div className="profile-alert profile-alert-error">{error}</div>}

          <div className="profile-actions">
            <button type="submit" className="btn-primary profile-action-btn" disabled={isLoading}>
              {isLoading ? 'Publication...' : '🚀 Publier l\'annonce'}
            </button>
            <button
              type="button"
              className="btn-secondary profile-action-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreerAnnonce;
