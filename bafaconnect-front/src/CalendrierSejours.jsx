import { useEffect, useState, useCallback } from 'react'
import api from './api/axios'

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDuree(debut, fin) {
  if (!debut || !fin || debut === fin) return null
  const d = Math.ceil((new Date(fin) - new Date(debut)) / (1000 * 60 * 60 * 24)) + 1
  return d > 0 ? d : null
}

function getTotalJours(plages) {
  return plages.filter(p => p.debut && p.fin).reduce((acc, p) => {
    const d = getDuree(p.debut, p.fin)
    return acc + (d || 0)
  }, 0)
}

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
  const [plages, setPlages] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [dispoSaving, setDispoSaving] = useState(false)
  const [dispoMsg, setDispoMsg] = useState('')
  const [addingDispo, setAddingDispo] = useState(false)
  const [newPlage, setNewPlage] = useState({ debut: '', fin: '' })

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
            const loaded = Array.isArray(d) ? d : (d?.debut ? [d] : [])
            setPlages(loaded)
          } catch {}
        }
      }
    } catch (err) {
      console.error('Erreur calendrier :', err)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { fetchData() }, [fetchData])

  const addPlage = () => {
    if (!newPlage.debut) return
    setPlages(prev => [...prev, { ...newPlage }])
    setNewPlage({ debut: '', fin: '' })
    setAddingDispo(false)
    setHasChanges(true)
  }

  const removePlage = (index) => {
    setPlages(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const saveDispo = async () => {
    setDispoSaving(true)
    setDispoMsg('')
    try {
      const filtered = plages.filter(p => p.debut)
      await api.post('/profiles/me', { disponibilites: filtered })
      setDispoMsg('success')
      setHasChanges(false)
    } catch {
      setDispoMsg('error')
    } finally {
      setDispoSaving(false)
      setTimeout(() => setDispoMsg(''), 4000)
    }
  }

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
    const startDay = startClamped.getDate() - 1
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

  const plagesFilled = plages.filter(p => p.debut)
  const totalJours = getTotalJours(plages)

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

      {/* ── Bande disponibilités animateur sur la règle ── */}
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
                <div className="calendrier-barre-track">
                  <div
                    className={`calendrier-barre ${passee ? 'calendrier-barre-passee' : ''}`}
                    style={{ ...getBarStyle(s), background: col.bg, borderColor: col.border }}
                    onClick={() => setSelected(isSelected ? null : s.id)}
                    title={s.titre}
                  >
                    <span className="calendrier-barre-label" style={{ color: col.text }}>
                      {s.titre}
                    </span>
                  </div>
                </div>

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
                      <span className="calendrier-statut-tag" style={{ background: col.bg, color: col.text, borderColor: col.border }}>
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

                    {s.description && <p className="calendrier-detail-desc">{s.description}</p>}

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

      {/* ── Section Disponibilités Pro (animateur seulement) ── */}
      {role === 'animateur' && (
        <div className="dispo-section">
          {/* Header */}
          <div className="dispo-section-header">
            <div className="dispo-section-title-group">
              <div className="dispo-section-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 className="dispo-section-title">Mes disponibilités</h3>
                <p className="dispo-section-subtitle">
                  {plagesFilled.length === 0
                    ? 'Aucune plage renseignée'
                    : `${plagesFilled.length} plage${plagesFilled.length > 1 ? 's' : ''}${totalJours > 0 ? ` · ${totalJours} jours disponibles` : ''}`
                  }
                </p>
              </div>
            </div>
            {!addingDispo && (
              <button className="dispo-add-btn" onClick={() => setAddingDispo(true)}>
                <span>+</span> Ajouter une plage
              </button>
            )}
          </div>

          {/* Liste des plages */}
          <div className="dispo-cards-list">
            {plagesFilled.length === 0 && !addingDispo ? (
              <div className="dispo-empty-state">
                <div className="dispo-empty-icon">🗓️</div>
                <p className="dispo-empty-title">Aucune disponibilité renseignée</p>
                <p className="dispo-empty-sub">Ajoutez vos plages pour apparaître dans le matching automatique et être trouvé par les directeurs.</p>
                <button className="dispo-add-btn dispo-add-btn-center" onClick={() => setAddingDispo(true)}>
                  + Ajouter ma première plage
                </button>
              </div>
            ) : (
              plagesFilled.map((p, i) => {
                const duree = getDuree(p.debut, p.fin)
                return (
                  <div key={i} className="dispo-card">
                    <div className="dispo-card-left">
                      <div className="dispo-card-dot" />
                    </div>
                    <div className="dispo-card-body">
                      <div className="dispo-card-dates">
                        <span className="dispo-card-date-start">{formatDate(p.debut)}</span>
                        {p.fin && p.fin !== p.debut && (
                          <>
                            <span className="dispo-card-arrow">→</span>
                            <span className="dispo-card-date-end">{formatDate(p.fin)}</span>
                          </>
                        )}
                      </div>
                      {duree && (
                        <span className="dispo-card-badge">{duree} jour{duree > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <button
                      className="dispo-card-delete"
                      onClick={() => removePlage(i)}
                      title="Supprimer cette plage"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Formulaire d'ajout */}
          {addingDispo && (
            <div className="dispo-add-form">
              <div className="dispo-add-form-header">
                <span className="dispo-add-form-title">Nouvelle plage de disponibilité</span>
              </div>
              <div className="dispo-add-form-fields">
                <div className="dispo-add-field">
                  <label className="dispo-add-label">Date de début</label>
                  <input
                    type="date"
                    className="dispo-add-input"
                    value={newPlage.debut}
                    onChange={e => setNewPlage(p => ({ ...p, debut: e.target.value }))}
                  />
                </div>
                <div className="dispo-add-field-sep">→</div>
                <div className="dispo-add-field">
                  <label className="dispo-add-label">Date de fin</label>
                  <input
                    type="date"
                    className="dispo-add-input"
                    value={newPlage.fin}
                    min={newPlage.debut || undefined}
                    onChange={e => setNewPlage(p => ({ ...p, fin: e.target.value }))}
                  />
                </div>
              </div>
              {newPlage.debut && newPlage.fin && newPlage.debut <= newPlage.fin && (
                <p className="dispo-add-preview">
                  ✓ {getDuree(newPlage.debut, newPlage.fin)} jour{getDuree(newPlage.debut, newPlage.fin) > 1 ? 's' : ''} de disponibilité
                </p>
              )}
              <div className="dispo-add-form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => { setAddingDispo(false); setNewPlage({ debut: '', fin: '' }) }}
                >
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={addPlage}
                  disabled={!newPlage.debut}
                >
                  Confirmer la plage
                </button>
              </div>
            </div>
          )}

          {/* Barre de sauvegarde */}
          {hasChanges && (
            <div className={`dispo-save-bar ${dispoMsg === 'success' ? 'dispo-save-bar-ok' : dispoMsg === 'error' ? 'dispo-save-bar-err' : ''}`}>
              {dispoMsg === 'success' ? (
                <span className="dispo-save-msg">✅ Disponibilités enregistrées avec succès</span>
              ) : dispoMsg === 'error' ? (
                <span className="dispo-save-msg">❌ Erreur lors de la sauvegarde</span>
              ) : (
                <>
                  <span className="dispo-save-pending">
                    <span className="dispo-save-dot" />
                    Modifications non enregistrées
                  </span>
                  <button
                    className="btn-primary dispo-save-btn"
                    onClick={saveDispo}
                    disabled={dispoSaving}
                  >
                    {dispoSaving ? 'Enregistrement...' : '💾 Enregistrer'}
                  </button>
                </>
              )}
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
