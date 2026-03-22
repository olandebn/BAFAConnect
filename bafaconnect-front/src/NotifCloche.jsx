import { useEffect, useRef, useState } from 'react'
import api from './api/axios'

const TYPE_ICON = {
  message:            '💬',
  candidature:        '📬',
  statut_candidature: '📋',
  invitation:         '💌',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

function NotifCloche() {
  const [notifs, setNotifs]       = useState([])
  const [nonLues, setNonLues]     = useState(0)
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const panelRef                  = useRef(null)

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifs(res.data.notifications)
      setNonLues(res.data.nonLues)
    } catch {}
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // rafraîchir toutes les 30s
    return () => clearInterval(interval)
  }, [])

  // Fermer le panel si clic à l'extérieur
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen(prev => !prev)
    // Marquer comme lues dès qu'on ouvre
    if (!open && nonLues > 0) {
      try {
        await api.put('/notifications/read')
        setNonLues(0)
        setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
      } catch {}
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  return (
    <div className="notif-cloche-wrapper" ref={panelRef}>
      <button
        className={`notif-cloche-btn ${nonLues > 0 ? 'notif-cloche-active' : ''}`}
        onClick={handleOpen}
        title="Notifications"
      >
        🔔
        {nonLues > 0 && (
          <span className="notif-badge">{nonLues > 9 ? '9+' : nonLues}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {notifs.length > 0 && (
              <button
                className="notif-panel-clear"
                onClick={async () => {
                  // Supprimer toutes
                  for (const n of notifs) {
                    try { await api.delete(`/notifications/${n.id}`) } catch {}
                  }
                  setNotifs([])
                  setNonLues(0)
                }}
              >
                Tout effacer
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="notif-empty">
              <span style={{ fontSize: '2rem' }}>🔔</span>
              <p>Tout est à jour !</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>Aucune nouvelle notification</span>
            </div>
          ) : (
            <ul className="notif-list">
              {notifs.map(n => (
                <li key={n.id} className={`notif-item ${!n.lu ? 'notif-item-new' : ''}`}>
                  <span className="notif-icon">
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>
                  <div className="notif-body">
                    <p className="notif-contenu">{n.contenu}</p>
                    <span className="notif-date">{timeAgo(n.created_at)}</span>
                  </div>
                  <button
                    className="notif-dismiss"
                    onClick={(e) => handleDelete(n.id, e)}
                    title="Supprimer"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotifCloche
