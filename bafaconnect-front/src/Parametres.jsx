import { useState, useEffect } from 'react'
import api from './api/axios'
import { activerNotificationsPush, desactiverNotificationsPush, estAbonnePush } from './pushNotifications'

function Parametres({ onEmailChange, darkMode, onThemeChange }) {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [pwMsg, setPwMsg] = useState(null)
  const [emailMsg, setEmailMsg] = useState(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pushAbonne, setPushAbonne] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMsg, setPushMsg] = useState(null)
  const pushSupporte = ('serviceWorker' in navigator) && ('PushManager' in window)

  useEffect(() => {
    estAbonnePush().then(setPushAbonne)
  }, [])

  const showMsg = (setter, type, text) => {
    setter({ type, text })
    setTimeout(() => setter(null), 4000)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMsg(setPwMsg, 'error', 'Les mots de passe ne correspondent pas.')
      return
    }
    setPwLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      showMsg(setPwMsg, 'success', '✅ Mot de passe mis à jour !')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showMsg(setPwMsg, 'error', err.response?.data?.error || 'Erreur serveur.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      const res = await api.put('/auth/change-email', {
        newEmail: emailForm.newEmail,
        password: emailForm.password
      })
      localStorage.setItem('userEmail', emailForm.newEmail)
      onEmailChange && onEmailChange(emailForm.newEmail)
      showMsg(setEmailMsg, 'success', '✅ Email mis à jour !')
      setEmailForm({ newEmail: '', password: '' })
    } catch (err) {
      showMsg(setEmailMsg, 'error', err.response?.data?.error || 'Erreur serveur.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleTogglePush = async () => {
    setPushLoading(true)
    setPushMsg(null)
    try {
      if (pushAbonne) {
        await desactiverNotificationsPush(api)
        setPushAbonne(false)
        showMsg(setPushMsg, 'success', '🔕 Notifications push désactivées.')
      } else {
        const ok = await activerNotificationsPush(api)
        setPushAbonne(ok)
        if (ok) showMsg(setPushMsg, 'success', '🔔 Notifications push activées !')
        else showMsg(setPushMsg, 'error', 'Impossible d\'activer les notifications (permission refusée ou clé VAPID manquante).')
      }
    } catch {
      showMsg(setPushMsg, 'error', 'Erreur lors de la gestion des notifications.')
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <div className="parametres-container">

      {/* ── Apparence ── */}
      <div className="parametres-card">
        <div className="parametres-card-header">
          <span className="parametres-icon">🎨</span>
          <div>
            <h2 className="parametres-title">Apparence</h2>
            <p className="parametres-subtitle">Personnalisez l'affichage de BafaConnect</p>
          </div>
        </div>
        <div>
          <div className="theme-toggle-row">
            <div>
              <div className="theme-toggle-label">{darkMode ? '☀️ Passer en mode clair' : '🌙 Passer en mode sombre'}</div>
              <div className="theme-toggle-desc">
                {darkMode ? 'Interface lumineuse, idéale en journée' : 'Interface sombre — activée par défaut'}
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={!!darkMode}
                onChange={e => onThemeChange && onThemeChange(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* ── Changer mot de passe ── */}
      <div className="parametres-card">
        <div className="parametres-card-header">
          <span className="parametres-icon">🔒</span>
          <div>
            <h2 className="parametres-title">Mot de passe</h2>
            <p className="parametres-subtitle">Choisissez un mot de passe sécurisé (min. 6 caractères)</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="parametres-form">
          <div className="form-group">
            <label>Mot de passe actuel</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              placeholder="Votre mot de passe actuel"
              required
            />
          </div>
          <div className="parametres-form-row">
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="Minimum 6 caractères"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                placeholder="Répéter le nouveau mot de passe"
                required
              />
            </div>
          </div>
          {pwMsg && (
            <div className={`parametres-alert ${pwMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {pwMsg.text}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* ── Changer email ── */}
      <div className="parametres-card">
        <div className="parametres-card-header">
          <span className="parametres-icon">📧</span>
          <div>
            <h2 className="parametres-title">Adresse email</h2>
            <p className="parametres-subtitle">
              Email actuel : <strong>{localStorage.getItem('userEmail') || '—'}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleChangeEmail} className="parametres-form">
          <div className="parametres-form-row">
            <div className="form-group">
              <label>Nouvel email</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                placeholder="nouveau@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer avec votre mot de passe</label>
              <input
                type="password"
                value={emailForm.password}
                onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                placeholder="Votre mot de passe"
                required
              />
            </div>
          </div>
          {emailMsg && (
            <div className={`parametres-alert ${emailMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {emailMsg.text}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={emailLoading}>
            {emailLoading ? 'Mise à jour...' : "Changer l'email"}
          </button>
        </form>
      </div>

      {/* ── Notifications push ── */}
      <div className="parametres-card">
        <div className="parametres-card-header">
          <span className="parametres-icon">🔔</span>
          <div>
            <h2 className="parametres-title">Notifications push</h2>
            <p className="parametres-subtitle">Recevez des alertes même quand BafaConnect est fermé</p>
          </div>
        </div>

        {!pushSupporte ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Votre navigateur ne supporte pas les notifications push.
          </p>
        ) : (
          <div>
            <div className="theme-toggle-row">
              <div>
                <div className="theme-toggle-label">
                  {pushAbonne ? '🔔 Notifications activées' : '🔕 Notifications désactivées'}
                </div>
                <div className="theme-toggle-desc">
                  {pushAbonne
                    ? 'Vous recevrez des alertes pour les messages, candidatures et invitations.'
                    : 'Activez pour être notifié des nouveaux messages et candidatures.'}
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pushAbonne}
                  onChange={handleTogglePush}
                  disabled={pushLoading}
                />
                <span className="switch-slider" />
              </label>
            </div>
            {pushMsg && (
              <div className={`parametres-alert ${pushMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>
                {pushMsg.text}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

export default Parametres
