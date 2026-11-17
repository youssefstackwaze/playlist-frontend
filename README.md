# Playlist Studio — Frontend Angular

Interface Angular 21 de l'API **Music Playlist Management** (dépôt backend séparé, Spring Boot).

Pages : Playlists (CRUD), détail d'une playlist (ajout / retrait / réordonnancement, recommandations, aperçu des 3 stratégies de shuffle, analyse, export JSON/M3U/PLS/CSV/XSPF), Catalogue, Smart playlist (créer + recommander + jouer), Lecteur global (mini-lecteur persistant en bas de page).

## Développement

Prérequis : Node 22+, et le backend lancé sur `http://localhost:8080`.

```bash
npm install
npm start          # http://localhost:4200 — proxy /api, /swagger-ui, /v3 -> localhost:8080 (proxy.conf.json)
npm run build      # build de production dans dist/frontend/browser
```

## URL de l'API

L'URL du backend est injectée **au build** via l'option Angular `define` (voir `src/app/core/config.ts`) :

- par défaut (`angular.json`) : `'/api'` → utilisé en dev avec le proxy ;
- en production : `npx ng build --define "API_BASE_URL='https://<backend>.onrender.com/api'"`.

Le backend doit autoriser l'origine du site (CORS) : par défaut en prod il accepte `https://*.onrender.com`.

## Structure

```
src/app/
  core/     api.service.ts (client HTTP typé), player.service.ts (état du lecteur global),
            error.interceptor.ts (toasts d'erreur), config.ts (URL de l'API), models.ts
  pages/    playlist-list, playlist-detail, song-catalog, smart-playlist, player-page
  shared/   player-bar (mini-lecteur), pipes duration / genreLabel
```

## Déploiement gratuit (Render, site statique)

`render.yaml` déclare un **Static Site** :

1. Pousser ce dépôt sur GitHub.
2. Render → **New → Blueprint** → choisir ce dépôt.
3. Renseigner `API_BASE_URL` = URL du backend + `/api` (ex. `https://playlist-musique-backend.onrender.com/api`). Si Render ne la demande pas : service → **Environment** → ajouter la variable → **Manual Deploy**.

Le site statique est servi par le CDN de Render (pas de mise en veille) ; les liens profonds (`/playlists/3`) sont réécrits vers `index.html`.
