import { useEffect, useState } from 'react';
import api from './api/axios';

function MesCandidatures() {
  const [mesCandidatures, setMesCandidatures] = useState([]);

  useEffect(() => {
    api.get('/candidatures/mes-candidatures')
      .then(res => setMesCandidatures(res.data))
      .catch(err => console.error("Erreur récup candidatures", err));
  }, []);

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #646cff', paddingTop: '20px' }}>
      <h2>📋 Mes Candidatures</h2>
      {mesCandidatures.length === 0 ? (
        <p>Vous n'avez pas encore postulé à des séjours.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {mesCandidatures.map(c => (
            <div key={c.id} style={{ background: '#333', padding: '10px', borderRadius: '8px', textAlign: 'left' }}>
              <strong>{c.titre}</strong> - 📍 {c.lieu}
              <br />
              <span style={{ 
                fontSize: '0.8rem', 
                color: c.statut === 'en attente' ? '#ffcc00' : '#00ff00' 
              }}>
                Statut : {c.statut}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesCandidatures;