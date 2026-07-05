import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('userEmail').textContent = user.email;
    loadDashboardData(user.uid);
  } else {
    window.location.href = 'login.html';
  }
});

async function loadDashboardData(userId) {
  try {
    const rentalsRef = collection(db, 'rentals');
    const q = query(rentalsRef, where('renterId', '==', userId));
    const snapshot = await getDocs(q);
    document.getElementById('totalBookings').textContent = snapshot.size;
    let active = 0;
    snapshot.forEach(doc => {
      if (doc.data().status === 'active') active++;
    });
    document.getElementById('activeBookings').textContent = active;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}
