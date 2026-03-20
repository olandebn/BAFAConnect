import { useState } from 'react'

function Sidebar({ role, page, setPage, unreadCount, onLogout, userEmail }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navAnimateur = [
    { id: 'annonces',     icon: '🏠', label: 'Annonces' },
    { id: 'candidatures', icon: '📋', label: 'Mes candidatures' },
    { id: 'messages',     icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',       icon: '👤', label: 'Mon profil' },
  ]

  const navDirecteur = [
    { id: 'dashboard',     icon: '📊', label: 'Tableau de bord' },
    { id: 'annonces',      icon: '📝', label: 'Mes annonces' },
    { id: 'recherche',     icon: '🔍', label: 'Trouver un animateur' },
    { id: 'candidatures',  icon: '📩', label: 'Candidatures reçues' },
    { id: 'messages',      icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',        icon: '👤', label: 'Mon profil' },
  ]

  const navItems = role === 'directeur' ? navDirecteur : navAnimateur

  const handleNav = (id) => {
    setPage(id)
    setMobileOpen(false)
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
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🧡</span>
          <span className="sidebar-logo-text">BafaConnect</span>
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
              {role === 'directeur' ? '🏕️' : '🎒'}
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
