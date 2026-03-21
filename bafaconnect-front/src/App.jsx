import { useEffect, useState, useCallback } from 'react'
import api from './api/axios'
import Login from './Login'
import Profile from './Profile'
import MesCandidatures from './MesCandidatures'
import GestionCandidatures from './GestionCandidatures'
import CreerAnnonce from './CreerAnnonce'
import MesAnnonces from './MesAnnonces'
import Messagerie from './Messagerie'
import DashboardDirecteur from './DashboardDirecteur'
import Sidebar from './Sidebar'
import RechercheAnimateurs from './RechercheAnimateurs'
import Favoris from './Favoris'
import Parametres from './Parametres'
import CalendrierSejours from './CalendrierSejours'
import DashboardAnimateur from './DashboardAnimateur'
import ProfilPublic from './ProfilPublic'
import CarteSejoursMap from './CarteSejoursMap'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role') || 'animateur')

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark'
    if (isDark) document.documentElement.classList.add('dark')
    return isDark
  })
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '')
  const [userPhoto, setUserPhoto] = useState('')
  const [page, setPage] = useState('dashboard')
  const [publicProfileId, setPublicProfileId] = useState(() => new URLSearchParams(window.location.search).get('profil'))
  const [messageDest, setMessageDest] = useState(null)
  const [postuleNotif, setPostuleNotif] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifItems, setNotifItems] = useState([])
  const [filtres, setFiltres] = useState({ lieu: '', type: '', date_debut: '', date_fin: '', postes_min: '' })
  const [annoncesView, setAnnoncesView] = useState('liste')
  const [animateurDispo, setAnimateurDispo] = useState(null) // { debut, fin } pour le matching

  const handleThemeChange = (isDark) => {
    setDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }

  const fetchSejours = useCallback(() => {
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error('Erreur récup séjours :', err))
  }, [])

  const fetchUserPhoto = useCallback(() => {
    if (!localStorage.getItem('token')) return
    api.get('/profiles/me')
      .then(res => {
        setUserPhoto(res.data.photo_url || '')
        // Récupère les dispos de l'animateur pour le matching (tableau ou objet)
        if (res.data.disponibilites) {
          try {
            const d = typeof res.data.disponibilites === 'string'
              ? JSON.parse(res.data.disponibilites)
              : res.data.disponibilites
            setAnimateurDispo(d) // peut être tableau ou {debut,fin}
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  const fetchUnread = useCallback(() => {
    if (!localStorage.getItem('token')) return
    api.get('/messages/conversations')
      .then(res => {
        const total = res.data.reduce((sum, c) => sum + Number(c.non_lus || 0), 0)
        setUnreadCount(total)
      })
      .catch(() => {})
  }, [])

  const fetchNotifItems = useCallback((currentRole) => {
    if (!localStorage.getItem('token')) return
    // Pour les directeurs : candidatures en attente
    if (currentRole === 'directeur') {
      api.get('/candidatures/recues')
        .then(res => {
          const enAttente = (res.data || []).filter(c => c.statut === 'en attente')
          if (enAttente.length > 0) {
            setNotifItems([{
              icon: '📩',
              text: `${enAttente.length} candidature${enAttente.length > 1 ? 's' : ''} en attente`,
              page: 'candidatures'
            }])
          } else {
            setNotifItems([])
          }
        })
        .catch(() => {})
    } else {
      // Pour les animateurs : candidatures récemment acceptées/refusées
      api.get('/candidatures/mes-candidatures')
        .then(res => {
          const recentes = (res.data || []).filter(c =>
            c.statut === 'acceptée' || c.statut === 'acceptee' || c.statut === 'refusée' || c.statut === 'refusee'
          ).slice(0, 3)
          if (recentes.length > 0) {
            setNotifItems(recentes.map(c => ({
              icon: c.statut === 'acceptée' || c.statut === 'acceptee' ? '✅' : '❌',
              text: `Candidature ${c.statut === 'acceptée' || c.statut === 'acceptee' ? 'acceptée' : 'refusée'} : ${c.sejour_titre || 'séjour'}`,
              page: 'candidatures'
            })))
          } else {
            setNotifItems([])
          }
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    fetchSejours()
    const savedRole = localStorage.getItem('role')
    if (savedRole) setRole(savedRole)
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail) setUserEmail(savedEmail)
  }, [isLoggedIn, fetchSejours])

  // Fetch photo de profil au login
  useEffect(() => {
    if (!isLoggedIn) return
    fetchUserPhoto()
  }, [isLoggedIn, fetchUserPhoto])

  // Polling badge non lus + notifs toutes les 30s
  useEffect(() => {
    if (!isLoggedIn) return
    const currentRole = localStorage.getItem('role') || role
    fetchUnread()
    fetchNotifItems(currentRole)
    const interval = setInterval(() => {
      fetchUnread()
      fetchNotifItems(currentRole)
    }, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn, fetchUnread, fetchNotifItems, role])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    setIsLoggedIn(false)
    setRole('animateur')
    setUserEmail('')
    setUserPhoto('')
    setUnreadCount(0)
    setNotifItems([])
  }

  const handleLoginSuccess = (userRole) => {
    setRole(userRole)
    setIsLoggedIn(true)
    setPage('dashboard')
    const email = localStorage.getItem('userEmail') || ''
    setUserEmail(email)
  }

  const handleContacter = (interlocuteur) => {
    setMessageDest(interlocuteur)
    setPage('messages')
  }

  const handlePostuler = async (sejourId) => {
    try {
      await api.post('/candidatures', { sejour_id: sejourId })
      setPostuleNotif('✅ Candidature envoyée avec succès !')
    } catch (err) {
      setPostuleNotif(err.response?.data?.error || 'Erreur lors de la candidature.')
    }
    setTimeout(() => setPostuleNotif(''), 4000)
  }

  const handleSetPage = (newPage) => {
    if (newPage !== 'messages') setMessageDest(null)
    if (newPage === 'messages') fetchUnread()
    setPage(newPage)
  }

  // ─── PROFIL PUBLIC (accessible sans connexion) ─────────────────────────
  if (publicProfileId) {
    return (
      <div className="site-wrapper" style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="sidebar-logo-icon" style={{ fontSize: '1.4rem' }}>🧡</span>
            <strong style={{ fontSize: '1.1rem' }}>BafaConnect</strong>
          </div>
          <ProfilPublic
            userId={publicProfileId}
            onContacter={isLoggedIn ? handleContacter : null}
            onRetour={() => {
              setPublicProfileId(null)
              window.history.replaceState({}, '', window.location.pathname)
            }}
          />
        </div>
      </div>
    )
  }

  // ─── LANDING PAGE (non connecté) ───────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="site-wrapper">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-heart">🧡</span>
              <span>BafaConnect</span>
            </div>
            <div className="nav-menu">
              <a href="#hero" className="nav-item">Accueil</a>
              <a href="#offres" className="nav-item">Trouver une mission</a>
              <a href="#comment" className="nav-item">Comment ça marche</a>
              <a href="#connexion" className="nav-item nav-cta-light">Connexion</a>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <div className="landing-page">
            <section id="hero" className="hero-section">
              <div className="hero-content">
                <span className="hero-badge">Plateforme de recrutement BAFA</span>
                <h1 className="hero-title hero-title-compact">
                  Le recrutement <span className="text-orange">BAFA</span>,<br />
                  enfin simple et rapide
                </h1>
                <p className="hero-subtitle">
                  Directeurs, publiez vos annonces. Animateurs, trouvez des missions adaptées
                  et candidatez en quelques clics.
                </p>
                <div className="hero-actions">
                  <a href="#connexion" className="btn-primary">Publier une annonce</a>
                  <a href="#offres" className="btn-secondary">Trouver une mission</a>
                </div>
                <p className="hero-note">Pensé pour les centres de loisirs, colonies et séjours jeunesse.</p>
              </div>

              <div id="connexion" className="login-card">
                <span className="section-kicker">Connexion</span>
                <h3>Votre espace BafaConnect</h3>
                <p>Directeurs et animateurs accèdent ici à leur espace personnel.</p>
                <Login onLoginSuccess={handleLoginSuccess} />
              </div>
            </section>

            <section className="audience-section">
              <div className="audience-card">
                <div className="audience-icon">🏕️</div>
                <h3>Vous êtes directeur ?</h3>
                <p>Publiez vos besoins en recrutement, recevez des candidatures et trouvez rapidement les bons profils.</p>
                <a href="#connexion" className="btn-primary">Déposer une annonce</a>
              </div>
              <div className="audience-card">
                <div className="audience-icon">🎒</div>
                <h3>Vous êtes animateur ?</h3>
                <p>Consultez les offres, mettez en avant votre profil et candidatez aux missions qui vous correspondent.</p>
                <a href="#offres" className="btn-secondary">Voir les offres</a>
              </div>
            </section>

            <section className="features-section">
              <div className="section-header">
                <span className="section-kicker">Pourquoi BafaConnect ?</span>
                <h2>Une plateforme pensée pour le recrutement dans l'animation</h2>
              </div>
              <div className="features-grid">
                <div className="feature-card"><div className="feature-icon">⚡</div><h3>Publiez en quelques minutes</h3><p>Créez une annonce claire, complète et visible rapidement.</p></div>
                <div className="feature-card"><div className="feature-icon">📂</div><h3>Centralisez les candidatures</h3><p>Recevez les profils au même endroit et gagnez du temps.</p></div>
                <div className="feature-card"><div className="feature-icon">✅</div><h3>Candidatez simplement</h3><p>Les animateurs trouvent les offres adaptées et postulent vite.</p></div>
                <div className="feature-card"><div className="feature-icon">🌍</div><h3>Pensé pour l'animation</h3><p>Une plateforme conçue pour les centres, colos et séjours jeunesse.</p></div>
              </div>
            </section>

            <section id="comment" className="steps-section">
              <div className="section-header">
                <span className="section-kicker">Comment ça marche ?</span>
                <h2>Un parcours simple pour les directeurs et les animateurs</h2>
              </div>
              <div className="steps-grid">
                <div className="step-column">
                  <h3>Pour les directeurs</h3>
                  <div className="step-item"><div className="step-number">1</div><div><h4>Créez votre espace</h4><p>Inscrivez-vous et accédez à votre tableau de bord.</p></div></div>
                  <div className="step-item"><div className="step-number">2</div><div><h4>Publiez votre annonce</h4><p>Ajoutez le lieu, les dates et le profil recherché.</p></div></div>
                  <div className="step-item"><div className="step-number">3</div><div><h4>Recevez des candidatures</h4><p>Consultez les profils et recrutez plus rapidement.</p></div></div>
                </div>
                <div className="step-column">
                  <h3>Pour les animateurs</h3>
                  <div className="step-item"><div className="step-number">1</div><div><h4>Créez votre profil</h4><p>Ajoutez vos expériences, disponibilités et qualifications.</p></div></div>
                  <div className="step-item"><div className="step-number">2</div><div><h4>Consultez les offres</h4><p>Parcourez les missions selon le lieu et la période.</p></div></div>
                  <div className="step-item"><div className="step-number">3</div><div><h4>Candidatez rapidement</h4><p>Postulez facilement aux offres qui vous intéressent.</p></div></div>
                </div>
              </div>
            </section>

            <section id="offres" className="offers-section">
              <div className="section-header">
                <span className="section-kicker">Offres récentes</span>
                <h2>Des opportunités concrètes</h2>
              </div>
              <div className="offers-grid">
                {sejours.slice(0, 6).map(s => (
                  <article key={s.id} className="offer-card">
                    <div className="offer-top"><span className="offer-location">📍 {s.lieu}</span></div>
                    <h3>{s.titre}</h3>
                    <p className="offer-structure">{s.nom_structure || 'Structure partenaire'}</p>
                    <p className="offer-description">{s.description || 'Mission d\'animation à découvrir.'}</p>
                    <button className="btn-primary">Voir l'offre</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="final-cta">
              <div className="final-cta-card">
                <span className="section-kicker">Rejoindre BafaConnect</span>
                <h2>Prêt à passer à l'action ?</h2>
                <div className="hero-actions center-actions">
                  <a href="#connexion" className="btn-primary">Publier une annonce</a>
                  <a href="#offres" className="btn-secondary">Créer mon profil</a>
                </div>
              </div>
            </section>

            <footer className="footer">
              <div className="footer-brand">
                <strong>BafaConnect</strong>
                <p>La plateforme qui relie directeurs et animateurs BAFA.</p>
              </div>
              <div className="footer-links">
                <a href="#hero">Accueil</a>
                <a href="#offres">Offres</a>
                <a href="#comment">Comment ça marche</a>
                <a href="#connexion">Connexion</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    )
  }

  // ─── DASHBOARD (connecté) ───────────────────────────────────────────────
  const sejoursFiltres = sejours.filter(s => {
    if (filtres.lieu && !s.lieu?.toLowerCase().includes(filtres.lieu.toLowerCase())) return false
    if (filtres.type && s.type !== filtres.type) return false
    if (filtres.date_debut && s.date_debut && s.date_debut < filtres.date_debut) return false
    if (filtres.date_fin && s.date_fin && s.date_fin > filtres.date_fin) return false
    if (filtres.postes_min && s.nombre_postes && Number(s.nombre_postes) < Number(filtres.postes_min)) return false
    return true
  })
  const nbFiltresActifs = Object.values(filtres).filter(Boolean).length

  // Matching : vérifie si un séjour chevauche au moins une plage de dispo de l'animateur
  const isCompatible = (s) => {
    if (!animateurDispo || !s.date_debut) return false
    const sejourDebut = new Date(s.date_debut)
    const sejourFin   = s.date_fin ? new Date(s.date_fin) : sejourDebut
    const plages = Array.isArray(animateurDispo) ? animateurDispo : (animateurDispo.debut ? [animateurDispo] : [])
    return plages.some(p => {
      if (!p.debut) return false
      const dispoDebut = new Date(p.debut)
      const dispoFin   = p.fin ? new Date(p.fin) : null
      if (dispoFin && sejourDebut > dispoFin) return false
      if (sejourFin < dispoDebut) return false
      return true
    })
  }

  return (
    <div className="app-layout">
      <Sidebar
        role={role}
        page={page}
        setPage={handleSetPage}
        unreadCount={unreadCount}
        onLogout={handleLogout}
        userEmail={userEmail}
        userPhoto={userPhoto}
        notifItems={notifItems}
      />

      <main className="app-main">

        {/* ── ANIMATEUR : Tableau de bord ── */}
        {role === 'animateur' && page === 'dashboard' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Tableau de bord</h1>
              <p className="page-subtitle">Vos statistiques personnelles</p>
            </div>
            <DashboardAnimateur onNavigate={handleSetPage} />
          </div>
        )}

        {/* ── ANIMATEUR : Annonces ── */}
        {role === 'animateur' && page === 'annonces' && (
          <div className="page-content">
            <div className="page-header">
              <div>
                <h1 className="page-title">Annonces disponibles</h1>
                <p className="page-subtitle">
                  {nbFiltresActifs > 0
                    ? `${sejoursFiltres.length} résultat${sejoursFiltres.length !== 1 ? 's' : ''} sur ${sejours.length} annonce${sejours.length !== 1 ? 's' : ''}`
                    : `${sejours.length} mission${sejours.length !== 1 ? 's' : ''} publiée${sejours.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className={annoncesView === 'liste' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                  onClick={() => setAnnoncesView('liste')}
                >📋 Liste</button>
                <button
                  className={annoncesView === 'carte' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                  onClick={() => setAnnoncesView('carte')}
                >🗺️ Carte</button>
              </div>
            </div>

            {annoncesView === 'carte' && (
              <CarteSejoursMap onPostuler={handlePostuler} role={role} />
            )}

            {annoncesView === 'liste' && (
            <div>
            {/* Filtres */}
            <div className="filtres-bar">
              <div className="filtres-grid">
                <div className="form-group">
                  <label>📍 Lieu</label>
                  <input type="text" placeholder="Ex : Ardèche, Lyon..."
                    value={filtres.lieu} onChange={e => setFiltres({ ...filtres, lieu: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>🏕️ Type de séjour</label>
                  <select value={filtres.type} onChange={e => setFiltres({ ...filtres, type: e.target.value })} className="profile-select">
                    <option value="">Tous les types</option>
                    <option value="Séjour de vacances">Séjour de vacances</option>
                    <option value="Accueil de loisirs">Accueil de loisirs</option>
                    <option value="Colonie">Colonie</option>
                    <option value="Séjour sportif">Séjour sportif</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>🗓️ À partir du</label>
                  <input type="date" value={filtres.date_debut}
                    onChange={e => setFiltres({ ...filtres, date_debut: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>🗓️ Jusqu'au</label>
                  <input type="date" value={filtres.date_fin}
                    onChange={e => setFiltres({ ...filtres, date_fin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>👥 Postes min.</label>
                  <input type="number" min="1" max="50" placeholder="Ex : 2"
                    value={filtres.postes_min}
                    onChange={e => setFiltres({ ...filtres, postes_min: e.target.value })} />
                </div>
                {nbFiltresActifs > 0 && (
                  <button className="btn-secondary filtres-reset"
                    onClick={() => setFiltres({ lieu: '', type: '', date_debut: '', date_fin: '', postes_min: '' })}>
                    ✕ Réinitialiser {nbFiltresActifs > 0 && <span className="filtres-count-badge">{nbFiltresActifs}</span>}
                  </button>
                )}
              </div>
            </div>

            {postuleNotif && (
              <div className={`notif-toast ${postuleNotif.includes('✅') ? 'toast-success' : 'toast-error'}`}>
                {postuleNotif}
              </div>
            )}

            {sejoursFiltres.length === 0 ? (
              <div className="empty-state">
                <span>🔍</span>
                <p>Aucune annonce ne correspond à vos filtres.</p>
              </div>
            ) : (
              <div className="annonces-grid">
                {sejoursFiltres.map(s => (
                  <div key={s.id} className={`annonce-card ${isCompatible(s) ? 'annonce-card-compatible' : ''}`}>
                    {isCompatible(s) && (
                      <div className="annonce-match-badge">✨ Compatible avec vos disponibilités</div>
                    )}
                    <div className="annonce-card-header">
                      <span className="annonce-card-lieu">📍 {s.lieu}</span>
                      {s.type && <span className="annonce-card-type">{s.type}</span>}
                    </div>
                    <h3 className="annonce-card-title">{s.titre}</h3>
                    <p className="annonce-card-structure">{s.nom_structure || 'Structure partenaire'}</p>
                    {s.date_debut && (
                      <p className="annonce-card-dates">
                        🗓️ {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                        {s.date_fin && ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}
                    {s.nombre_postes && (
                      <p className="annonce-card-postes">👥 {s.nombre_postes} poste{s.nombre_postes > 1 ? 's' : ''}</p>
                    )}
                    {s.description && <p className="annonce-card-desc">{s.description}</p>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="btn-primary annonce-card-btn" onClick={() => handlePostuler(s.id)}>
                        Postuler au séjour
                      </button>
                      {s.flyer_url && (
                        <button
                          className="btn-document"
                          style={{ fontSize: '0.8rem', padding: '7px 13px' }}
                          onClick={() => {
                            const win = window.open()
                            if (win) win.document.write(`<iframe src="${s.flyer_url}" style="width:100%;height:100%;border:none;" />`)
                          }}
                        >
                          📋 Voir le flyer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            )}
          </div>
        )}

        {/* ── ANIMATEUR : Mes candidatures ── */}
        {role === 'animateur' && page === 'candidatures' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Mes candidatures</h1>
              <p className="page-subtitle">Suivi de toutes vos candidatures envoyées</p>
            </div>
            <MesCandidatures onContacter={handleContacter} />
          </div>
        )}

        {/* ── DIRECTEUR : Tableau de bord ── */}
        {role === 'directeur' && page === 'dashboard' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Tableau de bord</h1>
              <p className="page-subtitle">Vue d'ensemble de votre activité</p>
            </div>
            <DashboardDirecteur />
          </div>
        )}

        {/* ── DIRECTEUR : Mes annonces ── */}
        {role === 'directeur' && page === 'annonces' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Mes annonces</h1>
              <p className="page-subtitle">Gérez vos offres publiées</p>
            </div>
            <div className="page-section">
              <h2 className="section-title">Créer une nouvelle annonce</h2>
              <CreerAnnonce onAnnonceCreated={fetchSejours} />
            </div>
            <div className="page-section">
              <MesAnnonces onAnnonceChanged={fetchSejours} />
            </div>
          </div>
        )}

        {/* ── DIRECTEUR : Recherche d'animateurs ── */}
        {role === 'directeur' && page === 'recherche' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Trouver un animateur</h1>
              <p className="page-subtitle">Recherchez des profils par nom, compétence, ville ou statut BAFA</p>
            </div>
            <RechercheAnimateurs onContacter={handleContacter} />
          </div>
        )}

        {/* ── DIRECTEUR : Favoris ── */}
        {role === 'directeur' && page === 'favoris' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Mes favoris</h1>
              <p className="page-subtitle">Les animateurs que vous avez sauvegardés</p>
            </div>
            <Favoris onContacter={handleContacter} />
          </div>
        )}

        {/* ── DIRECTEUR : Candidatures reçues ── */}
        {role === 'directeur' && page === 'candidatures' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Candidatures reçues</h1>
              <p className="page-subtitle">Gérez les demandes des animateurs</p>
            </div>
            <GestionCandidatures onContacter={handleContacter} />
          </div>
        )}

        {/* ── MESSAGES (commun) ── */}
        {page === 'messages' && (
          <div className="page-content page-content-full">
            <div className="page-header">
              <h1 className="page-title">Messages</h1>
              <p className="page-subtitle">Vos conversations</p>
            </div>
            <div className="messagerie-page-wrapper">
              <Messagerie
                key={messageDest?.id || 'default'}
                destinataireInitial={messageDest}
                onNewMessage={fetchUnread}
              />
            </div>
          </div>
        )}

        {/* ── PROFIL (commun) ── */}
        {page === 'profil' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Mon profil</h1>
              <p className="page-subtitle">Vos informations personnelles</p>
            </div>
            <Profile onPhotoChange={setUserPhoto} />
          </div>
        )}

        {/* ── CALENDRIER (commun) ── */}
        {page === 'calendrier' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Planning des séjours</h1>
              <p className="page-subtitle">
                {role === 'directeur' ? 'Vue calendrier de vos séjours publiés' : 'Visualisez et postulez aux séjours disponibles'}
              </p>
            </div>
            <CalendrierSejours onPostuler={handlePostuler} onContacter={handleContacter} />
          </div>
        )}

        {/* ── PARAMÈTRES (commun) ── */}
        {page === 'parametres' && (
          <div className="page-content">
            <div className="page-header">
              <h1 className="page-title">Paramètres</h1>
              <p className="page-subtitle">Sécurité et informations de connexion</p>
            </div>
            <Parametres onEmailChange={setUserEmail} darkMode={darkMode} onThemeChange={handleThemeChange} />
          </div>
        )}

      </main>
    </div>
  )
}

export default App
