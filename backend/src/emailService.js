// Service d'envoi d'emails
// Priorité 1 : nodemailer (npm install nodemailer dans /backend)
// Priorité 2 : fallback Python smtplib (aucune dépendance supplémentaire)
// Configurez dans .env : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, APP_URL

import { spawn } from 'child_process';

// ── Envoi via Python smtplib (fallback sans nodemailer) ──
function sendMailPython({ to, subject, html, smtpHost, smtpPort, smtpUser, smtpPass }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ to, subject, html, smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, smtp_pass: smtpPass });
    const py = spawn('python3', ['-c', `
import sys, json, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
d = json.loads(sys.stdin.read())
msg = MIMEMultipart('alternative')
msg['Subject'] = d['subject']
msg['From'] = 'BafaConnect <' + d['smtp_user'] + '>'
msg['To'] = d['to']
msg.attach(MIMEText(d['html'], 'html'))
with smtplib.SMTP(d.get('smtp_host','smtp.gmail.com'), int(d.get('smtp_port',587))) as s:
    s.ehlo()
    s.starttls()
    s.login(d['smtp_user'], d['smtp_pass'])
    s.sendmail(d['smtp_user'], d['to'], msg.as_string())
print('ok')
`]);
    py.stdin.write(payload);
    py.stdin.end();
    let out = '';
    let err = '';
    py.stdout.on('data', d => out += d);
    py.stderr.on('data', d => err += d);
    py.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `python exit ${code}`));
    });
  });
}

// ── Helper principal : essaie nodemailer, puis Python ──
async function sendMail({ to, subject, html }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || '587';

  if (!smtpUser || smtpUser === 'votre@gmail.com' || !smtpPass || smtpPass === 'votre_mot_de_passe_application') {
    console.log(`\n📧 [DEV - SMTP non configuré] À: ${to}\n   Sujet: ${subject}\n`);
    return;
  }

  // Essai 1 : nodemailer
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"BafaConnect" <${smtpUser}>`,
      to, subject, html,
    });
    console.log(`✉️  [nodemailer] Email envoyé à ${to}`);
    return;
  } catch (err) {
    if (!err.message.includes('Cannot find module')) {
      console.error('Erreur nodemailer :', err.message);
      return;
    }
    // nodemailer pas installé → fallback Python
    console.log('nodemailer absent, utilisation du fallback Python...');
  }

  // Essai 2 : Python smtplib
  try {
    await sendMailPython({ to, subject, html, smtpHost, smtpPort, smtpUser, smtpPass });
    console.log(`✉️  [python] Email envoyé à ${to}`);
  } catch (err) {
    console.error('Erreur envoi email (python) :', err.message);
  }
}

// ── Email de vérification après inscription ──
export async function sendVerificationEmail({ email, verifyUrl }) {
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
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'votre@gmail.com') {
    console.log(`\n📧 [DEV] Lien de vérification pour ${email} :\n${verifyUrl}\n`);
  }
  await sendMail({ to: email, subject, html });
}

// ── Email au directeur quand un animateur postule ──
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

// ── Email à l'animateur quand candidature acceptée/refusée ──
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

// ── Email de réinitialisation de mot de passe ──
export async function sendPasswordResetEmail({ email, resetUrl }) {
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
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'votre@gmail.com') {
    console.log(`\n🔑 [DEV] Lien de réinitialisation pour ${email} :\n${resetUrl}\n`);
  }
  await sendMail({ to: email, subject, html });
}
