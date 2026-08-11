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
import ProfilPublicDirecteur from './ProfilPublicDirecteur'
import CarteSejoursMap from './CarteSejoursMap'
import OnboardingBanner from './OnboardingBanner'
import AdminPanel from './AdminPanel'
import GuideBafa from './GuideBafa'
import LegalPage from './LegalPage'
import AboutPage from './AboutPage'
import ContactPage from './ContactPage'
import NotFound from './NotFound'
import CookieBanner from './CookieBanner'
import CampDoodles from './CampDoodles'
import StatCounter from './StatCounter'
import { burstConfetti } from './confetti'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role') || 'animateur')

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    // Dark mode par défaut — sauf si l'utilisateur a explicitement choisi le mode clair
    const isDark = saved !== 'light'
    if (isDark) document.documentElement.classList.add('dark')
    return isDark
  })
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '')
  const [emailVerified, setEmailVerified] = useState(localStorage.getItem('emailVerified') !== 'false')
  const [resendEmailMsg, setResendEmailMsg] = useState('')
  const [resendEmailLoading, setResendEmailLoading] = useState(false)
  const [userPhoto, setUserPhoto] = useState('')
  const [page, setPage] = useState(() => {
    // Si on revient d'une impersonation, forcer le dashboard et nettoyer l'URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('impersonate')) {
      window.history.replaceState({}, '', '/')
      return 'dashboard'
    }
    return 'dashboard'
  })
  const [publicProfileId, setPublicProfileId] = useState(() => new URLSearchParams(window.location.search).get('profil'))
  const [publicProfileRole, setPublicProfileRole] = useState('animateur')
  const [messageDest, setMessageDest] = useState(null)
  const [postuleNotif, setPostuleNotif] = useState('')
  const [sejoursLoading, setSejoursLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifItems, setNotifItems] = useState([])
  const [filtres, setFiltres] = useState({ lieu: '', type: '', date_debut: '', date_fin: '', postes_min: '' })
  const [annoncesView, setAnnoncesView] = useState('liste')
  const [animateurDispo, setAnimateurDispo] = useState(null) // { debut, fin } pour le matching
  const [cacherPassees, setCacherPassees] = useState(true) // masquer les séjours passés par défaut
  const [filtreCompatible, setFiltreCompatible] = useState(false)
  const [filtrePlacesDispo, setFiltrePlacesDispo] = useState(false)

  const handleThemeChange = (isDark) => {
    setDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }

  const fetchSejours = useCallback(() => {
    setSejoursLoading(true)
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(err => console.error('Erreur récup séjours :', err))
      .finally(() => setSejoursLoading(false))
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
      api.get('/recrutement/candidats-recus')
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

  // Vérification email via ?verify=TOKEN (si déjà connecté au clic du lien)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifyToken = params.get('verify')
    if (!verifyToken) return
    window.history.replaceState({}, '', '/')
    api.get(`/auth/verify-email/${verifyToken}`)
      .then(() => {
        localStorage.setItem('emailVerified', 'true')
        setEmailVerified(true)
        setResendEmailMsg('✅ Email vérifié avec succès !')
      })
      .catch(() => {})
  }, [])

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
    localStorage.removeItem('emailVerified')
    setIsLoggedIn(false)
    setRole('animateur')
    setUserEmail('')
    setUserPhoto('')
    setUnreadCount(0)
    setNotifItems([])
    setEmailVerified(true) // reset pour pas afficher le bandeau sur la page login
  }

  // Déconnexion automatique si le token expire (401 intercepté dans axios.js)
  useEffect(() => {
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const handleLoginSuccess = (userRole) => {
    setRole(userRole)
    setIsLoggedIn(true)
    setPage('dashboard')
    const email = localStorage.getItem('userEmail') || ''
    setUserEmail(email)
    setEmailVerified(localStorage.getItem('emailVerified') !== 'false')
  }

  const handleResendVerifEmail = async () => {
    setResendEmailLoading(true)
    setResendEmailMsg('')
    try {
      await api.post('/auth/resend-verification', { email: userEmail })
      setResendEmailMsg('Email renvoyé ! Vérifiez votre boîte mail.')
    } catch {
      setResendEmailMsg('Erreur lors du renvoi, réessayez.')
    } finally {
      setResendEmailLoading(false)
    }
  }

  const handleContacter = (interlocuteur) => {
    setMessageDest(interlocuteur)
    setPage('messages')
  }

  const handlePostuler = async (sejourId) => {
    try {
      await api.post('/candidatures', { sejour_id: sejourId })
      setPostuleNotif('✅ Candidature envoyée avec succès !')
      burstConfetti(window.innerWidth / 2, window.innerHeight / 3)
    } catch (err) {
      setPostuleNotif(err.response?.data?.error || 'Erreur lors de la candidature.')
    }
    setTimeout(() => setPostuleNotif(''), 4000)
  }

  // Couleur d'accent selon le type de séjour (barre à gauche des cartes)
  const typeColor = (t = '') => {
    const s = (t || '').toLowerCase()
    if (s.includes('colon')) return '#4f7d3f'
    if (s.includes('vacance')) return '#f59e0b'
    if (s.includes('loisir')) return '#0ea5a4'
    if (s.includes('sport')) return '#e8826b'
    if (s.includes('ado') || s.includes('camp')) return '#8b5cf6'
    return '#94a3b8'
  }

  const [landingPage, setLandingPage] = useState(null)
  const [loginInitialMode, setLoginInitialMode] = useState('login') // null = landing principale, sinon 'about'|'contact'|'mentions'|'cgu'|'rgpd'|'cookies'
  const [sunWave, setSunWave] = useState(false) // easter egg mascotte soleil
  const [landingNight, setLandingNight] = useState(false) // mode nuit "feu de camp" de la landing

  const handleSetPage = (newPage) => {
    if (newPage !== 'messages') setMessageDest(null)
    if (newPage === 'messages') fetchUnread()
    setPublicProfileId(null)
    setPage(newPage)
  }

  const handleVoirProfil = (userId, userRole = 'animateur') => {
    setPublicProfileRole(userRole)
    setPublicProfileId(userId)
  }

  // ─── PROFIL PUBLIC (accessible sans connexion) ─────────────────────────
  if (publicProfileId) {
    const onRetourProfil = () => {
      setPublicProfileId(null)
      window.history.replaceState({}, '', window.location.pathname)
    }
    return (
      <div className="site-wrapper" style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="sidebar-logo-icon" style={{ fontSize: '1.4rem' }}>🧡</span>
            <strong style={{ fontSize: '1.1rem' }}>BafaConnect</strong>
          </div>
          {publicProfileRole === 'directeur' ? (
            <ProfilPublicDirecteur
              userId={publicProfileId}
              onContacter={isLoggedIn ? handleContacter : null}
              onPostuler={isLoggedIn ? handlePostuler : null}
              onRetour={onRetourProfil}
            />
          ) : (
            <ProfilPublic
              userId={publicProfileId}
              onContacter={isLoggedIn ? handleContacter : null}
              onRetour={onRetourProfil}
            />
          )}
        </div>
      </div>
    )
  }

  // ─── LANDING PAGE (non connecté) ───────────────────────────────────────
  if (!isLoggedIn) {
    // Navbar commune à toutes les sous-pages
    const LandingNav = () => (
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setLandingPage(null)}>
            <img src="/logo-bafaconnect.png" alt="BafaConnect" className="nav-logo-img" onError={(e) => { e.target.style.display='none' }} />
            <span><span className="logo-bafa">Bafa</span><span className="logo-connect">Connect</span></span>
          </div>
          <div className="nav-menu">
            <button onClick={() => setLandingPage(null)} className="nav-item footer-link-btn">Accueil</button>
            <button onClick={() => setLandingPage('about')} className="nav-item footer-link-btn">À propos</button>
            <button onClick={() => setLandingPage('contact')} className="nav-item footer-link-btn">Contact</button>
            <a href="#connexion" className="nav-item nav-cta-light" onClick={() => setLandingPage(null)}>Connexion</a>
          </div>
        </div>
      </nav>
    )

    // Sous-pages légales, about, contact
    if (landingPage === 'about') return (
      <div className="site-wrapper landing-light">
        <LandingNav />
        <main className="main-content"><AboutPage onNavigate={(p) => { if (p === 'register') { setLoginInitialMode('register'); setLandingPage(null); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, 100) } else setLandingPage(p) }} /></main>
        <CookieBanner onNavigate={setLandingPage} />
      </div>
    )
    if (landingPage === 'contact') return (
      <div className="site-wrapper landing-light">
        <LandingNav />
        <main className="main-content"><ContactPage /></main>
        <CookieBanner onNavigate={setLandingPage} />
      </div>
    )
    if (['mentions', 'cgu', 'rgpd', 'cookies'].includes(landingPage)) return (
      <div className="site-wrapper landing-light">
        <LandingNav />
        <main className="main-content"><LegalPage initialTab={landingPage} /></main>
        <CookieBanner onNavigate={setLandingPage} />
      </div>
    )

    return (
      <div className={"site-wrapper landing-light" + (landingNight ? ' landing-night' : '')}>
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">
              <span className="logo-badge"><svg width="26" height="26" viewBox="0 0 80 80" aria-hidden="true"><use href="#cd-sun" /></svg></span>
              <span className="logo-text"><span className="logo-bafa">Bafa</span><span className="logo-connect">Connect</span></span>
              <svg className="logo-twinkle cd-twinkle" aria-hidden="true" width="16" height="16" viewBox="0 0 32 32"><use href="#cd-star" /></svg>
            </div>
            <div className="nav-menu">
              <a href="#hero" className="nav-item">Accueil</a>
              <a href="#offres" className="nav-item">Trouver une mission</a>
              <a href="#comment" className="nav-item">Comment ça marche</a>
              <button onClick={() => setLandingPage('about')} className="nav-item footer-link-btn">À propos</button>
              <button
                className="nav-daynight"
                aria-label={landingNight ? 'Passer en mode jour' : 'Passer en mode nuit'}
                title={landingNight ? 'Mode jour' : 'Mode nuit'}
                onClick={() => setLandingNight(v => !v)}
              >
                <svg width="22" height="22" viewBox="0 0 80 80" aria-hidden="true"><use href={landingNight ? '#cd-sun' : '#cd-moon'} /></svg>
              </button>
              <a href="#connexion" className="nav-item nav-cta-light" onClick={() => setLoginInitialMode('login')}>Connexion</a>
              <button
                className="nav-item nav-cta-primary"
                onClick={(e) => { burstConfetti(e.clientX, e.clientY); setLoginInitialMode('register'); document.getElementById('connexion')?.scrollIntoView({ behavior: 'smooth' }) }}
              >Inscription</button>
            </div>
          </div>
          <div className="nav-bunting" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => <span key={i} className="nav-flag" />)}
          </div>
        </nav>

        <main className="main-content">
          <div className="landing-page">
            <CampDoodles />
            <section id="hero" className="hero-section">
              <div className="hero-content">
                <span className="hero-badge">la plateforme des colos ✦</span>
                <h1 className="hero-title hero-title-compact">
                  Le recrutement <span className="text-orange">BAFA</span>,<br />
                  fait pour de <em className="hero-em">vraies</em> rencontres.
                </h1>
                <p className="hero-subtitle">
                  On relie directeurs et animateurs sans usine à gaz.{' '}
                  <span className="mark">100 % gratuit</span>, données hébergées en Europe.
                </p>
                <div className="hero-actions">
                  <a href="#connexion" className="btn-primary">Trouver une mission</a>
                  <a href="#offres" className="btn-secondary">Je recrute</a>
                  <span className="hero-hand">↖ promis, 2 min</span>
                </div>
                <p className="hero-note">Pensé pour les centres de loisirs, colonies et séjours jeunesse.</p>
              </div>

              <div className="hero-scene">
                {/* mascotte soleil — cliquable (easter egg) */}
                <span className="cd-doodle cd-float cd-mascot" style={{ top: '4px', right: '36px' }}>
                  <svg className={'cd-sun-svg' + (sunWave ? ' cd-pop' : '')} onClick={(e) => { burstConfetti(e.clientX, e.clientY); setSunWave(true); window.clearTimeout(window.__sunT); window.__sunT = window.setTimeout(() => setSunWave(false), 2400) }} width="124" height="124" viewBox="0 0 80 80" role="button" aria-label="Coucou !"><use href="#cd-sun" /></svg>
                  {sunWave && <span className="sun-hello">coucou&nbsp;! ✦</span>}
                </span>
                <svg className="cd-doodle cd-float2 cd-wig" aria-hidden="true" style={{ bottom: '34px', left: '6px', '--r': '-4deg' }} width="158" height="158" viewBox="0 0 80 80"><use href="#cd-tent" /></svg>
                <svg className="cd-doodle cd-wig" aria-hidden="true" style={{ bottom: '40px', right: '78px' }} width="62" height="62" viewBox="0 0 44 62"><use href="#cd-tree" /></svg>
                <svg className="cd-doodle cd-wig" aria-hidden="true" style={{ bottom: '32px', right: '28px' }} width="86" height="86" viewBox="0 0 44 62"><use href="#cd-tree" /></svg>
                <svg className="cd-doodle cd-float3 cd-wig" aria-hidden="true" style={{ top: '120px', right: '0', '--r': '8deg' }} width="74" height="74" viewBox="0 0 64 76"><use href="#cd-backpack" /></svg>
                {/* nuage */}
                <svg className="cd-doodle cd-drift" aria-hidden="true" style={{ top: '60px', left: '0' }} width="78" height="48" viewBox="0 0 72 48"><use href="#cd-cloud" /></svg>
                {/* oiseaux */}
                <svg className="cd-doodle cd-float2" aria-hidden="true" style={{ top: '110px', left: '70px' }} width="38" height="20" viewBox="0 0 38 16"><use href="#cd-bird" /></svg>
                {/* étoiles */}
                <svg className="cd-doodle cd-twinkle" aria-hidden="true" style={{ top: '26px', left: '38px' }} width="30" height="30" viewBox="0 0 32 32"><use href="#cd-star" /></svg>
                <svg className="cd-doodle cd-twinkle" aria-hidden="true" style={{ top: '200px', left: '10px', animationDelay: '.8s' }} width="22" height="22" viewBox="0 0 32 32"><use href="#cd-star" /></svg>
                <span className="note-pin">déjà 2 400+ anims !</span>
              </div>
            </section>

            <section id="connexion" className="login-section">
              <div className="login-card">
                <span className="section-kicker">Connexion</span>
                <h3>Votre espace BafaConnect</h3>
                <p>Directeurs et animateurs accèdent ici à leur espace personnel.</p>
                <Login onLoginSuccess={handleLoginSuccess} initialMode={loginInitialMode} />
              </div>
            </section>

            <section className="audience-section">
              <div className="audience-card">
                <div className="audience-icon"><svg width="52" height="52" viewBox="0 0 80 80"><use href="#cd-tent" /></svg></div>
                <h3>Vous êtes directeur ?</h3>
                <p>Publiez vos besoins en recrutement, recevez des candidatures et trouvez rapidement les bons profils.</p>
                <a href="#connexion" className="btn-primary">Déposer une annonce</a>
              </div>
              <div className="audience-card">
                <div className="audience-icon"><svg width="52" height="52" viewBox="0 0 64 76"><use href="#cd-backpack" /></svg></div>
                <h3>Vous êtes animateur ?</h3>
                <p>Consultez les offres, mettez en avant votre profil et candidatez aux missions qui vous correspondent.</p>
                <a href="#offres" className="btn-secondary">Voir les offres</a>
              </div>
            </section>

            <section className="stats-band" aria-label="Chiffres clés">
              <div className="stat-item"><span className="stat-num"><StatCounter to={2400} suffix="+" /></span><span className="stat-label">animateurs inscrits</span></div>
              <div className="stat-item"><span className="stat-num"><StatCounter to={680} suffix="+" /></span><span className="stat-label">séjours publiés</span></div>
              <div className="stat-item"><span className="stat-num"><StatCounter to={320} suffix="+" /></span><span className="stat-label">structures partenaires</span></div>
              <div className="stat-item"><span className="stat-num">100&nbsp;%</span><span className="stat-label">gratuit, sans pub</span></div>
            </section>

            <section className="features-section">
              <div className="section-header">
                <span className="section-kicker"><span className="sec-num">n° 1</span>Pourquoi BafaConnect ?</span>
                <h2>Une plateforme pensée pour le recrutement dans l'animation</h2>
              </div>
              <div className="features-grid">
                <div className="feature-card"><span className="feature-icon"><svg width="56" height="56" viewBox="0 0 80 80"><use href="#cd-tent" /></svg></span><div className="feature-text"><h3>Publiez en quelques minutes</h3><p>Créez une annonce claire, complète et visible rapidement.</p></div></div>
                <div className="feature-card"><span className="feature-icon"><svg width="56" height="56" viewBox="0 0 64 76"><use href="#cd-backpack" /></svg></span><div className="feature-text"><h3>Centralisez les candidatures</h3><p>Recevez les profils au même endroit et gagnez du temps.</p></div></div>
                <div className="feature-card"><span className="feature-icon"><svg width="56" height="56" viewBox="0 0 68 68"><use href="#cd-compass" /></svg></span><div className="feature-text"><h3>Candidatez simplement</h3><p>Les animateurs trouvent les offres adaptées et postulent vite.</p></div></div>
                <div className="feature-card"><span className="feature-icon"><svg width="56" height="56" viewBox="0 0 44 62"><use href="#cd-tree" /></svg></span><div className="feature-text"><h3>Pensé pour l'animation</h3><p>Une plateforme conçue pour les centres, colos et séjours jeunesse.</p></div></div>
              </div>
            </section>

            <section id="comment" className="steps-section">
              <div className="section-header">
                <span className="section-kicker"><span className="sec-num">n° 2</span>Le parcours, étape par étape</span>
                <h2>Un chemin simple, que vous recrutiez ou cherchiez une mission</h2>
                <p className="sec-sub">Comme une rando bien préparée : trois arrêts et c'est plié, que vous recrutiez ou que vous cherchiez une mission.</p>
              </div>
              <div className="trail">
                <svg className="trail-svg" viewBox="0 0 1100 340" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M70 60 C 280 200, 360 40, 560 150 S 880 280, 1030 110" fill="none" stroke="#4f7d3f" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 14" />
                </svg>
                <div className="trail-stops">
                  <div className="trail-stop reveal">
                    <span className="trail-pin">1</span>
                    <div className="trail-ic"><svg width="50" height="50" viewBox="0 0 80 80"><use href="#cd-tent" /></svg></div>
                    <h3>Créez votre espace</h3>
                    <p>Inscription en 2 minutes : votre tableau de bord est prêt à accueillir annonces ou candidatures.</p>
                  </div>
                  <div className="trail-stop reveal">
                    <span className="trail-pin">2</span>
                    <div className="trail-ic"><svg width="50" height="50" viewBox="0 0 64 76"><use href="#cd-backpack" /></svg></div>
                    <h3>Publiez ou candidatez</h3>
                    <p>Les directeurs déposent leurs missions, les animateurs postulent en quelques clics, sans paperasse.</p>
                  </div>
                  <div className="trail-stop reveal">
                    <span className="trail-pin">3</span>
                    <div className="trail-ic"><svg width="50" height="50" viewBox="0 0 80 80"><use href="#cd-sun" /></svg></div>
                    <h3>Faites équipe</h3>
                    <p>Messagerie, entretiens, contrats : tout se passe au même endroit jusqu'au grand départ.</p>
                  </div>
                </div>
              </div>
            </section>

            {sejours.length > 0 && (
            <section id="offres" className="offers-section">
              <div className="section-header">
                <span className="section-kicker"><span className="sec-num">n° 3</span>Offres récentes</span>
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
            )}

            <section className="avis-band">
              <div className="section-header">
                <span className="section-kicker"><span className="sec-num">★</span>Ils en parlent</span>
                <h2>Ce que disent les équipes qui l'utilisent</h2>
              </div>
              <div className="avis-grid">
                <figure className="avis-card">
                  <span className="avis-tape"></span>
                  <div className="avis-stars" aria-label="5 sur 5">{[0,1,2,3,4].map(i => <svg key={i} width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><use href="#cd-star" /></svg>)}</div>
                  <blockquote>« J'ai bouclé le recrutement de ma colo en une semaine. Les profils étaient clairs, j'ai pu choisir vite. »</blockquote>
                  <figcaption><span className="avis-ava">CM</span><span className="avis-who">Claire M.<small>Directrice · Annecy</small></span></figcaption>
                </figure>
                <figure className="avis-card">
                  <span className="avis-tape"></span>
                  <div className="avis-stars" aria-label="5 sur 5">{[0,1,2,3,4].map(i => <svg key={i} width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><use href="#cd-star" /></svg>)}</div>
                  <blockquote>« Première mission trouvée en deux jours. L'appli est simple et l'équipe super accueillante. »</blockquote>
                  <figcaption><span className="avis-ava">YB</span><span className="avis-who">Yanis B.<small>Animateur · Toulouse</small></span></figcaption>
                </figure>
                <figure className="avis-card">
                  <span className="avis-tape"></span>
                  <div className="avis-stars" aria-label="5 sur 5">{[0,1,2,3,4].map(i => <svg key={i} width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><use href="#cd-star" /></svg>)}</div>
                  <blockquote>« Enfin un outil pensé pour l'animation. On centralise tout, fini les tableurs et les mails perdus. »</blockquote>
                  <figcaption><span className="avis-ava">SN</span><span className="avis-who">Sarah N.<small>Directrice · Lyon</small></span></figcaption>
                </figure>
              </div>
            </section>

            <section className="final-cta">
              <div className="final-cta-card">
                <svg className="cta-deco" aria-hidden="true" style={{ top: '-12px', left: '24px' }} width="118" height="118" viewBox="0 0 80 80"><use href="#cd-tent" /></svg>
                <svg className="cta-deco" aria-hidden="true" style={{ bottom: '-22px', right: '34px' }} width="120" height="120" viewBox="0 0 44 62"><use href="#cd-tree" /></svg>
                <h2>Prêt à monter l'équipe de l'été ? ✦</h2>
                <div className="hero-actions center-actions">
                  <a href="#connexion" className="btn-primary">Publier une annonce</a>
                  <a href="#offres" className="btn-secondary">Créer mon profil</a>
                </div>
                <span className="cta-hand">
                  <svg className="cta-arrow" aria-hidden="true" width="54" height="36" viewBox="0 0 58 38"><use href="#cd-arrow" /></svg>
                  rejoins-nous, c'est gratuit&nbsp;!
                </span>
              </div>
            </section>

            <footer className="footer">
              <div className="footer-top">
                <div className="footer-brand">
                  <strong className="footer-logo">💚 BafaConnect</strong>
                  <p className="footer-tagline">La plateforme qui relie directeurs et animateurs BAFA.<br />100 % gratuit · Données hébergées en Europe.</p>
                  <div className="footer-social">
                    <a href="mailto:support@bafaconnect.fr" title="Email" className="footer-social-btn">✉️</a>
                  </div>
                </div>
                <div className="footer-cols">
                  <div className="footer-col">
                    <div className="footer-col-title">Navigation</div>
                    <a href="#hero">Accueil</a>
                    <a href="#offres">Offres de missions</a>
                    <a href="#comment">Comment ça marche</a>
                    <button onClick={() => setLandingPage('about')} className="footer-link-btn">À propos</button>
                  </div>
                  <div className="footer-col">
                    <div className="footer-col-title">Support</div>
                    <button onClick={() => setLandingPage('contact')} className="footer-link-btn">Nous contacter</button>
                    <a href="mailto:support@bafaconnect.fr">support@bafaconnect.fr</a>
                  </div>
                  <div className="footer-col">
                    <div className="footer-col-title">Légal</div>
                    <button onClick={() => setLandingPage('mentions')} className="footer-link-btn">Mentions légales</button>
                    <button onClick={() => setLandingPage('cgu')} className="footer-link-btn">CGU</button>
                    <button onClick={() => setLandingPage('rgpd')} className="footer-link-btn">Confidentialité</button>
                    <button onClick={() => setLandingPage('cookies')} className="footer-link-btn">Cookies</button>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} BafaConnect — Tous droits réservés</span>
                <span>Fait avec 💚 en France</span>
              </div>
            </footer>
            <CookieBanner onNavigate={(tab) => setLandingPage(tab)} />
          </div>
        </main>
      </div>
    )
  }

  // ─── DASHBOARD (connecté) ───────────────────────────────────────────────
  const now = new Date()

  const sejoursFiltres = sejours.filter(s => {
    if (cacherPassees && s.date_fin && new Date(s.date_fin) < now) return false
    if (cacherPassees && !s.date_fin && s.date_debut && new Date(s.date_debut) < now) return false
    if (filtres.lieu && !s.lieu?.toLowerCase().includes(filtres.lieu.toLowerCase())) return false
    if (filtres.type && s.type !== filtres.type) return false
    if (filtres.date_debut && s.date_debut && s.date_debut < filtres.date_debut) return false
    if (filtres.date_fin && s.date_fin && s.date_fin > filtres.date_fin) return false
    if (filtres.postes_min && s.nombre_postes && Number(s.nombre_postes) < Number(filtres.postes_min)) return false
    if (filtreCompatible && !isCompatible(s)) return false
    if (filtrePlacesDispo && isComplet(s)) return false
    return true
  })
  const nbFiltresActifs = Object.values(filtres).filter(Boolean).length + (filtreCompatible ? 1 : 0) + (filtrePlacesDispo ? 1 : 0)

  const isComplet = (s) => s.nombre_postes && parseInt(s.postes_pourvus || 0) >= parseInt(s.nombre_postes)
  const nbPassees = sejours.filter(s => {
    const fin = s.date_fin ? new Date(s.date_fin) : (s.date_debut ? new Date(s.date_debut) : null)
    return fin && fin < now
  }).length

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
        <CampDoodles />

        {/* Bandeau impersonation admin */}
        {localStorage.getItem('adminToken') && (
          <div style={{
            background: '#7c3aed', color: '#fff', padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: '0.9rem', fontWeight: 500, borderRadius: 0,
            marginBottom: 0, position: 'sticky', top: 0, zIndex: 100,
          }}>
            <span>🔐 Mode impersonation — vous naviguez en tant que <strong>{localStorage.getItem('userEmail')}</strong></span>
            <button
              onClick={() => {
                localStorage.setItem('token', localStorage.getItem('adminToken'));
                localStorage.setItem('userId', localStorage.getItem('adminUserId'));
                localStorage.setItem('userEmail', localStorage.getItem('adminEmail'));
                localStorage.setItem('role', localStorage.getItem('adminRole') || 'admin');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUserId');
                localStorage.removeItem('adminEmail');
                localStorage.removeItem('adminRole');
                window.location.href = '/';
              }}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontWeight: 700,
              }}
            >↩ Retour admin</button>
          </div>
        )}

        {/* Bandeau email non vérifié */}
        {isLoggedIn && !emailVerified && !localStorage.getItem('adminToken') && (
          <div style={{
            background: '#fef3c7', borderBottom: '1px solid #fcd34d',
            padding: '10px 20px', display: 'flex', alignItems: 'center',
            gap: 12, fontSize: '0.88rem', flexWrap: 'wrap',
          }}>
            <span style={{ color: '#92400e' }}>
              ✉️ <strong>Vérifiez votre email</strong> — un lien de confirmation a été envoyé à <strong>{userEmail}</strong>
            </span>
            {resendEmailMsg
              ? <span style={{ color: '#4f7d3f', fontWeight: 600 }}>{resendEmailMsg}</span>
              : <button
                  onClick={handleResendVerifEmail}
                  disabled={resendEmailLoading}
                  style={{
                    background: '#f59e0b', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '4px 14px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.85rem',
                  }}
                >{resendEmailLoading ? '…' : '↻ Renvoyer l\'email'}</button>
            }
            <button
              onClick={() => {
                localStorage.setItem('emailVerified', 'true')
                setEmailVerified(true)
              }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '1rem' }}
              title="Fermer (si vous avez déjà vérifié)"
            >✕</button>
          </div>
        )}

        <OnboardingBanner role={role} onNavigate={handleSetPage} />

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
                  <select value={filtres.type} onChange={e => setFiltres({ ...filtres, type: e.target.value })}>
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
              <div className="filtres-toggles">
                <label className="filtre-toggle-label">
                  <input type="checkbox" checked={cacherPassees} onChange={e => setCacherPassees(e.target.checked)} />
                  Masquer les séjours passés {nbPassees > 0 && <span className="filtres-count-badge">{nbPassees}</span>}
                </label>
                <label className="filtre-toggle-label">
                  <input type="checkbox" checked={filtrePlacesDispo} onChange={e => setFiltrePlacesDispo(e.target.checked)} />
                  Places disponibles uniquement
                </label>
                {animateurDispo && (
                  <label className="filtre-toggle-label filtre-toggle-compat">
                    <input type="checkbox" checked={filtreCompatible} onChange={e => setFiltreCompatible(e.target.checked)} />
                    ✨ Compatible avec mes disponibilités
                  </label>
                )}
              </div>
              <div className="filtres-chips-rapides">
                {[
                  { label: '☀️ Cet été', action: () => setFiltres(f => ({ ...f, date_debut: `${new Date().getFullYear()}-06-01`, date_fin: `${new Date().getFullYear()}-08-31` })) },
                  { label: '📅 Ce mois-ci', action: () => { const d = new Date(); const debut = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; const fin = new Date(d.getFullYear(), d.getMonth()+1, 0); setFiltres(f => ({ ...f, date_debut: debut, date_fin: `${fin.getFullYear()}-${String(fin.getMonth()+1).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}` })) }},
                  { label: '🏕️ Colonies', action: () => setFiltres(f => ({ ...f, type: 'Colonie' })) },
                  { label: '🏖️ Séjours vacances', action: () => setFiltres(f => ({ ...f, type: 'Séjour de vacances' })) },
                ].map(chip => (
                  <button key={chip.label} type="button" className="filtre-rapide-chip" onClick={chip.action}>{chip.label}</button>
                ))}
                {nbFiltresActifs > 0 && (
                  <button type="button" className="filtre-rapide-chip filtre-rapide-chip--reset"
                    onClick={() => { setFiltres({ lieu: '', type: '', date_debut: '', date_fin: '', postes_min: '' }); setFiltreCompatible(false); setFiltrePlacesDispo(false) }}>
                    ✕ Tout effacer
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
                {sejoursLoading && Array.from({ length: 4 }, (_, i) => (
                  <div key={'sk' + i} className="skeleton-card" aria-hidden="true">
                    <div className="skeleton-line sk-w40" />
                    <div className="skeleton-line sk-title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line sk-w60" />
                    <div className="skeleton-btn" />
                  </div>
                ))}
                {sejoursFiltres.map(s => {
                  const complet = isComplet(s)
                  const passe = s.date_fin ? new Date(s.date_fin) < now : (s.date_debut ? new Date(s.date_debut) < now : false)
                  return (
                  <div key={s.id} style={{ '--type-color': typeColor(s.type) }} className={`annonce-card ${isCompatible(s) ? 'annonce-card-compatible' : ''} ${complet ? 'annonce-card-complet' : ''} ${passe ? 'annonce-card-passe' : ''}`}>
                    {isCompatible(s) && !complet && (
                      <div className="annonce-match-badge">✨ Compatible avec vos disponibilités</div>
                    )}
                    {complet && <div className="annonce-complet-badge">🔒 Complet</div>}
                    {passe && !complet && <div className="annonce-passe-badge">📦 Séjour terminé</div>}
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
                      <p className="annonce-card-postes">
                        👥 {parseInt(s.postes_pourvus || 0)}/{s.nombre_postes} poste{s.nombre_postes > 1 ? 's' : ''} pourvu{parseInt(s.postes_pourvus || 0) > 1 ? 's' : ''}
                      </p>
                    )}
                    {s.description && <p className="annonce-card-desc">{s.description}</p>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto' }}>
                      {!complet && !passe ? (
                        <button className="btn-primary annonce-card-btn" onClick={() => handlePostuler(s.id)}>
                          Postuler au séjour
                        </button>
                      ) : (
                        <button className="btn-secondary annonce-card-btn" disabled style={{ opacity: 0.5 }}>
                          {complet ? '🔒 Complet' : '📦 Terminé'}
                        </button>
                      )}
                      {s.flyer_url && (
                        <button
                          className="btn-document"
                          style={{ fontSize: '0.8rem', padding: '7px 13px' }}
                          onClick={() => {
                            window.open(s.flyer_url, '_blank')
                          }}
                        >
                          📋 Voir le flyer
                        </button>
                      )}
                    </div>
                  </div>
                  )
                })}
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
            <DashboardDirecteur onNavigate={handleSetPage} />
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
            <RechercheAnimateurs onContacter={handleContacter} onVoirProfil={handleVoirProfil} />
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
                onVoirProfil={handleVoirProfil}
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

        {/* ── ADMIN PANEL ── */}
        {role === 'admin' && page === 'admin' && (
          <div className="page-content">
            <AdminPanel />
          </div>
        )}

        {/* ── GUIDE BAFA ── */}
        {page === 'guide-bafa' && (
          <div className="page-content">
            <GuideBafa />
          </div>
        )}

        {/* ── PAGES LÉGALES (accessibles depuis le footer connecté) ── */}
        {page === 'legal' && <div className="page-content"><LegalPage /></div>}
        {page === 'about' && <div className="page-content"><AboutPage onNavigate={handleSetPage} /></div>}
        {page === 'contact' && <div className="page-content"><ContactPage /></div>}

        {/* ── PAGE 404 ── */}
        {!['dashboard','annonces','candidatures','messages','profil','calendrier','parametres','recherche','favoris','creer-annonce','mes-annonces','recrutement','admin','guide-bafa','legal','about','contact'].includes(page) && (
          <div className="page-content">
            <NotFound onNavigate={handleSetPage} />
          </div>
        )}

      </main>
    </div>
  )
}

export default App
