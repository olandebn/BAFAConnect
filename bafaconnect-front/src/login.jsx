import { useState } from 'react'
import api from './api/axios'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
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
        console.error('Structure de réponse inattendue :', res.data)
        setError("Impossible de récupérer les informations de connexion.")
      }
    } catch (err) {
      console.error('Erreur de connexion :', err)
      setError('Identifiants incorrects ou erreur serveur.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-box">
      <div className="login-header">
        <h2>Bon retour sur BafaConnect</h2>
        <p>Connectez-vous pour retrouver vos annonces, candidatures et outils.</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
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
    </div>
  )
}

export default Login