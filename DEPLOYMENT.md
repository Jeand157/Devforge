# 🚀 Guide de Déploiement LocalLoop

Ce guide vous explique comment déployer LocalLoop en production.

## 1. Backend (API & WebSocket)
Plateforme recommandée : **Railway** ou **Render**.

### Variables d'Environnement
Configurez les variables suivantes sur votre plateforme :
- `PORT`: 4000 (ou celui fourni par l'hôte)
- `DB_HOST`: Host de votre base MySQL (ex: Railway MySQL)
- `DB_PORT`: 3306
- `DB_USER`: Utilisateur base de données
- `DB_PASSWORD`: Mot de passe base de données
- `DB_NAME`: localloop
- `FRONTEND_URL`: URL de votre site (ex: `https://localloop.vercel.app`)

### Commande de Build & Start
- **Build Command**: `npm run build -w apps/backend`
- **Start Command**: `npm run start -w apps/backend`
- **Root Directory**: `./` (le workspace gère le reste)

---

## 2. Frontend (Next.js)
Plateforme recommandée : **Vercel**.

### Configuration dans Vercel
1. Importez votre dépôt GitHub.
2. Définissez le **Root Directory** sur `apps/frontend`.
3. Ajoutez les **Environment Variables** :
   - `NEXT_PUBLIC_API_URL`: L'URL de votre backend (ex: `https://api-localloop.railway.app`)
   - `NEXTAUTH_URL`: L'URL de votre frontend (ex: `https://localloop.vercel.app`)
   - `NEXTAUTH_SECRET`: Une clé secrète longue et complexe.

---

## 3. Base de Données
Si vous utilisez Railway, ajoutez un service **MySQL**.
Pensez à exécuter vos scripts de création de tables si nécessaire (via DBeaver ou l'interface Railway).

## 4. Vérification après déploiement
1. Connectez-vous à votre frontend.
2. Vérifiez que les annonces s'affichent (si non, vérifiez `NEXT_PUBLIC_API_URL`).
3. Vérifiez le chat (si non, vérifiez que le backend autorise l'origin du frontend).
