import { useEffect, useState } from 'react';
import api from './api/axios';

function GestionCandidatures() {
  const [candidats, setCandidats] = useState([]);

  const fetchCandidats = () => {
    api.get('/recrutement/candidats-recus')
      .then(res => setCandidats(res.data))
      .catch(err => console.error("Erreur", err));
  };

  useEffect(() => {
    fetchCandidats();
  }, []);

  const handleAction = async (id, nouveauStatut) => {
    try {
      await api.patch(`/recrutement/candidatures/${id}`, { statut: nouveauStatut });
      alert(`Candidature ${nouveauStatut} !`);
      fetchCandidats(); // On rafraîchit la liste
    } catch (err) {
      alert("Erreur lors de l'action");
    }
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #646cff', paddingTop: '20px' }}>
      <h2 style={{ background: '#333', display: 'inline-block', padding: '5px 15px', borderRadius: '5px' }}>
        📩 Candidatures reçues
      </h2>
      
      {candidats.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#888' }}>Aucune candidature pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          {candidats.map(c => (
            <div key={c.candidature_id} style={{ background: '#242424', padding: '15px', borderRadius: '12px', border: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '1.1rem', color: '#646cff' }}>{c.candidat_nom}</strong>
                <p style={{ margin: '5px 0' }}>Postule pour : <em>{c.sejour_titre}</em></p>
                <span style={{ fontSize: '0.8rem', background: '#444', padding: '2px 8px', borderRadius: '10px' }}>
                  Statut actuel : {c.statut}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleAction(c.candidature_id, 'acceptée')} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  Accepter
                </button>
                <button onClick={() => handleAction(c.candidature_id, 'refusée')} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionCandidatures;