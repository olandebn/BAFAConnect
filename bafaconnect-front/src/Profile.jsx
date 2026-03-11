import { useEffect, useState } from 'react'
import api from './api/axios'

function Profile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const role = localStorage.getItem('role')

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    bafa_status: '',
    nom_structure: '',
    ville: '',
    description: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setError('')
      const res = await api.get('/profiles/me')
      setUser(res.data)

      if (role === 'animateur') {
        const nomParts = (res.data.nom || '').split(' ')
        setFormData({
          prenom: nomParts[0] || '',
          nom: nomParts.slice(1).join(' ') || '',
          bafa_status: res.data.diplomes?.[0] || 'Non diplômé',
          nom_structure: '',
          ville: '',
          description: ''
        })
      } else {
        setFormData({
          nom: '',
          prenom: '',
          bafa_status: '',
          nom_structure: res.data.nom_structure || '',
          ville: res.data.ville || '',
          description: res.data.description || ''
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
      await api.post('/profiles/me', formData)
      setIsEditing(false)
      setSuccess('Profil mis à jour avec succès.')
      fetchProfile()
    } catch (err) {
      console.error('Erreur mise à jour profil :', err)
      setError('Erreur lors de la mise à jour du profil.')
    }
  }

  if (!user) {
    return (
      <div className="profile-card">
        <p className="profile-loading">Chargement du profil...</p>
      </div>
    )
  }

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div>
          <span className="profile-kicker">
            {role === 'animateur' ? 'Espace animateur' : 'Espace directeur'}
          </span>

          <h2>
            {role === 'animateur' ? 'Mon profil animateur' : 'Mon profil directeur'}
          </h2>

          <p>
            {role === 'animateur'
              ? 'Retrouvez vos informations personnelles et mettez votre profil à jour.'
              : 'Gérez les informations de votre structure et présentez votre organisation.'}
          </p>
        </div>

        {!isEditing && (
          <button className="btn-primary profile-edit-btn" onClick={() => setIsEditing(true)}>
            Modifier mon profil
          </button>
        )}
      </div>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}
      {success && <div className="profile-alert profile-alert-success">{success}</div>}

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
                <strong>{user?.diplomes?.[0] || formData.bafa_status || 'Non renseigné'}</strong>
              </div>

              <div className="profile-info-box">
                <span className="profile-label">Identité complète</span>
                <strong>{user?.nom || 'Non renseigné'}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="profile-info-box">
                <span className="profile-label">Nom de la structure</span>
                <strong>{user?.nom_structure || 'Non renseignée'}</strong>
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
        <form onSubmit={handleUpdate} className="profile-form">
          {role === 'animateur' ? (
            <>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="prenom">Prénom</label>
                  <input
                    id="prenom"
                    type="text"
                    placeholder="Prénom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nom">Nom</label>
                  <input
                    id="nom"
                    type="text"
                    placeholder="Nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bafa_status">Statut BAFA</label>
                <select
                  id="bafa_status"
                  value={formData.bafa_status}
                  onChange={(e) => setFormData({ ...formData, bafa_status: e.target.value })}
                  className="profile-select"
                >
                  <option value="Non diplômé">Non diplômé</option>
                  <option value="Stagiaire">Stagiaire</option>
                  <option value="Diplômé">Diplômé</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label htmlFor="nom_structure">Nom de la structure</label>
                  <input
                    id="nom_structure"
                    type="text"
                    placeholder="Nom de la structure"
                    value={formData.nom_structure}
                    onChange={(e) => setFormData({ ...formData, nom_structure: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ville">Ville</label>
                  <input
                    id="ville"
                    type="text"
                    placeholder="Ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Présentez votre structure"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="profile-textarea"
                  rows="5"
                />
              </div>
            </>
          )}

          <div className="profile-actions">
            <button type="submit" className="btn-primary profile-action-btn">
              Enregistrer
            </button>

            <button
              type="button"
              className="btn-secondary profile-action-btn"
              onClick={() => {
                setIsEditing(false)
                setError('')
                setSuccess('')
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Profile