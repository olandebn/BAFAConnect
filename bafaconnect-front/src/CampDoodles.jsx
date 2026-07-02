// Sprite SVG des illustrations "fait-main" de la landing (mascotte soleil,
// tente, sapin, étoile, boussole, sac à dos). Rendu une seule fois, masqué ;
// les éléments sont réutilisés ailleurs via <svg><use href="#id" /></svg>.
const SPRITE = `
<defs>
  <g id="cd-sun">
    <g class="cd-spin">
      <g stroke="#e8826b" stroke-width="3" stroke-linecap="round">
        <line x1="40" y1="2" x2="40" y2="14"/><line x1="40" y1="66" x2="40" y2="78"/>
        <line x1="2" y1="40" x2="14" y2="40"/><line x1="66" y1="40" x2="78" y2="40"/>
        <line x1="12" y1="12" x2="21" y2="21"/><line x1="59" y1="59" x2="68" y2="68"/>
        <line x1="68" y1="12" x2="59" y2="21"/><line x1="21" y1="59" x2="12" y2="68"/>
      </g>
    </g>
    <circle cx="40" cy="40" r="22" fill="#fde68a" stroke="#14532d" stroke-width="2.5"/>
    <ellipse cx="33" cy="37" rx="2.4" ry="2.4" fill="#14532d"><animate attributeName="ry" values="2.4;2.4;2.4;0.3;2.4" keyTimes="0;0.88;0.92;0.95;1" dur="4.5s" repeatCount="indefinite"/></ellipse>
    <ellipse cx="47" cy="37" rx="2.4" ry="2.4" fill="#14532d"><animate attributeName="ry" values="2.4;2.4;2.4;0.3;2.4" keyTimes="0;0.88;0.92;0.95;1" dur="4.5s" repeatCount="indefinite"/></ellipse>
    <path d="M32 45 Q40 52 48 45" stroke="#14532d" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M27 43 Q29 47 31 43" stroke="#e8826b" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M49 43 Q51 47 53 43" stroke="#e8826b" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
  <g id="cd-tent">
    <path d="M8 64 L40 12 L72 64 Z" fill="#dcfce7" stroke="#14532d" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M40 12 L40 64" stroke="#14532d" stroke-width="2.2"/>
    <path d="M40 64 L30 40 L40 22 L50 40 Z" fill="#16a34a" stroke="#14532d" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M2 64 L78 64" stroke="#14532d" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M40 12 L40 4" stroke="#14532d" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M40 4 L46 8" stroke="#e8826b" stroke-width="2.2" stroke-linecap="round"/>
  </g>
  <g id="cd-tree">
    <path d="M22 8 L8 30 L16 30 L4 50 L40 50 L28 30 L36 30 Z" fill="#16a34a" stroke="#14532d" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="18" y="50" width="8" height="12" fill="#a87b4f" stroke="#14532d" stroke-width="2"/>
  </g>
  <g id="cd-star">
    <path d="M16 2 Q18 14 30 16 Q18 18 16 30 Q14 18 2 16 Q14 14 16 2 Z" fill="#fde68a" stroke="#14532d" stroke-width="2"/>
  </g>
  <g id="cd-compass">
    <circle cx="34" cy="34" r="28" fill="#fffdf8" stroke="#14532d" stroke-width="2.6"/>
    <path d="M34 14 L41 34 L34 54 L27 34 Z" fill="#e8826b" stroke="#14532d" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="34" cy="34" r="3" fill="#14532d"/>
  </g>
  <g id="cd-backpack">
    <rect x="10" y="20" width="44" height="48" rx="12" fill="#16a34a" stroke="#14532d" stroke-width="2.6"/>
    <path d="M22 20 Q22 8 32 8 Q42 8 42 20" fill="none" stroke="#14532d" stroke-width="2.6"/>
    <rect x="20" y="36" width="24" height="18" rx="6" fill="#dcfce7" stroke="#14532d" stroke-width="2.2"/>
    <line x1="32" y1="20" x2="32" y2="36" stroke="#14532d" stroke-width="2"/>
  </g>
  <g id="cd-cloud">
    <path d="M16 42 Q5 42 5 31 Q5 22 16 23 Q19 11 31 14 Q41 5 51 16 Q66 13 66 29 Q66 42 53 42 Z" fill="#fffdf8" stroke="#14532d" stroke-width="2.4" stroke-linejoin="round"/>
  </g>
  <g id="cd-bird">
    <path d="M2 13 Q11 2 19 12 Q27 2 36 13" fill="none" stroke="#14532d" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <g id="cd-arrow">
    <path d="M4 32 Q 28 38 50 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M41 13 L53 13 L51 25" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g id="cd-moon">
    <path d="M52 40 A26 26 0 1 1 28 8 A20 20 0 1 0 52 40 Z" fill="#fde68a" stroke="#14532d" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="34" cy="18" r="2" fill="#14532d" opacity="0.5"/>
    <circle cx="40" cy="30" r="1.6" fill="#14532d" opacity="0.4"/>
  </g>
</defs>`

export default function CampDoodles() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: SPRITE }}
    />
  )
}
