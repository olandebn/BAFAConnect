export default function AboutPage({ onNavigate }) {
  return (
    <div className="about-page">

      {/* Hero */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <span className="about-hero-tag">À propos</span>
          <h1 className="about-hero-title">La plateforme qui connecte<br />l'animation BAFA</h1>
          <p className="about-hero-desc">
            BafaConnect est née d'un constat simple : trouver un animateur qualifié ou une mission BAFA reste aujourd'hui trop compliqué, trop dispersé. Nous avons voulu créer l'outil qui manquait.
          </p>
        </div>
      </div>

      {/* Notre histoire */}
      <div className="about-section">
        <div className="about-section-inner">
          <div className="about-2col">
            <div>
              <h2 className="about-section-title">Notre histoire</h2>
              <p>
                BafaConnect est un projet fondé en 2026 par <strong>Olan Debruyne</strong>, 19 ans, animateur BAFA passionné par le monde de l'animation et de l'éducation populaire.
              </p>
              <p>
                Face à la difficulté des directeurs de trouver des animateurs disponibles et qualifiés — et des animateurs de trouver des missions qui correspondent à leur profil — l'idée s'est imposée : créer une plateforme dédiée, moderne et accessible.
              </p>
              <p>
                BafaConnect, c'est la rencontre entre la tech et l'animation sociale, au service des structures qui font vivre les séjours de vacances en France.
              </p>
            </div>
            <div className="about-stats-box">
              <div className="about-stat">
                <span className="about-stat-num">🎒</span>
                <span className="about-stat-label">Pour les animateurs</span>
                <span className="about-stat-desc">Trouvez des missions BAFA qui correspondent à vos disponibilités et compétences</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">🏕️</span>
                <span className="about-stat-label">Pour les directeurs</span>
                <span className="about-stat-desc">Recrutez des animateurs qualifiés rapidement, gérez vos candidatures en un endroit</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-num">🔒</span>
                <span className="about-stat-label">Sécurisé & gratuit</span>
                <span className="about-stat-desc">Plateforme 100 % gratuite, données hébergées en Europe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Valeurs */}
      <div className="about-section about-section-alt">
        <div className="about-section-inner">
          <h2 className="about-section-title" style={{ textAlign: 'center', marginBottom: 36 }}>Nos valeurs</h2>
          <div className="about-values-grid">
            {[
              { icon: '🤝', titre: 'Accessibilité', desc: 'Un outil gratuit et simple, accessible à toutes les structures, petites ou grandes.' },
              { icon: '🎯', titre: 'Pertinence', desc: 'Mise en relation ciblée selon les disponibilités, diplômes et localisations.' },
              { icon: '🔐', titre: 'Confiance', desc: 'Validation des diplômes, profils vérifiés, messagerie sécurisée.' },
              { icon: '⚡', titre: 'Réactivité', desc: 'Notifications en temps réel, réponses rapides, processus fluide.' },
            ].map((v, i) => (
              <div key={i} className="about-value-card">
                <div className="about-value-icon">{v.icon}</div>
                <h3 className="about-value-titre">{v.titre}</h3>
                <p className="about-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ce que propose la plateforme */}
      <div className="about-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Ce que propose BafaConnect</h2>
          <div className="about-features-list">
            {[
              { icon: '📋', titre: 'Profils complets', desc: 'Animateurs : diplômes, compétences, disponibilités, CV. Directeurs : présentation de la structure, séjours proposés.' },
              { icon: '🔍', titre: 'Recherche avancée', desc: 'Filtres par lieu, type de séjour, dates, nombre de postes disponibles, compatibilité des disponibilités.' },
              { icon: '📩', titre: 'Candidatures simplifiées', desc: 'Postuler en un clic, suivre l\'état de chaque candidature en temps réel.' },
              { icon: '💬', titre: 'Messagerie intégrée', desc: 'Échangez directement avec les directeurs ou animateurs depuis la plateforme.' },
              { icon: '⭐', titre: 'Système d\'avis', desc: 'Notes et avis entre animateurs et directeurs pour bâtir une communauté de confiance.' },
              { icon: '📅', titre: 'Calendrier des séjours', desc: 'Vue calendrier de tous les séjours disponibles pour planifier à l\'avance.' },
            ].map((f, i) => (
              <div key={i} className="about-feature-item">
                <span className="about-feature-icon">{f.icon}</span>
                <div>
                  <strong className="about-feature-titre">{f.titre}</strong>
                  <p className="about-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="about-cta">
        <h2>Rejoignez BafaConnect dès aujourd'hui</h2>
        <p>Gratuit, sans engagement, pour directeurs et animateurs.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary about-cta-btn" onClick={() => onNavigate && onNavigate('register')}>
            Créer un compte
          </button>
          <button className="btn-secondary about-cta-btn" onClick={() => onNavigate && onNavigate('contact')}>
            Nous contacter
          </button>
        </div>
      </div>

    </div>
  )
}
