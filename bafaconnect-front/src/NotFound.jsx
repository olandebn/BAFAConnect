export default function NotFound({ onNavigate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '40px 20px',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>🏕️</div>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', margin: '12px 0 8px' }}>Page introuvable</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 400, lineHeight: 1.6, marginBottom: 28 }}>
        On dirait que cette page est partie en séjour... Elle n'existe pas ou a été déplacée.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => onNavigate && onNavigate('dashboard')}>
          🏠 Retour à l'accueil
        </button>
        <button className="btn-secondary" onClick={() => window.history.back()}>
          ← Page précédente
        </button>
      </div>
    </div>
  )
}
