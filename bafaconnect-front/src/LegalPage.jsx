import { useState } from 'react'

const SECTIONS = [
  { id: 'mentions', label: '📋 Mentions légales' },
  { id: 'cgu',      label: '📜 CGU' },
  { id: 'rgpd',     label: '🔒 Confidentialité' },
  { id: 'cookies',  label: '🍪 Cookies' },
]

export default function LegalPage({ initialTab = 'mentions' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1 className="legal-title">Informations légales</h1>
        <p className="legal-subtitle">Transparence et conformité réglementaire</p>
      </div>

      <div className="legal-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`legal-tab-btn ${tab === s.id ? 'active' : ''}`}
            onClick={() => setTab(s.id)}
          >{s.label}</button>
        ))}
      </div>

      <div className="legal-content">

        {/* ═══ MENTIONS LÉGALES ═══ */}
        {tab === 'mentions' && (
          <div className="legal-section">
            <h2>Mentions légales</h2>
            <p className="legal-date">Dernière mise à jour : mars 2026</p>

            <h3>1. Éditeur du site</h3>
            <p>
              Le site <strong>BafaConnect</strong> (accessible à l'adresse <strong>bafaconnect.fr</strong>) est édité par :<br /><br />
              <strong>Olan Debruyne</strong><br />
              Projet personnel — personne physique<br />
              Email : <a href="mailto:support@bafaconnect.fr">support@bafaconnect.fr</a><br />
            </p>
            <div className="legal-notice">
              ⚠️ Ce projet est en cours de structuration juridique. Les informations légales complètes (SIRET, adresse) seront mises à jour lors de l'immatriculation de la structure.
            </div>

            <h3>2. Hébergement</h3>
            <p>
              <strong>Frontend (interface utilisateur)</strong><br />
              Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
            </p>
            <p>
              <strong>Backend (serveur API)</strong><br />
              Render Services, Inc. — 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis<br />
              <a href="https://render.com" target="_blank" rel="noreferrer">render.com</a>
            </p>
            <p>
              <strong>Base de données</strong><br />
              Supabase Inc. — 970 Toa Payoh North, #07-04, Singapour<br />
              <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> — Serveurs hébergés dans l'Union Européenne (eu-west-1)
            </p>

            <h3>3. Propriété intellectuelle</h3>
            <p>
              L'ensemble du contenu de ce site (textes, graphiques, logos, icônes, code source) est la propriété exclusive de BafaConnect ou de ses partenaires. Toute reproduction, distribution ou utilisation sans autorisation préalable écrite est interdite.
            </p>

            <h3>4. Limitation de responsabilité</h3>
            <p>
              BafaConnect est une plateforme de mise en relation entre directeurs de séjours et animateurs BAFA. BafaConnect n'est pas partie aux contrats conclus entre les utilisateurs et décline toute responsabilité quant aux relations établies via la plateforme, aux contenus publiés par les utilisateurs, et aux dommages pouvant résulter de l'utilisation du service.
            </p>

            <h3>5. Droit applicable</h3>
            <p>
              Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </div>
        )}

        {/* ═══ CGU ═══ */}
        {tab === 'cgu' && (
          <div className="legal-section">
            <h2>Conditions Générales d'Utilisation</h2>
            <p className="legal-date">Dernière mise à jour : mars 2026 — Version 1.0</p>

            <h3>Article 1 — Objet</h3>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme BafaConnect, service de mise en relation entre directeurs de séjours de vacances et animateurs titulaires ou en cours d'obtention du diplôme BAFA (Brevet d'Aptitude aux Fonctions d'Animateur).
            </p>

            <h3>Article 2 — Accès au service</h3>
            <p>
              L'accès à BafaConnect est ouvert à toute personne physique majeure ou mineure avec autorisation parentale, disposant d'une adresse email valide. L'inscription est gratuite. En s'inscrivant, l'utilisateur accepte les présentes CGU dans leur intégralité.
            </p>

            <h3>Article 3 — Création de compte</h3>
            <p>
              L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription. Il est seul responsable de la confidentialité de ses identifiants de connexion. Tout accès frauduleux au compte d'un tiers est interdit et passible de poursuites.
            </p>

            <h3>Article 4 — Règles de conduite</h3>
            <p>Il est interdit de :</p>
            <ul>
              <li>Publier des annonces ou profils contenant des informations fausses ou trompeuses</li>
              <li>Harceler, menacer ou insulter d'autres utilisateurs</li>
              <li>Utiliser la plateforme à des fins commerciales non autorisées</li>
              <li>Tenter d'accéder frauduleusement aux données d'autres utilisateurs</li>
              <li>Publier des contenus illicites, diffamatoires ou portant atteinte à la vie privée</li>
              <li>Contourner les systèmes de sécurité de la plateforme</li>
            </ul>

            <h3>Article 5 — Rôle de BafaConnect</h3>
            <p>
              BafaConnect est un intermédiaire technique qui met en relation des directeurs et des animateurs. BafaConnect n'intervient pas dans la conclusion des contrats de travail entre les parties, ne vérifie pas l'authenticité des diplômes (hormis la fonctionnalité de téléchargement), et ne garantit pas la disponibilité permanente du service.
            </p>

            <h3>Article 6 — Contenu utilisateur</h3>
            <p>
              En publiant du contenu sur BafaConnect (profil, annonce, message, avis), l'utilisateur accorde à BafaConnect une licence non exclusive et gratuite pour afficher ce contenu dans le cadre du service. L'utilisateur reste propriétaire de ses contenus et est seul responsable de leur légalité.
            </p>

            <h3>Article 7 — Modération et sanctions</h3>
            <p>
              BafaConnect se réserve le droit de supprimer tout contenu ou compte ne respectant pas les présentes CGU, sans préavis ni indemnité. En cas d'abus grave, BafaConnect peut transmettre les informations nécessaires aux autorités compétentes.
            </p>

            <h3>Article 8 — Disponibilité du service</h3>
            <p>
              BafaConnect s'efforce d'assurer la disponibilité du service 24h/24, 7j/7, sans pouvoir garantir une disponibilité ininterrompue. Des maintenances peuvent être effectuées et entraîner des interruptions temporaires.
            </p>

            <h3>Article 9 — Modification des CGU</h3>
            <p>
              BafaConnect se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email en cas de modification substantielle. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.
            </p>

            <h3>Article 10 — Résiliation</h3>
            <p>
              L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son profil. BafaConnect peut résilier un compte en cas de violation des CGU. La résiliation entraîne la suppression des données personnelles conformément à la politique de confidentialité.
            </p>
          </div>
        )}

        {/* ═══ RGPD ═══ */}
        {tab === 'rgpd' && (
          <div className="legal-section">
            <h2>Politique de confidentialité</h2>
            <p className="legal-date">Dernière mise à jour : mars 2026 — Conforme au RGPD (UE 2016/679)</p>

            <h3>1. Responsable du traitement</h3>
            <p>
              <strong>Olan Debruyne</strong> — BafaConnect<br />
              Email : <a href="mailto:support@bafaconnect.fr">support@bafaconnect.fr</a>
            </p>

            <h3>2. Données collectées</h3>
            <p>BafaConnect collecte les données suivantes :</p>
            <table className="legal-table">
              <thead>
                <tr><th>Donnée</th><th>Finalité</th><th>Base légale</th></tr>
              </thead>
              <tbody>
                <tr><td>Adresse email</td><td>Identification, communication</td><td>Contrat</td></tr>
                <tr><td>Nom, prénom</td><td>Profil visible</td><td>Consentement</td></tr>
                <tr><td>Ville</td><td>Matching géographique</td><td>Consentement</td></tr>
                <tr><td>Diplômes, compétences</td><td>Mise en relation</td><td>Consentement</td></tr>
                <tr><td>CV, photo de profil</td><td>Profil professionnel</td><td>Consentement</td></tr>
                <tr><td>Messages échangés</td><td>Communication entre utilisateurs</td><td>Contrat</td></tr>
                <tr><td>Logs de connexion</td><td>Sécurité</td><td>Intérêt légitime</td></tr>
              </tbody>
            </table>

            <h3>3. Durée de conservation</h3>
            <p>
              Les données sont conservées pendant la durée d'activité du compte, puis supprimées dans un délai de <strong>30 jours</strong> après la clôture du compte. Les logs de connexion sont conservés <strong>12 mois</strong> pour des raisons de sécurité.
            </p>

            <h3>4. Partage des données</h3>
            <p>
              BafaConnect ne vend jamais vos données personnelles. Les données peuvent être partagées avec :
            </p>
            <ul>
              <li><strong>Vercel, Render, Supabase</strong> — hébergeurs techniques soumis au RGPD</li>
              <li><strong>Resend</strong> — service d'envoi d'emails transactionnels</li>
              <li><strong>Autorités légales</strong> — uniquement sur réquisition judiciaire</li>
            </ul>

            <h3>5. Vos droits</h3>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible</li>
              <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
            </ul>
            <p>
              Pour exercer vos droits : <a href="mailto:support@bafaconnect.fr">support@bafaconnect.fr</a><br />
              Délai de réponse : 30 jours maximum.<br />
              En cas de réclamation, vous pouvez saisir la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>
            </p>

            <h3>6. Sécurité</h3>
            <p>
              BafaConnect met en œuvre des mesures techniques et organisationnelles appropriées : chiffrement HTTPS, mots de passe hashés (bcrypt), tokens JWT, limitation du débit des requêtes (rate limiting), accès restreint aux données sensibles.
            </p>

            <h3>7. Transferts hors UE</h3>
            <p>
              Certains hébergeurs (Vercel, Render) sont basés aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne et/ou le cadre EU-US Data Privacy Framework.
            </p>
          </div>
        )}

        {/* ═══ COOKIES ═══ */}
        {tab === 'cookies' && (
          <div className="legal-section">
            <h2>Politique de cookies</h2>
            <p className="legal-date">Dernière mise à jour : mars 2026</p>

            <h3>1. Qu'est-ce qu'un cookie ?</h3>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site web. Il permet de mémoriser des informations entre vos visites.
            </p>

            <h3>2. Cookies utilisés par BafaConnect</h3>
            <table className="legal-table">
              <thead>
                <tr><th>Cookie</th><th>Type</th><th>Durée</th><th>Finalité</th></tr>
              </thead>
              <tbody>
                <tr><td>token</td><td>Fonctionnel</td><td>7 jours</td><td>Authentification — maintenir la session</td></tr>
                <tr><td>role</td><td>Fonctionnel</td><td>Session</td><td>Affichage de l'interface selon le rôle</td></tr>
                <tr><td>theme</td><td>Préférence</td><td>1 an</td><td>Mémoriser le mode clair/sombre</td></tr>
                <tr><td>userId</td><td>Fonctionnel</td><td>7 jours</td><td>Identification de l'utilisateur</td></tr>
                <tr><td>cookieConsent</td><td>Fonctionnel</td><td>1 an</td><td>Mémoriser votre choix de cookies</td></tr>
              </tbody>
            </table>

            <h3>3. Cookies tiers</h3>
            <p>
              BafaConnect <strong>n'utilise pas</strong> de cookies publicitaires ou de tracking tiers (Google Analytics, Facebook Pixel, etc.). Aucune donnée de navigation n'est partagée avec des régies publicitaires.
            </p>

            <h3>4. Gérer vos préférences</h3>
            <p>
              Les cookies fonctionnels sont nécessaires au bon fonctionnement du service et ne peuvent pas être désactivés. Vous pouvez supprimer tous les cookies depuis les paramètres de votre navigateur, ce qui entraînera votre déconnexion.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
