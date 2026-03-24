import { useState, useEffect } from 'react'

export default function CookieBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setVisible(false)
  }

  const refuse = () => {
    localStorage.setItem('cookieConsent', 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      padding: '16px 24px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.4rem' }}>🍪</span>
      <p style={{ flex: 1, margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5, minWidth: 200 }}>
        BafaConnect utilise des cookies <strong>strictement nécessaires</strong> au fonctionnement du service (authentification, préférences). Pas de cookies publicitaires ni de tracking.{' '}
        <button
          onClick={() => onNavigate && onNavigate('cookies')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'inherit', padding: 0, textDecoration: 'underline' }}
        >En savoir plus</button>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={refuse}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem',
          }}
        >Refuser</button>
        <button
          onClick={accept}
          className="btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >✓ Accepter</button>
      </div>
    </div>
  )
}
