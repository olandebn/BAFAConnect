import { useEffect, useState, useCallback } from 'react'
import api from './api/axios'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function CalendrierSejours({ onPostuler, onContacter }) {
  const role = localStorage.getItem('role')
  const now = new Date()
  const [mois, setMois] = useState(now.getMonth())
  const [annee, setAnnee] = useState(now.getFullYear())
  const [sejours, setSejours] = useState([])
  const [candidatures, setCandidatures] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  // Disponibilités animateur
  const [plages, setPlages] = useState([{ debut: '', fin: '' }])
  const [dispoSaving, setDispoSaving] = useState(false)
  const [dispoMsg, setDispoMsg] = useState('')
  const [dispoOpen, setDispoOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (role === 'directeur') {
        const res = await api.get('/sejours/mes-sejours')
        setSejours(res.data)
      } else {
        const [sejoursRes, candidaturesRes, profilRes] = await Promise.all([
          api.get('/sejours'),
          api.get('/candidatures/me'),
          api.get('/profiles/me').catch(() => ({ data: {} }))
        ])
        setSejours(sejoursRes.data)
        const map = {}
        for (const c of candidaturesRes.data) map[c.sejour_id] = c.statut
        setCandidatures(map)
        // Charger les dispos existantes
        const rawDispo = profilRes.data?.disponibilites
        if (rawDispo) {
          try {
            const d = typeof rawDispo === 'string' ? JSON.parse(rawDispo) : rawDispo
            const loaded = Array.isArray(d) ? d : (d?.debut ? [d] : [{ debut: '', fin: '' }])
            setPlages(loaded.length > 0 ? loaded : [{ debut: '', fin: '' }])
          } catch {}
        }
      }
    } catch (err) {
      console.error('Erreur calendrier :', err)
    } finally {
      setLoading(false)
    }
  }, [role])

  const saveDispo = async () => {
    setDispoSaving(true)
    setDispoMsg('')
    try {
      const filtered = plages.filter(p => p.debut)
      await api.post('/profiles/me', { disponibilites: filtered })
      setDispoMsg('✅ Disponibilités enregistrées !')
    } catch {
      setDispoMsg('❌ Erreur lors de la sauvegarde.')
    } finally {
      setDispoSaving(false)
      setTimeout(() => setDispoMsg(''), 3000)
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const prevMois = () => {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1) }
    else setMois(m => m - 1)
    setSelected(null)
  }

  const nextMois = () => {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1) }
    else setMois(m => m + 1)
    setSelected(null)
  }

  // Séjours qui chevauchent ce mois
  const debutMois = new Date(annee, mois, 1)
  const finMois = new Date(annee, mois + 1, 0, 23, 59, 59)
  const nbJours = finMois.getDate()

  const sejoursDuMois = sejours.filter(s => {
    if (!s.date_debut) return false
    const debut = new Date(s.date_debut)
    const fin = s.date_fin ? new Date(s.date_fin) : debut
    return debut <= finMois && fin >= debutMois
  })

  const getStatut = (s) => {
    if (role === 'directeur') return 'directeur'
    return candidatures[s.id] || 'libre'
  }

  const getBarStyle = (s) => {
    const debut = new Date(s.date_debut)
    const fin = s.date_fin ? new Date(s.date_fin) : debut

    const startClamped = debut < debutMois ? debutMois : debut
    const endClamped = fin > finMois ? finMois : fin

    const startDay = startClamped.getDate() - 1  // 0-indexed
    const endDay = endClamped.getDate() - 1

    const leftPct = (startDay / nbJours) * 100
    const widthPct = ((endDay - startDay + 1) / nbJours) * 100

    return { left: `${leftPct}%`, width: `${Math.max(widthPct, 3)}%` }
  }

  const getColor = (statut) => {
    switch (statut) {
      case 'directeur': return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
      case 'acceptée':
      case 'acceptee': return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' }
      case 'refusée':
      case 'refusee': return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' }
      case 'en attente': return { bg: '#fef9c3', border: '#eab308', text: '#854d0e' }
      default: return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' }
    }
  }

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'directeur': return 'Mon séjour'
      case 'acceptée':
      case 'acceptee': return '✅ Accepté'
      case 'refusée':
      case 'refusee': return '❌ Refusé'
      case 'en attente': return '⏳ En attente'
      default: return 'Postuler'
    }
  }

  const isPassee = (s) => s.date_fin ? new Date(s.date_fin) < now : new Date(s.date_debut) < now

  // Calcule le style d'une plage de dispo sur la règle du mois
  const getDispoBarStyle = (p) => {
    if (!p.debut) return null
    const debut = new Date(p.debut)
    const fin = p.fin ? new Date(p.fin) : debut
    if (debut > finMois || fin < debutMois) return null
    const startClamped = debut < debutMois ? debutMois : debut
    const endClamped = fin > finMois ? finMois : fin
    const startDay = startClamped.getDate() - 1
    const endDay = endClamped.getDate() - 1
    return {
      left: `${(startDay / nbJours) * 100}%`,
      width: `${Math.max(((endDay - startDay + 1) / nbJours) * 100, 2)}%`
    }
  }

  return (
    <div className="calendrier-wrapper">

      {/* ── Navigation mois ── */}
      <div className="calendrier-nav">
        <button className="calendrier-nav-btn" onClick={prevMois}>‹</button>
        <div className="calendrier-nav-title">
          <span className="calendrier-mois">{MOIS[mois]}</span>
          <span className="calendrier-annee">{annee}</span>
        </div>
        <button className="calendrier-nav-btn" onClick={nextMois}>›</button>
      </div>

      {/* ── Règle des jours ── */}
      <div className="calendrier-regle">
        {Array.from({ length: nbJours }, (_, i) => (
          <div key={i} className="calendrier-regle-jour">
            <span className={i + 1 === now.getDate() && mois === now.getMonth() && annee === now.getFullYear() ? 'regle-today' : ''}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* ── Bande disponibilités animateur ── */}
      {role === 'animateur' && (
        <div className="calendrier-dispo-track" title="Mes disponibilités">
          <span className="calendrier-dispo-label">Mes dispos</span>
          <div className="calendrier-dispo-barre-wrapper">
            {plages.map((p, i) => {
              const style = getDispoBarStyle(p)
              if (!style) return null
              return (
                <div
                  key={i}
                  className="calendrier-dispo-barre"
                  style={style}
                  title={`Disponible du ${p.debut}${p.fin ? ` au ${p.fin}` : ''}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Lignes séjours ── */}
      {loading ? (
        <div className="empty-state"><p>Chargement...</p></div>
      ) : sejoursDuMois.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 32 }}>
          <span>📅</span>
          <p>Aucun séjour ce mois-ci.</p>
        </div>
      ) : (
        <div className="calendrier-lignes">
          {sejoursDuMois.map(s => {
            const statut = getStatut(s)
            const col = getColor(statut)
            const passee = isPassee(s)
            const isSelected = selected === s.id
            return (
              <div key={s.id} className="calendrier-ligne">
                {/* Barre timeline */}
                <div className="calendrier-barre-track">
                  <div
                    className={`calendrier-barre ${passee ? 'calendrier-barre-passee' : ''}`}
                    style={{
                      ...getBarStyle(s),
                      background: col.bg,
                      borderColor: col.border,
                    }}
                    onClick={() => setSelected(isSelected ? null : s.id)}
                    title={s.titre}
                  >
                    <span className="calendrier-barre-label" style={{ color: col.text }}>
                      {s.titre}
                    </span>
                  </div>
                </div>

                {/* Détail au clic */}
                {isSelected && (
                  <div className="calendrier-detail" style={{ borderColor: col.border }}>
                    <div className="calendrier-detail-header">
                      <div>
                        <h4 className="calendrier-detail-titre">{s.titre}</h4>
                        <div className="calendrier-detail-meta">
                          {s.lieu && <span>📍 {s.lieu}</span>}
                          {s.type && <span className="annonce-item-type">{s.type}</span>}
                        </div>
                      </div>
                      <span
                        className="calendrier-statut-tag"
                        style={{ background: col.bg, color: col.text, borderColor: col.border }}
                      >
                        {getStatutLabel(statut)}
                      </span>
                    </div>

                    <div className="calendrier-detail-dates">
                      🗓️ {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                      {s.date_fin && ` → ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`}
                      {s.nombre_postes && ` · 👥 ${s.nombre_postes} poste${s.nombre_postes > 1 ? 's' : ''}`}
                      {role === 'directeur' && s.nb_candidatures !== undefined && (
                        <span> · 📩 {s.nb_candidatures} candidature{s.nb_candidatures != 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {s.description && (
                      <p className="calendrier-detail-desc">{s.description}</p>
                    )}

                    <div className="calendrier-detail-actions">
                      {role === 'animateur' && statut === 'libre' && !passee && onPostuler && (
                        <button className="btn-primary" style={{ fontSize: '0.85rem' }}
                          onClick={() => { onPostuler(s.id); setSelected(null) }}>
                          Postuler
                        </button>
                      )}
                      {role === 'animateur' && (statut === 'acceptée' || statut === 'acceptee') && onContacter && s.directeur_id && (
                        <button className="btn-secondary" style={{ fontSize: '0.85rem' }}
                          onClick={() => onContacter({ id: s.directeur_id, role: 'directeur' })}>
                          💬 Contacter le directeur
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Gestion disponibilités animateur ── */}
      {role === 'animateur' && (
        <div className="calendrier-dispo-panel">
          <button
            className="calendrier-dispo-toggle"
            onClick={() => setDispoOpen(o => !o)}
          >
            🗓️ Mes disponibilités {dispoOpen ? '▲' : '▼'}
          </button>

          {dispoOpen && (
            <div className="calendrier-dispo-form">
              <p className="calendrier-dispo-hint">
                Indiquez vos plages de disponibilité. Elles apparaîtront en vert sur le calendrier et permettront le matching automatique avec les annonces.
              </p>
              <div className="plages-list">
                {plages.map((p, i) => (
                  <div key={i} className="plage-row">
                    <input
                      type="date"
                      value={p.debut}
                      onChange={e => {
                        const updated = plages.map((pl, j) => j === i ? { ...pl, debut: e.target.value } : pl)
                        setPlages(updated)
                      }}
                    />
                    <span className="plage-sep">→</span>
                    <input
                      type="date"
                      value={p.fin}
                      onChange={e => {
                        const updated = plages.map((pl, j) => j === i ? { ...pl, fin: e.target.value } : pl)
                        setPlages(updated)
                      }}
                    />
                    {plages.length > 1 && (
                      <button
                        type="button"
                        className="btn-delete-sm"
                        onClick={() => setPlages(prev => prev.filter((_, j) => j !== i))}
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                  onClick={() => setPlages(prev => [...prev, { debut: '', fin: '' }])}
                >
                  + Ajouter une plage
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '5px 16px' }}
                  onClick={saveDispo}
                  disabled={dispoSaving}
                >
                  {dispoSaving ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
                {dispoMsg && <span style={{ fontSize: '0.82rem' }}>{dispoMsg}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Légende ── */}
      <div className="calendrier-legende">
        {role === 'directeur' ? (
          <span className="legende-item"><span className="legende-dot" style={{ background: '#3b82f6' }} />Mes séjours</span>
        ) : (
          <>
            <span className="legende-item"><span className="legende-dot" style={{ background: '#22c55e', opacity: 0.5 }} />Mes dispos</span>
            <span className="legende-item"><span className="legende-dot" style={{ background: '#94a3b8' }} />Séjour libre</span>
            <span className="legende-item"><span className="legende-dot" style={{ background: '#eab308' }} />En attente</span>
            <span className="legende-item"><span className="legende-dot" style={{ background: '#22c55e' }} />Accepté</span>
            <span className="legende-item"><span className="legende-dot" style={{ background: '#ef4444' }} />Refusé</span>
          </>
        )}
      </div>
    </div>
  )
}

export default CalendrierSejours
