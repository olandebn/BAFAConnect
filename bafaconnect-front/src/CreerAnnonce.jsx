import { useState } from 'react';
import api from './api/axios';

function CreerAnnonce({ onAnnonceCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    lieu: '',
    description: '',
    nom_structure: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sejours', formData);
      alert("Annonce publiée ! 🚀");
      setFormData({ titre: '', lieu: '', description: '', nom_structure: '' });
      setShowForm(false);
      if (onAnnonceCreated) onAnnonceCreated();
    } catch (err) {
      alert("Erreur lors de la publication");
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)} 
          style={{ background: '#28a745', color: 'white', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
        >
          ➕ Publier une nouvelle annonce
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#242424', padding: '20px', borderRadius: '12px', border: '1px solid #28a745', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Nouvelle Annonce</h3>
          <input type="text" placeholder="Titre du séjour" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} required style={{ padding: '8px' }} />
          <input type="text" placeholder="Lieu (ex: Ardèche)" value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})} required style={{ padding: '8px' }} />
          <input type="text" placeholder="Nom de ta structure" value={formData.nom_structure} onChange={e => setFormData({...formData, nom_structure: e.target.value})} required style={{ padding: '8px' }} />
          <textarea placeholder="Description du poste et missions..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '8px', minHeight: '80px', background: '#1a1a1a', color: 'white' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ background: '#28a745', flex: 1, padding: '10px' }}>Publier</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: '#dc3545', flex: 1, padding: '10px' }}>Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreerAnnonce;