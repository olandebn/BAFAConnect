import CampDoodles from './CampDoodles'

export default function NotFound({ onNavigate }) {
  return (
    <div className="notfound-page">
      <CampDoodles />
      <span className="notfound-hand">oups… ✦</span>
      <div className="notfound-num">
        <svg className="cd-doodle cd-float notfound-sun" aria-hidden="true" width="96" height="96" viewBox="0 0 80 80"><use href="#cd-sun" /></svg>
        <h1 className="notfound-404">404</h1>
        <svg className="cd-doodle cd-twinkle notfound-star" aria-hidden="true" width="34" height="34" viewBox="0 0 32 32"><use href="#cd-star" /></svg>
      </div>
      <h2 className="notfound-title">Cette page est partie en colo</h2>
      <p className="notfound-text">
        Elle n'existe pas ou a plié bagage. On te ramène au campement ?
      </p>
      <div className="notfound-actions">
        <button className="btn-primary" onClick={() => onNavigate && onNavigate('dashboard')}>
          Retour à l'accueil
        </button>
        <button className="btn-secondary" onClick={() => window.history.back()}>
          ← Page précédente
        </button>
      </div>
    </div>
  )
}
