import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { VIP_PLANS, getUserVIP, upgradeVIP } from './vip.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './wallet.js';

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('agriequip-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === saved);
  });
}
window.setTheme = function(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('agriequip-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
};
initTheme();

window.clearCache = function() {
  if (confirm('Clear cache and reload?')) {
    localStorage.removeItem('agriequip-theme');
    location.reload();
  }
};

window.setLanguage = function(lang) {
  localStorage.setItem('agriequip-lang', lang);
  alert(lang === 'am' ? 'አማርኛ በቅርቡ ይጨመራል!' : 'Language set to English');
};

// ===== NAVIGATION =====
const navHistory = ['home'];
let navIndex = 0;

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

document.getElementById('openMenu')?.addEventListener('click', (e) => { e.stopPropagation(); openSidebar(); });
document.getElementById('menuToggle')?.addEventListener('click', closeSidebar);
document.getElementById('overlay')?.addEventListener('click', closeSidebar);

window.showSection = function(id) {
  document.querySelectorAll('.section').forEach(s => { s.style.display = 'none'; });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.style.animation = 'fadeUp 0.4s ease'; }
  const link = document.querySelector(`[data-section="${id}"]`);
  if (link) link.classList.add('active');
  closeSidebar();
  const titles = {
    home:'🏠 Home', browse:'🔍 Browse Equipment',
    bookings:'📅 My Bookings', listings:'📦 My Listings',
    wallet:'💳 Wallet', vip:'💎 VIP Plans',
    earnings:'💰 Earnings', profile:'👤 Profile',
    settings:'⚙️ Settings', about:'ℹ️ About & Legal'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[id] || 'AgriEquip';
  if (navHistory[navIndex] !== id) {
    navHistory.splice(navIndex + 1);
    navHistory.push(id);
    navIndex = navHistory.length - 1;
  }
  updateArrows();
};

function updateArrows() {
  const backBtn = document.getElementById('backBtn');
  const fwdBtn = document.getElementById('fwdBtn');
  if (backBtn) backBtn.style.opacity = navIndex > 0 ? '1' : '0.3';
  if (fwdBtn) fwdBtn.style.opacity = navIndex < navHistory.length - 1 ? '1' : '0.3';
}

document.getElementById('backBtn')?.addEventListener('click', () => {
  if (navIndex > 0) { navIndex--; showSection(navHistory[navIndex]); }
});
document.getElementById('fwdBtn')?.addEventListener('click', () => {
  if (navIndex < navHistory.length - 1) { navIndex++; showSection(navHistory[navIndex]); }
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); showSection(link.dataset.section); });
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (confirm('Sign out of AgriEquip?')) {
    await signOut(auth);
    window.location.href = 'login.html';
  }
});

// ===== AUTH =====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  el('userEmail', user.email);
  el('userInitial', user.email[0].toUpperCase());
  el('profileEmail', user.email);
  await initUser(user);
  await loadAll(user);
  setupForms(user);
});

async function initUser(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const referralCode = 'AGR-' + user.uid.substring(0, 6).toUpperCase();
    await setDoc(ref, {
      email: user.email,
      vipLevel: 'free',
      walletBalance: 0,
      referralCode,
      referralCount: 0,
      createdAt: new Date().toISOString()
    });
  }
}

function el(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val;
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
    el('profileVIP', plan.badge + ' ' + plan.name + ' Member');

    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      const referralCode = userSnap.data().referralCode || 'AGR-' + user.uid.substring(0, 6).toUpperCase();
      el('referralCode', referralCode);
      el('profileReferral', '🎁 Referral: ' + referralCode);
    }

    const rentalsSnap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    let active = 0;
    rentalsSnap.forEach(d => { if (d.data().status === 'active') active++; });
    el('totalBookings', rentalsSnap.size);
    el('activeBookings', active);

    const listSnap = await getDocs(query(collection(db, 'equipment'), where('ownerId', '==', user.uid)));
    el('totalListings', listSnap.size);
    el('earningsListings', listSnap.size);
  } catch (e) { console.error(e); }
}

window.copyReferral = function() {
  const code = document.getElementById('referralCode')?.textContent;
  if (code) {
    navigator.clipboard.writeText(code).then(() => alert('✅ Referral code copied!\nShare: ' + code));
  }
};

// ===== BROWSE =====
async function loadBrowse() {
  const grid = document.getElementById('equipmentList');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(collection(db, 'equipment'));
    if (snap.empty) {
      grid.innerHTML = '<div class="empty-state"><p>🚜</p><p>No equipment listed yet</p><p style="font-size:0.82rem;margin-top:8px">Be the first to list equipment!</p><button class="action-btn" style="margin-top:15px;max-width:200px" onclick="showSection(\'listings\')">➕ Add Listing</button></div>';
      return;
    }
    grid.innerHTML = '';
    snap.forEach(d => {
      const q = d.data();
      grid.innerHTML += `
      <div class="equip-card">
        <div class="equip-badge">${getCatEmoji(q.category)} ${q.category||'Equipment'}</div>
        <h3>${q.name}</h3>
        <p style="font-size:0.82rem;margin:4px 0">📍 ${q.location||'Ethiopia'}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1.1rem;margin:8px 0">${q.pricePerDay} ETB<span style="color:#64748B;font-weight:400;font-size:0.78rem">/day</span></p>
        ${q.description ? `<p style="color:#64748B;font-size:0.8rem;margin-bottom:10px">${q.description}</p>` : ''}
        <button class="action-btn" onclick="bookEquipment('${d.id}','${q.name}',${q.pricePerDay},'${q.ownerId}')">📅 Book Now</button>
      </div>`;
    });
  } catch (e) { grid.innerHTML = '<p class="empty-msg">Error loading. Check connection.</p>'; console.error(e); }
}

function getCatEmoji(cat) {
  return {tractor:'🚜',plow:'⚙️',harvester:'🌾',irrigation:'💧',other:'📦'}[cat]||'📦';
}

document.getElementById('searchInput')?.addEventListener('input', filterEquipment);
document.getElementById('categoryFilter')?.addEventListener('change', filterEquipment);

function filterEquipment() {
  const search = document.getElementById('searchInput')?.value.toLowerCase()||'';
  const cat = document.getElementById('categoryFilter')?.value||'';
  document.querySelectorAll('.equip-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!search||text.includes(search)) && (!cat||text.includes(cat)) ? 'block' : 'none';
  });
}

window.bookEquipment = async function(equipId, name, price, ownerId) {
  const user = auth.currentUser;
  if (!user) return;
  if (ownerId === user.uid) { alert("❌ You can't book your own equipment."); return; }
  const days = prompt(`📅 Book "${name}"\n💰 ${price} ETB/day\n\nHow many days?`);
  if (!days || isNaN(days) || Number(days) < 1) return;
  const total = price * Number(days);
  if (!confirm(`Confirm Booking:\n📦 ${name}\n📅 ${days} day(s)\n💰 Total: ${total} ETB\n\nProceed?`)) return;
  try {
    await addDoc(collection(db, 'rentals'), {
      equipmentId: equipId, equipmentName: name,
      renterId: user.uid, renterEmail: user.email,
      ownerId, days: Number(days), totalPrice: total,
      status: 'pending', createdAt: new Date().toISOString()
    });
    alert('✅ Booking request sent!\nThe owner will confirm shortly.');
    await loadStats(user);
  } catch (e) { alert('❌ Error: ' + e.message); }
};

// ===== BOOKINGS =====
async function loadBookings(user) {
  const container = document.getElementById('bookingsList');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><p>📭</p><p>No bookings yet</p><button class="action-btn" style="margin-top:15px;max-width:200px" onclick="showSection(\'browse\')">🔍 Browse Equipment</button></div>';
      return;
    }
    container.innerHTML = '';
    snap.forEach(d => {
      const b = d.data();
      const colors = {pending:'#F59E0B',active:'#22C55E',completed:'#06B6D4',cancelled:'#EF4444'};
      const color = colors[b.status]||'#64748B';
      container.innerHTML += `
      <div class="section-card" style="border-left:4px solid ${color};margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
          <div>
            <h3 style="font-size:0.95rem">${b.equipmentName}</h3>
            <p style="color:#64748B;font-size:0.8rem;margin-top:4px">📅 ${b.days} day(s) • 💰 ${b.totalPrice} ETB</p>
            <p style="color:#64748B;font-size:0.75rem;margin-top:2px">🕐 ${new Date(b.createdAt).toLocaleDateString()}</p>
          </div>
          <span style="background:${color}22;color:${color};padding:4px 10px;border-radius:50px;font-size:0.72rem;font-weight:700;white-space:nowrap">${b.status.toUpperCase()}</span>
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
        <div class="equip-badge">${getCatEmoji(eq.category)} ${eq.category}</div>
        <h3>${eq.name}</h3>
        <p style="font-size:0.82rem;margin:4px 0">📍 ${eq.location}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1rem;margin:6px 0">${eq.pricePerDay} ETB/day</p>
        <p style="color:#22C55E;font-size:0.8rem">✅ Active listing</p>
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
    const hist = await getTransactionHistory(user.uid);
    if (!hist.length) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><p>📊</p><p style="font-size:0.85rem">No transactions yet</p></div>';
      return;
    }
    container.innerHTML = hist.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => `
    <div class="transaction-item">
      <div>
        <p style="font-weight:600;font-size:0.85rem">${t.type==='deposit'?'⬆️ Deposit':'⬇️ Withdrawal'}</p>
        <p style="color:#64748B;font-size:0.75rem">${new Date(t.createdAt).toLocaleDateString()} • ${t.bankName||'AgriEquip Wallet'}</p>
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;color:${t.type==='deposit'?'#22C55E':'#EF4444'}">${t.type==='deposit'?'+':'-'}${t.amount} ETB</p>
        <span style="font-size:0.7rem;padding:2px 8px;border-radius:50px;font-weight:700;background:${t.status==='pending'?'#FEF9C3':t.status==='approved'?'#DCFCE7':'#FEE2E2'};color:${t.status==='pending'?'#F59E0B':t.status==='approved'?'#22C55E':'#EF4444'}">${t.status}</span>
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
    <div class="vip-card" style="border-color:${plan.color};${isCurrent?'box-shadow:0 0 20px '+plan.color+'44':''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="vip-badge" style="background:${plan.color}">${plan.badge} ${plan.name}</div>
        ${isCurrent?'<span style="background:#DCFCE7;color:#22C55E;padding:3px 10px;border-radius:50px;font-size:0.72rem;font-weight:700">✅ ACTIVE</span>':''}
      </div>
      <ul class="vip-features">
        <li>💰 ${plan.fee===0?'<strong>Free forever</strong>':'<strong>'+plan.fee+' ETB</strong>/month'}</li>
        <li>📋 <strong>${plan.listings===999?'Unlimited':plan.listings}</strong> equipment listings</li>
        <li>💸 Only <strong>${plan.commission}%</strong> commission per rental</li>
        <li>🏅 ${plan.name} verified seller badge</li>
      </ul>
      ${!isCurrent && plan.fee > 0 ? `
      <div style="margin-top:12px">
        <button class="action-btn" style="background:${plan.color}" onclick="activateVIP('${key}','${plan.name}',${plan.fee})">
          ${canAfford ? '✅ Activate '+plan.name : '💳 Deposit '+plan.fee+' ETB to unlock'}
        </button>
        ${!canAfford ? '<button class="action-btn" style="background:#8B5CF6;margin-top:8px" onclick="showSection(\'wallet\')">⬆️ Deposit Now</button>' : ''}
      </div>` : isCurrent ? '' : '<p style="color:#22C55E;font-size:0.85rem;margin-top:10px;font-weight:600">✅ Your current free plan</p>'}
    </div>`;
  }).join('');
}

window.activateVIP = async function(planKey, planName, fee) {
  const user = auth.currentUser;
  if (!user) return;
  const balance = await getWalletBalance(user.uid);
  if (balance < fee) {
    const goDeposit = confirm(`❌ Insufficient balance!\n\nYou need: ${fee} ETB\nYour balance: ${balance} ETB\nShortfall: ${fee-balance} ETB\n\nGo to Wallet to deposit?`);
    if (goDeposit) showSection('wallet');
    return;
  }
  if (!confirm(`Activate ${planName}?\n💰 Cost: ${fee} ETB/month\nThis will be deducted from your wallet.\n\nConfirm?`)) return;
  const result = await upgradeVIP(user.uid, planKey);
  alert(result.success ? '🎉 ' + result.message : '❌ ' + result.message);
  if (result.success) await loadAll(user);
};

// ===== EARNINGS =====
async function loadEarnings(user) {
  try {
    let total = 0, pending = 0, completed = 0;
    const snap = await getDocs(query(collection(db, 'rentals'), where('ownerId', '==', user.uid)));
    const histContainer = document.getElementById('earningsHistoryList');
    if (snap.empty) {
      if (histContainer) histContainer.innerHTML = '<div class="empty-state" style="padding:20px"><p>💰</p><p style="font-size:0.85rem">No rental earnings yet</p><p style="color:#64748B;font-size:0.78rem;margin-top:8px">List equipment to start earning!</p><button class="action-btn" style="margin-top:12px;max-width:200px" onclick="showSection(\'listings\')">📦 List Equipment</button></div>';
      el('totalEarnings', '0 ETB');
      el('pendingEarnings', '0 ETB');
      el('completedRentals', '0');
      el('commissionPaid', '0 ETB');
      el('earnings', '0 ETB');
      return;
    }
    let html = '';
    const vipLevel = await getUserVIP(user.uid);
    const commission = VIP_PLANS[vipLevel].commission;
    snap.forEach(d => {
      const r = d.data();
      const earn = r.ownerEarnings || Math.round(r.totalPrice * (1 - commission/100));
      if (r.status === 'completed') { total += earn; completed++; }
      if (r.status === 'active') pending += (r.totalPrice||0);
      html += `
      <div class="transaction-item">
        <div>
          <p style="font-weight:600;font-size:0.85rem">📦 ${r.equipmentName}</p>
          <p style="color:#64748B;font-size:0.75rem">${r.days} day(s) • ${new Date(r.createdAt).toLocaleDateString()}</p>
        </div>
        <div style="text-align:right">
          <p style="font-weight:700;color:#22C55E">+${earn} ETB</p>
          <span style="font-size:0.7rem;padding:2px 8px;border-radius:50px;font-weight:700;background:${r.status==='completed'?'#DCFCE7':r.status==='active'?'#DBEAFE':'#FEF9C3'};color:${r.status==='completed'?'#22C55E':r.status==='active'?'#3B82F6':'#F59E0B'}">${r.status}</span>
        </div>
      </div>`;
    });
    if (histContainer) histContainer.innerHTML = html;
    el('totalEarnings', total + ' ETB');
    el('earnings', total + ' ETB');
    el('pendingEarnings', pending + ' ETB');
    el('completedRentals', completed);
    el('commissionPaid', Math.round(total * commission / (100 - commission)) + ' ETB');
  } catch (e) { console.error(e); }
}

// ===== PROFILE =====
async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      const fields = {profileName:'displayName', profilePhone:'phone', profileCity:'city', profileReferralInput:'usedReferral'};
      Object.entries(fields).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (el && data[key]) el.value = data[key];
      });
    }
  } catch (e) { console.error(e); }
}

// ===== FORMS =====
function setupForms(user) {
  document.getElementById('addListingBtn')?.addEventListener('click', () => {
    const form = document.getElementById('addListingForm');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('submitListing')?.addEventListener('click', async () => {
    const name = document.getElementById('equipName')?.value;
    const price = document.getElementById('equipPrice')?.value;
    const location = document.getElementById('equipLocation')?.value.trim();
    const desc = document.getElementById('equipDesc')?.value.trim();
    if (!name||!price||!location) { alert('⚠️ Please fill all required fields.'); return; }
    try {
      await addDoc(collection(db, 'equipment'), {
        name, category, pricePerDay: Number(price),
        location, description: desc,
        ownerId: user.uid, ownerEmail: user.email,
        availability: 'available', createdAt: new Date().toISOString()
      });
      alert('✅ Equipment listed successfully!');
      document.getElementById('addListingForm').style.display = 'none';
      ['equipName','equipPrice','equipLocation','equipDesc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      await loadMyListings(user);
      await loadBrowse();
      await loadStats(user);
    } catch (e) { alert('❌ Error: ' + e.message); }
  });

  document.getElementById('depositBtn')?.addEventListener('click', async () => {
    const banks = ['CBE','Awash Bank','Dashen Bank','Abyssinia Bank','Telebirr','M-Pesa'];
    const bankChoice = prompt('🏦 Select bank/service:\n1. CBE\n2. Awash Bank\n3. Dashen Bank\n4. Abyssinia Bank\n5. Telebirr\n6. M-Pesa\n\nEnter number (1-6):');
    if (!bankChoice || isNaN(bankChoice) || bankChoice < 1 || bankChoice > 6) { alert('Invalid selection'); return; }
    const bankName = banks[Number(bankChoice) - 1];
    const amount = prompt(`💰 Deposit via ${bankName}\n\nEnter amount (minimum 100 ETB):`);
    if (!amount || isNaN(amount) || Number(amount) < 100) { alert('❌ Minimum deposit is 100 ETB'); return; }
    const ref = prompt(`📋 Enter your ${bankName} transaction reference number:`);
    if (!ref) { alert('❌ Transaction reference is required'); return; }
    const result = await requestDeposit(user.uid, amount, bankName, ref);
    alert(result.success ? `✅ Deposit request submitted!\n\nBank: ${bankName}\nAmount: ${amount} ETB\nRef: ${ref}\n\nAdmin will verify and credit your wallet within 24 hours.` : '❌ ' + result.message);
    if (result.success) await loadWallet(user);
  });

  document.getElementById('withdrawBtn')?.addEventListener('click', async () => {
    const balance = await getWalletBalance(user.uid);
    if (balance < 200) { alert(`❌ Minimum withdrawal is 200 ETB.\nYour balance: ${balance} ETB`); return; }
    const banks = ['CBE','Awash Bank','Dashen Bank','Abyssinia Bank','Telebirr','M-Pesa'];
    const bankChoice = prompt('🏦 Withdraw to:\n1. CBE\n2. Awash Bank\n3. Dashen Bank\n4. Abyssinia Bank\n5. Telebirr\n6. M-Pesa\n\nEnter number (1-6):');
    if (!bankChoice || isNaN(bankChoice) || bankChoice < 1 || bankChoice > 6) return;
    const bankName = banks[Number(bankChoice) - 1];
    const accountNo = prompt(`Enter your ${bankName} account number:`);
    if (!accountNo) return;
    const amount = prompt(`💰 Withdraw from wallet\nBalance: ${balance} ETB\nMinimum: 200 ETB\n\nEnter amount:`);
    if (!amount || isNaN(amount) || Number(amount) < 200) { alert('❌ Minimum withdrawal is 200 ETB'); return; }
    if (Number(amount) > balance) { alert(`❌ Insufficient balance. Max: ${balance} ETB`); return; }
    const result = await requestWithdrawal(user.uid, amount, bankName, accountNo);
    alert(result.success ? `✅ Withdrawal requested!\n\nBank: ${bankName}\nAccount: ${accountNo}\nAmount: ${amount} ETB\n\nWill be processed within 24 hours.` : '❌ ' + result.message);
    if (result.success) await loadWallet(user);
  });

  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName')?.value;
    const phone = document.getElementById('profilePhone')?.value;
    const city = document.getElementById('profileCity')?.value;
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: name, phone, city }, { merge: true });
      alert('✅ Profile saved!');
    } catch (e) { alert('❌ Error: ' + e.message); }
  });
}
