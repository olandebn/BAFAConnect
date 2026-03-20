import { useState } from 'react'
import api from './api/axios'

function RechercheAnimateurs({ onContacter }) {
  const [filtres, setFiltres] = useState({ q: '', ville: '', statut: '' })
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const set = (field) => (e) => setFiltres({ ...filtres, [field]: e.target.value })

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (filtres.q)      params.append('q', filtres.q)
      if (filtres.ville)  params.append('ville', filtres.ville)
      if (filtres.statut) params.append('statut', filtres.statut)
      const res = await api.get(`/profiles/animateurs?${params}`)
      setResultats(res.data)
    } catch {
      setError('Erreur lors de la recherche.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFiltres({ q: '', ville: '', statut: '' })
    setResultats([])
    setSearched(false)
    setError('')
  }

  const getDispos = (dispos) => {
    if (!dispos) return null
    try {
      const d = typeof dispos === 'string' ? JSON.parse(dispos) : dispos
      if (!d.debut && !d.fin) return null
      const fmt = (s) => s ? new Date(s).toLocaleDateString('fr-FR') : '?'
      return `${fmt(d.debut)} → ${fmt(d.fin)}`
    } catch { return null }
  }

  return (
    <div>
      {/* Formulaire de recherche */}
      <form onSubmit={handleSearch} className="recherche-form">
        <div className="filtres-grid">
          <div className="form-group">
            <label>🔍 Nom ou compétence</label>
            <input
              type="text"
              placeholder="Ex : natation, musique, Paul..."
              value={filtres.q}
              onChange={set('q')}
            />
          </div>
          <div className="form-group">
            <label>📍 Ville</label>
            <input
              type="text"
              placeholder="Ex : Lyon, Paris..."
              value={filtres.ville}
              onChange={set('ville')}
            />
          </div>
          <div className="form-group">
            <label>🎓 Statut BAFA</label>
            <select value={filtres.statut} onChange={set('statut')} className="profile-select">
              <option value="">Tous</option>
              <option value="Diplômé BAFA">Diplômé BAFA</option>
              <option value="En cours de formation">En cours de formation</option>
              <option value="Non diplômé">Non diplômé</option>
            </select>
          </div>
          <div className="recherche-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
            {searched && (
              <button type="button" className="btn-secondary" onClick={handleReset}>
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </form>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}

      {/* Résultats */}
      {searched && !loading && (
        <div className="recherche-resultats">
          {resultats.length === 0 ? (
            <div className="empty-state">
              <span>🔍</span>
              <p>Aucun animateur ne correspond à ces critères.</p>
            </div>
          ) : (
            <>
              <p className="recherche-count">
                {resultats.length} animateur{resultats.length > 1 ? 's' : ''} trouvé{resultats.length > 1 ? 's' : ''}
              </p>
              <div className="animateurs-grid">
                {resultats.map(a => {
                  const dispos = getDispos(a.disponibilites)
                  return (
                    <div key={a.user_id} className="animateur-card">
                      <div className="animateur-card-top">
                        <div className="animateur-avatar">
                          {a.photo_url
                            ? <img src={a.photo_url} alt={a.nom} className="animateur-avatar-img" />
                            : <span>🎒</span>
                          }
                        </div>
                        <div className="animateur-card-info">
                          <h3 className="animateur-card-nom">{a.nom || 'Anonyme'}</h3>
                          {a.ville && <p className="animateur-card-ville">📍 {a.ville}</p>}
                          {a.diplomes?.[0] && (
                            <span className="animateur-card-statut">{a.diplomes[0]}</span>
                          )}
                        </div>
                      </div>

                      {a.competences?.length > 0 && (
                        <div className="animateur-card-chips">
                          {a.competences.slice(0, 4).map((c, i) => (
                            <span key={i} className="chip">{c}</span>
                          ))}
                          {a.competences.length > 4 && (
                            <span className="chip chip-more">+{a.competences.length - 4}</span>
                          )}
                        </div>
                      )}

                      {dispos && (
                        <p className="animateur-card-dispos">🗓️ Disponible : {dispos}</p>
                      )}

                      {onContacter && (
                        <button
                          className="btn-primary animateur-card-btn"
                          onClick={() => onContacter({ id: a.user_id, nom: a.nom, role: 'animateur' })}
                        >
                          💬 Contacter
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="empty-state" style={{ paddingTop: 32 }}>
          <span>👥</span>
          <p>Lancez une recherche pour trouver des animateurs disponibles.</p>
        </div>
      )}
    </div>
  )
}

export default RechercheAnimateurs
