import { useEffect, useState } from 'react'
import api from './api/axios'

function Stars({ note }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(note) ? '#f59e0b' : '#d1d5db', fontSize: '1.1rem' }}>★</span>
      ))}
    </span>
  )
}

function ProfilPublic({ userId, onContacter, onRetour }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isLoggedIn = !!localStorage.getItem('token')
  const role = localStorage.getItem('role')

  useEffect(() => {
    if (!userId) return
    api.get(`/profiles/public/${userId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Profil introuvable ou non disponible.'))
      .finally(() => setLoading(false))
  }, [userId])

  const getDispos = (disponibilites) => {
    if (!disponibilites) return null
    try {
      const d = typeof disponibilites === 'string' ? JSON.parse(disponibilites) : disponibilites
      const fmt = (s) => new Date(s).toLocaleDateString('fr-FR')
      if (d.debut && d.fin) return `Du ${fmt(d.debut)} au ${fmt(d.fin)}`
      if (d.debut) return `À partir du ${fmt(d.debut)}`
      return null
    } catch { return null }
  }

  if (loading) return (
    <div className="profil-public-wrapper">
      <p className="candidatures-empty">Chargement du profil...</p>
    </div>
  )

  if (error) return (
    <div className="profil-public-wrapper">
      <div className="profile-alert profile-alert-error">{error}</div>
      {onRetour && (
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={onRetour}>
          ← Retour
        </button>
      )}
    </div>
  )

  if (!data) return null

  const { profil, avis, moyenne, nb_avis } = data
  const dispos = getDispos(profil.disponibilites)

  const badges = []
  if (profil.diplomes?.some(d => /diplômé bafa/i.test(d) || /diplome bafa/i.test(d))) {
    badges.push({ icon: '🎓', label: 'Diplômé BAFA', cls: 'badge-bafa' })
  }
  if ((profil.experiences?.length || 0) >= 2) {
    badges.push({ icon: '💪', label: 'Expérimenté', cls: 'badge-exp' })
  }
  if (moyenne >= 4.5 && nb_avis >= 3) {
    badges.push({ icon: '⭐', label: 'Top noté', cls: 'badge-top' })
  }

  return (
    <div className="profil-public-wrapper">

      {/* Bouton retour */}
      {onRetour && (
        <button className="btn-link profil-public-retour" onClick={onRetour}>
          ← Retour
        </button>
      )}

      {/* Card principale */}
      <div className="profil-public-card">
        <div className="profil-public-header">
          <div className="profil-public-avatar">
            {profil.photo_url
              ? <img src={profil.photo_url} alt={profil.nom} className="profil-public-avatar-img" />
              : <span className="profil-public-avatar-placeholder">🎒</span>
            }
          </div>
          <div className="profil-public-identity">
            <h1 className="profil-public-nom">{profil.nom || 'Animateur'}</h1>
            <div className="profil-public-meta">
              {profil.ville && <span>📍 {profil.ville}</span>}
              {profil.diplomes?.[0] && (
                <span className="animateur-card-statut">{profil.diplomes[0]}</span>
              )}
            </div>
            {moyenne && (
              <div className="profil-public-avis-ligne">
                <Stars note={moyenne} />
                <span className="profil-public-moyenne">{moyenne.toFixed(1)}/5</span>
                <span className="profil-public-nb-avis">({nb_avis} avis)</span>
              </div>
            )}
            {badges.length > 0 && (
              <div className="animateur-badges" style={{ marginTop: 8 }}>
                {badges.map((b, i) => (
                  <span key={i} className={`animateur-badge ${b.cls}`}>{b.icon} {b.label}</span>
                ))}
              </div>
            )}
          </div>

          {/* Bouton contacter */}
          {isLoggedIn && role === 'directeur' && onContacter && (
            <button
              className="btn-primary profil-public-contact-btn"
              onClick={() => onContacter({ id: profil.user_id, nom: profil.nom, role: 'animateur' })}
            >
              💬 Contacter
            </button>
          )}
          {!isLoggedIn && (
            <div className="profil-public-login-hint">
              <span>Connectez-vous pour contacter cet animateur</span>
            </div>
          )}
        </div>

        <div className="profil-public-body">
          {/* Compétences */}
          {profil.competences?.length > 0 && (
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">Compétences</h3>
              <div className="profile-chips">
                {profil.competences.map((c, i) => (
                  <span key={i} className="profile-chip">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Expériences */}
          {profil.experiences?.length > 0 && (
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">Expériences</h3>
              <div className="profile-chips">
                {profil.experiences.map((e, i) => (
                  <span key={i} className="profile-chip">{e}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disponibilités */}
          {dispos && (
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">Disponibilités</h3>
              <p className="profil-public-dispos">🗓️ {dispos}</p>
            </div>
          )}
        </div>
      </div>

      {/* Avis */}
      {avis.length > 0 && (
        <div className="profil-public-avis">
          <h2 className="profil-public-avis-title">
            Avis reçus
            {moyenne && <span className="profil-public-avis-moyenne"> · ⭐ {moyenne.toFixed(1)}/5</span>}
          </h2>
          <div className="avis-list">
            {avis.map((a, i) => (
              <div key={i} className="avis-item">
                <div className="avis-item-top">
                  <Stars note={a.note} />
                  <span className="avis-item-auteur">{a.auteur_nom}</span>
                  <span className="avis-item-date">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {a.commentaire && (
                  <p className="avis-item-commentaire">"{a.commentaire}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partager ce profil */}
      <div className="profil-public-share">
        <span className="profil-public-share-label">🔗 Lien du profil :</span>
        <code className="profil-public-share-url">
          {window.location.origin}?profil={profil.user_id}
        </code>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}?profil=${profil.user_id}`)
          }}
        >
          Copier
        </button>
      </div>
    </div>
  )
}

export default ProfilPublic
