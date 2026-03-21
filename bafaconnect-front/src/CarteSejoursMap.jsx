import { useEffect, useRef, useState } from 'react'
import api from './api/axios'

// Coordonnées de référence pour les villes françaises courantes
const CITY_COORDS = {
  'paris': [48.8566, 2.3522], 'lyon': [45.764, 4.8357], 'marseille': [43.2965, 5.3698],
  'toulouse': [43.6047, 1.4442], 'nice': [43.7102, 7.262], 'nantes': [47.2184, -1.5536],
  'montpellier': [43.6119, 3.8772], 'strasbourg': [48.5734, 7.7521], 'bordeaux': [44.8378, -0.5792],
  'lille': [50.6292, 3.0573], 'rennes': [48.1173, -1.6778], 'reims': [49.2583, 4.0317],
  'grenoble': [45.1885, 5.7245], 'dijon': [47.322, 5.0415], 'angers': [47.4784, -0.5632],
  'nimes': [43.8367, 4.3601], 'nimes': [43.8367, 4.3601], 'clermont': [45.7794, 3.0869],
  'limoges': [45.8315, 1.2578], 'tours': [47.3941, 0.6848], 'amiens': [49.894, 2.3022],
  'caen': [49.1829, -0.3707], 'metz': [49.1193, 6.1727], 'brest': [48.3904, -4.4861],
  'toulon': [43.1242, 5.928], 'perpignan': [42.6886, 2.8948], 'rouen': [49.4432, 1.0993],
  'mulhouse': [47.7508, 7.3359], 'nancy': [48.6921, 6.1844], 'besancon': [47.2378, 6.0241],
  'orleans': [47.9029, 1.9039], 'avignon': [43.9493, 4.8055], 'poitiers': [46.5802, 0.34],
  'la rochelle': [46.1604, -1.1511], 'rochelle': [46.1604, -1.1511],
  'bayonne': [43.4929, -1.4748], 'pau': [43.2951, -0.3708], 'valence': [44.9334, 4.8924],
  'annecy': [45.8992, 6.1294], 'chambery': [45.5646, 5.9178], 'cannes': [43.5528, 7.0174],
  'biarritz': [43.4832, -1.5586], 'colmar': [48.0793, 7.3585], 'troyes': [48.2973, 4.0744],
  'chartres': [48.4469, 1.4885], 'laval': [48.0734, -0.7686], 'le mans': [48.0061, 0.1996],
  'mans': [48.0061, 0.1996], 'lorient': [47.7485, -3.3673], 'vannes': [47.6586, -2.7597],
  'quimper': [47.9962, -4.0953], 'ardeche': [44.7, 4.4], 'vosges': [48.1, 6.4],
  'alsace': [48.3, 7.4], 'bretagne': [48.0, -2.8], 'normandie': [49.1, 0.2],
  'provence': [43.7, 5.3], 'auvergne': [45.5, 3.1], 'dordogne': [45.1, 0.7],
  'coreze': [45.3, 1.9], 'cantal': [45.1, 2.5], 'lozere': [44.5, 3.5],
}

function getCoordsForCity(lieu) {
  if (!lieu) return null
  const lower = lieu.toLowerCase().trim()
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key)) return coords
  }
  // Fallback: centre France
  return [46.6034, 1.8883]
}

let leafletLoaded = false

function loadLeaflet() {
  return new Promise((resolve) => {
    if (leafletLoaded && window.L) { resolve(window.L); return }
    if (window.L) { leafletLoaded = true; resolve(window.L); return }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => { leafletLoaded = true; resolve(window.L) }
    document.head.appendChild(script)
  })
}

function CarteSejoursMap({ onPostuler, role }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const [sejours, setSejours] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/sejours')
      .then(res => setSejours(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current) return
    let destroyed = false

    loadLeaflet().then(L => {
      if (destroyed || !mapRef.current) return

      // Initialiser la carte une seule fois
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          center: [46.6034, 1.8883],
          zoom: 5,
          zoomControl: true,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(mapInstance.current)
      }

      // Supprimer anciens marqueurs
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // Créer icône personnalisée orange
      const orangeIcon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#f97316;transform:rotate(-45deg);
          border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
        className: '',
      })

      sejours.forEach(s => {
        const coords = getCoordsForCity(s.lieu)
        if (!coords) return

        // Légère variation pour éviter superposition exacte
        const jitter = (Math.random() - 0.5) * 0.05
        const marker = L.marker([coords[0] + jitter, coords[1] + jitter], { icon: orangeIcon })

        const dateStr = s.date_debut
          ? `${new Date(s.date_debut).toLocaleDateString('fr-FR')}${s.date_fin ? ' → ' + new Date(s.date_fin).toLocaleDateString('fr-FR') : ''}`
          : ''

        const popupHtml = `
          <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:200px;max-width:240px">
            <h4 style="margin:0 0 4px;font-size:0.92rem;color:#1c1917">${s.titre}</h4>
            <p style="margin:0 0 4px;font-size:0.78rem;color:#78716c">📍 ${s.lieu}</p>
            ${dateStr ? `<p style="margin:0 0 8px;font-size:0.78rem;color:#78716c">🗓️ ${dateStr}</p>` : ''}
            ${s.nom_structure ? `<p style="margin:0 0 8px;font-size:0.78rem;color:#78716c">🏕️ ${s.nom_structure}</p>` : ''}
            ${role === 'animateur' ? `<button onclick="window.__bafaPostuler('${s.id}')" style="
              background:#f97316;color:white;border:none;padding:6px 14px;
              border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;width:100%
            ">Postuler</button>` : ''}
          </div>
        `

        marker.bindPopup(popupHtml, { maxWidth: 260 })
        marker.addTo(mapInstance.current)
        markersRef.current.push(marker)
      })

      // Callback global pour les boutons dans les popups Leaflet
      window.__bafaPostuler = (sejourId) => {
        if (onPostuler) onPostuler(sejourId)
      }
    })

    return () => {
      destroyed = true
    }
  }, [sejours, loading, onPostuler, role])

  // Nettoyage à l'unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
      delete window.__bafaPostuler
    }
  }, [])

  if (loading) return (
    <div className="empty-state"><p>Chargement de la carte...</p></div>
  )

  return (
    <div className="carte-wrapper">
      <div ref={mapRef} className="carte-leaflet" />
      <div className="carte-legende">
        <span className="carte-legende-item">
          <span className="carte-dot carte-dot-orange" /> Séjour disponible
        </span>
        <span className="carte-legende-item" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
          Cliquez sur un marqueur pour voir les détails
          {role === 'animateur' ? ' et postuler' : ''}
        </span>
      </div>
    </div>
  )
}

export default CarteSejoursMap
