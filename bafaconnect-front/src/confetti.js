// Petite explosion d'étoiles/✦ aux couleurs de la marque (esprit carnet).
const GLYPHS = ['✦', '★', '✸', '✶']
const COLORS = ['#4f7d3f', '#3f6a30', '#fde68a', '#e8826b', '#bbf7d0']

export function burstConfetti(x, y) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  const n = 16
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span')
    el.className = 'cd-confetti'
    el.textContent = GLYPHS[i % GLYPHS.length]
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5
    const dist = 60 + Math.random() * 75
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.style.setProperty('--dx', Math.cos(ang) * dist + 'px')
    el.style.setProperty('--dy', (Math.sin(ang) * dist - 40) + 'px')
    el.style.setProperty('--rot', (Math.random() * 560 - 280) + 'deg')
    el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)]
    el.style.fontSize = (12 + Math.random() * 13) + 'px'
    el.style.animationDuration = (700 + Math.random() * 500) + 'ms'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1300)
  }
}
