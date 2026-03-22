import { useState } from 'react'
import NotifCloche from './NotifCloche'

function Sidebar({ role, page, setPage, unreadCount, onLogout, userEmail, userPhoto }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const navAdmin = [
    { id: 'admin',      icon: '🛡️', label: 'Panel Admin' },
    { id: 'parametres', icon: '⚙️', label: 'Paramètres' },
  ]

  const navItems = role === 'admin' ? navAdmin : role === 'directeur' ? navDirecteur : navAnimateur

  const filteredItems = searchQuery.trim()
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems

  const handleNav = (id) => {
    setPage(id)
    setMobileOpen(false)
    setSearchQuery('')
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
            <div className="sidebar-logo-img-wrapper">
              <img src="/logo-bafaconnect.png" alt="BafaConnect" className="sidebar-logo-img" />
            </div>
            <span className="sidebar-logo-text">BafaConnect</span>
          </div>

          {/* Cloche notifications */}
          <NotifCloche />
        </div>

        {/* Barre de recherche */}
        <div className="sidebar-search-wrapper">
          <span className="sidebar-search-icon">🔍</span>
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sidebar-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredItems.length > 0 ? filteredItems.map(item => (
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
          )) : (
            <p className="sidebar-search-empty">Aucun résultat</p>
          )}
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
