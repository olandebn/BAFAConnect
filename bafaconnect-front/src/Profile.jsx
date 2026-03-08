import { useEffect, useState } from 'react';
import api from './api/axios';

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', bafa_status: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api.get('/profiles/me')
      .then(res => {
        setUser(res.data);
        // On sépare le nom complet pour remplir le formulaire si besoin
        const nomParts = (res.data.nom || '').split(' ');
        setFormData({
          prenom: nomParts[0] || '',
          nom: nomParts.slice(1).join(' ') || '',
          bafa_status: (res.data.diplomes && res.data.diplomes[0]) || ''
        });
      })
      .catch(err => console.error("Erreur récup profil", err));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // On envoie en POST comme configuré dans ton profiles.js
      await api.post('/profiles/me', formData);
      setIsEditing(false);
      fetchProfile(); 
      alert("Profil mis à jour ! ✅");
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  if (!user) return <p>Chargement du profil...</p>;

  return (
    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #646cff', textAlign: 'left', maxWidth: '600px', margin: '0 auto 30px auto' }}>
      <h2 style={{ color: '#646cff', marginTop: 0, textAlign: 'center' }}>👤 Mon Profil Animateur</h2>

      {!isEditing ? (
        // --- MODE AFFICHAGE ---
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
            <div>
              <p><strong>Identité :</strong> {user.nom || 'Non renseigné'}</p>
            </div>
            <div>
              <p><strong>Diplôme :</strong> 
                <span style={{ background: '#646cff', padding: '3px 8px', borderRadius: '5px', marginLeft: '10px', fontSize: '0.9rem' }}>
                  {user.diplomes && user.diplomes.length > 0 ? user.diplomes[0] : 'Non renseigné'}
                </span>
              </p>
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} style={{ background: '#646cff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
            Modifier mon profil
          </button>
        </div>
      ) : (
        // --- MODE ÉDITION ---
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Prénom" 
              value={formData.prenom} 
              onChange={e => setFormData({...formData, prenom: e.target.value})} 
              style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="Nom" 
              value={formData.nom} 
              onChange={e => setFormData({...formData, nom: e.target.value})} 
              style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: 'white' }}
            />
          </div>
          
          <select 
            value={formData.bafa_status} 
            onChange={e => setFormData({...formData, bafa_status: e.target.value})} 
            style={{ padding: '10px', borderRadius: '5px', background: '#222', color: 'white', border: '1px solid #444' }}
          >
            <option value="">-- Quel est ton statut BAFA ? --</option>
            <option value="Non diplômé">Non diplômé</option>
            <option value="Stagiaire">Stagiaire</option>
            <option value="Diplômé">Diplômé</option>
          </select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', flex: 1, cursor: 'pointer' }}>Enregistrer</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', flex: 1, cursor: 'pointer' }}>Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;