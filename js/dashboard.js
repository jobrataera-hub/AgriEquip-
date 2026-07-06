import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { VIP_PLANS, getUserVIP, upgradeVIP } from './vip.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './wallet.js';
import { initTeffAI } from './teffai.js';

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

// ===== BANK MODAL =====
const BANKS = [
  { id:'cbe',  name:'CBE', icon:'🏦', desc:'Commercial Bank of Ethiopia' },
  { id:'awash', name:'Awash Bank', icon:'🏦', desc:'Awash International Bank' },
  { id:'dashen', name:'Dashen Bank', icon:'🏦', desc:'Dashen Bank S.C.' },
  { id:'abyssinia', name:'Abyssinia Bank', icon:'🏦', desc:'Bank of Abyssinia' },
  { id:'telebirr', name:'Telebirr', icon:'📱', desc:'Ethio Telecom Mobile Wallet' },
  { id:'mpesa', name:'M-Pesa', icon:'📱', desc:'Safaricom M-Pesa Ethiopia' },
];

function openModal() {
  const m = document.getElementById('bankModal');
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal() {
  const m = document.getElementById('bankModal');
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}
document.getElementById('bankModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('bankModal')) closeModal();
});

function showBankSelect(type) {
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSubtitle');
  const body = document.getElementById('modalBody');
  if (!body) return;

  if (type === 'deposit') {
    title.textContent = '⬆️ Deposit Funds';
    sub.textContent = 'Select your bank or mobile wallet to deposit';
  } else {
    title.textContent = '⬇️ Withdraw Funds';
    sub.textContent = 'Select your bank or mobile wallet to receive payment';
  }

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      ${BANKS.map(bank => `
        <button onclick="selectBank('${bank.id}','${bank.name}','${type}')"
          style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);
          border-radius:14px;padding:14px 10px;cursor:pointer;transition:all 0.3s;
          display:flex;flex-direction:column;align-items:center;gap:6px;
          font-family:'Poppins',sans-serif;"
          onmouseover="this.style.borderColor='#22C55E';this.style.background='rgba(34,197,94,0.1)'"
          onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.background='rgba(255,255,255,0.05)'">
          <span style="font-size:1.8rem">${bank.icon}</span>
          <span style="color:white;font-weight:600;font-size:0.82rem">${bank.name}</span>
          <span style="color:#64748B;font-size:0.68rem;text-align:center">${bank.desc}</span>
        </button>
      `).join('')}
    </div>
    <button onclick="closeModal()" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:rgba(255,255,255,0.6);cursor:pointer;font-family:'Poppins',sans-serif;font-size:0.85rem">Cancel</button>
  `;
  openModal();
}

window.closeModal = closeModal;

window.selectBank = function(bankId, bankName, type) {
  const body = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSubtitle');

  if (type === 'deposit') {
    title.textContent = `⬆️ Deposit via ${bankName}`;
    sub.textContent = 'Fill in your deposit details below';
    body.innerHTML = `
      <div style="margin-bottom:14px">
        <label style="color:rgba(255,255,255,0.6);font-size:0.75rem;display:block;margin-bottom:5px">Amount (ETB) — Minimum 100 ETB</label>
        <input type="number" id="depositAmount" placeholder="e.g. 500"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;font-size:0.9rem;font-family:'Poppins',sans-serif;outline:none"
          onfocus="this.style.borderColor='#22C55E'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
      </div>
      <div style="margin-bottom:14px">
        <label style="color:rgba(255,255,255,0.6);font-size:0.75rem;display:block;margin-bottom:5px">Your ${bankName} Account / Reference Number</label>
        <input type="text" id="depositRef" placeholder="Account no. or transaction ref."
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;font-size:0.9rem;font-family:'Poppins',sans-serif;outline:none"
          onfocus="this.style.borderColor='#22C55E'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
      </div>
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:12px;margin-bottom:14px">
        <p style="color:#86EFAC;font-size:0.78rem;line-height:1.7">
          📋 <strong>Instructions:</strong><br>
          1. Transfer your amount to AgriEquip's ${bankName} account<br>
          2. Enter the transaction reference above<br>
          3. Admin will verify and credit your wallet within 24hrs
        </p>
      </div>
      <button onclick="submitDeposit('${bankName}')"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#22C55E,#16A34A);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.9rem;cursor:pointer;font-family:'Poppins',sans-serif;margin-bottom:8px;box-shadow:0 4px 15px rgba(34,197,94,0.3)">
        ✅ Submit Deposit Request
      </button>
      <button onclick="showBankSelect('deposit')"
        style="width:100%;padding:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:rgba(255,255,255,0.5);cursor:pointer;font-family:'Poppins',sans-serif;font-size:0.82rem">
        ← Change Bank
      </button>
    `;
  } else {
    title.textContent = `⬇️ Withdraw via ${bankName}`;
    sub.textContent = 'Fill in your withdrawal details below';
    body.innerHTML = `
      <div style="margin-bottom:14px">
        <label style="color:rgba(255,255,255,0.6);font-size:0.75rem;display:block;margin-bottom:5px">Amount (ETB) — Minimum 200 ETB</label>
        <input type="number" id="withdrawAmount" placeholder="e.g. 500"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;font-size:0.9rem;font-family:'Poppins',sans-serif;outline:none"
          onfocus="this.style.borderColor='#22C55E'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
      </div>
      <div style="margin-bottom:14px">
        <label style="color:rgba(255,255,255,0.6);font-size:0.75rem;display:block;margin-bottom:5px">Your ${bankName} Account Number</label>
        <input type="text" id="withdrawAccount" placeholder="Enter your account number"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;font-size:0.9rem;font-family:'Poppins',sans-serif;outline:none"
          onfocus="this.style.borderColor='#22C55E'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
      </div>
      <div style="margin-bottom:14px">
        <label style="color:rgba(255,255,255,0.6);font-size:0.75rem;display:block;margin-bottom:5px">Account Holder Name</label>
        <input type="text" id="withdrawName" placeholder="Name on the account"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;font-size:0.9rem;font-family:'Poppins',sans-serif;outline:none"
          onfocus="this.style.borderColor='#22C55E'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
      </div>
      <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:12px;margin-bottom:14px">
        <p style="color:#67E8F9;font-size:0.78rem;line-height:1.7">
          ℹ️ Withdrawals are processed within <strong>24 hours</strong>.<br>
          Minimum: <strong>200 ETB</strong> per withdrawal.<br>
          Make sure your account details are correct.
        </p>
      </div>
      <button onclick="submitWithdrawal('${bankName}')"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.9rem;cursor:pointer;font-family:'Poppins',sans-serif;margin-bottom:8px;box-shadow:0 4px 15px rgba(139,92,246,0.3)">
        ✅ Submit Withdrawal Request
      </button>
      <button onclick="showBankSelect('withdraw')"
        style="width:100%;padding:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:rgba(255,255,255,0.5);cursor:pointer;font-family:'Poppins',sans-serif;font-size:0.82rem">
        ← Change Bank
      </button>
    `;
  }
};

window.submitDeposit = async function(bankName) {
  const amount = document.getElementById('depositAmount')?.value;
  const ref = document.getElementById('depositRef')?.value.trim();
  const user = auth.currentUser;
  if (!user) return;
  if (!amount || Number(amount) < 100) {
    alert('❌ Minimum deposit is 100 ETB'); return;
  }
  if (!ref) {
    alert('❌ Please enter your transaction reference number'); return;
  }
  const result = await requestDeposit(user.uid, amount, bankName, ref);
  if (result.success) {
    closeModal();
    showSuccessToast(`✅ Deposit request of ${amount} ETB via ${bankName} submitted! Admin will verify within 24hrs.`);
    await loadWallet(user);
  } else {
    alert('❌ ' + result.message);
  }
};

window.submitWithdrawal = async function(bankName) {
  const amount = document.getElementById('withdrawAmount')?.value;
  const account = document.getElementById('withdrawAccount')?.value.trim();
  const name = document.getElementById('withdrawName')?.value.trim();
  const user = auth.currentUser;
  if (!user) return;
  if (!amount || Number(amount) < 200) {
    alert('❌ Minimum withdrawal is 200 ETB'); return;
  }
  if (!account) {
    alert('❌ Please enter your account number'); return;
  }
  if (!name) {
    alert('❌ Please enter account holder name'); return;
  }
  const result = await requestWithdrawal(user.uid, amount, bankName, account);
  if (result.success) {
    closeModal();
    showSuccessToast(`✅ Withdrawal of ${amount} ETB to ${bankName} submitted! Will be processed within 24hrs.`);
    await loadWallet(user);
  } else {
    alert('❌ ' + result.message);
  }
};

function showSuccessToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#0F172A,#1a3a2a);
    border:1px solid rgba(34,197,94,0.3);
    color:white;padding:14px 20px;border-radius:14px;
    font-size:0.82rem;z-index:99999;max-width:320px;text-align:center;
    box-shadow:0 8px 30px rgba(0,0,0,0.4);line-height:1.5;
    animation:fadeUp 0.4s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 5000);
}

// ===== NAVIGATION =====
const navHistory = ['home'];
let navIndex = 0;

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function openSidebar() { sidebar?.classList.add('open'); overlay?.classList.add('show'); }
function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }

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
    earnings:'💰 Earnings', teffai:'🤖 Teff AI',
    profile:'👤 Profile', settings:'⚙️ Settings', about:'ℹ️ About'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[id] || 'AgriEquip';
  if (navHistory[navIndex] !== id) {
    navHistory.splice(navIndex + 1);
    navHistory.push(id);
    navIndex = navHistory.length - 1;
  }
  updateArrows();
  if (id === 'teffai') initTeffAI();
};

function updateArrows() {
  const b = document.getElementById('backBtn');
  const f = document.getElementById('fwdBtn');
  if (b) b.style.opacity = navIndex > 0 ? '1' : '0.25';
  if (f) f.style.opacity = navIndex < navHistory.length - 1 ? '1' : '0.25';
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
  setEl('userEmail', user.email);
  setEl('userInitial', user.email[0].toUpperCase());
  setEl('profileEmail', user.email);
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
      referralCode: 'AGR-' + user.uid.substring(0, 6).toUpperCase(),
      referralCount: 0,
      referralEarnings: 0,
      createdAt: new Date().toISOString()
    });
  }
}

function setEl(id, val) {
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
    setEl('vipBadge', plan.badge + ' ' + plan.name);
    setEl('commissionRate', plan.commission + '%');
    setEl('walletBalance', balance + ' ETB');
    setEl('walletBalanceHome', balance + ' ETB');
    setEl('profileVIP', plan.badge + ' ' + plan.name + ' Member');

    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      const code = data.referralCode || 'AGR-' + user.uid.substring(0, 6).toUpperCase();
      setEl('referralCode', code);
      setEl('profileReferral', '🎁 Code: ' + code);
      if (data.fullName) setEl('profileFullName', data.fullName);
    }

    const rentalsSnap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    let active = 0;
    rentalsSnap.forEach(d => { if (d.data().status === 'active') active++; });
    setEl('totalBookings', rentalsSnap.size);
    setEl('activeBookings', active);

    const listSnap = await getDocs(query(collection(db, 'equipment'), where('ownerId', '==', user.uid)));
    setEl('totalListings', listSnap.size);
  } catch(e) { console.error(e); }
}

window.copyReferral = function() {
  const code = document.getElementById('referralCode')?.textContent;
  if (code && code !== 'Loading...') {
    navigator.clipboard.writeText(code).then(() => showSuccessToast('📋 Referral code copied! Share it with friends to earn 50 ETB each.'));
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
      grid.innerHTML = `
        <div class="empty-state">
          <p>🚜</p>
          <p style="font-weight:600;margin-top:8px">No equipment listed yet</p>
          <p style="font-size:0.8rem;margin-top:6px;color:#64748B">Be the first to list your equipment!</p>
          <button class="action-btn" style="margin-top:14px;max-width:200px" onclick="showSection('listings')">➕ Add Listing</button>
        </div>`;
      return;
    }
    grid.innerHTML = '';
    snap.forEach(d => {
      const q = d.data();
      const emoji = {tractor:'🚜',plow:'⚙️',harvester:'🌾',irrigation:'💧',other:'📦'}[q.category]||'📦';
      grid.innerHTML += `
        <div class="equip-card">
          <div class="equip-badge">${emoji} ${q.category||'Equipment'}</div>
          <h3>${q.name}</h3>
          <p style="font-size:0.8rem;margin:4px 0;color:#64748B">📍 ${q.location||'Ethiopia'}</p>
          <p style="color:#22C55E;font-weight:700;font-size:1.05rem;margin:8px 0">
            ${q.pricePerDay} ETB<span style="color:#64748B;font-weight:400;font-size:0.78rem">/day</span>
          </p>
          ${q.description?`<p style="color:#64748B;font-size:0.78rem;margin-bottom:10px;line-height:1.5">${q.description}</p>`:''}
          <button class="action-btn" onclick="bookEquipment('${d.id}','${q.name}',${q.pricePerDay},'${q.ownerId}')">📅 Book Now</button>
        </div>`;
    });
  } catch(e) { grid.innerHTML = '<p class="empty-msg">Error loading. Check connection.</p>'; }
}

document.getElementById('searchInput')?.addEventListener('input', filterEquip);
document.getElementById('categoryFilter')?.addEventListener('change', filterEquip);
function filterEquip() {
  const s = document.getElementById('searchInput')?.value.toLowerCase()||'';
  const c = document.getElementById('categoryFilter')?.value||'';
  document.querySelectorAll('.equip-card').forEach(card => {
    const t = card.textContent.toLowerCase();
    card.style.display = (!s||t.includes(s)) && (!c||t.includes(c)) ? 'block' : 'none';
  });
}

window.bookEquipment = async function(equipId, name, price, ownerId) {
  const user = auth.currentUser;
  if (!user) return;
  if (ownerId === user.uid) { alert("❌ You can't book your own equipment."); return; }
  const days = prompt(`📅 Book "${name}"\n💰 ${price} ETB/day\n\nHow many days?`);
  if (!days || isNaN(days) || Number(days) < 1) return;
  const total = price * Number(days);
  if (!confirm(`Confirm Booking:\n📦 ${name}\n📅 ${days} day(s)\n💰 Total: ${total} ETB`)) return;
  try {
    await addDoc(collection(db, 'rentals'), {
      equipmentId: equipId, equipmentName: name,
      renterId: user.uid, renterEmail: user.email,
      ownerId, days: Number(days), totalPrice: total,
      status: 'pending', createdAt: new Date().toISOString()
    });
    showSuccessToast('✅ Booking request sent! The owner will confirm shortly.');
    await loadStats(user);
  } catch(e) { alert('❌ Error: ' + e.message); }
};

// ===== BOOKINGS =====
async function loadBookings(user) {
  const c = document.getElementById('bookingsList');
  if (!c) return;
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'rentals'), where('renterId', '==', user.uid)));
    if (snap.empty) {
      c.innerHTML = `<div class="empty-state"><p>📭</p><p>No bookings yet</p><button class="action-btn" style="margin-top:14px;max-width:200px" onclick="showSection('browse')">🔍 Browse Equipment</button></div>`;
      return;
    }
    c.innerHTML = '';
    snap.forEach(d => {
      const b = d.data();
      const colors = {pending:'#F59E0B',active:'#22C55E',completed:'#06B6D4',cancelled:'#EF4444'};
      const color = colors[b.status]||'#64748B';
      c.innerHTML += `
        <div class="section-card" style="border-left:4px solid ${color};margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
            <div>
              <h3 style="font-size:0.92rem">${b.equipmentName}</h3>
              <p style="color:#64748B;font-size:0.78rem;margin-top:4px">📅 ${b.days} day(s) • 💰 ${b.totalPrice} ETB</p>
              <p style="color:#64748B;font-size:0.73rem;margin-top:2px">🕐 ${new Date(b.createdAt).toLocaleDateString()}</p>
            </div>
            <span style="background:${color}22;color:${color};padding:4px 10px;border-radius:50px;font-size:0.7rem;font-weight:700;white-space:nowrap">${b.status.toUpperCase()}</span>
          </div>
        </div>`;
    });
  } catch(e) { c.innerHTML = '<p class="empty-msg">Error loading bookings.</p>'; }
}

// ===== MY LISTINGS =====
async function loadMyListings(user) {
  const c = document.getElementById('myListings');
  if (!c) return;
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db, 'equipment'), where('ownerId', '==', user.uid)));
    if (snap.empty) {
      c.innerHTML = `<div class="empty-state"><p>📦</p><p>No listings yet</p><p style="font-size:0.8rem;color:#64748B;margin-top:6px">Add equipment to start earning!</p></div>`;
      return;
    }
    c.innerHTML = '';
    snap.forEach(d => {
      const eq = d.data();
      const emoji = {tractor:'🚜',plow:'⚙️',harvester:'🌾',irrigation:'💧',other:'📦'}[eq.category]||'📦';
      c.innerHTML += `
        <div class="equip-card">
          <div class="equip-badge">${emoji} ${eq.category}</div>
          <h3>${eq.name}</h3>
          <p style="font-size:0.8rem;margin:4px 0;color:#64748B">📍 ${eq.location}</p>
          <p style="color:#22C55E;font-weight:700;font-size:1rem;margin:6px 0">${eq.pricePerDay} ETB/day</p>
          <p style="color:#22C55E;font-size:0.78rem">✅ Active listing</p>
        </div>`;
    });
  } catch(e) { console.error(e); }
}

// ===== WALLET =====
async function loadWallet(user) {
  const balance = await getWalletBalance(user.uid);
  setEl('walletBalance', balance + ' ETB');
  setEl('walletBalanceHome', balance + ' ETB');
  await loadTransactions(user);
}

async function loadTransactions(user) {
  const c = document.getElementById('transactionHistory');
  if (!c) return;
  const hist = await getTransactionHistory(user.uid);
  if (!hist.length) {
    c.innerHTML = '<div class="empty-state" style="padding:20px"><p>📊</p><p style="font-size:0.82rem">No transactions yet</p></div>';
    return;
  }
  c.innerHTML = hist.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => `
    <div class="transaction-item">
      <div>
        <p style="font-weight:600;font-size:0.85rem">${t.type==='deposit'?'⬆️ Deposit':'⬇️ Withdrawal'}</p>
        <p style="color:#64748B;font-size:0.73rem;margin-top:2px">${t.bankName||'AgriEquip'} • ${new Date(t.createdAt).toLocaleDateString()}</p>
        ${t.accountRef?`<p style="color:#64748B;font-size:0.7rem">Ref: ${t.accountRef}</p>`:''}
        ${t.accountNumber?`<p style="color:#64748B;font-size:0.7rem">Acc: ${t.accountNumber}</p>`:''}
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;color:${t.type==='deposit'?'#22C55E':'#EF4444'};font-size:0.95rem">${t.type==='deposit'?'+':'-'}${t.amount} ETB</p>
        <span style="font-size:0.68rem;padding:3px 9px;border-radius:50px;font-weight:700;
          background:${t.status==='pending'?'rgba(245,158,11,0.15)':t.status==='approved'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'};
          color:${t.status==='pending'?'#F59E0B':t.status==='approved'?'#22C55E':'#EF4444'}">
          ${t.status.toUpperCase()}
        </span>
      </div>
    </div>`).join('');
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
    <div class="vip-card" style="border-color:${plan.color};${isCurrent?'box-shadow:0 0 24px '+plan.color+'44;border-width:2px':''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="vip-badge" style="background:${plan.color}">${plan.badge} ${plan.name}</div>
        ${isCurrent?`<span style="background:rgba(34,197,94,0.15);color:#22C55E;padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:700">✅ ACTIVE</span>`:''}
      </div>
      <div style="background:${plan.color}18;border-radius:10px;padding:12px;margin-bottom:12px">
        <p style="font-size:1.3rem;font-weight:800;color:${plan.color}">
          ${plan.fee===0?'FREE':'ETB '+plan.fee}<span style="font-size:0.75rem;font-weight:500;color:#64748B">${plan.fee>0?'/month':' forever'}</span>
        </p>
      </div>
      <ul class="vip-features">
        ${plan.features.map(f => `<li>✔️ ${f}</li>`).join('')}
      </ul>
      ${!isCurrent && plan.fee > 0 ? `
        <div style="margin-top:14px">
          <button class="action-btn" style="background:${plan.color};box-shadow:0 4px 15px ${plan.color}44"
            onclick="activateVIP('${key}','${plan.name}',${plan.fee})">
            ${canAfford ? '💎 Activate '+plan.name : '💳 Deposit '+plan.fee+' ETB first'}
          </button>
          ${!canAfford ? `
            <button class="action-btn" style="background:#8B5CF6;margin-top:8px"
              onclick="showSection('wallet')">
              ⬆️ Go to Wallet
            </button>` : ''}
        </div>` :
        isCurrent ? `<p style="color:#22C55E;font-size:0.82rem;margin-top:12px;font-weight:600;text-align:center">✅ This is your current plan</p>` :
        `<p style="color:#94A3B8;font-size:0.82rem;margin-top:12px;text-align:center">✅ Free forever</p>`}
    </div>`;
  }).join('');
}

window.activateVIP = async function(planKey, planName, fee) {
  const user = auth.currentUser;
  if (!user) return;
  const balance = await getWalletBalance(user.uid);
  if (balance < fee) {
    const go = confirm(`❌ Insufficient balance!\n\nYou need: ${fee} ETB\nYour balance: ${balance} ETB\nShortfall: ${fee - balance} ETB\n\nGo to Wallet to deposit?`);
    if (go) showSection('wallet');
    return;
  }
  if (!confirm(`Activate ${planName} for ${fee} ETB/month?\nThis will be deducted from your wallet.`)) return;
  const result = await upgradeVIP(user.uid, planKey);
  if (result.success) {
    showSuccessToast('🎉 ' + result.message);
    await loadAll(user);
  } else {
    alert('❌ ' + result.message);
  }
};

// ===== EARNINGS =====
async function loadEarnings(user) {
  try {
    let total = 0, pending = 0, completed = 0;
    const snap = await getDocs(query(collection(db, 'rentals'), where('ownerId', '==', user.uid)));
    const vipLevel = await getUserVIP(user.uid);
    const commission = VIP_PLANS[vipLevel].commission;
    const histEl = document.getElementById('earningsHistoryList');
    let html = '';

    snap.forEach(d => {
      const r = d.data();
      const earn = r.ownerEarnings || Math.round(r.totalPrice * (1 - commission/100));
      if (r.status === 'completed') { total += earn; completed++; }
      if (r.status === 'active') pending += (r.totalPrice || 0);
      const colors = {pending:'#F59E0B',active:'#22C55E',completed:'#06B6D4',cancelled:'#EF4444'};
      html += `
        <div class="transaction-item">
          <div>
            <p style="font-weight:600;font-size:0.85rem">📦 ${r.equipmentName}</p>
            <p style="color:#64748B;font-size:0.73rem;margin-top:2px">${r.days} day(s) • ${new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
          <div style="text-align:right">
            <p style="font-weight:700;color:#22C55E">+${earn} ETB</p>
            <span style="font-size:0.68rem;padding:3px 9px;border-radius:50px;font-weight:700;background:${colors[r.status]||'#64748B'}22;color:${colors[r.status]||'#64748B'}">${r.status}</span>
          </div>
        </div>`;
    });

    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const refEarnings = userSnap.exists() ? (userSnap.data().referralEarnings || 0) : 0;
    if (refEarnings > 0) {
      html = `<div class="transaction-item"><div><p style="font-weight:600;font-size:0.85rem">🎁 Referral Earnings</p><p style="color:#64748B;font-size:0.73rem">From successful referrals</p></div><div style="text-align:right"><p style="font-weight:700;color:#22C55E">+${refEarnings} ETB</p></div></div>` + html;
    }

    if (histEl) histEl.innerHTML = html || '<div class="empty-state" style="padding:20px"><p>💰</p><p style="font-size:0.85rem">No earnings yet</p><button class="action-btn" style="margin-top:12px;max-width:200px" onclick="showSection(\'listings\')">📦 List Equipment</button></div>';

    setEl('totalEarnings', (total + refEarnings) + ' ETB');
    setEl('earnings', (total + refEarnings) + ' ETB');
    setEl('pendingEarnings', pending + ' ETB');
    setEl('completedRentals', completed);
    setEl('referralEarnings', refEarnings + ' ETB');
    setEl('commissionPaid', Math.round(total * commission / (100 - commission)) + ' ETB');
  } catch(e) { console.error(e); }
}

// ===== PROFILE =====
async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const d = snap.data();
      const fields = {profileName:'fullName',profileFatherName:'fatherName',profilePhone:'phone',profileCity:'city'};
      Object.entries(fields).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && d[key]) el.value = d[key];
      });
      if (d.fullName) setEl('profileFullName', d.fullName);
    }
  } catch(e) { console.error(e); }
}

// ===== FORMS =====
function setupForms(user) {
  document.getElementById('addListingBtn')?.addEventListener('click', () => {
    const f = document.getElementById('addListingForm');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('submitListing')?.addEventListener('click', async () => {
    const name = document.getElementById('equipName')?.value.trim();
    const category = document.getElementById('equipCategory')?.value;
    const price = document.getElementById('equipPrice')?.value;
    const location = document.getElementById('equipLocation')?.value.trim();
    const desc = document.getElementById('equipDesc')?.value.trim();
    if (!name || !price || !location) { alert('⚠️ Please fill all required fields.'); return; }
    try {
      await addDoc(collection(db, 'equipment'), {
        name, category, pricePerDay: Number(price),
        location, description: desc,
        ownerId: user.uid, ownerEmail: user.email,
        availability: 'available',
        createdAt: new Date().toISOString()
      });
      showSuccessToast('✅ Equipment listed successfully!');
      document.getElementById('addListingForm').style.display = 'none';
      ['equipName','equipPrice','equipLocation','equipDesc'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      await loadMyListings(user);
      await loadBrowse();
      await loadStats(user);
    } catch(e) { alert('❌ Error: ' + e.message); }
  });

  document.getElementById('depositBtn')?.addEventListener('click', () => {
    showBankSelect('deposit');
  });

  document.getElementById('withdrawBtn')?.addEventListener('click', () => {
    showBankSelect('withdraw');
  });

  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName')?.value;
    const father = document.getElementById('profileFatherName')?.value;
    const phone = document.getElementById('profilePhone')?.value;
    const city = document.getElementById('profileCity')?.value;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        fullName: name, fatherName: father,
        displayName: name, phone, city
      }, { merge: true });
      showSuccessToast('✅ Profile saved successfully!');
      if (name) setEl('profileFullName', name);
    } catch(e) { alert('❌ Error: ' + e.message); }
  });
}
