import { useEffect, useRef, useState } from 'react'

// Compteur qui s'incrémente de 0 à `to` quand il entre dans le viewport.
export default function StatCounter({ to = 0, suffix = '', duration = 1400 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setVal(to); return }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !done.current) {
          done.current = true
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.round(eased * to))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.4 })

    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return <span ref={ref}>{val.toLocaleString('fr-FR')}{suffix}</span>
}
