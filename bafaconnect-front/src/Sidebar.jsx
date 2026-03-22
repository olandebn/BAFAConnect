import { useState } from 'react'
import NotifCloche from './NotifCloche'

function Sidebar({ role, page, setPage, unreadCount, onLogout, userEmail, userPhoto }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navAnimateur = [
    { id: 'dashboard',    icon: '📊', label: 'Tableau de bord' },
    { id: 'annonces',     icon: '🏠', label: 'Annonces' },
    { id: 'calendrier',   icon: '📅', label: 'Planning' },
    { id: 'candidatures', icon: '📋', label: 'Mes candidatures' },
    { id: 'messages',     icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',       icon: '👤', label: 'Mon profil' },
    { id: 'parametres',   icon: '⚙️', label: 'Paramètres' },
  ]

  const navDirecteur = [
    { id: 'dashboard',    icon: '📊', label: 'Tableau de bord' },
    { id: 'annonces',     icon: '📝', label: 'Mes annonces' },
    { id: 'calendrier',   icon: '📅', label: 'Planning' },
    { id: 'recherche',    icon: '🔍', label: 'Trouver un animateur' },
    { id: 'favoris',      icon: '❤️', label: 'Mes favoris' },
    { id: 'candidatures', icon: '📩', label: 'Candidatures reçues' },
    { id: 'messages',     icon: '💬', label: 'Messages', badge: unreadCount },
    { id: 'profil',       icon: '👤', label: 'Mon profil' },
    { id: 'parametres',   icon: '⚙️', label: 'Paramètres' },
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

        {/* Logo + Cloche */}
        <div className="sidebar-logo-row">
          <div className="sidebar-logo">
            <img src="/logo-bafaconnect.png" alt="BafaConnect" className="sidebar-logo-img" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
            <span className="sidebar-logo-fallback" style={{display:'none', alignItems:'center', gap:6}}>
              <span className="sidebar-logo-icon">🧡</span>
              <span className="sidebar-logo-text">BafaConnect</span>
            </span>
          </div>

          {/* Cloche notifications */}
          <NotifCloche />
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
