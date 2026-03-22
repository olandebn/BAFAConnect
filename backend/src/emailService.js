// Service d'envoi d'emails via Resend (https://resend.com)
// Configurez dans .env : RESEND_API_KEY=re_xxxx  et  EMAIL_FROM=noreply@votredomaine.com

// ── Envoi principal via l'API Resend ──────────────────────────────────────
export async function sendMail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  // Mode dev : pas de clé → log dans le terminal
  if (!apiKey || apiKey === 'VOTRE_CLE_RESEND') {
    console.log(`\n📧 [DEV - Resend non configuré]\n   À      : ${to}\n   Sujet  : ${subject}\n   (Ajoutez RESEND_API_KEY dans .env pour envoyer de vrais emails)\n`);
    return;
  }

  const from = process.env.EMAIL_FROM || 'BafaConnect <noreply@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || `Resend error ${response.status}`);
    }

    console.log(`✉️  [Resend] Email envoyé à ${to} (id: ${data.id})`);
  } catch (err) {
    console.error(`❌ Erreur envoi email à ${to} :`, err.message);
  }
}

// ── Email de vérification après inscription ───────────────────────────────
export async function sendVerificationEmail({ email, verifyUrl }) {
  // En dev sans clé, affiche le lien dans le terminal
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'VOTRE_CLE_RESEND') {
    console.log(`\n📧 [DEV] Lien de vérification pour ${email} :\n${verifyUrl}\n`);
  }

  const subject = 'BafaConnect — Vérifiez votre adresse email';
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fffbf5;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:2rem;">🧡</span>
        <h2 style="color:#1a3a2f;margin:8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color:#1c1917;">Bienvenue sur BafaConnect !</h3>
      <p style="color:#44403c;line-height:1.6;">
        Votre compte a bien été créé. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.
        Ce lien est valable <strong>24 heures</strong>.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}"
           style="display:inline-block;background:#f97316;color:white;padding:14px 32px;
                  border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;">
          ✅ Vérifier mon email
        </a>
      </div>
      <p style="color:#78716c;font-size:0.9rem;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      <p style="color:#a8a29e;font-size:0.85rem;margin-top:24px;">BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.</p>
    </div>
  `;
  await sendMail({ to: email, subject, html });
}

// ── Email au directeur quand un animateur postule ─────────────────────────
export async function sendNouvellePostulation({ emailDirecteur, animateurNom, sejourTitre, appUrl }) {
  const subject = `BafaConnect — Nouvelle candidature pour "${sejourTitre}"`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fffbf5;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:2rem;">🧡</span>
        <h2 style="color:#1a3a2f;margin:8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color:#1c1917;">Nouvelle candidature reçue !</h3>
      <p style="color:#44403c;line-height:1.6;">
        <strong style="color:#f97316;">${animateurNom || 'Un animateur'}</strong> vient de postuler à votre séjour
        <strong style="color:#1a3a2f;">"${sejourTitre}"</strong>.
      </p>
      <div style="background:#fff7ed;border-radius:12px;padding:16px;margin:20px 0;border-left:4px solid #f97316;">
        <p style="color:#9a3412;margin:0;">📬 Consultez sa candidature et son profil pour lui répondre rapidement !</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl || 'http://localhost:5173'}"
           style="display:inline-block;background:#f97316;color:white;padding:12px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;">
          Voir les candidatures
        </a>
      </div>
      <p style="color:#a8a29e;font-size:0.85rem;margin-top:24px;">BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.</p>
    </div>
  `;
  await sendMail({ to: emailDirecteur, subject, html });
}

// ── Email à l'animateur quand candidature acceptée/refusée ───────────────
export async function sendCandidatureNotification({ email, animateurNom, sejourTitre, statut }) {
  const isAccepted = statut === 'acceptée' || statut === 'acceptee';
  const statutLabel = isAccepted ? 'acceptée ✅' : 'refusée ❌';
  const subject = `BafaConnect — Votre candidature a été ${statutLabel}`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fffbf5;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:2rem;">🧡</span>
        <h2 style="color:#1a3a2f;margin:8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color:#1c1917;">Bonjour ${animateurNom || 'animateur'} !</h3>
      <p style="color:#44403c;line-height:1.6;">
        Votre candidature pour le séjour <strong style="color:#f97316;">${sejourTitre}</strong>
        a été <strong>${statutLabel}</strong>.
      </p>
      ${isAccepted ? `
        <div style="background:#dcfce7;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="color:#14532d;margin:0;">🎉 Félicitations ! Le directeur vous contactera prochainement via la messagerie BafaConnect.</p>
        </div>
      ` : `
        <div style="background:#fee2e2;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="color:#7f1d1d;margin:0;">Ne vous découragez pas, d'autres missions vous attendent sur BafaConnect !</p>
        </div>
      `}
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:5173'}"
           style="display:inline-block;background:#f97316;color:white;padding:12px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;">
          Voir mes candidatures
        </a>
      </div>
      <p style="color:#a8a29e;font-size:0.85rem;margin-top:24px;">BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.</p>
    </div>
  `;
  await sendMail({ to: email, subject, html });
}

// ── Email de réinitialisation de mot de passe ─────────────────────────────
export async function sendPasswordResetEmail({ email, resetUrl }) {
  // En dev sans clé, affiche le lien dans le terminal
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'VOTRE_CLE_RESEND') {
    console.log(`\n🔑 [DEV] Lien de réinitialisation pour ${email} :\n${resetUrl}\n`);
  }

  const subject = 'BafaConnect — Réinitialisation de votre mot de passe';
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fffbf5;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:2rem;">🧡</span>
        <h2 style="color:#1a3a2f;margin:8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color:#1c1917;">Réinitialisation de mot de passe</h3>
      <p style="color:#44403c;line-height:1.6;">
        Vous avez demandé à réinitialiser votre mot de passe.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        Ce lien est valable <strong>1 heure</strong>.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;background:#f97316;color:white;padding:12px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color:#78716c;font-size:0.9rem;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p style="color:#a8a29e;font-size:0.85rem;margin-top:24px;">BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.</p>
    </div>
  `;
  await sendMail({ to: email, subject, html });
}
