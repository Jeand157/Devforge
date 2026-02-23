# LocalLoop Frontend

## 🎨 Design System

### Palette de Couleurs
- **Primaire** : Vert (#22c55e) - Solidarité et écologie
- **Secondaire** : Gris (#64748b) - Professionnel et moderne
- **Accents** : Blanc, vert clair, vert foncé

### Style
- **Approche** : Professionnel/Corporate avec animations fluides
- **Typographie** : Inter (Google Fonts)
- **Composants** : Tailwind CSS avec composants personnalisés

## 🚀 Fonctionnalités

### Page d'Accueil
- ✅ Hero section avec message inspirant
- ✅ Statistiques en temps réel
- ✅ Fonctionnalités principales (3 étapes)
- ✅ Témoignages utilisateurs
- ✅ Impact écologique
- ✅ Call-to-action final

### Authentification
- ✅ Connexion Email + Mot de passe
- ✅ Connexion Google OAuth
- ✅ Inscription complète (nom, email, username, password)
- ✅ Redirection automatique après connexion

### Navigation
- ✅ Menu responsive avec hamburger mobile
- ✅ Affichage du nom d'utilisateur
- ✅ Liens vers toutes les pages principales

### Annonces
- ✅ Liste des objets avec filtres
- ✅ Recherche par texte et catégorie
- ✅ Cards avec images, descriptions, localisation
- ✅ Statuts des objets (disponible, réservé, pris)

### Publication
- ✅ Formulaire complet avec validation
- ✅ Upload d'images drag & drop
- ✅ Catégories prédéfinies
- ✅ Géolocalisation automatique

### Carte Interactive
- ✅ OpenStreetMap et Google Maps
- ✅ Géolocalisation utilisateur
- ✅ Marqueurs pour les objets
- ✅ Filtres par recherche et catégorie
- ✅ Sidebar avec statistiques et conseils

### Chat
- ✅ Messages linéaires (style WhatsApp)
- ✅ Conversations privées
- ✅ Statut en ligne/hors ligne
- ✅ Socket.io pour temps réel
- ✅ Interface moderne avec avatars

### Profil
- ✅ Informations utilisateur
- ✅ Statistiques personnelles
- ✅ Activité récente
- ✅ Système de réalisations/badges
- ✅ Note et évaluations

## 🛠️ Technologies

- **Framework** : Next.js 14 avec App Router
- **Styling** : Tailwind CSS + CSS personnalisé
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Maps** : Leaflet + OpenStreetMap
- **Chat** : Socket.io Client
- **Auth** : NextAuth.js
- **Images** : Next.js Image Optimization

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Breakpoints : sm, md, lg, xl
- ✅ Navigation mobile avec menu hamburger
- ✅ Cards adaptatives
- ✅ Images responsives

## 🎯 Animations

- ✅ Fade-in et slide-up pour les sections
- ✅ Hover effects sur les boutons et cards
- ✅ Loading states avec spinners
- ✅ Transitions fluides entre les pages
- ✅ Animations de scroll (Intersection Observer)

## 🔧 Installation

```bash
cd apps/frontend
npm install
npm run dev
```

## 🌐 URLs

- **Développement** : http://localhost:3000
- **Pages** :
  - `/` - Accueil
  - `/login` - Connexion
  - `/register` - Inscription
  - `/items` - Annonces
  - `/publish` - Publier
  - `/map` - Carte
  - `/chat` - Chat
  - `/profile` - Profil

## 🎨 Composants Personnalisés

- `.btn-primary` - Bouton principal vert
- `.btn-secondary` - Bouton secondaire blanc
- `.btn-outline` - Bouton contour vert
- `.card` - Carte avec ombre et bordure
- `.input` - Champ de saisie stylisé
- `.gradient-text` - Texte avec dégradé vert
- `.hero-gradient` - Arrière-plan dégradé vert

## 📊 Performance

- ✅ Images optimisées avec Next.js
- ✅ Lazy loading des composants
- ✅ Code splitting automatique
- ✅ CSS purgé avec Tailwind
- ✅ Animations GPU-accélérées


