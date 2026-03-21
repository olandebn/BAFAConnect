import { useEffect, useState } from 'react';
import api from './api/axios';
import AvisSection from './AvisSection';

function GestionCandidatures({ onContacter }) {
  const [candidats, setCandidats] = useState([]);
  const [avisOuvert, setAvisOuvert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCandidats = () => {
    setIsLoading(true);
    api.get('/recrutement/candidats-recus')
      .then(res => setCandidats(res.data))
      .catch(err => {
        console.error("Erreur", err);
        setError("Impossible de charger les candidatures.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCandidats();
  }, []);

  const handleAction = async (id, nouveauStatut) => {
    setActionLoading(id);
    setError('');
    try {
      await api.patch(`/recrutement/candidatures/${id}`, { statut: nouveauStatut });
      fetchCandidats();
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoading(null);
    }
  };

  const statutLabel = (statut) => {
    if (statut === 'acceptée' || statut === 'acceptee') return { label: 'Acceptée', cls: 'statut-accepte' };
    if (statut === 'refusée' || statut === 'refusee') return { label: 'Refusée', cls: 'statut-refuse' };
    return { label: 'En attente', cls: 'statut-attente' };
  };

  const exportCSV = () => {
    const header = ['Candidat', 'Séjour', 'Statut', 'Date candidature']
    const rows = candidats.map(c => [
      c.candidat_nom || 'Anonyme',
      c.sejour_titre || '—',
      c.statut || '—',
      c.date_candidature ? new Date(c.date_candidature).toLocaleDateString('fr-FR') : '—'
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidatures_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    // Grouper par séjour
    const grouped = {}
    candidats.forEach(c => {
      const titre = c.sejour_titre || 'Séjour sans titre'
      if (!grouped[titre]) grouped[titre] = []
      grouped[titre].push(c)
    })

    const statutColor = (s) => {
      if (s === 'acceptée' || s === 'acceptee') return '#16a34a'
      if (s === 'refusée' || s === 'refusee') return '#dc2626'
      return '#d97706'
    }
    const statutText = (s) => {
      if (s === 'acceptée' || s === 'acceptee') return 'Acceptée'
      if (s === 'refusée' || s === 'refusee') return 'Refusée'
      return 'En attente'
    }

    const sections = Object.entries(grouped).map(([titre, cands]) => `
      <div class="annonce-section">
        <div class="annonce-title">📋 ${titre}</div>
        <table>
          <thead>
            <tr>
              <th>Candidat</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${cands.map(c => `
              <tr>
                <td>${c.candidat_nom || 'Anonyme'}</td>
                <td style="color:${statutColor(c.statut)};font-weight:600">${statutText(c.statut)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size:0.8rem;color:#666;margin-top:6px">
          Total : ${cands.length} candidature${cands.length > 1 ? 's' : ''}
          · ${cands.filter(c => c.statut === 'acceptée' || c.statut === 'acceptee').length} acceptée${cands.filter(c => c.statut === 'acceptée' || c.statut === 'acceptee').length !== 1 ? 's' : ''}
        </p>
      </div>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Candidatures — BafaConnect</title>
  <style>
    body{font-family:Arial,sans-serif;padding:28px;color:#1a1a1a;max-width:800px;margin:0 auto}
    h1{color:#f97316;font-size:1.5rem;margin-bottom:4px}
    .meta{color:#6b7280;font-size:0.82rem;margin-bottom:24px;border-bottom:1px solid #e5e7eb;padding-bottom:12px}
    .annonce-section{margin-top:24px}
    .annonce-title{font-size:1.05rem;font-weight:700;padding-bottom:6px;border-bottom:2px solid #f97316;margin-bottom:10px}
    table{width:100%;border-collapse:collapse}
    th{background:#f97316;color:#fff;padding:8px 14px;text-align:left;font-size:0.82rem}
    td{padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:0.85rem}
    tr:nth-child(even) td{background:#fafafa}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <h1>📩 Candidatures reçues</h1>
  <div class="meta">
    BafaConnect · Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} · ${candidats.length} candidature${candidats.length > 1 ? 's' : ''} au total
  </div>
  ${sections}
</body>
</html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 400)
  };

  return (
    <div className="candidatures-section">
      <div className="candidatures-title-row">
        <h2 className="candidatures-title">📩 Candidatures reçues</h2>
        {candidats.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-export-pdf" onClick={exportPDF} title="Exporter en PDF">
              📄 PDF
            </button>
            <button className="btn-export-pdf" onClick={exportCSV} title="Exporter en CSV" style={{ background: '#16a34a' }}>
              📊 CSV
            </button>
          </div>
        )}
      </div>

      {error && <div className="profile-alert profile-alert-error">{error}</div>}

      {isLoading ? (
        <p className="candidatures-empty">Chargement...</p>
      ) : candidats.length === 0 ? (
        <p className="candidatures-empty">Aucune candidature reçue pour le moment.</p>
      ) : (
        <div className="candidatures-list">
          {candidats.map(c => {
            const { label, cls } = statutLabel(c.statut);
            const loading = actionLoading === c.candidature_id;

            return (
              <div key={c.candidature_id}>
                <div className="candidature-item candidature-item-directeur">
                  <div className="candidature-info">
                    <h4 className="candidature-titre">{c.candidat_nom || 'Anonyme'}</h4>
                    <p className="candidature-lieu">Postule pour : <em>{c.sejour_titre}</em></p>
                    <span className={`candidature-statut-tag ${cls}`}>{label}</span>
                  </div>

                  <div className="candidature-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAction(c.candidature_id, 'acceptée')}
                      disabled={loading || c.statut === 'acceptée' || c.statut === 'acceptee'}
                    >
                      {loading ? '...' : 'Accepter'}
                    </button>
                    <button
                      className="btn-refuse"
                      onClick={() => handleAction(c.candidature_id, 'refusée')}
                      disabled={loading || c.statut === 'refusée' || c.statut === 'refusee'}
                    >
                      {loading ? '...' : 'Refuser'}
                    </button>
                    {onContacter && (
                      <button
                        className="btn-contacter"
                        onClick={() => onContacter({ id: c.animateur_id, nom: c.candidat_nom, role: 'animateur' })}
                      >
                        💬 Contacter
                      </button>
                    )}
                    {(c.statut === 'acceptée' || c.statut === 'acceptee') && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        onClick={() => setAvisOuvert(avisOuvert === c.animateur_id ? null : c.animateur_id)}
                      >
                        ⭐ Avis
                      </button>
                    )}
                  </div>
                </div>
                {avisOuvert === c.animateur_id && (
                  <div style={{ marginTop: 12 }}>
                    <AvisSection cibleId={c.animateur_id} canLeaveAvis={true} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GestionCandidatures;
