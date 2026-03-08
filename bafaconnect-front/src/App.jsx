import { useEffect, useState } from 'react'
import api from './api/axios'
import Login from './Login'
import Profile from './Profile'
import MesCandidatures from './MesCandidatures'
import GestionCandidatures from './GestionCandidatures'
import CreerAnnonce from './CreerAnnonce'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role') || 'animateur')

  // Fonction pour charger les annonces
  const fetchSejours = () => {
    api.get('/sejours')
      .then(res => {
        console.log("Annonces reçues :", res.data);
        setSejours(res.data);
      })
      .catch(err => console.error("Erreur récup séjours :", err))
  }

  // Synchronisation au montage et au changement de connexion
  useEffect(() => {
    fetchSejours();
    // On s'assure que l'état local du rôle est bien celui du localStorage
    const savedRole = localStorage.getItem('role');
    if (savedRole) setRole(savedRole);
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setIsLoggedIn(false)
    setRole('animateur') 
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>🌍 BAFA Connect</h1>
      
      {!isLoggedIn ? (
        /* --- CORRECTION ICI : onLoginSuccess --- */
        <Login onLoginSuccess={(userRole) => {
          localStorage.setItem('role', userRole); // Sauvegarde immédiate
          setRole(userRole);                      // Mise à jour de l'interface
          setIsLoggedIn(true);                    // Déclenche le useEffect
        }} />
      ) : (
        <>
          <button onClick={handleLogout} style={{ background: '#ff4646', marginBottom: '20px', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
            Se déconnecter
          </button>

          <Profile />

          {/* AFFICHAGE CONDITIONNEL STRICT SELON LE RÔLE */}
          {role === 'animateur' ? (
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ color: '#646cff' }}>Annonces disponibles</h2>
              
              {sejours.length === 0 ? (
                <p>Aucune annonce n'est disponible pour le moment.</p>
              ) : (
                <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
                  {sejours.map(s => (
                    <div key={s.id} style={{ border: '1px solid #444', padding: '20px', borderRadius: '12px', background: '#242424', textAlign: 'left' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#646cff' }}>{s.titre}</h3>
                      <p><strong>📍 Lieu :</strong> {s.lieu}</p>
                      <p><strong>🏢 Structure :</strong> {s.nom_structure || 'Non précisé'}</p>
                      <p style={{ fontSize: '0.9rem', color: '#bbb' }}>{s.description}</p>
                      <button 
                        onClick={() => {
                          api.post('/candidatures', { sejour_id: s.id })
                            .then(() => alert("Candidature envoyée !"))
                            .catch(() => alert("Tu as déjà postulé à ce séjour."));
                        }}
                        style={{ background: '#646cff', marginTop: '10px' }}
                      >
                        Postuler
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <MesCandidatures />
            </div>
          ) : (
            /* ESPACE RÉSERVÉ AU DIRECTEUR */
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ color: '#28a745' }}>Espace Recruteur</h2>
              <CreerAnnonce onAnnonceCreated={fetchSejours} /> 
              <GestionCandidatures />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App