// Service d'envoi d'emails — nécessite : npm install nodemailer
// Configurez dans .env : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, APP_URL

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  } catch {
    return null;
  }
}

export async function sendCandidatureNotification({ email, animateurNom, sejourTitre, statut }) {
  const isAccepted = statut === 'acceptée' || statut === 'acceptee';
  const statutLabel = isAccepted ? 'acceptée ✅' : 'refusée ❌';
  const subject = `BafaConnect — Votre candidature a été ${statutLabel}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fffbf5; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 2rem;">🧡</span>
        <h2 style="color: #1a3a2f; margin: 8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color: #1c1917;">Bonjour ${animateurNom || 'animateur'} !</h3>
      <p style="color: #44403c; line-height: 1.6;">
        Votre candidature pour le séjour <strong style="color: #f97316;">${sejourTitre}</strong>
        a été <strong>${statutLabel}</strong>.
      </p>
      ${isAccepted ? `
        <div style="background: #dcfce7; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="color: #14532d; margin: 0;">
            🎉 Félicitations ! Le directeur vous contactera prochainement via la messagerie BafaConnect.
          </p>
        </div>
      ` : `
        <div style="background: #fee2e2; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="color: #7f1d1d; margin: 0;">
            Ne vous découragez pas, d'autres missions vous attendent sur BafaConnect !
          </p>
        </div>
      `}
      <a href="${process.env.APP_URL || 'http://localhost:5173'}"
         style="display: inline-block; background: #f97316; color: white; padding: 12px 28px;
                border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
        Voir mes candidatures
      </a>
      <p style="color: #a8a29e; font-size: 0.85rem; margin-top: 24px;">
        BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.
      </p>
    </div>
  `;

  try {
    const t = await getTransporter();
    if (!t) {
      console.log(`[Email non envoyé — nodemailer non configuré] À: ${email} | Sujet: ${subject}`);
      return;
    }
    await t.sendMail({
      from: `"BafaConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`Email envoyé à ${email}`);
  } catch (err) {
    console.error('Erreur envoi email :', err.message);
  }
}

export async function sendPasswordResetEmail({ email, resetUrl }) {
  const subject = 'BafaConnect — Réinitialisation de votre mot de passe';
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fffbf5; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 2rem;">🧡</span>
        <h2 style="color: #1a3a2f; margin: 8px 0;">BafaConnect</h2>
      </div>
      <h3 style="color: #1c1917;">Réinitialisation de mot de passe</h3>
      <p style="color: #44403c; line-height: 1.6;">
        Vous avez demandé à réinitialiser votre mot de passe.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        Ce lien est valable <strong>1 heure</strong>.
      </p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #f97316; color: white; padding: 12px 28px;
                border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
        Réinitialiser mon mot de passe
      </a>
      <p style="color: #78716c; font-size: 0.9rem; margin-top: 20px;">
        Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
      <p style="color: #a8a29e; font-size: 0.85rem; margin-top: 24px;">
        BafaConnect — La plateforme qui relie directeurs et animateurs BAFA.
      </p>
    </div>
  `;

  try {
    const t = await getTransporter();
    if (!t) {
      console.log(`[Email non envoyé — nodemailer non configuré]`);
      console.log(`Lien de réinitialisation (mode dev) : ${resetUrl}`);
      return;
    }
    await t.sendMail({
      from: `"BafaConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`Email de réinitialisation envoyé à ${email}`);
  } catch (err) {
    console.error('Erreur envoi email réinitialisation :', err.message);
  }
}
