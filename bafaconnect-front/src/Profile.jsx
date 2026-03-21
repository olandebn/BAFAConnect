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
    nom: '', prenom: '', bafa_status: '', ville: '',
    // Animateur avancé
    competencesText: '',   // texte brut → tableau à l'envoi
    experiencesText: '',   // idem
    dispo_debut: '', dispo_fin: '',
    // Directeur
    nom_structure: '', type_structure: '', description: '',
    // Commun
    photo_url: ''
  })

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      setError('')
      const res = await api.get('/profiles/me')
      setUser(res.data)

      if (role === 'animateur') {
        const nomParts = (res.data.nom || '').split(' ')
        const dispo = res.data.disponibilites
          ? (typeof res.data.disponibilites === 'string'
            ? JSON.parse(res.data.disponibilites)
            : res.data.disponibilites)
          : {}
        setFormData({
          prenom: nomParts[0] || '',
          nom: nomParts.slice(1).join(' ') || '',
          bafa_status: res.data.diplomes?.[0] || 'Non diplômé',
          ville: res.data.ville || '',
          competencesText: (res.data.competences || []).join('\n'),
          experiencesText: (res.data.experiences || []).join('\n'),
          dispo_debut: dispo.debut || '',
          dispo_fin: dispo.fin || '',
          nom_structure: '', type_structure: '', description: '',
          photo_url: res.data.photo_url || ''
        })
      } else {
        setFormData({
          nom: '', prenom: '', bafa_status: '',
          ville: '', competencesText: '', experiencesText: '',
          dispo_debut: '', dispo_fin: '',
          nom_structure: res.data.nom_structure || '',
          type_structure: res.data.type_structure || '',
          description: res.data.description || '',
          photo_url: res.data.photo_url || ''
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

  const getCompletude = () => {
    if (role === 'animateur') {
      const champs = [
        { label: 'Prénom', ok: !!formData.prenom },
        { label: 'Nom', ok: !!formData.nom },
        { label: 'Statut BAFA', ok: !!formData.bafa_status && formData.bafa_status !== 'Non diplômé' },
        { label: 'Ville', ok: !!formData.ville },
        { label: 'Compétences', ok: formData.competencesText.trim().length > 0 },
        { label: 'Expériences', ok: formData.experiencesText.trim().length > 0 },
        { label: 'Disponibilités', ok: !!formData.dispo_debut },
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
                  <strong>
                    {(() => {
                      const d = typeof user.disponibilites === 'string'
                        ? JSON.parse(user.disponibilites)
                        : user.disponibilites
                      if (d?.debut && d?.fin)
                        return `Du ${new Date(d.debut).toLocaleDateString('fr-FR')} au ${new Date(d.fin).toLocaleDateString('fr-FR')}`
                      if (d?.debut) return `À partir du ${new Date(d.debut).toLocaleDateString('fr-FR')}`
                      return 'Non renseignées'
                    })()}
                  </strong>
                </div>
              )}
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

              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="dispo_debut">Disponible à partir du</label>
                  <input id="dispo_debut" type="date" value={formData.dispo_debut} onChange={set('dispo_debut')} />
                </div>
                <div className="form-group">
                  <label htmlFor="dispo_fin">Disponible jusqu'au</label>
                  <input id="dispo_fin" type="date" value={formData.dispo_fin} onChange={set('dispo_fin')} />
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
