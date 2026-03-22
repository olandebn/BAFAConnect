import { useState } from 'react'
import api from './api/axios'
import InviterModal from './InviterModal'

const COMPETENCES_RAPIDES = ['PSC1', 'Natation', 'Sport', 'Théâtre', 'Musique', 'Cuisine', 'Bricolage', 'Informatique', 'Langues', 'Arts plastiques']

function getBadges(a) {
  const badges = []
  if (a.diplomes?.some(d => /diplômé bafa/i.test(d) || /diplome bafa/i.test(d))) {
    badges.push({ icon: '🎓', label: 'Diplômé BAFA', cls: 'badge-bafa' })
  }
  if ((a.experiences?.length || 0) >= 2) {
    badges.push({ icon: '💪', label: 'Expérimenté', cls: 'badge-exp' })
  }
  return badges
}

const APPROFONDISSEMENTS = [
  'Activités physiques et sportives',
  'Activités nautiques',
  'Surveillant de baignade',
  'Animation musicale',
  'Théâtre / Arts du spectacle',
  'Activités de pleine nature',
  'Animation auprès des jeunes enfants',
  'Numérique / Informatique',
  'Animation interculturelle',
  'Approfondissement général',
]

const PAGE_SIZE = 9

function RechercheAnimateurs({ onContacter, onVoirProfil }) {
  const [filtres, setFiltres] = useState({ q: '', ville: '', statut: '', appro: '' })
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [favorisIds, setFavorisIds] = useState(new Set())
  const [favoriNotif, setFavoriNotif] = useState('')
  const [inviterAnimateur, setInviterAnimateur] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const toggleFavori = async (animateur) => {
    const isFavori = favorisIds.has(animateur.user_id)
    try {
      if (isFavori) {
        await api.delete(`/favoris/${animateur.user_id}`)
        setFavorisIds(prev => { const s = new Set(prev); s.delete(animateur.user_id); return s })
        setFavoriNotif(`${animateur.nom || 'Animateur'} retiré des favoris`)
      } else {
        await api.post(`/favoris/${animateur.user_id}`)
        setFavorisIds(prev => new Set([...prev, animateur.user_id]))
        setFavoriNotif(`${animateur.nom || 'Animateur'} ajouté aux favoris ❤️`)
      }
    } catch {
      setFavoriNotif('Erreur lors de la mise à jour des favoris')
    }
    setTimeout(() => setFavoriNotif(''), 3000)
  }

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
      if (filtres.appro)  params.append('appro', filtres.appro)
      const res = await api.get(`/profiles/animateurs?${params}`)
      setResultats(res.data)
      setCurrentPage(1)
    } catch {
      setError('Erreur lors de la recherche.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFiltres({ q: '', ville: '', statut: '', appro: '' })
    setResultats([])
    setSearched(false)
    setError('')
    setCurrentPage(1)
  }

  const searchByCompetence = (comp) => {
    const newFiltres = { ...filtres, q: comp }
    setFiltres(newFiltres)
    setLoading(true)
    setError('')
    setSearched(true)
    const params = new URLSearchParams()
    params.append('q', comp)
    if (newFiltres.ville) params.append('ville', newFiltres.ville)
    if (newFiltres.statut) params.append('statut', newFiltres.statut)
    if (newFiltres.appro) params.append('appro', newFiltres.appro)
    api.get(`/profiles/animateurs?${params}`)
      .then(res => setResultats(res.data))
      .catch(() => setError('Erreur lors de la recherche.'))
      .finally(() => setLoading(false))
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
      {inviterAnimateur && (
        <InviterModal animateur={inviterAnimateur} onClose={() => setInviterAnimateur(null)} />
      )}
      {/* Formulaire de recherche */}
      <form onSubmit={handleSearch} className="recherche-form">
        <div className="recherche-fields-grid">
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
              <option value="">Tous statuts</option>
              <option value="Diplômé BAFA">Diplômé BAFA</option>
              <option value="En cours de formation">En cours</option>
              <option value="Non diplômé">Non diplômé</option>
            </select>
          </div>
          <div className="form-group">
            <label>📚 Approfondissement</label>
            <select value={filtres.appro} onChange={set('appro')} className="profile-select">
              <option value="">Tous</option>
              {APPROFONDISSEMENTS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="recherche-actions-row">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
          {searched && (
            <button type="button" className="btn-secondary" onClick={handleReset}>
              Réinitialiser
            </button>
          )}
        </div>
        {/* Filtres compétences rapides */}
        <div className="competences-rapides">
          <span className="competences-rapides-label">🏅 Filtrer par compétence :</span>
          <div className="competences-rapides-chips">
            {COMPETENCES_RAPIDES.map(c => (
              <button
                key={c}
                type="button"
                className={`competence-chip${filtres.q === c ? ' competence-chip-active' : ''}`}
                onClick={() => filtres.q === c ? handleReset() : searchByCompetence(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {favoriNotif && <div className="notif-toast toast-success">{favoriNotif}</div>}

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
                {resultats.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(a => {
                  const dispos = getDispos(a.disponibilites)
                  const badges = getBadges(a)
                  return (
                    <div key={a.user_id} className="animateur-card">
                      <div className="animateur-card-content">
                      <div className="animateur-card-top">
                        <div className="animateur-avatar">
                          {a.photo_url
                            ? <img src={a.photo_url} alt={a.nom} className="animateur-avatar-img" />
                            : <span>🎒</span>
                          }
                        </div>
                        <div className="animateur-card-info">
                          <h3 className="animateur-card-nom">
                            {a.nom && !a.nom.includes('undefined') ? a.nom : 'Profil incomplet'}
                          </h3>
                          {a.ville && <p className="animateur-card-ville">📍 {a.ville}</p>}
                          {a.diplomes?.[0] && (
                            <span className="animateur-card-statut">{a.diplomes[0]}</span>
                          )}
                          {a.diplomes?.[1] && (
                            <div className="appro-tag-row">
                              <span className="appro-tag">📚 {a.diplomes[1]}</span>
                              <span className="appro-autodeclare" title="Qualification déclarée par l'animateur — demandez un justificatif pour vérifier">
                                ⚠️ Auto-déclaré
                              </span>
                            </div>
                          )}
                          {badges.length > 0 && (
                            <div className="animateur-badges">
                              {badges.map((b, i) => (
                                <span key={i} className={`animateur-badge ${b.cls}`}>{b.icon} {b.label}</span>
                              ))}
                            </div>
                          )}
                          {a.cv_url && (
                            <button
                              type="button"
                              className="badge-cv badge-cv-btn"
                              title="Voir le CV"
                              onClick={() => {
                                const win = window.open()
                                if (win) win.document.write(`<iframe src="${a.cv_url}" style="width:100%;height:100%;border:none;" />`)
                              }}
                            >
                              📄 Voir le CV
                            </button>
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
                      </div>{/* end animateur-card-content */}

                      <div className="animateur-card-actions-row">
                        {onVoirProfil && (
                          <button
                            className="btn-secondary animateur-card-btn"
                            onClick={() => onVoirProfil(a.user_id, 'animateur')}
                          >
                            👤 Voir le profil
                          </button>
                        )}
                        {onContacter && (
                          <button
                            className="btn-primary animateur-card-btn"
                            onClick={() => onContacter({ id: a.user_id, nom: a.nom, role: 'animateur' })}
                          >
                            💬 Contacter
                          </button>
                        )}
                        <button
                          className="btn-inviter"
                          onClick={() => setInviterAnimateur({ id: a.user_id, nom: a.nom })}
                          title="Inviter à postuler"
                        >
                          🔗 Inviter
                        </button>
                        <button
                          className={`btn-favori ${favorisIds.has(a.user_id) ? 'btn-favori-active' : ''}`}
                          onClick={() => toggleFavori(a)}
                          title={favorisIds.has(a.user_id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          {favorisIds.has(a.user_id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {resultats.length > PAGE_SIZE && (
                <div className="pagination-wrapper">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0) }}
                  >← Précédent</button>

                  {Array.from({ length: Math.ceil(resultats.length / PAGE_SIZE) }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === Math.ceil(resultats.length / PAGE_SIZE) || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={`e${i}`} className="pagination-info">…</span>
                      : <button key={p} className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => { setCurrentPage(p); window.scrollTo(0, 0) }}>{p}</button>
                    )
                  }

                  <button
                    className="pagination-btn"
                    disabled={currentPage === Math.ceil(resultats.length / PAGE_SIZE)}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0) }}
                  >Suivant →</button>

                  <span className="pagination-info">
                    Page {currentPage}/{Math.ceil(resultats.length / PAGE_SIZE)}
                  </span>
                </div>
              )}
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
