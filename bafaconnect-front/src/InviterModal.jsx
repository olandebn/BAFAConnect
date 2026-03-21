import { useEffect, useState } from 'react'
import api from './api/axios'

function InviterModal({ animateur, onClose }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [sejourId, setSejourId] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get('/sejours/mes-annonces')
      .then(res => { setAnnonces(res.data); if (res.data[0]) setSejourId(res.data[0].id) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSend = async () => {
    if (!sejourId) return
    setSending(true)
    try {
      await api.post('/invitations', {
        animateur_id: animateur.id || animateur.user_id || animateur.animateur_id,
        sejour_id: sejourId,
        message: message.trim() || null
      })
      setResult({ type: 'success', text: `✅ Invitation envoyée à ${animateur.nom || 'cet animateur'} !` })
    } catch (err) {
      setResult({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'envoi.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="invite-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="invite-modal">
        <h3 className="invite-modal-title">🔗 Inviter {animateur.nom || 'cet animateur'}</h3>
        <p className="invite-modal-sub">
          Un message d'invitation sera envoyé automatiquement dans la messagerie.
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Chargement de vos annonces...</p>
        ) : annonces.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Vous n'avez aucune annonce publiée. Créez d'abord une annonce.
          </p>
        ) : (
          <>
            <div className="form-group">
              <label>Séjour concerné</label>
              <select
                value={sejourId}
                onChange={e => setSejourId(e.target.value)}
                className="profile-select"
              >
                {annonces.map(a => (
                  <option key={a.id} value={a.id}>{a.titre} — {a.lieu}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Message personnalisé <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span></label>
              <textarea
                rows={3}
                placeholder="Ex : Votre profil correspond parfaitement à notre équipe..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          </>
        )}

        {result && (
          <div className={`profile-alert ${result.type === 'success' ? 'profile-alert-success' : 'profile-alert-error'}`}>
            {result.text}
          </div>
        )}

        <div className="invite-modal-actions">
          {!result && annonces.length > 0 && (
            <button className="btn-primary" onClick={handleSend} disabled={sending || !sejourId}>
              {sending ? 'Envoi...' : '💌 Envoyer l\'invitation'}
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            {result?.type === 'success' ? 'Fermer' : 'Annuler'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviterModal
