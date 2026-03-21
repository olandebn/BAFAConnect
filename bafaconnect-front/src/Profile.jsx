import { useEffect, useState } from 'react'
import api from './api/axios'
import AvisSection from './AvisSection'

function Profile({ onPhotoChange }) {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const role = localStorage.getItem('role')

  const [formData, setFormData] = useState({
    // Commun animateur
    nom: '', prenom: '', bafa_status: '', approfondissement: '', ville: '',
    // Animateur avancé
    competencesText: '',   // texte brut → tableau à l'envoi
    experiencesText: '',   // idem
    plages: [{ debut: '', fin: '' }],  // multi-disponibilités
    // Directeur
    nom_structure: '', type_structure: '', description: '',
    // Commun
    photo_url: '',
    // Documents
    cv_url: '',
    flyer_url: ''
  })

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      setError('')
      const res = await api.get('/profiles/me')
      setUser(res.data)

      if (role === 'animateur') {
        const nomParts = (res.data.nom || '').split(' ')
        const rawDispo = res.data.disponibilites
          ? (typeof res.data.disponibilites === 'string'
            ? JSON.parse(res.data.disponibilites)
            : res.data.disponibilites)
          : null
        // Normalise en tableau de plages
        let plages = [{ debut: '', fin: '' }]
        if (rawDispo) {
          if (Array.isArray(rawDispo)) {
            plages = rawDispo.length > 0 ? rawDispo : [{ debut: '', fin: '' }]
          } else if (rawDispo.debut) {
            plages = [{ debut: rawDispo.debut || '', fin: rawDispo.fin || '' }]
          }
        }
        setFormData({
          prenom: nomParts[0] || '',
          nom: nomParts.slice(1).join(' ') || '',
          bafa_status: res.data.diplomes?.[0] || 'Non diplômé',
          approfondissement: res.data.diplomes?.[1] || '',
          ville: res.data.ville || '',
          competencesText: (res.data.competences || []).join('\n'),
          experiencesText: (res.data.experiences || []).join('\n'),
          plages,
          nom_structure: '', type_structure: '', description: '',
          photo_url: res.data.photo_url || '',
          cv_url: res.data.cv_url || '',
          flyer_url: ''
        })
      } else {
        setFormData({
          nom: '', prenom: '', bafa_status: '',
          ville: '', competencesText: '', experiencesText: '',
          dispo_debut: '', dispo_fin: '',
          nom_structure: res.data.nom_structure || '',
          type_structure: res.data.type_structure || '',
          ville: res.data.ville || '',
          description: res.data.description || '',
          photo_url: res.data.photo_url || '',
          cv_url: '',
          flyer_url: res.data.flyer_url || ''
        })
      }
    } catch (err) {
      console.error('Erreur récupération profil :', err)
      setError('Impossible de charger le profil.')
      setUser({})
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = role === 'animateur'
        ? {
            ...formData,
            competences: formData.competencesText.split('\n').map(s => s.trim()).filter(Boolean),
            experiences: formData.experiencesText.split('\n').map(s => s.trim()).filter(Boolean),
            // Multi-dispo : on envoie le tableau filtré des plages renseignées
            disponibilites: formData.plages.filter(p => p.debut),
          }
        : formData

      const res = await api.post('/profiles/me', payload)
      setIsEditing(false)
      setSuccess('Profil mis à jour avec succès.')
      // Remonte la photo vers App.jsx pour la sidebar
      const savedPhoto = res.data?.profil?.photo_url || formData.photo_url || ''
      onPhotoChange && onPhotoChange(savedPhoto)
      fetchProfile()
    } catch (err) {
      console.error('Erreur mise à jour profil :', err)
      setError('Erreur lors de la mise à jour du profil.')
    }
  }

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value })

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop lourde (max 2 Mo).')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setFormData(prev => ({ ...prev, photo_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleDocumentChange = (field) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Document trop lourd (max 5 Mo).')
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setFormData(prev => ({ ...prev, [field]: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const openDocument = (dataUrl) => {
    const win = window.open()
    if (win) {
      win.document.write(`<iframe src="${dataUrl}" style="width:100%;height:100%;border:none;" />`)
    }
  }

  const getCompletude = () => {
    if (role === 'animateur') {
      const champs = [
        { label: 'Prénom', ok: !!formData.prenom },
        { label: 'Nom', ok: !!formData.nom },
        { label: 'Statut BAFA', ok: !!formData.bafa_status && formData.bafa_status !== 'Non diplômé' },
        { label: 'Ville', ok: !!formData.ville },
        { label: 'Compétences', ok: formData.competencesText.trim().length > 0 },
        { label: 'Expériences', ok: formData.experiencesText.trim().length > 0 },
        { label: 'Disponibilités', ok: formData.plages?.some(p => !!p.debut) },
        { label: 'Photo de profil', ok: !!formData.photo_url },
      ]
      const done = champs.filter(c => c.ok).length
      return { pct: Math.round((done / champs.length) * 100), manquants: champs.filter(c => !c.ok).map(c => c.label) }
    } else {
      const champs = [
        { label: 'Nom de la structure', ok: !!formData.nom_structure },
        { label: 'Type de structure', ok: !!formData.type_structure },
        { label: 'Ville', ok: !!formData.ville },
        { label: 'Description', ok: !!formData.description },
        { label: 'Photo de profil', ok: !!formData.photo_url },
      ]
      const done = champs.filter(c => c.ok).length
      return { pct: Math.round((done / champs.length) * 100), manquants: champs.filter(c => !c.ok).map(c => c.label) }
    }
  }

  const renderChips = (arr) => {
    if (!arr || arr.length === 0) return <span className="profile-empty-chip">Non renseigné</span>
    return (
      <div className="profile-chips">
        {arr.map((item, i) => <span key={i} className="profile-chip">{item}</span>)}
      </div>
    )
  }

  if (!user) return (
    <div className="profile-card">
      <p className="profile-loading">Chargement du profil...</p>
    </div>
  )

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-header-left">
          <div className="profile-avatar">
            {formData.photo_url
              ? <img src={formData.photo_url} alt="Photo de profil" className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">
                  {role === 'animateur' ? '🎒' : '🏕️'}
                </div>
            }
          </div>
          <div>
            <span className="profile-kicker">
              {role === 'animateur' ? 'Espace animateur' : 'Espace directeur'}
            </span>
            <h2>{role === 'animateur' ? 'Mon profil animateur' : 'Mon profil directeur'}</h2>
            <p>
              {role === 'animateur'
                ? 'Complétez votre profil pour être visible et postuler aux meilleures missions.'
                : 'Gérez les informations de votre structure et présentez votre organisation.'}
            </p>
          </div>
        </div>
        {!isEditing && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-primary profile-edit-btn" onClick={() => setIsEditing(true)}>
              Modifier mon profil
            </button>
            {role === 'animateur' && user?.user_id && (
              <button
                className="btn-secondary profile-edit-btn"
                onClick={() => {
                  const url = `${window.location.origin}?profil=${user.user_id}`
                  navigator.clipboard.writeText(url)
                    .then(() => setSuccess('🔗 Lien de profil copié !'))
                    .catch(() => setSuccess(`Lien : ${url}`))
                  setTimeout(() => setSuccess(''), 3000)
                }}
                title="Copier le lien de votre profil public"
              >
                🔗 Partager mon profil
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {success && <div className="profile-alert profile-alert-success">{success}</div>}

      {/* ── Barre de complétion ── */}
      {!isEditing && user && (() => {
        const { pct, manquants } = getCompletude()
        const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
        return (
          <div className="completude-block">
            <div className="completude-header">
              <span className="completude-label">
                Profil complété à <strong style={{ color: barColor }}>{pct}%</strong>
              </span>
              {pct === 100 && <span className="completude-badge">🏆 Profil complet !</span>}
            </div>
            <div className="completude-track">
              <div className="completude-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            {manquants.length > 0 && (
              <p className="completude-hint">
                Manquant : {manquants.join(', ')}
              </p>
            )}
          </div>
        )
      })()}

      {/* ── VUE LECTURE ── */}
      {!isEditing ? (
        <div className="profile-grid">
          {role === 'animateur' ? (
            <>
              <div className="profile-info-box">
                <span className="profile-label">Prénom</span>
                <strong>{formData.prenom || 'Non renseigné'}</strong>
              </div>
              <div className="profile-info-box">
                <span className="profile-label">Nom</span>
                <strong>{formData.nom || 'Non renseigné'}</strong>
              </div>
              <div className="profile-info-box">
                <span className="profile-label">Statut BAFA</span>
                <strong>{user?.diplomes?.[0] || 'Non renseigné'}</strong>
              </div>
              {user?.diplomes?.[1] && (
                <div className="profile-info-box">
                  <span className="profile-label">Approfondissement</span>
                  <strong>{user.diplomes[1]}</strong>
                </div>
              )}
              <div className="profile-info-box">
                <span className="profile-label">Ville</span>
                <strong>{user?.ville || 'Non renseignée'}</strong>
              </div>
              <div className="profile-info-box profile-info-box-full">
                <span className="profile-label">Compétences</span>
                {renderChips(user?.competences)}
              </div>
              <div className="profile-info-box profile-info-box-full">
                <span className="profile-label">Expériences</span>
                {renderChips(user?.experiences)}
              </div>
              {(user?.disponibilites) && (
                <div className="profile-info-box profile-info-box-full">
                  <span className="profile-label">Disponibilités</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {(() => {
                      const raw = typeof user.disponibilites === 'string'
                        ? JSON.parse(user.disponibilites)
                        : user.disponibilites
                      const plages = Array.isArray(raw) ? raw : (raw?.debut ? [raw] : [])
                      if (plages.length === 0) return <span>Non renseignées</span>
                      return plages.map((p, i) => (
                        <span key={i} className="profile-chip">
                          🗓️ {p.debut ? new Date(p.debut).toLocaleDateString('fr-FR') : '?'}
                          {p.fin ? ` → ${new Date(p.fin).toLocaleDateString('fr-FR')}` : ''}
                        </span>
                      ))
                    })()}
                  </div>
                </div>
              )}
              <div className="profile-info-box profile-info-box-full">
                <span className="profile-label">Mon CV</span>
                {user?.cv_url
                  ? <button type="button" className="btn-document" onClick={() => openDocument(user.cv_url)}>
                      📄 Voir mon CV
                    </button>
                  : <span className="profile-empty-chip">Aucun CV déposé</span>
                }
              </div>
            </>
          ) : (
            <>
              <div className="profile-info-box">
                <span className="profile-label">Nom de la structure</span>
                <strong>{user?.nom_structure || 'Non renseignée'}</strong>
              </div>
              <div className="profile-info-box">
                <span className="profile-label">Type de structure</span>
                <strong>{user?.type_structure || 'Non renseigné'}</strong>
              </div>
              <div className="profile-info-box">
                <span className="profile-label">Ville</span>
                <strong>{user?.ville || 'Non renseignée'}</strong>
              </div>
              <div className="profile-info-box profile-info-box-full">
                <span className="profile-label">Description</span>
                <strong>{user?.description || 'Aucune description renseignée'}</strong>
              </div>
              <div className="profile-info-box profile-info-box-full">
                <span className="profile-label">Flyer de la structure</span>
                {user?.flyer_url
                  ? <button type="button" className="btn-document" onClick={() => openDocument(user.flyer_url)}>
                      📋 Voir le flyer
                    </button>
                  : <span className="profile-empty-chip">Aucun flyer déposé</span>
                }
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── FORMULAIRE ÉDITION ── */
        <form onSubmit={handleUpdate} className="profile-form">
          {role === 'animateur' ? (
            <>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="prenom">Prénom</label>
                  <input id="prenom" type="text" placeholder="Prénom" value={formData.prenom} onChange={set('prenom')} />
                </div>
                <div className="form-group">
                  <label htmlFor="nom">Nom</label>
                  <input id="nom" type="text" placeholder="Nom" value={formData.nom} onChange={set('nom')} />
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="bafa_status">Statut BAFA</label>
                  <select id="bafa_status" value={formData.bafa_status} onChange={set('bafa_status')} className="profile-select">
                    <option value="Non diplômé">Non diplômé</option>
                    <option value="Stagiaire BAFA">Stagiaire BAFA</option>
                    <option value="Diplômé BAFA">Diplômé BAFA</option>
                    <option value="Diplômé BAFD">Diplômé BAFD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="approfondissement">📚 Approfondissement BAFA</label>
                  <select id="approfondissement" value={formData.approfondissement} onChange={set('approfondissement')} className="profile-select">
                    <option value="">Aucun / Non renseigné</option>
                    <option value="Activités physiques et sportives">Activités physiques et sportives</option>
                    <option value="Activités nautiques">Activités nautiques</option>
                    <option value="Surveillant de baignade">Surveillant de baignade</option>
                    <option value="Animation musicale">Animation musicale</option>
                    <option value="Théâtre / Arts du spectacle">Théâtre / Arts du spectacle</option>
                    <option value="Activités de pleine nature">Activités de pleine nature</option>
                    <option value="Animation auprès des jeunes enfants">Animation auprès des jeunes enfants</option>
                    <option value="Numérique / Informatique">Numérique / Informatique</option>
                    <option value="Animation interculturelle">Animation interculturelle</option>
                    <option value="Approfondissement général">Approfondissement général</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="ville">Ville</label>
                  <input id="ville" type="text" placeholder="Ex : Lyon" value={formData.ville} onChange={set('ville')} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="competencesText">
                  Compétences <span className="form-hint">(une par ligne)</span>
                </label>
                <textarea
                  id="competencesText"
                  placeholder={"Premiers secours\nAnimation sportive\nMusique"}
                  value={formData.competencesText}
                  onChange={set('competencesText')}
                  className="profile-textarea"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experiencesText">
                  Expériences <span className="form-hint">(une par ligne)</span>
                </label>
                <textarea
                  id="experiencesText"
                  placeholder={"Animateur colo été 2023 – Ardèche\nACCM centre de loisirs 2024"}
                  value={formData.experiencesText}
                  onChange={set('experiencesText')}
                  className="profile-textarea"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>🗓️ Disponibilités <span className="form-hint">(plusieurs plages possibles)</span></label>
                <div className="plages-list">
                  {formData.plages.map((p, i) => (
                    <div key={i} className="plage-row">
                      <input
                        type="date"
                        value={p.debut}
                        onChange={e => {
                          const updated = formData.plages.map((pl, j) => j === i ? { ...pl, debut: e.target.value } : pl)
                          setFormData(prev => ({ ...prev, plages: updated }))
                        }}
                        placeholder="Début"
                      />
                      <span className="plage-sep">→</span>
                      <input
                        type="date"
                        value={p.fin}
                        onChange={e => {
                          const updated = formData.plages.map((pl, j) => j === i ? { ...pl, fin: e.target.value } : pl)
                          setFormData(prev => ({ ...prev, plages: updated }))
                        }}
                        placeholder="Fin"
                      />
                      {formData.plages.length > 1 && (
                        <button
                          type="button"
                          className="btn-delete-sm"
                          onClick={() => setFormData(prev => ({ ...prev, plages: prev.plages.filter((_, j) => j !== i) }))}
                        >×</button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '5px 12px', marginTop: 6 }}
                    onClick={() => setFormData(prev => ({ ...prev, plages: [...prev.plages, { debut: '', fin: '' }] }))}
                  >
                    + Ajouter une plage
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="nom_structure">Nom de la structure</label>
                  <input id="nom_structure" type="text" placeholder="Nom de la structure" value={formData.nom_structure} onChange={set('nom_structure')} />
                </div>
                <div className="form-group">
                  <label htmlFor="ville">Ville</label>
                  <input id="ville" type="text" placeholder="Ville" value={formData.ville} onChange={set('ville')} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="type_structure">Type de structure</label>
                <select id="type_structure" value={formData.type_structure} onChange={set('type_structure')} className="profile-select">
                  <option value="">— Sélectionner —</option>
                  <option value="Association">Association</option>
                  <option value="Centre de loisirs">Centre de loisirs</option>
                  <option value="Colonie de vacances">Colonie de vacances</option>
                  <option value="Établissement scolaire">Établissement scolaire</option>
                  <option value="Collectivité territoriale">Collectivité territoriale</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" placeholder="Présentez votre structure" value={formData.description} onChange={set('description')} className="profile-textarea" rows="5" />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Photo de profil <span className="form-hint">(JPG/PNG, max 2 Mo)</span></label>
            <div className="photo-upload-area">
              {formData.photo_url && (
                <img src={formData.photo_url} alt="Aperçu" className="photo-preview" />
              )}
              <label className="btn-secondary photo-upload-btn" htmlFor="photo-input">
                {formData.photo_url ? '🔄 Changer la photo' : '📷 Ajouter une photo'}
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {formData.photo_url && (
                <button
                  type="button"
                  className="btn-delete-sm"
                  onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {role === 'animateur' && (
            <div className="form-group">
              <label>{formData.cv_url ? '📄 Mon CV' : '📄 Ajouter mon CV'} <span className="form-hint">(PDF, max 5 Mo)</span></label>
              <div className="doc-upload-area">
                {formData.cv_url && (
                  <button type="button" className="btn-document" onClick={() => openDocument(formData.cv_url)}>
                    👁️ Aperçu du CV
                  </button>
                )}
                <label className="btn-secondary photo-upload-btn" htmlFor="cv-input">
                  {formData.cv_url ? '🔄 Remplacer le CV' : '📤 Téléverser un CV'}
                </label>
                <input
                  id="cv-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleDocumentChange('cv_url')}
                  style={{ display: 'none' }}
                />
                {formData.cv_url && (
                  <button
                    type="button"
                    className="btn-delete-sm"
                    onClick={() => setFormData(prev => ({ ...prev, cv_url: null }))}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )}

          {role === 'directeur' && (
            <div className="form-group">
              <label>{formData.flyer_url ? '📋 Mon flyer' : '📋 Ajouter un flyer'} <span className="form-hint">(PDF, max 5 Mo)</span></label>
              <div className="doc-upload-area">
                {formData.flyer_url && (
                  <button type="button" className="btn-document" onClick={() => openDocument(formData.flyer_url)}>
                    👁️ Aperçu du flyer
                  </button>
                )}
                <label className="btn-secondary photo-upload-btn" htmlFor="flyer-input">
                  {formData.flyer_url ? '🔄 Remplacer le flyer' : '📤 Téléverser un flyer'}
                </label>
                <input
                  id="flyer-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleDocumentChange('flyer_url')}
                  style={{ display: 'none' }}
                />
                {formData.flyer_url && (
                  <button
                    type="button"
                    className="btn-delete-sm"
                    onClick={() => setFormData(prev => ({ ...prev, flyer_url: null }))}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button type="submit" className="btn-primary profile-action-btn">Enregistrer</button>
            <button type="button" className="btn-secondary profile-action-btn"
              onClick={() => { setIsEditing(false); setError(''); setSuccess('') }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Avis reçus sur ce profil */}
      {user && !isEditing && (
        <div style={{ marginTop: 32 }}>
          <AvisSection cibleId={user.id} canLeaveAvis={false} />
        </div>
      )}
    </div>
  )
}

export default Profile
