import { useEffect, useState } from 'react';
import api from './api/axios';

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const role = localStorage.getItem('role'); // On récupère le rôle en direct

  const [formData, setFormData] = useState({ 
    nom: '', prenom: '', bafa_status: '', 
    nom_structure: '', ville: '', description: '' 
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profiles/me');
      setUser(res.data);
      
      // On pré-remplit le formulaire selon le rôle
      if (role === 'animateur') {
        const nomParts = (res.data.nom || '').split(' ');
        setFormData({
          prenom: nomParts[0] || '',
          nom: nomParts.slice(1).join(' ') || '',
          bafa_status: res.data.diplomes?.[0] || ''
        });
      } else {
        setFormData({
          nom_structure: res.data.nom_structure || '',
          ville: res.data.ville || '',
          description: res.data.description || ''
        });
      }
    } catch (err) {
      console.error("Erreur récupération profil :", err);
      // On crée un objet vide pour sortir du mode "Chargement" en cas d'erreur
      setUser({}); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/profiles/me', formData);
      setIsEditing(false);
      fetchProfile(); 
      alert("Profil mis à jour ! ✅");
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  // Sécurité pour ne pas rester bloqué
  if (!user) return <p style={{ color: 'white', textAlign: 'center' }}>Chargement du profil...</p>;

  return (
    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #646cff', textAlign: 'left', maxWidth: '600px', margin: '0 auto 30px auto' }}>
      <h2 style={{ color: '#646cff', marginTop: 0, textAlign: 'center' }}>
        👤 Mon Profil {role === 'animateur' ? 'Animateur' : 'Directeur'}
      </h2>

      {!isEditing ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {role === 'animateur' ? (
              <>
                <p><strong>Identité :</strong> {user?.nom || 'Non renseigné'}</p>
                <p><strong>Diplôme :</strong> {user?.diplomes?.[0] || 'Non renseigné'}</p>
              </>
            ) : (
              <>
                <p><strong>Structure :</strong> {user?.nom_structure || 'Non renseignée'}</p>
                <p><strong>Ville :</strong> {user?.ville || 'Non renseignée'}</p>
              </>
            )}
          </div>
          <button onClick={() => setIsEditing(true)} style={{ background: '#646cff', color: 'white', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', border: 'none' }}>
            Modifier mon profil
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {role === 'animateur' ? (
            <>
              <input type="text" placeholder="Prénom" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} />
              <input type="text" placeholder="Nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
              <select value={formData.bafa_status} onChange={e => setFormData({...formData, bafa_status: e.target.value})}>
                <option value="Non diplômé">Non diplômé</option>
                <option value="Stagiaire">Stagiaire</option>
                <option value="Diplômé">Diplômé</option>
              </select>
            </>
          ) : (
            <>
              <input type="text" placeholder="Nom de la structure" value={formData.nom_structure} onChange={e => setFormData({...formData, nom_structure: e.target.value})} />
              <input type="text" placeholder="Ville" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ background: '#28a745', color: 'white', padding: '10px', borderRadius: '5px', flex: 1 }}>Enregistrer</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#dc3545', color: 'white', padding: '10px', borderRadius: '5px', flex: 1 }}>Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;