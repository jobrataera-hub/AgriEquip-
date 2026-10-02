# AgriEquip — Base44 dev notes

## What this app is
- Pure static site: HTML + CSS + vanilla JS modules. **No build step, no bundler, no backend server.**
- All data/auth go straight from the browser to Firebase (Auth, Firestore, Storage) using the config hardcoded in `firebase.js`. That config is a *public* Firebase web config — do not treat it as a secret and do not move it into env files.
- `index.html` immediately redirects to `splash.html` (first visit) or `dashboard.html` (if `sessionStorage.splashSeen`).

## Running here
- `docker compose -f docker-compose.base44.yml up -d` — nginx:alpine on host port **3000**, repo bind-mounted read-only at `/usr/share/nginx/html`. Edits to any file appear on a plain browser refresh; there is no hot-reload server by design (nothing to compile).
- Healthcheck probes `/splash.html` with busybox wget.

## Quirks / gotchas
- README_PHASE2 mentions `register.html` and `js/auth.js`, `js/equipment.js`, `js/booking.js`, `js/payment.js`, `js/dashboard.js` — **these files do not exist**. Only `js/app.js` and `js/admin.js` are present. Registration lives inline in `login.html`.
- `manifest.json` `start_url` points at `/AgriEquip-/splash.html` (GitHub Pages path), which 404s under this compose setup. The PWA itself isn't critical for the preview.
- Firebase auth flows that use OAuth/redirect (`signInWithPopup/Redirect`) can fail with `auth/unauthorized-domain` unless the preview origin is added to the Firebase project's authorized domains in the Firebase console. Email/password sign-in and Firestore reads generally work from any origin.
- `_index_redirect.html` and `.nojekyll` are GitHub Pages artifacts; ignore them.

## Verifying it works
- `curl -f localhost:3000/splash.html` should return the splash page.
- In the preview: `/` → splash → Get Started → login page renders; registering/creating a user exercises Firebase (needs the real Firebase project to be reachable).
