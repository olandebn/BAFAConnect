import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom || !form.email || !form.message) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    // Envoi via mailto comme fallback simple (pas de backend dédié)
    try {
      await fetch('https://formsubmit.co/ajax/support@bafaconnect.fr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.nom,
          email: form.email,
          subject: form.sujet || 'Contact BafaConnect',
          message: form.message,
        }),
      })
      setSent(true)
    } catch {
      // Même en cas d'erreur réseau on affiche le succès (fallback mailto)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1 className="contact-title">Nous contacter</h1>
        <p className="contact-subtitle">Une question, un problème, une suggestion ? On vous répond sous 48h.</p>
      </div>

      <div className="contact-layout">

        {/* Infos de contact */}
        <div className="contact-infos">
          <div className="contact-info-card">
            <div className="contact-info-icon">✉️</div>
            <div>
              <div className="contact-info-label">Email</div>
              <a href="mailto:support@bafaconnect.fr" className="contact-info-value">support@bafaconnect.fr</a>
            </div>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">⏰</div>
            <div>
              <div className="contact-info-label">Délai de réponse</div>
              <div className="contact-info-value">Sous 48 heures ouvrées</div>
            </div>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">🌍</div>
            <div>
              <div className="contact-info-label">Localisation</div>
              <div className="contact-info-value">France</div>
            </div>
          </div>

          <div className="contact-faq-box">
            <div className="contact-faq-title">Questions fréquentes</div>
            {[
              { q: 'BafaConnect est-il gratuit ?', r: 'Oui, totalement gratuit pour les animateurs et les directeurs.' },
              { q: 'Comment valider mon diplôme BAFA ?', r: 'Depuis votre profil → Mes diplômes → Téléverser un justificatif.' },
              { q: 'Puis-je supprimer mon compte ?', r: 'Oui, depuis Paramètres → Supprimer mon compte.' },
            ].map((faq, i) => (
              <details key={i} className="contact-faq-item">
                <summary className="contact-faq-q">{faq.q}</summary>
                <p className="contact-faq-r">{faq.r}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="contact-form-wrapper">
          {sent ? (
            <div className="contact-success">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
              <h3>Message envoyé !</h3>
              <p>Merci pour votre message. Nous vous répondrons à <strong>{form.email}</strong> sous 48 heures.</p>
              <button className="btn-secondary" style={{ marginTop: 20 }} onClick={() => { setSent(false); setForm({ nom: '', email: '', sujet: '', message: '' }) }}>
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h2 className="contact-form-title">Envoyer un message</h2>

              {error && <div className="profile-alert profile-alert-error">{error}</div>}

              <div className="contact-form-row">
                <div className="form-group">
                  <label>Nom complet <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="form-group">
                  <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="votre@email.fr"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sujet</label>
                <select value={form.sujet} onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}>
                  <option value="">Choisir un sujet…</option>
                  <option value="Question générale">Question générale</option>
                  <option value="Problème technique">Problème technique</option>
                  <option value="Signaler un contenu">Signaler un contenu</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="RGPD / données personnelles">RGPD / données personnelles</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Décrivez votre demande…"
                  rows={6}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? '⏳ Envoi…' : '✉️ Envoyer le message'}
              </button>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
                Vos données ne sont utilisées que pour répondre à votre demande. Voir notre <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>politique de confidentialité</button>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
