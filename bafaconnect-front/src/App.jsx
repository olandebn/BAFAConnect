import { useEffect, useState } from 'react'
import api from './api/axios'
import Login from './Login'
import MesCandidatures from './MesCandidatures' // Nouvel import
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  // Charger la liste globale des séjours
  const fetchSejours = () => {
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error("Erreur lors de la récupération des séjours :", err))
  }

  useEffect(() => {
    fetchSejours()
  }, [])

  // Fonction pour envoyer une candidature au backend
  const handlePostuler = async (sejourId) => {
    try {
      await api.post('/candidatures', { sejour_id: sejourId });
      alert("Candidature envoyée avec succès ! 🚀");
      // Optionnel : on pourrait recharger les candidatures ici
      window.location.reload(); 
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de la postulation";
      alert(errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
      <h1>🌍 BAFA Connect</h1>
      
      {!isLoggedIn ? (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleLogout} style={{ background: '#ff4646', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
              Se déconnecter
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Annonces disponibles</h2>
            {sejours.map(s => (
              <div key={s.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#242424', textAlign: 'center' }}>
                <h2 style={{ color: '#646cff', margin: '0 0 10px 0' }}>{s.titre}</h2>
                <p>📍 {s.lieu} | 🏢 {s.nom_structure}</p>
                <p style={{ fontStyle: 'italic', color: '#ccc' }}>{s.description}</p>
                <button 
                  onClick={() => handlePostuler(s.id)}
                  style={{ background: '#646cff', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  Postuler
                </button>
              </div>
            ))}
          </div>

          {/* Affichage des candidatures de l'utilisateur connecté */}
          <div style={{ maxWidth: '600px', margin: '40px auto 0 auto' }}>
            <MesCandidatures />
          </div>
        </>
      )}
    </div>
  )
}

export default App