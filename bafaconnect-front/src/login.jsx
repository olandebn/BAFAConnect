import { useState } from 'react'
import api from './api/axios'

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Connexion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Inscription
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regRole, setRegRole] = useState('animateur')
  const [regSuccess, setRegSuccess] = useState('')

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
        onLoginSuccess(userRole)
      } else {
        setError("Impossible de récupérer les informations de connexion.")
      }
    } catch (err) {
      console.error('Erreur de connexion :', err)
      setError('Identifiants incorrects ou erreur serveur.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setRegSuccess('')

    if (regPassword !== regPassword2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (regPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/register', {
        email: regEmail,
        password: regPassword,
        role: regRole,
      })
      setRegSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
      setRegEmail('')
      setRegPassword('')
      setRegPassword2('')
      setMode('login')
      setEmail(regEmail)
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || "Erreur lors de la création du compte.")
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setRegSuccess('')
  }

  return (
    <div className="login-box">
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

      {mode === 'login' ? (
        <>
          <div className="login-header">
            <h2>Bon retour sur BafaConnect</h2>
            <p>Connectez-vous pour retrouver vos annonces, candidatures et outils.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="login-header">
            <h2>Rejoindre BafaConnect</h2>
            <p>Créez votre compte gratuit en quelques secondes.</p>
          </div>

          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="votre@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-role">Je suis…</label>
              <select
                id="reg-role"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="profile-select"
              >
                <option value="animateur">Animateur / Animatrice BAFA</option>
                <option value="directeur">Directeur / Directrice de structure</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Mot de passe</label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password2">Confirmer le mot de passe</label>
              <input
                id="reg-password2"
                type="password"
                placeholder="••••••••"
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}
            {regSuccess && <div className="login-success">{regSuccess}</div>}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default Login
