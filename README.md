# LocalLoop (Web)

Monorepo Next.js (frontend) + Express (backend) + Socket.io. Map via Leaflet. Optional DB: Postgres+PostGIS (Docker compose included). MVP stores data in-memory so you can run instantly.

## Setup
1) Install dependencies
- `npm install`

2) (Optional) Start Postgres+PostGIS
- `docker compose up -d db`

3) Env files
- Frontend: create `apps/frontend/.env.local`
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=dev-secret
```
- Backend: create `apps/backend/.env`
```
PORT=4000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

4) Run both apps
- `npm run dev`
- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/api/health

## Features
- Items API: geofilter by radius, create items, update status (reserved, given)
- Map with markers and radius filter
- Publish form (requires login)
- Real-time chat (Socket.io)
- Upload image (Cloudinary signed)
- PWA basics: manifest + service worker caches item requests
- Auth: Google (NextAuth v5)

## Pages
- `/` Carte + annonces + filtre rayon
- `/publish` Publier un objet (auth requise)
- `/upload` Uploader une image (Cloudinary)
- `/chat` Démarrer une conversation → `/chat/[id]`
- `/profile` Statistiques personnelles

## Key API endpoints (backend)
- GET `/api/items?lat&lon&radius`
- POST `/api/items`
- POST `/api/items/:id/status`
- POST `/api/conversations`
- GET `/api/conversations/:id/messages`
- POST `/api/conversations/:id/messages`
- GET `/api/users/me/stats`
- POST `/api/uploads/sign` (signature Cloudinary)

## Deploy
- Frontend: Vercel (`apps/frontend`)
- Backend: Railway/Render/Heroku (`apps/backend`)
