import { useEffect, useState } from 'react'
import api from './api/axios'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])

  useEffect(() => {
    // Appel à ton API backend
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error("Erreur lors de la récupération :", err))
  }, [])

  return (
    <div className="App">
      <h1>BAFA Connect</h1>
      <div className="sejours-list" style={{ display: 'grid', gap: '20px' }}>
        {sejours.map(s => (
          <div key={s.id} className="sejour-card" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{s.titre}</h3>
            <p><strong>Lieu :</strong> {s.lieu}</p>
            <p>{s.description}</p>
            <span style={{ background: '#eee', padding: '5px', borderRadius: '4px' }}>
              Structure : {s.nom_structure}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App