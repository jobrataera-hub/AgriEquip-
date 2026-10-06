# AgriEquip — Base44 Dev Environment

## Project Overview
Static HTML/JS/CSS Firebase web app (no build step, no package.json).
Entry point: `index.html` → redirects to `splash.html` → `dashboard.html`.
Dashboard loads `js/app.js` as an ES module (`type="module"`), which imports `firebase.js`.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
Served by nginx:alpine on host port 3000. Source is bind-mounted read-only, so
file edits are reflected immediately on next request (no rebuild needed).

## Architecture
- **firebase.js** — Firebase init (auth + Firestore), exports `auth`, `db`, `app`.
  Uses Firebase 10.7.0 from gstatic CDN (ES modules).
- **js/app.js** — Main app logic (~179KB), loaded as ES module on dashboard.
  Exposes functions to `window._app` for HTML onclick handlers via bridge script.
- **dashboard.html** — Main app UI with bridge script delegating to `window._app`.
- **login.html** — Auth page (register/login).
- **splash.html** — Animated splash screen, redirects to login or dashboard.

## Verification
- `curl -s http://localhost:3000/index.html` returns the redirect page.
- `curl -s http://localhost:3000/dashboard.html` returns the dashboard.
- `node --check js/app.js` validates JS syntax (no build step).

## Firebase
Firebase config is hardcoded in `firebase.js` (public config, not secret).
The app connects to Firebase Auth + Firestore at runtime from the browser.
No server-side secrets are needed.
