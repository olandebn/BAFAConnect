import { useEffect, useState } from 'react'
import api from './api/axios'

function ShareCard() {
  const userId = localStorage.getItem('userId')
  const [copied, setCopied] = useState(false)
  if (!userId) return null
  const link = `${window.location.origin}?profil=${userId}`
  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <div className="share-card">
      <div className="share-card-icon">🔗</div>
      <div className="share-card-body">
        <div className="share-card-title">Mon lien de profil public</div>
        <p className="share-card-sub">Partagez ce lien avec les directeurs pour qu'ils consultent votre profil directement.</p>
        <div className="share-card-link-row">
          <code className="share-card-url">{link}</code>
          <button className={`share-card-btn ${copied ? 'share-card-btn-ok' : ''}`} onClick={handleCopy}>
            {copied ? '✅ Copié !' : '📋 Copier'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stars({ note }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(note) ? '#f59e0b' : '#d1d5db', fontSize: '1rem' }}>★</span>
      ))}
    </span>
  )
}

function DashboardAnimateur({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/candidatures/stats'),
      api.get('/invitations').catch(() => ({ data: [] }))
    ]).then(([statsRes, invitRes]) => {
      setStats(statsRes.data)
      setInvitations(invitRes.data || [])
    }).catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="candidatures-empty">Chargement...</p>
  if (error) return <div className="profile-alert profile-alert-error">{error}</div>
  if (!stats) return null

  const tauxColor = stats.taux_acceptation >= 60 ? '#22c55e' : stats.taux_acceptation >= 30 ? '#f59e0b' : '#ef4444'

  const statutLabel = (statut) => {
    if (statut === 'acceptée' || statut === 'acceptee') return { label: 'Acceptée', cls: 'statut-accepte' }
    if (statut === 'refusée' || statut === 'refusee') return { label: 'Refusée', cls: 'statut-refuse' }
    return { label: 'En attente', cls: 'statut-attente' }
  }

  return (
    <div className="dashboard-v2">

      {/* ── Chiffres clés ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.nb_total}</div>
          <div className="stat-label">Candidature{stats.nb_total !== 1 ? 's' : ''} envoyée{stats.nb_total !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.nb_acceptees}</div>
          <div className="stat-label">Acceptée{stats.nb_acceptees !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.nb_en_attente}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value" style={{ color: tauxColor }}>{stats.taux_acceptation}%</div>
          <div className="stat-label">Taux d'acceptation</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.moyenne_avis ? stats.moyenne_avis.toFixed(1) : '—'}
          </div>
          <div className="stat-label">
            Moyenne avis
            {stats.nb_avis > 0 && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>({stats.nb_avis} avis)</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.nb_refusees}</div>
          <div className="stat-label">Refusée{stats.nb_refusees !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ── Taux d'acceptation ── */}
      {stats.nb_total > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Taux d'acceptation</h3>
            <span className="dashboard-section-hint">
              {stats.nb_acceptees} acceptée{stats.nb_acceptees !== 1 ? 's' : ''} sur {stats.nb_total} candidature{stats.nb_total !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="taux-bar-wrapper">
            <div className="taux-bar-track">
              <div className="taux-bar-fill" style={{ width: `${stats.taux_acceptation}%`, background: tauxColor }} />
            </div>
            <span className="taux-bar-label" style={{ color: tauxColor }}>{stats.taux_acceptation}%</span>
          </div>
        </div>
      )}

      {/* ── Note moyenne ── */}
      {stats.moyenne_avis && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Réputation</h3>
          </div>
          <div className="anim-reputation">
            <Stars note={stats.moyenne_avis} />
            <span className="anim-reputation-score">{stats.moyenne_avis.toFixed(1)} / 5</span>
            <span className="anim-reputation-count">({stats.nb_avis} avis reçu{stats.nb_avis > 1 ? 's' : ''})</span>
          </div>
        </div>
      )}

      {/* ── Dernières candidatures ── */}
      {stats.dernieres_candidatures?.length > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Dernières candidatures</h3>
            <button
              className="btn-link"
              onClick={() => onNavigate && onNavigate('candidatures')}
            >
              Voir tout →
            </button>
          </div>
          <div className="annonces-stats-list">
            {stats.dernieres_candidatures.map((c, i) => {
              const { label, cls } = statutLabel(c.statut)
              return (
                <div key={i} className="annonce-stats-row">
                  <div className="annonce-stats-left">
                    <span className="annonce-stats-titre">{c.sejour_titre}</span>
                    <div className="annonce-stats-meta">
                      {c.lieu && <span>📍 {c.lieu}</span>}
                      {c.date_candidature && (
                        <span>Candidaté le {new Date(c.date_candidature).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                  <span className={`candidature-statut-tag ${cls}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Invitations reçues ── */}
      {invitations.length > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">💌 Invitations reçues</h3>
            <span className="dashboard-section-hint">{invitations.length} invitation{invitations.length > 1 ? 's' : ''}</span>
          </div>
          <div className="annonces-stats-list">
            {invitations.slice(0, 3).map((inv, i) => (
              <div key={i} className="annonce-stats-row">
                <div className="annonce-stats-left">
                  <span className="annonce-stats-titre">{inv.sejour_titre}</span>
                  <div className="annonce-stats-meta">
                    {inv.lieu && <span>📍 {inv.lieu}</span>}
                    <span>de {inv.directeur_nom}</span>
                    {inv.date_debut && <span>🗓️ {new Date(inv.date_debut).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
                  onClick={() => onNavigate && onNavigate('annonces')}
                >
                  Voir →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">Actions rapides</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onNavigate && onNavigate('annonces')}>
            🏠 Voir les annonces
          </button>
          <button className="btn-secondary" onClick={() => onNavigate && onNavigate('profil')}>
            👤 Compléter mon profil
          </button>
          <button className="btn-secondary" onClick={() => onNavigate && onNavigate('candidatures')}>
            📋 Mes candidatures
          </button>
        </div>
      </div>

      {/* ── Lien de profil partageable ── */}
      <ShareCard />

      {stats.nb_total === 0 && (
        <div className="empty-state">
          <span>🎒</span>
          <p>Vous n'avez pas encore postulé à un séjour.</p>
          <button className="btn-primary" style={{ marginTop: 12 }}
            onClick={() => onNavigate && onNavigate('annonces')}>
            Voir les annonces
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardAnimateur
