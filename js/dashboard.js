import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { VIP_PLANS, getUserVIP, upgradeVIP } from './vip.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './wallet.js';

// ===== NAVIGATION HISTORY =====
const history = ['home'];
let currentIndex = 0;

// ===== SIDEBAR =====
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const openBtn = document.getElementById('openMenu');
const closeBtn = document.getElementById('menuToggle');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

if (openBtn) openBtn.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); });
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);

// ===== SECTION NAVIGATION =====
window.showSection = function(id) {
  document.querySelectorAll('.section').forEach(s => {
    s.style.display = 'none';
    s.style.animation = '';
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'block';
    el.style.animation = 'fadeUp 0.4s ease';
  }
  const link = document.querySelector(`[data-section="${id}"]`);
  if (link) link.classList.add('active');
  closeSidebar();
  // Update page title
  const titles = {
    home:'🏠 Home', browse:'🔍 Browse Equipment',
    bookings:'📅 My Bookings', listings:'📦 My Listings',
    wallet:'💳 Wallet', vip:'💎 VIP Plans',
    profile:'👤 Profile', earnings:'💰 Earnings'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[id] || 'AgriEquip';
  // History tracking
  if (history[currentIndex] !== id) {
    history.splice(currentIndex + 1);
    history.push(id);
    currentIndex = history.length - 1;
  }
  updateNavArrows();
};

function updateNavArrows() {
  const backBtn = document.getElementById('backBtn');
  const fwdBtn = document.getElementById('fwdBtn');
  if (backBtn) backBtn.style.opacity = currentIndex > 0 ? '1' : '0.3';
  if (fwdBtn) fwdBtn.style.opacity = currentIndex < history.length - 1 ? '1' : '0.3';
}

document.getElementById('backBtn')?.addEventListener('click', () => {
  if (currentIndex > 0) { currentIndex--; showSection(history[currentIndex]); }
});
document.getElementById('fwdBtn')?.addEventListener('click', () => {
  if (currentIndex < history.length - 1) { currentIndex++; showSection(history[currentIndex]); }
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); showSection(link.dataset.section); });
});

// ===== LOGOUT =====
document.querySelector('.logout-btn')?.addEventListener('click', async () => {
  if (confirm('Sign out of AgriEquip?')) {
    await signOut(auth);
    window.location.href = 'login.html';
  }
});

// ===== AUTH =====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const emailEl = document.getElementById('userEmail');
  const initialEl = document.getElementById('userInitial');
  const profileEmailEl = document.getElementById('profileEmail');
  if (emailEl) emailEl.textContent = user.email;
  if (initialEl) initialEl.textContent = user.email[0].toUpperCase();
  if (profileEmailEl) profileEmailEl.textContent = user.email;
  await initUser(user);
  await loadAll(user);
  setupForms(user);
});

async function initUser(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      vipLevel: 'free',
      walletBalance: 0,
      createdAt: new Date().toISOString()
    });
  }
}

async function loadAll(user) {
  await Promise.all([
    loadStats(user),
    loadBrowse(),
    loadMyListings(user),
    loadBookings(user),
    loadWallet(user),
    loadVIP(user),
    loadEarnings(user),
    loadProfile(user)
  ]);
}

// ===== STATS =====
async function loadStats(user) {
  try {
    const vipLevel = await getUserVIP(user.uid);
    const plan = VIP_PLANS[vipLevel];
    const balance = await getWalletBalance(user.uid);
    el('vipBadge', plan.badge + ' ' + plan.name);
    el('commissionRate', plan.commission + '%');
    el('walletBalance', balance + ' ETB');
    el('walletBalanceHome', balance + ' ETB');
    const rentalsSnap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    let active = 0;
    rentalsSnap.forEach(d => { if (d.data().status === 'active') active++; });
    el('totalBookings', rentalsSnap.size);
    el('activeBookings', active);
    const listSnap = await getDocs(query(collection(db, 'equipment'), where('ownerId', '==', user.uid)));
    el('totalListings', listSnap.size);
  } catch (e) { console.error(e); }
}

function el(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val;
}

// ===== BROWSE =====
async function loadBrowse() {
  const grid = document.getElementById('equipmentList');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(collection(db, 'equipment'));
    if (snap.empty) {
      grid.innerHTML = '<div class="empty-state"><p>🚜</p><p>No equipment listed yet</p><p style="font-size:0.82rem;margin-top:8px">Be the first to list your equipment!</p></div>';
      return;
    }
    grid.innerHTML = '';
    snap.forEach(d => {
      const q = d.data();
      grid.innerHTML += `
      <div class="equip-card">
        <div class="equip-badge">${getCategoryEmoji(q.category)} ${q.category||'Equipment'}</div>
        <h3>${q.name}</h3>
        <p>📍 ${q.location||'Ethiopia'}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1rem;margin:6px 0">${q.pricePerDay} ETB<span style="color:#64748B;font-weight:400;font-size:0.8rem">/day</span></p>
        <p style="color:#64748B;font-size:0.82rem;margin-bottom:10px">${q.description||''}</p>
        <button class="action-btn" onclick="bookEquipment('${d.id}','${q.name}',${q.pricePerDay},'${q.ownerId}')">📅 Book Now</button>
      </div>`;
    });
  } catch (e) { grid.innerHTML = '<p class="empty-msg">Error loading equipment.</p>'; }
}

function getCategoryEmoji(cat) {
  const map = {tractor:'🚜',plow:'⚙️',harvester:'🌾',irrigation:'💧',other:'📦'};
  return map[cat]||'📦';
}

// Search & Filter
document.getElementById('searchInput')?.addEventListener('input', filterEquipment);
document.getElementById('categoryFilter')?.addEventListener('change', filterEquipment);

function filterEquipment() {
  const search = document.getElementById('searchInput')?.value.toLowerCase()||'';
  const cat = document.getElementById('categoryFilter')?.value||'';
  document.querySelectorAll('.equip-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    const catMatch = !cat || text.includes(cat);
    const searchMatch = !search || text.includes(search);
    card.style.display = catMatch && searchMatch ? 'block' : 'none';
  });
}

window.bookEquipment = async function(equipId, name, price, ownerId) {
  const user = auth.currentUser;
  if (!user) return;
  if (ownerId === user.uid) { alert("You can't book your own equipment."); return; }
  const days = prompt(`📅 Book "${name}"\n💰 ${price} ETB/day\n\nHow many days?`);
  if (!days || isNaN(days) || Number(days) < 1) return;
  const total = price * Number(days);
  if (!confirm(`Confirm booking:\n📦 ${name}\n📅 ${days} days\n💰 Total: ${total} ETB`)) return;
  try {
    await addDoc(collection(db, 'rentals'), {
      equipmentId: equipId, equipmentName: name,
      renterId: user.uid, renterEmail: user.email,
      ownerId, days: Number(days), totalPrice: total,
      status: 'pending', createdAt: new Date().toISOString()
    });
    alert('✅ Booking request sent! The owner will confirm shortly.');
    await loadStats(user);
  } catch (e) { alert('Error: ' + e.message); }
};

// ===== BOOKINGS =====
async function loadBookings(user) {
  const container = document.getElementById('bookingsList');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><p>📭</p><p>No bookings yet</p><button class="action-btn" style="margin-top:15px;max-width:200px" onclick="showSection(\'browse\')">Browse Equipment</button></div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(d => {
      const b = d.data();
      const statusColor = {pending:'#F59E0B',active:'#22C55E',completed:'#06B6D4',cancelled:'#EF4444'}[b.status]||'#64748B';
      container.innerHTML += `
      <div class="section-card" style="border-left:4px solid ${statusColor}">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <h3 style="font-size:1rem">${b.equipmentName}</h3>
            <p style="color:#64748B;font-size:0.82rem;margin-top:4px">📅 ${b.days} days • 💰 ${b.totalPrice} ETB</p>
            <p style="color:#64748B;font-size:0.78rem;margin-top:2px">🕐 ${new Date(b.createdAt).toLocaleDateString()}</p>
          </div>
          <span class="status-badge ${b.status}" style="background:${statusColor}22;color:${statusColor}">${b.status}</span>
        </div>
      </div>`;
    });
  } catch (e) { container.innerHTML = '<p class="empty-msg">Error loading bookings.</p>'; }
}

// ===== MY LISTINGS =====
async function loadMyListings(user) {
  const container = document.getElementById('myListings');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'equipment'), where('ownerId', '==', user.uid)));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><p>📦</p><p>No listings yet</p><p style="font-size:0.82rem;margin-top:8px">Add your first equipment to start earning!</p></div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(d => {
      const eq = d.data();
      container.innerHTML += `
      <div class="equip-card">
        <div class="equip-badge">${getCategoryEmoji(eq.category)} ${eq.category}</div>
        <h3>${eq.name}</h3>
        <p>📍 ${eq.location}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1rem;margin:6px 0">${eq.pricePerDay} ETB/day</p>
        <p style="color:#22C55E;font-size:0.82rem">✅ Active listing</p>
      </div>`;
    });
  } catch (e) { console.error(e); }
}

// ===== WALLET =====
async function loadWallet(user) {
  try {
    const balance = await getWalletBalance(user.uid);
    el('walletBalance', balance + ' ETB');
    await loadTransactions(user);
  } catch (e) { console.error(e); }
}

async function loadTransactions(user) {
  const container = document.getElementById('transactionHistory');
  if (!container) return;
  try {
    const history = await getTransactionHistory(user.uid);
    if (!history.length) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><p>📊</p><p style="font-size:0.9rem">No transactions yet</p></div>';
      return;
    }
    container.innerHTML = history.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(t => `
    <div class="transaction-item">
      <div>
        <p style="font-weight:600;font-size:0.88rem">${t.type==='deposit'?'⬆️ Deposit':'⬇️ Withdrawal'}</p>
        <p style="color:#64748B;font-size:0.75rem">${new Date(t.createdAt).toLocaleDateString()}</p>
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;color:${t.type==='deposit'?'#22C55E':'#EF4444'}">${t.type==='deposit'?'+':'-'}${t.amount} ETB</p>
        <span class="status-badge ${t.status}">${t.status}</span>
      </div>
    </div>`).join('');
  } catch (e) { console.error(e); }
}

// ===== VIP =====
async function loadVIP(user) {
  const container = document.getElementById('vipPlans');
  if (!container) return;
  const currentVIP = await getUserVIP(user.uid);
  const balance = await getWalletBalance(user.uid);
  container.innerHTML = Object.entries(VIP_PLANS).map(([key, plan]) => {
    const isCurrent = key === currentVIP;
    const canAfford = balance >= plan.fee;
    return `
    <div class="vip-card" style="border-color:${plan.color};${isCurrent?'background:'+plan.color+'11':''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="vip-badge" style="background:${plan.color}">${plan.badge} ${plan.name}</div>
        ${isCurrent?'<span style="color:#22C55E;font-weight:700;font-size:0.82rem">✅ ACTIVE</span>':''}
      </div>
      <ul class="vip-features">
        <li>💰 ${plan.fee===0?'Free':'Monthly fee: '+plan.fee+' ETB'}</li>
        <li>📋 ${plan.listings===999?'Unlimited':plan.listings} equipment listings</li>
        <li>💸 ${plan.commission}% commission per rental</li>
        <li>🏅 ${plan.name} seller badge</li>
      </ul>
      ${!isCurrent && plan.fee > 0 ? `
        <button class="action-btn" style="background:${plan.color};margin-top:12px;${!canAfford?'opacity:0.6':''}" onclick="activateVIP('${key}','${plan.name}',${plan.fee})">
          ${canAfford?'✅ Activate '+plan.name:'💳 Need '+plan.fee+' ETB'}
        </button>` : isCurrent ? '' : '<p style="color:#22C55E;font-size:0.85rem;margin-top:10px">✅ Your current free plan</p>'}
    </div>`;
  }).join('');
}

window.activateVIP = async function(planKey, planName, fee) {
  const user = auth.currentUser;
  if (!user) return;
  const balance = await getWalletBalance(user.uid);
  if (balance < fee) {
    alert(`❌ Insufficient balance.\nYou need ${fee} ETB but have ${balance} ETB.\nPlease deposit first.`);
    showSection('wallet');
    return;
  }
  if (!confirm(`Activate ${planName} for ${fee} ETB/month?\nThis will be deducted from your wallet.`)) return;
  const result = await upgradeVIP(user.uid, planKey);
  alert(result.success ? '🎉 ' + result.message : '❌ ' + result.message);
  if (result.success) { await loadAll(user); }
};

// ===== EARNINGS =====
async function loadEarnings(user) {
  try {
    let total = 0, pending = 0, completed = 0;
    const snap = await getDocs(query(collection(db, 'rentals'), where('ownerId', '==', user.uid)));
    snap.forEach(d => {
      const r = d.data();
      if (r.status === 'completed') { total += (r.ownerEarnings||0); completed++; }
      if (r.status === 'active') pending += (r.totalPrice||0);
    });
    el('totalEarnings', total + ' ETB');
    el('pendingEarnings', pending + ' ETB');
    el('completedRentals', completed);
    el('earnings', total + ' ETB');
    const vipLevel = await getUserVIP(user.uid);
    const commission = VIP_PLANS[vipLevel].commission;
    el('commissionPaid', Math.round(total * commission / 100) + ' ETB');
  } catch (e) { console.error(e); }
}

// ===== PROFILE =====
async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      const nameEl = document.getElementById('profileName');
      const phoneEl = document.getElementById('profilePhone');
      const cityEl = document.getElementById('profileCity');
      if (nameEl && data.displayName) nameEl.value = data.displayName;
      if (phoneEl && data.phone) phoneEl.value = data.phone;
      if (cityEl && data.city) cityEl.value = data.city;
    }
  } catch (e) { console.error(e); }
}

// ===== FORMS SETUP =====
function setupForms(user) {
  // Listing form
  document.getElementById('addListingBtn')?.addEventListener('click', () => {
    const form = document.getElementById('addListingForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('submitListing')?.addEventListener('click', async () => {
    const name = document.getElementById('equipName')?.value.trim();
    const category = document.getElementById('equipCategory')?.value;
    const price = document.getElementById('equipPrice')?.value;
    const location = document.getElementById('equipLocation')?.value.trim();
    const desc = document.getElementById('equipDesc')?.value.trim();
    if (!name||!price||!location) { alert('Please fill all required fields.'); return; }
    try {
      await addDoc(collection(db, 'equipment'), {
        name, category, pricePerDay: Number(price),
        location, description: desc,
        ownerId: user.uid, ownerEmail: user.email,
        availability: 'available',
        createdAt: new Date().toISOString()
      });
      alert('✅ Equipment listed successfully!');
      document.getElementById('addListingForm').style.display = 'none';
      document.getElementById('equipName').value = '';
      document.getElementById('equipPrice').value = '';
      document.getElementById('equipLocation').value = '';
      document.getElementById('equipDesc').value = '';
      await loadMyListings(user);
      await loadBrowse();
      await loadStats(user);
    } catch (e) { alert('Error: ' + e.message); }
  });

  // Wallet
  document.getElementById('depositBtn')?.addEventListener('click', async () => {
    const amount = prompt('💰 Enter deposit amount (ETB):\n\nMinimum: 100 ETB');
    if (!amount || isNaN(amount) || Number(amount) < 100) { alert('Minimum deposit is 100 ETB'); return; }
    const result = await requestDeposit(user.uid, amount);
    alert(result.success ? '✅ ' + result.message : '❌ ' + result.message);
    if (result.success) await loadWallet(user);
  });

  document.getElementById('withdrawBtn')?.addEventListener('click', async () => {
    const balance = await getWalletBalance(user.uid);
    const amount = prompt(`💰 Enter withdrawal amount (ETB):\n\nAvailable: ${balance} ETB`);
    if (!amount || isNaN(amount)) return;
    const result = await requestWithdrawal(user.uid, amount);
    alert(result.success ? '✅ ' + result.message : '❌ ' + result.message);
    if (result.success) await loadWallet(user);
  });

  // Profile save
  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName')?.value;
    const phone = document.getElementById('profilePhone')?.value;
    const city = document.getElementById('profileCity')?.value;
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: name, phone, city }, { merge: true });
      alert('✅ Profile saved successfully!');
    } catch (e) { alert('Error: ' + e.message); }
  });
}
