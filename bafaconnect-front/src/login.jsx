import { useState, useEffect } from 'react'
import api from './api/axios'

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'reset'

  // Connexion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Inscription
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regRole, setRegRole] = useState('animateur')

  // Mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState('')

  // Réinitialisation
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')

  // Détecter le token de reset dans l'URL (?reset=TOKEN)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset')
    if (token) {
      setResetToken(token)
      setMode('reset')
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const userRole = res.data.user?.role
      const token = res.data.token
      if (token && userRole) {
        localStorage.setItem('token', token)
        localStorage.setItem('role', userRole)
        localStorage.setItem('userId', res.data.user.id)
        localStorage.setItem('userEmail', res.data.user.email)
        onLoginSuccess(userRole)
      } else {
        setError("Impossible de récupérer les informations de connexion.")
      }
    } catch (err) {
      setError('Identifiants incorrects ou erreur serveur.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPassword !== regPassword2) { setError('Les mots de passe ne correspondent pas.'); return }
    if (regPassword.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setIsLoading(true)
    try {
      await api.post('/auth/register', { email: regEmail, password: regPassword, role: regRole })
      setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
      setRegEmail(''); setRegPassword(''); setRegPassword2('')
      setMode('login')
      setEmail(regEmail)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création du compte.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail })
      setSuccess(res.data.message)
    } catch {
      setError('Erreur serveur. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== newPassword2) { setError('Les mots de passe ne correspondent pas.'); return }
    if (newPassword.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setIsLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { token: resetToken, newPassword })
      setSuccess(res.data.message + ' Vous pouvez vous connecter.')
      setMode('login')
      setResetToken('')
    } catch (err) {
      setError(err.response?.data?.error || 'Lien invalide ou expiré.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-box">

      {/* ── Onglets principaux (masqués sur forgot/reset) ── */}
      {mode !== 'forgot' && mode !== 'reset' && (
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Créer un compte
          </button>
        </div>
      )}

      {/* ── CONNEXION ── */}
      {mode === 'login' && (
        <>
          <div className="login-header">
            <h2>Bon retour sur BafaConnect</h2>
            <p>Connectez-vous pour retrouver vos annonces, candidatures et outils.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="votre@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>

            <button
              type="button"
              className="forgot-link"
              onClick={() => switchMode('forgot')}
            >
              Mot de passe oublié ?
            </button>
          </form>
        </>
      )}

      {/* ── INSCRIPTION ── */}
      {mode === 'register' && (
        <>
          <div className="login-header">
            <h2>Rejoindre BafaConnect</h2>
            <p>Créez votre compte gratuit en quelques secondes.</p>
          </div>

          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" placeholder="votre@email.com"
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-role">Je suis…</label>
              <select id="reg-role" value={regRole} onChange={(e) => setRegRole(e.target.value)} className="profile-select">
                <option value="animateur">Animateur / Animatrice BAFA</option>
                <option value="directeur">Directeur / Directrice de structure</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Mot de passe</label>
              <input id="reg-password" type="password" placeholder="••••••••"
                value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password2">Confirmer le mot de passe</label>
              <input id="reg-password2" type="password" placeholder="••••••••"
                value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)} required />
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </>
      )}

      {/* ── MOT DE PASSE OUBLIÉ ── */}
      {mode === 'forgot' && (
        <>
          <div className="login-header">
            <h2>Mot de passe oublié</h2>
            <p>Entrez votre email, nous vous enverrons un lien de réinitialisation.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Votre email</label>
              <input id="forgot-email" type="email" placeholder="votre@email.com"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <button type="button" className="forgot-link" onClick={() => switchMode('login')}>
              ← Retour à la connexion
            </button>
          </form>
        </>
      )}

      {/* ── RÉINITIALISATION DE MOT DE PASSE ── */}
      {mode === 'reset' && (
        <>
          <div className="login-header">
            <h2>Nouveau mot de passe</h2>
            <p>Choisissez un nouveau mot de passe pour votre compte.</p>
          </div>

          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="new-password">Nouveau mot de passe</label>
              <input id="new-password" type="password" placeholder="••••••••"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="new-password2">Confirmer le mot de passe</label>
              <input id="new-password2" type="password" placeholder="••••••••"
                value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} required />
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default Login
