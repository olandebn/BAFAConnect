import { useEffect, useState } from 'react'
import api from './api/axios'

// Affiche les étoiles
function Stars({ note, interactive = false, onSelect }) {
  return (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          className={`star ${i <= note ? 'star-on' : 'star-off'}`}
          onClick={interactive ? () => onSelect(i) : undefined}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function AvisSection({ cibleId, canLeaveAvis = false }) {
  const [data, setData] = useState({ avis: [], moyenne: null, total: 0 })
  const [monAvis, setMonAvis] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      const res = await api.get(`/avis/${cibleId}`)
      setData(res.data)
    } catch {}
  }

  const loadMonAvis = async () => {
    try {
      const res = await api.get(`/avis/mon-avis/${cibleId}`)
      if (res.data) {
        setMonAvis(res.data)
        setNote(res.data.note)
        setCommentaire(res.data.commentaire || '')
      }
    } catch {}
  }

  useEffect(() => {
    load()
    if (canLeaveAvis) loadMonAvis()
  }, [cibleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (note === 0) { setError('Veuillez choisir une note.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/avis', { cible_id: cibleId, note, commentaire })
      setSuccess(monAvis ? 'Avis mis à jour !' : 'Avis publié !')
      setFormOpen(false)
      await load()
      await loadMonAvis()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="avis-section">
      <div className="avis-header">
        <div className="avis-header-left">
          <h3 className="avis-title">Avis</h3>
          {data.moyenne !== null && (
            <div className="avis-moyenne">
              <Stars note={Math.round(data.moyenne)} />
              <span className="avis-moyenne-val">{data.moyenne}/5</span>
              <span className="avis-count">({data.total} avis)</span>
            </div>
          )}
        </div>
        {canLeaveAvis && (
          <button
            className="btn-secondary avis-btn-leave"
            onClick={() => setFormOpen(o => !o)}
          >
            {monAvis ? '✏️ Modifier mon avis' : '⭐ Laisser un avis'}
          </button>
        )}
      </div>

      {/* Formulaire */}
      {formOpen && (
        <form className="avis-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Note</label>
            <Stars note={note} interactive onSelect={setNote} />
          </div>
          <div className="form-group">
            <label>Commentaire (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Décrivez votre expérience..."
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
            />
          </div>
          {error && <div className="profile-alert profile-alert-error">{error}</div>}
          <div className="avis-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Envoi...' : monAvis ? 'Mettre à jour' : 'Publier'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {success && <div className="profile-alert profile-alert-success">{success}</div>}

      {/* Liste des avis */}
      {data.avis.length === 0 ? (
        <p className="avis-empty">Aucun avis pour le moment.</p>
      ) : (
        <div className="avis-list">
          {data.avis.map(a => (
            <div key={a.id} className="avis-item">
              <div className="avis-item-top">
                <span className="avis-item-auteur">
                  {a.auteur_role === 'directeur' ? '🏕️' : '🎒'} {a.auteur_nom}
                </span>
                <Stars note={a.note} />
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
      )}
    </div>
  )
}

export default AvisSection
