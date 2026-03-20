import { useState } from 'react'

function Sidebar({ role, page, setPage, unreadCount, onLogout, userEmail, userPhoto, notifItems }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const navAnimateur = [
    { id: 'annonces',     icon: '🏠', label: 'Annonces' },
    { id: 'candidatures', icon: '📋', label: 'Mes candidatures' },
    { id: 'messages',     icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',       icon: '👤', label: 'Mon profil' },
    { id: 'parametres',   icon: '⚙️', label: 'Paramètres' },
  ]

  const navDirecteur = [
    { id: 'dashboard',    icon: '📊', label: 'Tableau de bord' },
    { id: 'annonces',     icon: '📝', label: 'Mes annonces' },
    { id: 'recherche',    icon: '🔍', label: 'Trouver un animateur' },
    { id: 'favoris',      icon: '❤️', label: 'Mes favoris' },
    { id: 'candidatures', icon: '📩', label: 'Candidatures reçues' },
    { id: 'messages',     icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',       icon: '👤', label: 'Mon profil' },
    { id: 'parametres',   icon: '⚙️', label: 'Paramètres' },
  ]

  const navItems = role === 'directeur' ? navDirecteur : navAnimateur

  const totalNotifs = (notifItems || []).length
  const totalBadge = unreadCount + totalNotifs

  const handleNav = (id) => {
    setPage(id)
    setMobileOpen(false)
    setNotifOpen(false)
  }

  return (
    <>
      {/* ── Bouton burger (mobile) ── */}
      <button
        className="sidebar-burger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* ── Overlay (mobile) ── */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>

        {/* Logo + Cloche */}
        <div className="sidebar-logo-row">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🧡</span>
            <span className="sidebar-logo-text">BafaConnect</span>
          </div>

          {/* Cloche notifications */}
          <div className="sidebar-notif-wrapper">
            <button
              className="sidebar-notif-btn"
              onClick={() => setNotifOpen(o => !o)}
              title="Notifications"
            >
              🔔
              {totalBadge > 0 && (
                <span className="sidebar-notif-dot">{totalBadge > 9 ? '9+' : totalBadge}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">Notifications</div>

                {unreadCount > 0 && (
                  <button
                    className="notif-item notif-item-message"
                    onClick={() => handleNav('messages')}
                  >
                    <span className="notif-item-icon">💬</span>
                    <span className="notif-item-text">
                      {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                    </span>
                  </button>
                )}

                {(notifItems || []).map((n, i) => (
                  <button
                    key={i}
                    className="notif-item"
                    onClick={() => handleNav(n.page || 'candidatures')}
                  >
                    <span className="notif-item-icon">{n.icon || '📩'}</span>
                    <span className="notif-item-text">{n.text}</span>
                  </button>
                ))}

                {totalBadge === 0 && (
                  <div className="notif-empty">Aucune nouvelle notification</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + déconnexion */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {userPhoto
                ? <img src={userPhoto} alt="avatar" className="sidebar-avatar-img" />
                : <span>{role === 'directeur' ? '🏕️' : '🎒'}</span>
              }
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-email">{userEmail}</span>
              <span className="sidebar-user-role">
                {role === 'directeur' ? 'Directeur' : 'Animateur'}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout} title="Déconnexion">↩</button>
        </div>

      </aside>
    </>
  )
}

export default Sidebar
