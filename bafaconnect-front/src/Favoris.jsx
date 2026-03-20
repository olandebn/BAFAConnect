import { useEffect, useState } from 'react'
import api from './api/axios'

function Favoris({ onContacter }) {
  const [favoris, setFavoris] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFavoris = async () => {
    setLoading(true)
    try {
      const res = await api.get('/favoris')
      setFavoris(res.data)
    } catch (err) {
      console.error('Erreur favoris :', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFavoris() }, [])

  const retirerFavori = async (animateurId) => {
    try {
      await api.delete(`/favoris/${animateurId}`)
      setFavoris(prev => prev.filter(f => f.animateur_id !== animateurId))
    } catch (err) {
      console.error('Erreur retrait favori :', err)
    }
  }

  const getDispos = (disponibilites) => {
    if (!disponibilites) return null
    try {
      const d = typeof disponibilites === 'string' ? JSON.parse(disponibilites) : disponibilites
      if (!d.debut) return null
      const fmt = (s) => new Date(s).toLocaleDateString('fr-FR')
      if (d.debut && d.fin) return `${fmt(d.debut)} → ${fmt(d.fin)}`
      return `à partir du ${fmt(d.debut)}`
    } catch { return null }
  }

  if (loading) return (
    <div className="empty-state"><p>Chargement...</p></div>
  )

  if (favoris.length === 0) return (
    <div className="empty-state">
      <span>❤️</span>
      <p>Aucun animateur en favoris pour le moment.</p>
      <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 6 }}>
        Ajoutez des animateurs depuis "Trouver un animateur".
      </p>
    </div>
  )

  return (
    <div className="animateurs-grid">
      {favoris.map(f => {
        const dispos = getDispos(f.disponibilites)
        return (
          <div key={f.animateur_id} className="animateur-card">
            <div className="animateur-card-top">
              <div className="animateur-avatar">
                {f.photo_url
                  ? <img src={f.photo_url} alt={f.nom} className="animateur-avatar-img" />
                  : <span>🎒</span>
                }
              </div>
              <div className="animateur-card-info">
                <h3 className="animateur-card-nom">{f.nom || f.email}</h3>
                {f.ville && <p className="animateur-card-ville">📍 {f.ville}</p>}
                {f.diplomes?.[0] && (
                  <span className="animateur-card-statut">{f.diplomes[0]}</span>
                )}
              </div>
            </div>

            {f.competences?.length > 0 && (
              <div className="animateur-card-chips">
                {f.competences.slice(0, 4).map((c, i) => (
                  <span key={i} className="chip">{c}</span>
                ))}
                {f.competences.length > 4 && (
                  <span className="chip chip-more">+{f.competences.length - 4}</span>
                )}
              </div>
            )}

            {dispos && (
              <p className="animateur-card-dispos">🗓️ Disponible : {dispos}</p>
            )}

            <div className="animateur-card-actions-row">
              {onContacter && (
                <button
                  className="btn-primary animateur-card-btn"
                  onClick={() => onContacter({ id: f.animateur_id, nom: f.nom, role: 'animateur' })}
                >
                  💬 Contacter
                </button>
              )}
              <button
                className="btn-favori-retirer"
                onClick={() => retirerFavori(f.animateur_id)}
                title="Retirer des favoris"
              >
                ❤️ Retirer
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Favoris
