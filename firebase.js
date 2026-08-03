import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { initializeFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDQL4d38G1ZQwARORaszwsf1YIRypKjP_M",
  authDomain: "agriequip-8124b.firebaseapp.com",
  projectId: "agriequip-8124b",
  storageBucket: "agriequip-8124b.appspot.com",
  messagingSenderId: "662047538853",
  appId: "1:662047538853:web:84dd49584bface153a174c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auto-detects whether this network blocks Firestore's normal streaming
// connection (common on some mobile carriers/proxies) and falls back to
// long-polling automatically — targets the exact symptom we confirmed:
// writes hang indefinitely while reads work fine.
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});

setPersistence(auth, browserLocalPersistence).catch(e =>
  console.warn('Auth persistence:', e)
);

export { auth, db, app };
