import { useState } from 'react';
import api from './api/axios';

function CreerAnnonce({ onAnnonceCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    type: '',
    lieu: '',
    date_debut: '',
    date_fin: '',
    description: '',
    nombre_postes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.date_fin && formData.date_debut && formData.date_fin < formData.date_debut) {
      setError('La date de fin ne peut pas être antérieure à la date de début.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/sejours', {
        ...formData,
        nombre_postes: formData.nombre_postes ? parseInt(formData.nombre_postes) : null,
      });
      setFormData({ titre: '', type: '', lieu: '', date_debut: '', date_fin: '', description: '', nombre_postes: '' });
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
    setFormData({ titre: '', type: '', lieu: '', date_debut: '', date_fin: '', description: '', nombre_postes: '' });
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
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type de séjour</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="profile-select"
              >
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
              required
            />
          </div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label htmlFor="date_debut">Date de début</label>
              <input
                id="date_debut"
                name="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_fin">Date de fin</label>
              <input
                id="date_fin"
                name="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nombre_postes">Nombre de postes</label>
            <input
              id="nombre_postes"
              name="nombre_postes"
              type="number"
              min="1"
              placeholder="Ex : 3"
              value={formData.nombre_postes}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description du poste *</label>
            <textarea
              id="description"
              name="description"
              placeholder="Décrivez les missions, le profil recherché, les conditions..."
              value={formData.description}
              onChange={handleChange}
              className="profile-textarea"
              rows="5"
              required
            />
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
