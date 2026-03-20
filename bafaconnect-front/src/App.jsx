import { useEffect, useState } from 'react'
import api from './api/axios'
import Login from './Login'
import Profile from './Profile'
import MesCandidatures from './MesCandidatures'
import GestionCandidatures from './GestionCandidatures'
import CreerAnnonce from './CreerAnnonce'
import Messagerie from './Messagerie'
import './App.css'

function App() {
  const [sejours, setSejours] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role') || 'animateur')
  const [postuleNotif, setPostuleNotif] = useState('')
  const [messageDest, setMessageDest] = useState(null) // Ouvre la messagerie vers un interlocuteur
  const [onglet, setOnglet] = useState('dashboard') // 'dashboard' | 'messages'

  const fetchSejours = () => {
    api.get('/sejours')
      .then((res) => setSejours(res.data))
      .catch((err) => console.error('Erreur récup séjours :', err))
  }

  useEffect(() => {
    fetchSejours()
    const savedRole = localStorage.getItem('role')
    if (savedRole) setRole(savedRole)
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setIsLoggedIn(false)
    setRole('animateur')
  }

  const handleLoginSuccess = (userRole) => {
    localStorage.setItem('role', userRole)
    setRole(userRole)
    setIsLoggedIn(true)
  }

  const handleContacter = (interlocuteur) => {
    setMessageDest(interlocuteur)
    setOnglet('messages')
  }

  const handlePostuler = async (sejourId) => {
    try {
      await api.post('/candidatures', { sejour_id: sejourId })
      setPostuleNotif('Candidature envoyée avec succès !')
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la candidature.'
      setPostuleNotif(msg)
    }
    setTimeout(() => setPostuleNotif(''), 4000)
  }

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

            {!isLoggedIn ? (
              <a href="#connexion" className="nav-item nav-cta-light">Connexion</a>
            ) : (
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {!isLoggedIn ? (
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

                <p className="hero-note">
                  Pensé pour les centres de loisirs, colonies et séjours jeunesse.
                </p>
              </div>

              <div id="connexion" className="login-card">
                <span className="section-kicker">Connexion</span>
                <h3>Votre espace BafaConnect</h3>
                <p>
                  Directeurs et animateurs accèdent ici à leur espace personnel.
                </p>

                <Login onLoginSuccess={handleLoginSuccess} />
              </div>
            </section>

            <section className="audience-section">
              <div className="audience-card">
                <div className="audience-icon">🏕️</div>
                <h3>Vous êtes directeur ?</h3>
                <p>
                  Publiez vos besoins en recrutement, recevez des candidatures
                  et trouvez rapidement les bons profils pour vos séjours et accueils de loisirs.
                </p>
                <a href="#connexion" className="btn-primary">Déposer une annonce</a>
              </div>

              <div className="audience-card">
                <div className="audience-icon">🎒</div>
                <h3>Vous êtes animateur ?</h3>
                <p>
                  Consultez les offres, mettez en avant votre profil
                  et candidatez facilement aux missions qui vous correspondent.
                </p>
                <a href="#offres" className="btn-secondary">Voir les offres</a>
              </div>
            </section>

            <section className="features-section">
              <div className="section-header">
                <span className="section-kicker">Pourquoi BafaConnect ?</span>
                <h2>Une plateforme pensée pour le recrutement dans l’animation</h2>
                <p>
                  Gagnez du temps, simplifiez le recrutement et rendez les candidatures plus fluides.
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>Publiez en quelques minutes</h3>
                  <p>Créez une annonce claire, complète et visible rapidement.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">📂</div>
                  <h3>Centralisez les candidatures</h3>
                  <p>Recevez les profils au même endroit et gagnez du temps.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">✅</div>
                  <h3>Candidatez simplement</h3>
                  <p>Les animateurs trouvent les offres adaptées et postulent vite.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🌍</div>
                  <h3>Pensé pour l’animation</h3>
                  <p>Une plateforme conçue pour les centres, colos et séjours jeunesse.</p>
                </div>
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

                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div>
                      <h4>Créez votre espace</h4>
                      <p>Inscrivez-vous et accédez à votre tableau de bord.</p>
                    </div>
                  </div>

                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div>
                      <h4>Publiez votre annonce</h4>
                      <p>Ajoutez le lieu, les dates et le profil recherché.</p>
                    </div>
                  </div>

                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div>
                      <h4>Recevez des candidatures</h4>
                      <p>Consultez les profils et recrutez plus rapidement.</p>
                    </div>
                  </div>
                </div>

                <div className="step-column">
                  <h3>Pour les animateurs</h3>

                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div>
                      <h4>Créez votre profil</h4>
                      <p>Ajoutez vos expériences, disponibilités et qualifications.</p>
                    </div>
                  </div>

                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div>
                      <h4>Consultez les offres</h4>
                      <p>Parcourez les missions selon le lieu et la période.</p>
                    </div>
                  </div>

                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div>
                      <h4>Candidatez rapidement</h4>
                      <p>Postulez facilement aux offres qui vous intéressent.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="offres" className="offers-section">
              <div className="section-header">
                <span className="section-kicker">Offres récentes</span>
                <h2>Des opportunités concrètes</h2>
                <p>Découvrez les dernières missions publiées sur la plateforme.</p>
              </div>

              <div className="offers-grid">
                {sejours.slice(0, 6).map((s) => (
                  <article key={s.id} className="offer-card">
                    <div className="offer-top">
                      <span className="offer-location">📍 {s.lieu}</span>
                    </div>

                    <h3>{s.titre}</h3>
                    <p className="offer-structure">{s.nom_structure || 'Structure partenaire'}</p>
                    <p className="offer-description">
                      {s.description || 'Mission d’animation à découvrir sur BafaConnect.'}
                    </p>

                    <button className="btn-primary">Voir l’offre</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="final-cta">
              <div className="final-cta-card">
                <span className="section-kicker">Rejoindre BafaConnect</span>
                <h2>Prêt à passer à l’action ?</h2>
                <p>
                  Que vous recrutiez pour un séjour ou que vous cherchiez votre prochaine mission,
                  BafaConnect vous aide à aller plus vite.
                </p>

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
        ) : (
          <div className="dashboard-container">
            <div className="card">
              <Profile />
            </div>

            {/* Onglets de navigation du dashboard */}
            <div className="dashboard-tabs">
              <button
                className={`dashboard-tab ${onglet === 'dashboard' ? 'active' : ''}`}
                onClick={() => setOnglet('dashboard')}
              >
                {role === 'animateur' ? '🎒 Mes missions' : '🏕️ Recrutement'}
              </button>
              <button
                className={`dashboard-tab ${onglet === 'messages' ? 'active' : ''}`}
                onClick={() => { setOnglet('messages'); setMessageDest(null); }}
              >
                💬 Messages
              </button>
            </div>

            {onglet === 'messages' ? (
              <div className="card">
                <Messagerie destinataireInitial={messageDest} />
              </div>
            ) : role === 'animateur' ? (
              <div className="view-section">
                <h2 className="title-center">Annonces disponibles</h2>

                {postuleNotif && (
                  <div className={`profile-alert ${postuleNotif.includes('succès') ? 'profile-alert-success' : 'profile-alert-error'}`}>
                    {postuleNotif}
                  </div>
                )}

                <div className="annonces-grid">
                  {sejours.map((s) => (
                    <div key={s.id} className="card item-card">
                      <div className="badge">📍 {s.lieu}</div>
                      <h3>{s.titre}</h3>
                      <p className="subtitle">{s.nom_structure || 'Structure partenaire'}</p>
                      {s.date_debut && (
                        <p className="offer-dates">
                          🗓️ {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                          {s.date_fin && ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`}
                        </p>
                      )}
                      {s.nombre_postes && (
                        <p className="offer-postes">👥 {s.nombre_postes} poste{s.nombre_postes > 1 ? 's' : ''}</p>
                      )}
                      <p className="description">{s.description}</p>
                      <button
                        className="btn-primary"
                        onClick={() => handlePostuler(s.id)}
                      >
                        Postuler au séjour
                      </button>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <MesCandidatures onContacter={handleContacter} />
                </div>
              </div>
            ) : (
              <div className="view-section">
                <h2 className="title-center text-orange">Espace Recrutement</h2>

                <div className="card action-card">
                  <CreerAnnonce onAnnonceCreated={fetchSejours} />
                </div>

                <div className="card">
                  <GestionCandidatures onContacter={handleContacter} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App