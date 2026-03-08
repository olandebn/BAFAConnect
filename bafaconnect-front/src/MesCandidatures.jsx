import { useEffect, useState } from 'react';
import api from './api/axios';

function MesCandidatures() {
  const [mesCandidatures, setMesCandidatures] = useState([]);

  useEffect(() => {
    api.get('/candidatures/mes-candidatures')
      .then(res => setSejours(res.data)) // Attention ici, utilise bien setMesCandidatures
      .catch(err => console.error("Erreur récup candidatures", err));
  }, []);

  // Correction du setMesCandidatures
  useEffect(() => {
    api.get('/candidatures/mes-candidatures')
      .then(res => setMesCandidatures(res.data))
      .catch(err => console.error("Erreur récup candidatures", err));
  }, []);

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #646cff', paddingTop: '20px' }}>
      <h2 style={{ color: '#646cff' }}>📋 Mes Candidatures</h2>
      {mesCandidatures.length === 0 ? (
        <p>Vous n'avez pas encore postulé à des séjours.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {mesCandidatures.map(c => (
            <div key={c.id} style={{ background: '#333', padding: '15px', borderRadius: '8px', textAlign: 'left' }}>
              <strong style={{ fontSize: '1.1rem' }}>{c.titre}</strong>
              <p style={{ margin: '5px 0' }}>📍 {c.lieu}</p>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '0.8rem', 
                background: c.statut === 'en attente' ? '#555' : '#006400',
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