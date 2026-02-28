import { useEffect, useState } from 'react'
import api from './api/axios'
import Login from './Login'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  // Charger les séjours depuis l'API
  const fetchSejours = () => {
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error("Erreur lors de la récupération des séjours :", err))
  }

  useEffect(() => {
    fetchSejours()
  }, [])

  // Fonction pour postuler à un séjour
  const handlePostuler = async (sejourId) => {
    try {
      await api.post('/candidatures', { sejour_id: sejourId });
      alert("Candidature envoyée avec succès ! 🚀");
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
            {sejours.map(s => (
              <div key={s.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#242424', textAlign: 'center' }}>
                <h2 style={{ color: '#646cff' }}>{s.titre}</h2>
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
        </>
      )}
    </div>
  )
}

export default App