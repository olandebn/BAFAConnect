# 🚀 Guide de déploiement — BafaConnect

## Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com) (base de données PostgreSQL)
- Un compte [Render](https://render.com) ou [Railway](https://railway.app) pour le backend
- Un compte [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) pour le frontend
- (Optionnel) Un compte Gmail ou SMTP pour les emails

---

## 1. Base de données — Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez la **Connection string** dans *Settings > Database > Connection string*
3. Gardez aussi l'**URL** et la **clé anon** pour le stockage de fichiers

---

## 2. Backend — Variables d'environnement

Créez le fichier `backend/.env` :

```env
# Base de données
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# JWT
JWT_SECRET=votre_secret_jwt_très_long_et_aléatoire

# URL du frontend (pour CORS)
FRONTEND_URL=https://votre-app.vercel.app

# URL de l'app (pour les emails)
APP_URL=https://votre-app.vercel.app

# SMTP (Gmail recommandé)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_mot_de_passe_application   # Généré dans Gmail > Sécurité > Mots de passe d'application

# VAPID (notifications push)
# Générez vos clés avec : cd backend && npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=votre_clé_publique_vapid
VAPID_PRIVATE_KEY=votre_clé_privée_vapid
VAPID_EMAIL=mailto:contact@bafaconnect.fr
```

---

## 3. Frontend — Variables d'environnement

Créez le fichier `bafaconnect-front/.env.production` :

```env
VITE_API_URL=https://votre-backend.onrender.com/api
VITE_VAPID_PUBLIC_KEY=votre_clé_publique_vapid   # La même que côté backend
```

---

## 4. Déploiement Backend sur Render

1. Poussez le code sur GitHub
2. Sur [render.com](https://render.com), créez un **Web Service**
3. Paramètres :
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `node backend/src/app.js`
   - **Environment** : Node
4. Ajoutez les variables d'environnement depuis `backend/.env`
5. Cliquez sur **Deploy**

> 💡 Render offre un tier gratuit (le service se met en veille après 15 min d'inactivité).
> Pour la production, utilisez le tier payant ou Railway.

---

## 5. Déploiement Frontend sur Vercel

```bash
cd bafaconnect-front
npm install
npm run build
```

Puis sur [vercel.com](https://vercel.com) :

1. Importez votre repo GitHub
2. Framework : **Vite**
3. Build command : `npm run build`
4. Output directory : `dist`
5. Ajoutez les variables d'environnement `VITE_API_URL` et `VITE_VAPID_PUBLIC_KEY`
6. Déployez

Ou via CLI :
```bash
npm i -g vercel
vercel --prod
```

---

## 6. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../bafaconnect-front
npm install
```

Les nouveaux packages ajoutés :
- `socket.io` — WebSockets temps réel
- `node-cron` — Tâches planifiées (rapport mensuel)
- `web-push` — Notifications push navigateur

---

## 7. Clés VAPID (notifications push)

```bash
cd backend
npx web-push generate-vapid-keys
```

Copiez les clés générées dans `backend/.env` et `bafaconnect-front/.env.production`.

---

## 8. Configuration du compte Gmail

Pour envoyer des emails :

1. Allez dans votre compte Google > **Sécurité**
2. Activez la **Validation en deux étapes**
3. Créez un **Mot de passe d'application** (App Password)
4. Copiez ce mot de passe dans `SMTP_PASS`

---

## 9. Créer un compte admin

Pour accéder au panel admin, créez un utilisateur avec le rôle `admin` directement en base :

```sql
-- Dans Supabase > SQL Editor
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

---

## 10. Vérification du déploiement

Checklist avant mise en ligne :

- [ ] `DATABASE_URL` configurée et connexion testée
- [ ] `JWT_SECRET` défini (au moins 32 caractères)
- [ ] `VITE_API_URL` pointe vers le backend en production
- [ ] CORS configuré avec l'URL du frontend (`FRONTEND_URL`)
- [ ] Clés VAPID générées et copiées des deux côtés
- [ ] SMTP testé (un email de test envoyé)
- [ ] `npm run build` réussit sans erreur
- [ ] Service Worker accessible sur `/sw.js`

---

## 11. Développement local

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev       # ou: node src/app.js

# Terminal 2 — Frontend
cd bafaconnect-front
npm install
npm run dev
```

L'app sera accessible sur `http://localhost:5173`
L'API backend sur `http://localhost:3000`

---

## Architecture

```
BafaConnect/
├── backend/                 # API Express + Socket.io
│   ├── src/
│   │   ├── app.js           # Point d'entrée + Socket.io
│   │   ├── routes/          # Routes API REST
│   │   ├── middleware/      # Auth JWT
│   │   ├── cron/            # Tâches planifiées
│   │   └── emailService.js  # Envoi emails
│   └── package.json
│
└── bafaconnect-front/       # React + Vite
    ├── src/
    │   ├── App.jsx          # Composant racine + routing
    │   ├── pushNotifications.js  # Web Push
    │   └── ...              # Composants
    ├── public/
    │   └── sw.js            # Service Worker
    └── package.json
```

---

*BafaConnect — La plateforme qui relie directeurs et animateurs BAFA* 🏕️
