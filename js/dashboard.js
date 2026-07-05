import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { VIP_PLANS, getUserVIP, upgradeVIP } from './vip.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './wallet.js';

const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openMenu');
const closeBtn = document.getElementById('menuToggle');

if (openBtn) openBtn.addEventListener('click', () => sidebar.classList.add('open'));
if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

document.addEventListener('click', (e) => {
  if (sidebar && !sidebar.contains(e.target) && e.target !== openBtn) {
    sidebar.classList.remove('open');
  }
});

window.showSection = function(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  const link = document.querySelector(`[data-section="${id}"]`);
  if (link) link.classList.add('active');
  sidebar.classList.remove('open');
};

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  
  const emailEl = document.getElementById('userEmail');
  const profileEmailEl = document.getElementById('profileEmail');
  if (emailEl) emailEl.textContent = user.email;
  if (profileEmailEl) profileEmailEl.textContent = user.email;

  await initUserProfile(user);
  await loadDashboard(user);
  setupListingForm(user);
  setupWallet(user);
  setupVIP(user);
  setupProfile(user);
});

async function initUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      email: user.email,
      vipLevel: 'free',
      walletBalance: 0,
      createdAt: new Date().toISOString()
    });
  }
}

async function loadDashboard(user) {
  try {
    const balance = await getWalletBalance(user.uid);
    const vipLevel = await getUserVIP(user.uid);
    const plan = VIP_PLANS[vipLevel];

    const walletEl = document.getElementById('walletBalance');
    const vipEl = document.getElementById('vipBadge');
    const commEl = document.getElementById('commissionRate');
    if (walletEl) walletEl.textContent = balance + ' ETB';
    if (vipEl) vipEl.textContent = plan.badge + ' ' + plan.name;
    if (commEl) commEl.textContent = plan.commission + '%';

    const rentalsQ = query(collection(db, 'rentals'), where('renterId', '==', user.uid));
    const rentalsSnap = await getDocs(rentalsQ);
    const totalEl = document.getElementById('totalBookings');
    const activeEl = document.getElementById('activeBookings');
    if (totalEl) totalEl.textContent = rentalsSnap.size;
    let active = 0;
    rentalsSnap.forEach(d => { if (d.data().status === 'active') active++; });
    if (activeEl) activeEl.textContent = active;

    const listingsQ = query(collection(db, 'equipment'), where('ownerId', '==', user.uid));
    const listingsSnap = await getDocs(listingsQ);
    const listingsEl = document.getElementById('totalListings');
    if (listingsEl) listingsEl.textContent = listingsSnap.size;

    let totalEarned = 0;
    const earningsQ = query(collection(db, 'rentals'), where('ownerId', '==', user.uid), where('status', '==', 'completed'));
    const earningsSnap = await getDocs(earningsQ);
    earningsSnap.forEach(d => { totalEarned += d.data().ownerEarnings || 0; });
    const earnEl = document.getElementById('earnings');
    const totalEarnEl = document.getElementById('totalEarnings');
    if (earnEl) earnEl.textContent = totalEarned + ' ETB';
    if (totalEarnEl) totalEarnEl.textContent = totalEarned + ' ETB';

    await loadBrowse();
    await loadMyListings(user);
    await loadTransactions(user);
  } catch (e) { console.error(e); }
}

async function loadBrowse() {
  try {
    const snap = await getDocs(collection(db, 'equipment'));
    const grid = document.getElementById('equipmentList');
    if (!grid) return;
    if (snap.empty) { grid.innerHTML = '<p class="empty-msg">No equipment listed yet.</p>'; return; }
    grid.innerHTML = '';
    snap.forEach(d => {
      const eq = d.data();
      grid.innerHTML += `
        <div class="equip-card">
          <div class="equip-badge">${eq.category || 'Equipment'}</div>
          <h3>${eq.name}</h3>
          <p>📍 ${eq.location || 'Ethiopia'}</p>
          <p>💰 ${eq.pricePerDay} ETB/day</p>
          <p style="color:#64748B;font-size:0.85rem">${eq.description || ''}</p>
          <button class="action-btn" style="margin-top:10px" onclick="bookEquipment('${d.id}','${eq.name}',${eq.pricePerDay})">Book Now</button>
        </div>`;
    });
  } catch (e) { console.error(e); }
}

window.bookEquipment = async function(equipId, name, price) {
  const user = auth.currentUser;
  if (!user) return;
  const days = prompt(`Book "${name}" for how many days? (${price} ETB/day)`);
  if (!days || isNaN(days)) return;
  const total = price * Number(days);
  const confirm = window.confirm(`Total: ${total} ETB for ${days} days. Confirm?`);
  if (!confirm) return;
  try {
    await addDoc(collection(db, 'rentals'), {
      equipmentId: equipId,
      equipmentName: name,
      renterId: user.uid,
      renterEmail: user.email,
      days: Number(days),
      totalPrice: total,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    alert('Booking request sent! Owner will confirm shortly.');
  } catch (e) { alert('Error: ' + e.message); }
};

async function loadMyListings(user) {
  try {
    const q = query(collection(db, 'equipment'), where('ownerId', '==', user.uid));
    const snap = await getDocs(q);
    const container = document.getElementById('myListings');
    if (!container) return;
    if (snap.empty) { container.innerHTML = '<div class="empty-state"><p>📭 No listings yet</p><p style="color:#64748B;margin-top:10px">Add your first equipment!</p></div>'; return; }
    container.innerHTML = '';
    snap.forEach(d => {
      const eq = d.data();
      container.innerHTML += `
        <div class="equip-card">
          <div class="equip-badge">${eq.category}</div>
          <h3>${eq.name}</h3>
          <p>📍 ${eq.location}</p>
          <p>💰 ${eq.pricePerDay} ETB/day</p>
          <p style="color:#22C55E;font-size:0.85rem">✅ Active listing</p>
        </div>`;
    });
  } catch (e) { console.error(e); }
}

function setupListingForm(user) {
  const addBtn = document.getElementById('addListingBtn');
  const form = document.getElementById('addListingForm');
  const submitBtn = document.getElementById('submitListing');
  if (addBtn) addBtn.addEventListener('click', () => { form.style.display = form.style.display === 'none' ? 'block' : 'none'; });
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const name = document.getElementById('equipName').value;
      const category = document.getElementById('equipCategory').value;
      const price = document.getElementById('equipPrice').value;
      const location = document.getElementById('equipLocation').value;
      const desc = document.getElementById('equipDesc').value;
      if (!name || !price || !location) { alert('Please fill all fields.'); return; }
      try {
        await addDoc(collection(db, 'equipment'), {
          name, category, pricePerDay: Number(price), location,
          description: desc, ownerId: user.uid, ownerEmail: user.email,
          availability: 'available', createdAt: new Date().toISOString()
        });
        alert('Equipment listed successfully!');
        form.style.display = 'none';
        await loadMyListings(user);
        await loadBrowse();
      } catch (e) { alert('Error: ' + e.message); }
    });
  }
}

async function loadTransactions(user) {
  const history = await getTransactionHistory(user.uid);
  const container = document.getElementById('transactionHistory');
  if (!container) return;
  if (!history.length) { container.innerHTML = '<p style="color:#64748B">No transactions yet.</p>'; return; }
  container.innerHTML = history.map(t => `
    <div class="transaction-item">
      <span>${t.type === 'deposit' ? '⬆️ Deposit' : '⬇️ Withdrawal'}</span>
      <span>${t.amount} ETB</span>
      <span class="status-badge ${t.status}">${t.status}</span>
    </div>`).join('');
}

function setupWallet(user) {
  const depositBtn = document.getElementById('depositBtn');
  const withdrawBtn = document.getElementById('withdrawBtn');
  if (depositBtn) {
    depositBtn.addEventListener('click', async () => {
      const amount = prompt('Enter deposit amount (ETB):');
      if (!amount || isNaN(amount)) return;
      const result = await requestDeposit(user.uid, amount);
      alert(result.message);
      await loadDashboard(user);
    });
  }
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', async () => {
      const amount = prompt('Enter withdrawal amount (ETB):');
      if (!amount || isNaN(amount)) return;
      const result = await requestWithdrawal(user.uid, amount);
      alert(result.message);
      await loadDashboard(user);
    });
  }
}

function setupVIP(user) {
  const container = document.getElementById('vipPlans');
  if (!container) return;
  container.innerHTML = Object.entries(VIP_PLANS).map(([key, plan]) => `
    <div class="vip-card" style="border-color:${plan.color}">
      <div class="vip-badge" style="background:${plan.color}">${plan.badge} ${plan.name}</div>
      <p><strong>${plan.fee === 0 ? 'Free' : plan.fee + ' ETB/month'}</strong></p>
      <p>📋 ${plan.listings === 999 ? 'Unlimited' : plan.listings} listings</p>
      <p>💸 ${plan.commission}% commission</p>
      ${plan.fee > 0 ? `<button class="action-btn" style="background:${plan.color};margin-top:10px" onclick="activateVIP('${key}')">Activate</button>` : '<p style="color:#22C55E;margin-top:10px">✅ Current Plan</p>'}
    </div>`).join('');
}

window.activateVIP = async function(planKey) {
  const user = auth.currentUser;
  if (!user) return;
  const plan = VIP_PLANS[planKey];
  const confirm = window.confirm(`Activate ${plan.name} for ${plan.fee} ETB/month?`);
  if (!confirm) return;
  const result = await upgradeVIP(user.uid, planKey);
  alert(result.message);
  if (result.success) await loadDashboard(user);
};

function setupProfile(user) {
  const saveBtn = document.getElementById('saveProfile');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('profileName').value;
      const phone = document.getElementById('profilePhone').value;
      const city = document.getElementById('profileCity').value;
      try {
        await setDoc(doc(db, 'users', user.uid), { displayName: name, phone, city }, { merge: true });
        alert('Profile saved!');
      } catch (e) { alert('Error: ' + e.message); }
    });
  }
  getDoc(doc(db, 'users', user.uid)).then(d => {
    if (d.exists()) {
      const data = d.data();
      const nameEl = document.getElementById('profileName');
      const phoneEl = document.getElementById('profilePhone');
      const cityEl = document.getElementById('profileCity');
      if (nameEl && data.displayName) nameEl.value = data.displayName;
      if (phoneEl && data.phone) phoneEl.value = data.phone;
      if (cityEl && data.city) cityEl.value = data.city;
    }
  });
}
