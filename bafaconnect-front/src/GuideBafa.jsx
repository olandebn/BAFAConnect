import { useState } from 'react'

const ETAPES = [
  {
    num: 1,
    icon: '📚',
    titre: 'Session de formation générale',
    duree: '8 jours minimum',
    description: 'C\'est le point de départ. Tu apprends les bases de l\'animation, la pédagogie, la sécurité et la vie collective. Se déroule dans un centre de formation agréé.',
    couleur: '#6366f1',
  },
  {
    num: 2,
    icon: '🏕️',
    titre: 'Stage pratique',
    duree: '14 jours minimum',
    description: 'Tu pars encadrer un vrai séjour (colonie, centre de loisirs, séjour ados…) sous la responsabilité d\'un directeur. C\'est ici que tu mets en pratique ce que tu as appris.',
    couleur: '#10b981',
  },
  {
    num: 3,
    icon: '🎓',
    titre: 'Session d\'approfondissement',
    duree: '6 jours minimum',
    description: 'Tu reviens en formation pour approfondir une thématique (sport, nature, culture, handicap…). Tu valides tes acquis et obtiens ton BAFA définitif.',
    couleur: '#f59e0b',
  },
]

const FINANCEMENTS = [
  {
    icon: '🏛️',
    nom: 'CAF (Caisse d\'Allocations Familiales)',
    montant: 'jusqu\'à 200€',
    detail: 'Aide versée sous conditions de ressources par ta CAF locale. À demander avant le départ en formation.',
    lien: 'https://www.caf.fr',
  },
  {
    icon: '🎫',
    nom: 'ANCV (Chèques-Vacances)',
    montant: 'variable',
    detail: 'Si tes parents ont des chèques-vacances via leur employeur, ils peuvent être utilisés pour financer le BAFA.',
    lien: 'https://www.ancv.com',
  },
  {
    icon: '🏢',
    nom: 'Conseil Régional',
    montant: 'jusqu\'à 200€',
    detail: 'Beaucoup de régions proposent une aide spécifique BAFA. Renseigne-toi sur le site de ta région.',
    lien: 'https://www.regions-de-france.fr',
  },
  {
    icon: '🤝',
    nom: 'MSA (secteur agricole)',
    montant: 'jusqu\'à 150€',
    detail: 'Si tes parents relèvent du régime agricole, la MSA peut participer au financement.',
    lien: 'https://www.msa.fr',
  },
]

const ORGANISMES = [
  {
    nom: 'UCPA',
    type: 'Sport & plein air',
    description: 'Spécialiste du sport et de la nature, formations dynamiques avec approfondissements outdoor.',
    lien: 'https://www.ucpa.com',
    logo: '🏔️',
  },
  {
    nom: 'UFCV',
    type: 'Généraliste',
    description: 'Un des plus grands organismes de formation BAFA/BAFD en France, présent dans toutes les régions.',
    lien: 'https://www.ufcv.fr',
    logo: '🎯',
  },
  {
    nom: 'Scouts et Guides de France',
    type: 'Scoutisme',
    description: 'Formation dans l\'esprit scout : vie en communauté, respect de la nature, engagement citoyen.',
    lien: 'https://www.sgdf.fr',
    logo: '⚜️',
  },
  {
    nom: 'Ligue de l\'Enseignement',
    type: 'Laïc & citoyen',
    description: 'Formations axées sur les valeurs républicaines, l\'éducation populaire et la citoyenneté.',
    lien: 'https://www.laligue.org',
    logo: '📖',
  },
  {
    nom: 'CEMEA',
    type: 'Pédagogie active',
    description: 'Pionniers de l\'éducation nouvelle, formations très axées sur la pédagogie et l\'autonomie.',
    lien: 'https://www.cemea.asso.fr',
    logo: '💡',
  },
  {
    nom: 'Léo Lagrange',
    type: 'Éducation populaire',
    description: 'Réseau national avec un fort ancrage territorial, formations accessibles et accompagnées.',
    lien: 'https://www.leolagrange.org',
    logo: '🌍',
  },
]

const DOCS = [
  {
    icon: '✅',
    titre: 'Checklist candidature BAFA',
    description: 'Tous les documents à rassembler avant de s\'inscrire en formation générale.',
    pdfUrl: '/docs/checklist-bafa.pdf',
    apercu: [
      '📋 Documents obligatoires (pièce d\'identité, justificatif de domicile…)',
      '📝 Formulaires à remplir (dossier d\'inscription, demandes d\'aides)',
      '💡 Informations pratiques (âge minimum, coût estimé, agrément)',
      '✅ Checklist après la formation générale (trouver un stage, etc.)',
    ],
  },
  {
    icon: '💶',
    titre: 'Guide financement BAFA',
    description: 'Toutes les aides disponibles pour financer ta formation, cumulables entre elles.',
    pdfUrl: '/docs/guide-financement-bafa.pdf',
    apercu: [
      '💰 Coût total estimé : 700€ – 1 200€',
      '🏛️ CAF : jusqu\'à 200€ (demander avant la formation)',
      '🗺️ Conseil Régional : jusqu\'à 200€ selon ta région',
      '📊 Exemple de financement : reste à payer ~450€ après aides',
    ],
  },
  {
    icon: '⚖️',
    titre: 'Droits & devoirs de l\'animateur',
    description: 'Ce que tu dois savoir avant de partir en séjour : responsabilités légales, temps de travail, rémunération.',
    pdfUrl: '/docs/droits-animateur-bafa.pdf',
    apercu: [
      '📄 Statut juridique : Contrat d\'Engagement Éducatif (CEE)',
      '💵 Rémunération minimum : ~23€ brut/jour en 2024',
      '👶 Ratio d\'encadrement légal (1 pour 8 ou 1 pour 12)',
      '🚨 Que faire en cas d\'accident, désaccord ou non-paiement',
    ],
  },
]

function GuideBafa() {
  const [onglet, setOnglet] = useState('parcours')
  const [docOuvert, setDocOuvert] = useState(null)

  return (
    <div className="guide-bafa-wrapper">
      {/* Hero */}
      <div className="guide-bafa-hero">
        <div className="guide-bafa-hero-badge">🏅 Devenir animateur</div>
        <h1 className="guide-bafa-hero-title">Tout savoir sur le BAFA</h1>
        <p className="guide-bafa-hero-sub">
          Le Brevet d'Aptitude aux Fonctions d'Animateur te permet d'encadrer des enfants et ados
          lors de séjours et centres de loisirs. Voici tout ce qu'il faut savoir.
        </p>
        <div className="guide-bafa-hero-stats">
          <div className="guide-bafa-stat"><span className="guide-bafa-stat-num">17 ans</span><span>âge minimum</span></div>
          <div className="guide-bafa-stat"><span className="guide-bafa-stat-num">28 jours</span><span>de formation</span></div>
          <div className="guide-bafa-stat"><span className="guide-bafa-stat-num">~700€</span><span>coût moyen</span></div>
          <div className="guide-bafa-stat"><span className="guide-bafa-stat-num">10 ans</span><span>de validité</span></div>
        </div>
      </div>

      {/* Onglets */}
      <div className="guide-bafa-tabs">
        {[
          { id: 'parcours', label: '📋 Le parcours' },
          { id: 'financement', label: '💶 Financement' },
          { id: 'organismes', label: '🏢 Organismes' },
          { id: 'documents', label: '📄 Documents' },
        ].map(t => (
          <button
            key={t.id}
            className={`guide-bafa-tab ${onglet === t.id ? 'active' : ''}`}
            onClick={() => setOnglet(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="guide-bafa-content">

        {/* PARCOURS */}
        {onglet === 'parcours' && (
          <div>
            <p className="guide-bafa-intro">
              Le BAFA se valide en <strong>3 étapes</strong> qui doivent être réalisées dans l'ordre.
              L'ensemble du parcours doit être complété en <strong>18 mois</strong> maximum.
            </p>
            <div className="guide-bafa-etapes">
              {ETAPES.map((e, i) => (
                <div key={e.num} className="guide-bafa-etape">
                  <div className="guide-bafa-etape-num" style={{ background: e.couleur }}>{e.num}</div>
                  {i < ETAPES.length - 1 && <div className="guide-bafa-etape-trait" />}
                  <div className="guide-bafa-etape-card">
                    <div className="guide-bafa-etape-icon">{e.icon}</div>
                    <div>
                      <div className="guide-bafa-etape-titre">{e.titre}</div>
                      <div className="guide-bafa-etape-duree" style={{ color: e.couleur }}>⏱ {e.duree}</div>
                      <p className="guide-bafa-etape-desc">{e.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="guide-bafa-tip">
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <div>
                <strong>Pour le stage pratique, utilise BAFAConnect !</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Tous les séjours de la plateforme peuvent servir de stage pratique. Postule directement auprès des directeurs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FINANCEMENT */}
        {onglet === 'financement' && (
          <div>
            <p className="guide-bafa-intro">
              Ces aides sont <strong>cumulables</strong> entre elles. Avec un peu d'organisation,
              tu peux réduire significativement le coût de ta formation.
            </p>
            <div className="guide-bafa-grid">
              {FINANCEMENTS.map(f => (
                <div key={f.nom} className="guide-bafa-financement-card">
                  <div className="guide-bafa-financement-top">
                    <span className="guide-bafa-financement-icon">{f.icon}</span>
                    <div>
                      <div className="guide-bafa-financement-nom">{f.nom}</div>
                      <div className="guide-bafa-financement-montant">{f.montant}</div>
                    </div>
                  </div>
                  <p className="guide-bafa-financement-detail">{f.detail}</p>
                  <a href={f.lien} target="_blank" rel="noopener noreferrer" className="guide-bafa-link">
                    Voir le site →
                  </a>
                </div>
              ))}
            </div>

            <div className="guide-bafa-tip" style={{ marginTop: 24 }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <strong>Important :</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  La plupart des aides doivent être demandées <strong>avant</strong> le début de ta formation.
                  Ne tarde pas à faire les démarches, certains organismes ont des délais de traitement d'un mois.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ORGANISMES */}
        {onglet === 'organismes' && (
          <div>
            <p className="guide-bafa-intro">
              Ces organismes sont <strong>agréés par l'État</strong> pour délivrer le BAFA.
              Les prix et les méthodes varient — n'hésite pas à comparer avant de choisir.
            </p>
            <div className="guide-bafa-grid">
              {ORGANISMES.map(o => (
                <div key={o.nom} className="guide-bafa-orga-card">
                  <div className="guide-bafa-orga-logo">{o.logo}</div>
                  <div>
                    <div className="guide-bafa-orga-nom">{o.nom}</div>
                    <div className="guide-bafa-orga-type">{o.type}</div>
                    <p className="guide-bafa-orga-desc">{o.description}</p>
                    <a href={o.lien} target="_blank" rel="noopener noreferrer" className="guide-bafa-link">
                      Visiter →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="guide-bafa-tip" style={{ marginTop: 24 }}>
              <span style={{ fontSize: '1.4rem' }}>🔍</span>
              <div>
                <strong>Trouver toutes les sessions agréées</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Le site officiel du gouvernement liste toutes les sessions disponibles par région et par date.
                </p>
                <a href="https://www.jeunes.gouv.fr/bafa-bafd" target="_blank" rel="noopener noreferrer" className="guide-bafa-link" style={{ display: 'inline-block', marginTop: 6 }}>
                  jeunes.gouv.fr/bafa-bafd →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {onglet === 'documents' && (
          <div>
            <p className="guide-bafa-intro">
              Ces documents PDF sont téléchargeables gratuitement. Ils t'aideront à te préparer et à connaître tes droits.
            </p>
            <div className="guide-bafa-docs">
              {DOCS.map(doc => (
                <div key={doc.titre} className="guide-bafa-doc-card">
                  <div className="guide-bafa-doc-icon">{doc.icon}</div>
                  <div className="guide-bafa-doc-body">
                    <div className="guide-bafa-doc-titre">{doc.titre}</div>
                    <p className="guide-bafa-doc-desc">{doc.description}</p>
                  </div>
                  <div className="guide-bafa-doc-actions">
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                      onClick={() => setDocOuvert(docOuvert?.titre === doc.titre ? null : doc)}
                    >
                      👁️ Aperçu
                    </button>
                    <a
                      href={doc.pdfUrl}
                      download
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '6px 12px', textDecoration: 'none' }}
                    >
                      ⬇️ Télécharger PDF
                    </a>
                  </div>
                  {docOuvert?.titre === doc.titre && (
                    <div className="guide-bafa-doc-preview">
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                        {doc.apercu.map((ligne, i) => (
                          <li key={i} style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{ligne}</li>
                        ))}
                      </ul>
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <a
                          href={doc.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="guide-bafa-link"
                          style={{ fontSize: '0.85rem' }}
                        >
                          Ouvrir le PDF complet →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA bas */}
      <div className="guide-bafa-cta">
        <div className="guide-bafa-cta-text">
          <h3>Tu as ton BAFA ? Trouve un séjour sur BAFAConnect</h3>
          <p>Des dizaines de directeurs cherchent des animateurs qualifiés. Crée ton profil et postule en quelques clics.</p>
        </div>
        <a href="?page=annonces" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
          Voir les séjours →
        </a>
      </div>
    </div>
  )
}

export default GuideBafa
