import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

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
const db = getFirestore(app);
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(e => console.warn('Auth persistence:', e));

enableIndexedDbPersistence(db).catch(e => {
  if (e.code === 'failed-precondition') console.warn('Multiple tabs open');
  else if (e.code === 'unimplemented') console.warn('Browser not supported');
});

export { auth, db, storage, app };
