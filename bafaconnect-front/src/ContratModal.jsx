import { useEffect, useState, useRef } from 'react';
import api from './api/axios';

function fmt(dateStr) {
  if (!dateStr) return '___________';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ContratModal({ candidatureId, onClose }) {
  const [contrat, setContrat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    api.get(`/candidatures/${candidatureId}/contrat`)
      .then(res => setContrat(res.data))
      .catch(err => setError(err.response?.data?.error || 'Impossible de charger le contrat.'))
      .finally(() => setLoading(false));
  }, [candidatureId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="contrat-overlay">
      <div className="contrat-modal">
        <p className="candidatures-empty">Chargement du contrat...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="contrat-overlay" onClick={onClose}>
      <div className="contrat-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-alert profile-alert-error">{error}</div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 12 }}>Fermer</button>
      </div>
    </div>
  );

  const diplomes = Array.isArray(contrat.animateur_diplomes)
    ? contrat.animateur_diplomes.join(', ')
    : contrat.animateur_diplomes || 'Non renseigné';

  return (
    <>
      {/* Overlay (masqué à l'impression) */}
      <div className="contrat-overlay no-print" onClick={onClose} />

      {/* Barre d'actions (masquée à l'impression) */}
      <div className="contrat-actions-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📄 Convention d'engagement — {contrat.sejour_titre}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handlePrint}>🖨️ Imprimer / Enregistrer PDF</button>
          <button className="btn-secondary" onClick={onClose}>✕ Fermer</button>
        </div>
      </div>

      {/* Document imprimable */}
      <div className="contrat-document" ref={printRef}>
        {/* En-tête */}
        <div className="contrat-header">
          <div className="contrat-logo">🏕️ BafaConnect</div>
          <div className="contrat-header-right">
            <div className="contrat-ref">Réf. : BC-{contrat.candidature_id?.slice(0, 8).toUpperCase()}</div>
            <div className="contrat-date-gen">Générée le {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <h1 className="contrat-titre">Convention d'Engagement Animateur</h1>
        <p className="contrat-sous-titre">
          Dans le cadre d'un séjour avec hébergement — Brevet d'Aptitude aux Fonctions d'Animateur
        </p>

        <div className="contrat-divider" />

        {/* Préambule */}
        <p className="contrat-preambule">
          Entre les soussignés, il a été convenu et arrêté ce qui suit, conformément aux dispositions
          légales en vigueur relatives aux accueils collectifs de mineurs et à la réglementation
          applicable aux animateurs titulaires du BAFA ou en formation.
        </p>

        {/* Parties */}
        <div className="contrat-parties">

          {/* Partie 1 : Structure */}
          <div className="contrat-partie">
            <div className="contrat-partie-header">
              <span className="contrat-partie-num">1</span>
              <h2>La Structure organisatrice</h2>
            </div>
            <div className="contrat-grid">
              <div className="contrat-field">
                <label>Nom de la structure</label>
                <div className="contrat-value">{contrat.nom_structure || '___________________________'}</div>
              </div>
              <div className="contrat-field">
                <label>Type de structure</label>
                <div className="contrat-value">{contrat.type_structure || '___________________________'}</div>
              </div>
              <div className="contrat-field">
                <label>Ville</label>
                <div className="contrat-value">{contrat.structure_ville || '___________________________'}</div>
              </div>
              <div className="contrat-field">
                <label>Responsable (directeur)</label>
                <div className="contrat-value">{contrat.directeur_email}</div>
              </div>
            </div>
          </div>

          {/* Partie 2 : Animateur */}
          <div className="contrat-partie">
            <div className="contrat-partie-header">
              <span className="contrat-partie-num">2</span>
              <h2>L'Animateur·rice</h2>
            </div>
            <div className="contrat-grid">
              <div className="contrat-field">
                <label>Nom et prénom</label>
                <div className="contrat-value">{contrat.animateur_nom || '___________________________'}</div>
              </div>
              <div className="contrat-field">
                <label>Email</label>
                <div className="contrat-value">{contrat.animateur_email}</div>
              </div>
              <div className="contrat-field">
                <label>Ville de résidence</label>
                <div className="contrat-value">{contrat.animateur_ville || '___________________________'}</div>
              </div>
              <div className="contrat-field">
                <label>Diplômes / Formation</label>
                <div className="contrat-value">{diplomes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Séjour */}
        <div className="contrat-partie">
          <div className="contrat-partie-header">
            <span className="contrat-partie-num">3</span>
            <h2>Le Séjour concerné</h2>
          </div>
          <div className="contrat-grid">
            <div className="contrat-field">
              <label>Intitulé du séjour</label>
              <div className="contrat-value">{contrat.sejour_titre}</div>
            </div>
            <div className="contrat-field">
              <label>Type de séjour</label>
              <div className="contrat-value">{contrat.sejour_type || '___________________________'}</div>
            </div>
            <div className="contrat-field">
              <label>Lieu</label>
              <div className="contrat-value">{contrat.sejour_lieu || '___________________________'}</div>
            </div>
            <div className="contrat-field">
              <label>Date de début</label>
              <div className="contrat-value">{fmt(contrat.date_debut)}</div>
            </div>
            <div className="contrat-field">
              <label>Date de fin</label>
              <div className="contrat-value">{fmt(contrat.date_fin)}</div>
            </div>
            <div className="contrat-field">
              <label>Postes disponibles</label>
              <div className="contrat-value">{contrat.nombre_postes || '___'}</div>
            </div>
          </div>
          {contrat.sejour_description && (
            <div className="contrat-field" style={{ marginTop: 12 }}>
              <label>Description du séjour</label>
              <div className="contrat-value contrat-value-text">{contrat.sejour_description}</div>
            </div>
          )}
        </div>

        {/* Engagements */}
        <div className="contrat-partie">
          <div className="contrat-partie-header">
            <span className="contrat-partie-num">4</span>
            <h2>Engagements réciproques</h2>
          </div>
          <div className="contrat-engagements">
            <div className="contrat-engagement-col">
              <h3>La structure s'engage à :</h3>
              <ul>
                <li>Accueillir l'animateur·rice dans des conditions conformes à la réglementation</li>
                <li>Fournir le logement et la restauration pendant la durée du séjour</li>
                <li>Verser une indemnité ou rémunération convenue entre les parties</li>
                <li>Déclarer le séjour auprès des autorités compétentes (DRAJES)</li>
                <li>Encadrer l'animateur·rice en cas de formation BAFA en cours</li>
              </ul>
            </div>
            <div className="contrat-engagement-col">
              <h3>L'animateur·rice s'engage à :</h3>
              <ul>
                <li>Assurer l'encadrement des mineurs avec sérieux et bienveillance</li>
                <li>Respecter le projet pédagogique de la structure</li>
                <li>Être présent·e pour toute la durée du séjour sauf accord préalable</li>
                <li>Signaler tout incident à la direction du séjour</li>
                <li>Respecter le règlement intérieur de la structure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Indemnité */}
        <div className="contrat-partie">
          <div className="contrat-partie-header">
            <span className="contrat-partie-num">5</span>
            <h2>Conditions financières</h2>
          </div>
          <div className="contrat-grid">
            <div className="contrat-field">
              <label>Indemnité journalière ou forfait</label>
              <div className="contrat-value contrat-value-blank">___________________________</div>
            </div>
            <div className="contrat-field">
              <label>Mode de règlement</label>
              <div className="contrat-value contrat-value-blank">___________________________</div>
            </div>
            <div className="contrat-field">
              <label>Frais de transport pris en charge</label>
              <div className="contrat-value contrat-value-blank">☐ Oui &nbsp;&nbsp; ☐ Non &nbsp;&nbsp; ☐ Partiel</div>
            </div>
            <div className="contrat-field">
              <label>Autres avantages</label>
              <div className="contrat-value contrat-value-blank">___________________________</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="contrat-partie">
          <div className="contrat-partie-header">
            <span className="contrat-partie-num">6</span>
            <h2>Signatures</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>
            Fait en deux exemplaires originaux, à _____________, le ___________
          </p>
          <div className="contrat-signatures">
            <div className="contrat-signature-bloc">
              <p className="contrat-signature-titre">Pour la structure</p>
              <p className="contrat-signature-nom">{contrat.nom_structure || 'La structure organisatrice'}</p>
              <div className="contrat-signature-zone">
                <span>Signature et cachet</span>
              </div>
            </div>
            <div className="contrat-signature-bloc">
              <p className="contrat-signature-titre">L'animateur·rice</p>
              <p className="contrat-signature-nom">{contrat.animateur_nom || 'L\'animateur·rice'}</p>
              <div className="contrat-signature-zone">
                <span>Signature précédée de "Lu et approuvé"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="contrat-footer">
          <div className="contrat-footer-logo">🏕️ BafaConnect</div>
          <p>Document généré automatiquement via BafaConnect — plateforme de mise en relation directeurs et animateurs BAFA</p>
          <p>Ce document doit être complété, signé et conservé par chaque partie. Il ne se substitue pas à un contrat de travail.</p>
        </div>
      </div>
    </>
  );
}

export default ContratModal;
