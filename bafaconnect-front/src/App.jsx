import { useEffect, useState } from 'react'
import api from './api/axios'
import Login from './Login'
import Profile from './Profile'
import MesCandidatures from './MesCandidatures'
import GestionCandidatures from './GestionCandidatures' // Nouvel import
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  
  // On récupère le rôle stocké (on devra peut-être le stocker au Login)
  const [role, setRole] = useState(localStorage.getItem('role') || 'animateur')

  const fetchSejours = () => {
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error("Erreur récup séjours :", err))
  }

  useEffect(() => {
    fetchSejours()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setIsLoggedIn(false)
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>🌍 BAFA Connect</h1>
      
      {!isLoggedIn ? (
        <Login onLoginSuccess={(userRole) => {
          setIsLoggedIn(true);
          setRole(userRole);
        }} />
      ) : (
        <>
          <button onClick={handleLogout} style={{ background: '#ff4646', marginBottom: '20px' }}>
            Se déconnecter
          </button>

          <Profile />

          {/* AFFICHAGE CONDITIONNEL SELON LE RÔLE */}
          {role === 'animateur' ? (
            <>
              <h2>Annonces disponibles</h2>
              <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
                {sejours.map(s => (
                  <div key={s.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', background: '#242424' }}>
                    <h3>{s.titre}</h3>
                    <p>📍 {s.lieu}</p>
                    <button onClick={() => api.post('/candidatures', { sejour_id: s.id })}>Postuler</button>
                  </div>
                ))}
              </div>
              <MesCandidatures />
            </>
          ) : (
            /* SI C'EST UN DIRECTEUR */
            <GestionCandidatures />
          )}
        </>
      )}
    </div>
  )
}

export default App