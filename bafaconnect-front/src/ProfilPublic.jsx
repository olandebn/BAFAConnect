import { useEffect, useState } from 'react'
import api from './api/axios'

function Stars({ note, interactive = false, onSelect }) {
  return (
    <span style={{ cursor: interactive ? 'pointer' : 'default' }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          style={{ color: i <= Math.round(note) ? '#f59e0b' : '#d1d5db', fontSize: interactive ? '1.6rem' : '1.1rem', transition: 'color 0.1s' }}
          onClick={() => interactive && onSelect && onSelect(i)}
        >★</span>
      ))}
    </span>
  )
}

function ProfilPublic({ userId, onContacter, onRetour }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [avisForm, setAvisForm] = useState({ note: 0, commentaire: '' })
  const [avisMsg, setAvisMsg] = useState('')
  const [avisSaving, setAvisSaving] = useState(false)
  const [monAvis, setMonAvis] = useState(null)
  const [diplomesValides, setDiplomesValides] = useState([])
  const isLoggedIn = !!localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const myId = localStorage.getItem('userId')

  useEffect(() => {
    if (!userId) return
    api.get(`/profiles/public/${userId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Profil introuvable ou non disponible.'))
      .finally(() => setLoading(false))
    // Charger les diplômes validés
    api.get(`/diplomes/user/${userId}`)
      .then(res => setDiplomesValides(res.data))
      .catch(() => {})
    // Charger mon avis existant
    if (isLoggedIn) {
      api.get(`/avis/mon-avis/${userId}`)
        .then(res => {
          if (res.data) {
            setMonAvis(res.data)
            setAvisForm({ note: res.data.note, commentaire: res.data.commentaire || '' })
          }
        })
        .catch(() => {})
    }
  }, [userId, isLoggedIn])

  const submitAvis = async () => {
    if (!avisForm.note) return
    setAvisSaving(true)
    setAvisMsg('')
    try {
      await api.post('/avis', { cible_id: userId, note: avisForm.note, commentaire: avisForm.commentaire })
      setAvisMsg('success')
      setMonAvis({ note: avisForm.note, commentaire: avisForm.commentaire })
      // Recharger les avis
      const res = await api.get(`/profiles/public/${userId}`)
      setData(res.data)
    } catch (err) {
      setAvisMsg(err.response?.data?.error || 'error')
    } finally {
      setAvisSaving(false)
    }
  }

  const getDispos = (disponibilites) => {
    if (!disponibilites) return null
    try {
      const raw = typeof disponibilites === 'string' ? JSON.parse(disponibilites) : disponibilites
      const fmt = (s) => new Date(s).toLocaleDateString('fr-FR')
      const plages = Array.isArray(raw) ? raw : (raw?.debut ? [raw] : [])
      if (plages.length === 0) return null
      return plages.map(p => {
        if (p.debut && p.fin) return `Du ${fmt(p.debut)} au ${fmt(p.fin)}`
        if (p.debut) return `À partir du ${fmt(p.debut)}`
        return null
      }).filter(Boolean)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="profil-public-nom" style={{ margin: 0 }}>{profil.nom || 'Animateur'}</h1>
              {diplomesValides.length > 0 && (
                <span className="badge-verifie" title={`Diplômes vérifiés : ${diplomesValides.map(d => d.type).join(', ')}`}>
                  ✅ Vérifié
                </span>
              )}
            </div>
            <div className="profil-public-meta">
              {profil.ville && <span>📍 {profil.ville}</span>}
              {profil.diplomes?.[0] && (
                <span className="animateur-card-statut">{profil.diplomes[0]}</span>
              )}
            </div>
            {profil.diplomes?.[1] && (
              <div className="appro-tag-row" style={{ marginTop: 6 }}>
                <span className="appro-tag">📚 {profil.diplomes[1]}</span>
                <span className="appro-autodeclare" title="Qualification déclarée par l'animateur — demandez un justificatif pour confirmer">
                  ⚠️ Auto-déclaré
                </span>
              </div>
            )}
            {diplomesValides.length > 0 && (
              <div className="diplomes-verifies-row">
                {diplomesValides.map(d => (
                  <span key={d.type} className="diplome-verifie-tag">
                    ✅ {d.type} <span className="diplome-verifie-label">vérifié</span>
                  </span>
                ))}
              </div>
            )}
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
          {dispos && dispos.length > 0 && (
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">Disponibilités</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dispos.map((d, i) => (
                  <span key={i} className="profile-chip">🗓️ {d}</span>
                ))}
              </div>
            </div>
          )}

          {/* CV */}
          {profil.cv_url && (
            <div className="profil-public-section">
              <h3 className="profil-public-section-title">CV</h3>
              <button
                className="btn-document"
                onClick={() => {
                  const win = window.open()
                  if (win) win.document.write(`<iframe src="${profil.cv_url}" style="width:100%;height:100%;border:none;" />`)
                }}
              >
                📄 Voir le CV de {profil.nom?.split(' ')[0] || 'cet animateur'}
              </button>
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

      {/* ── Laisser un avis (directeur connecté seulement, pas son propre profil) ── */}
      {isLoggedIn && userId !== myId && (
        <div className="profil-avis-form-card">
          <div className="profil-avis-form-header">
            <span className="profil-avis-form-icon">⭐</span>
            <div>
              <h3 className="profil-avis-form-title">
                {monAvis ? 'Modifier votre avis' : 'Laisser un avis'}
              </h3>
              <p className="profil-avis-form-sub">
                {monAvis
                  ? `Votre note actuelle : ${monAvis.note}/5`
                  : 'Partagez votre expérience avec cet animateur'
                }
              </p>
            </div>
          </div>
          <div className="profil-avis-stars-row">
            <Stars note={avisForm.note} interactive onSelect={n => setAvisForm(f => ({ ...f, note: n }))} />
            {avisForm.note > 0 && (
              <span className="profil-avis-note-label">
                {['', 'Insuffisant', 'Passable', 'Bien', 'Très bien', 'Excellent'][avisForm.note]}
              </span>
            )}
          </div>
          <textarea
            className="profil-avis-textarea"
            placeholder="Ajoutez un commentaire (facultatif)..."
            value={avisForm.commentaire}
            onChange={e => setAvisForm(f => ({ ...f, commentaire: e.target.value }))}
            rows={3}
          />
          <div className="profil-avis-form-footer">
            <button
              className="btn-primary"
              onClick={submitAvis}
              disabled={!avisForm.note || avisSaving}
            >
              {avisSaving ? 'Envoi...' : monAvis ? '✏️ Modifier mon avis' : '⭐ Envoyer mon avis'}
            </button>
            {avisMsg === 'success' && <span className="profil-avis-ok">✅ Avis enregistré !</span>}
            {avisMsg && avisMsg !== 'success' && <span className="profil-avis-err">❌ {avisMsg === 'error' ? 'Erreur' : avisMsg}</span>}
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
