import { useEffect, useState } from 'react';
import api from './api/axios';

function MesCandidatures() {
  const [candidatures, setCandidatures] = useState([]);

  useEffect(() => {
    fetchMesCandidatures();
  }, []);

  const fetchMesCandidatures = () => {
    api.get('/candidatures/me')
      .then(res => {
        // CORRECTION : On utilise setCandidatures et non setSejours
        setCandidatures(res.data);
      })
      .catch(err => console.error("Erreur récup candidatures :", err));
  };

  return (
    <div style={{ marginTop: '30px', textAlign: 'left' }}>
      <h2 style={{ color: '#646cff' }}>📂 Mes candidatures envoyées</h2>
      {candidatures.length === 0 ? (
        <p style={{ color: '#bbb' }}>Vous n'avez pas encore postulé à des séjours.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {candidatures.map(c => (
            <div key={c.id} style={{ background: '#333', padding: '15px', borderRadius: '10px', borderLeft: '5px solid #646cff' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{c.sejour_titre}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Statut : <span style={{ 
                  color: c.statut === 'acceptée' ? '#28a745' : c.statut === 'refusée' ? '#dc3545' : '#ffc107',
                  fontWeight: 'bold' 
                }}>
                  {c.statut.toUpperCase()}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesCandidatures;