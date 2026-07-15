import { auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// This file just checks auth state on dashboard pages
// Login/register logic lives in login.html directly

onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname.split('/').pop();
  if (!user && currentPage === 'dashboard.html') {
    window.location.href = 'login.html';
  }
});
