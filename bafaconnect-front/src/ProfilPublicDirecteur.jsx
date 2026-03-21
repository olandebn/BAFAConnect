import { useEffect, useState } from 'react'
import api from './api/axios'

function ProfilPublicDirecteur({ userId, onContacter, onPostuler, onRetour }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isLoggedIn = !!localStorage.getItem('token')
  const role = localStorage.getItem('role')

  useEffect(() => {
    if (!userId) return
    api.get(`/profiles/public-directeur/${userId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Profil introuvable ou non disponible.'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="profil-public-wrapper">
      <p className="candidatures-empty">Chargement du profil...</p>
    </div>
  )

  if (error) return (
    <div className="profil-public-wrapper">
      <div className="profile-alert profile-alert-error">{error}</div>
      {onRetour && <button className="btn-secondary" style={{ marginTop: 12 }} onClick={onRetour}>← Retour</button>}
    </div>
  )

  if (!data) return null

  const { profil, sejours } = data
  const sejoursAvenir = sejours.filter(s => !s.date_fin || new Date(s.date_fin) >= new Date())

  return (
    <div className="profil-public-wrapper">

      {onRetour && (
        <button className="btn-link profil-public-retour" onClick={onRetour}>← Retour</button>
      )}

      {/* Card principale structure */}
      <div className="profil-public-card">
        <div className="profil-public-header">
          <div className="profil-public-avatar">
            {profil.photo_url
              ? <img src={profil.photo_url} alt={profil.nom_structure} className="profil-public-avatar-img" />
              : <span className="profil-public-avatar-placeholder">🏕️</span>
            }
          </div>
          <div className="profil-public-identity">
            <h1 className="profil-public-nom">{profil.nom_structure || 'Structure'}</h1>
            <div className="profil-public-meta">
              {profil.ville && <span>📍 {profil.ville}</span>}
              {profil.type_structure && (
                <span className="animateur-card-statut">{profil.type_structure}</span>
              )}
            </div>
            <div className="pdir-badges">
              {sejoursAvenir.length > 0 && (
                <span className="pdir-badge-actif">
                  ✅ {sejoursAvenir.length} séjour{sejoursAvenir.length > 1 ? 's' : ''} en cours / à venir
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pdir-actions">
            {isLoggedIn && role === 'animateur' && onContacter && (
              <button
                className="btn-primary"
                onClick={() => onContacter({ id: profil.user_id, nom: profil.nom_structure, role: 'directeur' })}
              >
                💬 Contacter
              </button>
            )}
            {profil.flyer_url && (
              <button
                className="btn-document"
                onClick={() => {
                  const win = window.open()
                  if (win) win.document.write(`<iframe src="${profil.flyer_url}" style="width:100%;height:100%;border:none;" />`)
                }}
              >
                📋 Voir le flyer
              </button>
            )}
          </div>
        </div>

        {profil.description && (
          <div className="profil-public-body">
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">À propos</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{profil.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Séjours à venir */}
      {sejoursAvenir.length > 0 && (
        <div className="pdir-sejours-section">
          <h2 className="pdir-sejours-title">
            📅 Séjours proposés
            <span className="pdir-sejours-count">{sejoursAvenir.length}</span>
          </h2>
          <div className="pdir-sejours-list">
            {sejoursAvenir.map(s => (
              <div key={s.id} className="pdir-sejour-card">
                <div className="pdir-sejour-top">
                  <div className="pdir-sejour-info">
                    <h3 className="pdir-sejour-titre">{s.titre}</h3>
                    <div className="pdir-sejour-meta">
                      {s.lieu && <span>📍 {s.lieu}</span>}
                      {s.type && <span className="annonce-item-type">{s.type}</span>}
                    </div>
                  </div>
                  {isLoggedIn && role === 'animateur' && onPostuler && (
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '7px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={() => onPostuler(s.id)}
                    >
                      Postuler
                    </button>
                  )}
                </div>
                <div className="pdir-sejour-dates">
                  🗓️ {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                  {s.date_fin && ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`}
                  {s.nombre_postes && (
                    <span> · 👥 {s.nombre_postes} poste{s.nombre_postes > 1 ? 's' : ''}</span>
                  )}
                </div>
                {s.description && (
                  <p className="pdir-sejour-desc">{s.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sejoursAvenir.length === 0 && (
        <div className="pdir-sejours-section">
          <div className="empty-state" style={{ padding: '28px 0' }}>
            <span>📅</span>
            <p>Aucun séjour à venir pour cette structure.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilPublicDirecteur
