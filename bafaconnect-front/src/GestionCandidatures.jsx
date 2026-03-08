import { useEffect, useState } from 'react';
import api from './api/axios';

function GestionCandidatures() {
  const [candidats, setCandidats] = useState([]);

  useEffect(() => {
    api.get('/recrutement/candidats-recus')
      .then(res => setCandidats(res.data))
      .catch(err => console.error("Erreur", err));
  }, []);

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #00ff00', paddingTop: '20px' }}>
      <h2>📩 Candidatures reçues</h2>
      {candidats.length === 0 ? <p>Aucune candidature pour le moment.</p> : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {candidats.map(c => (
            <div key={c.candidature_id} style={{ background: '#333', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{c.candidat_nom}</strong> postule pour <em>{c.sejour_titre}</em>
                <br />Statut : {c.statut}
              </div>
              <div>
                <button style={{ background: 'green', marginRight: '5px' }}>Accepter</button>
                <button style={{ background: 'red' }}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionCandidatures;