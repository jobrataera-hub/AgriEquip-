import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

document.addEventListener('click', (e) => {
  if (sidebar && !sidebar.contains(e.target) && e.target !== menuToggle) {
    sidebar.classList.remove('open');
  }
});

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.section;
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    sections.forEach(s => {
      s.style.display = s.id === target ? 'block' : 'none';
    });
    sidebar.classList.remove('open');
  });
});

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = user.email;
    loadStats(user.uid);
  } else {
    window.location.href = 'login.html';
  }
});

async function loadStats(userId) {
  try {
    const q = query(collection(db, 'rentals'), where('renterId', '==', userId));
    const snap = await getDocs(q);
    const total = document.getElementById('totalBookings');
    const active = document.getElementById('activeBookings');
    if (total) total.textContent = snap.size;
    let activeCount = 0;
    snap.forEach(doc => { if (doc.data().status === 'active') activeCount++; });
    if (active) active.textContent = activeCount;
  } catch (e) {
    console.error(e);
  }
}
