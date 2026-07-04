// Firebase Configuration
// Initialize Firebase with your credentials from Firebase Console

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

// TODO: Replace with your Firebase config from Firebase Console
// Go to Firebase Console > Project Settings > Web App > Config
const firebaseConfig = {

  apiKey: "AIzaSyDQL4d38G1ZQwARORaszwsf1YIRypKjP_M",
    authDomain: "agriequip-8124b.firebaseapp.com",
      projectId: "agriequip-8124b",
        storageBucket: "agriequip-8124b.appspot.com",
          messagingSenderId: "662047538853",
            appId: "1:662047538853:web:84dd49584bface153a174c"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);

            // Initialize Authentication with persistence
            const auth = getAuth(app);
            await setPersistence(auth, browserLocalPersistence);

            // Initialize Firestore
            const db = getFirestore(app);

            // Initialize Storage
            const storage = getStorage(app);

            export { auth, db, storage, app };
