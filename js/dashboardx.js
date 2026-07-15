import { VIP_PLANS, getUserVIP, upgradeVIP } from './vipx.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './walletx.js';
import { initTeffAI } from './teffaix.js';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, query, where, getDocs, orderBy, limit,
  serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { VIP_PLANS, getUserVIP, upgradeVIP } from './vip.js';
import { getWalletBalance, requestDeposit, requestWithdrawal, getTransactionHistory } from './wallet.js';
import { initTeffAI } from './teffai.js';

(function initTheme() {
  const t = localStorage.getItem('agriequip-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
})();
window.setTheme = t => {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('agriequip-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
};

const RANKS = [
  { key:'seedling', label:'🌱 Seedling', min:0 },
  { key:'grower', label:'🌿 Grower', min:100 },
  { key:'cultivator', label:'🌾 Cultivator', min:300 },
  { key:'harvester', label:'🚜 Harvester', min:600 },
  { key:'mechanic', label:'🔧 Mechanic', min:1000 },
  { key:'expert', label:'🏅 Expert Farmer', min:1500 },
  { key:'legend', label:'👑 Agricultural Legend', min:2500 }
];
function getRank(points) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (points >= r.min) rank = r; }
  return rank;
}

const navHistory = ['home'];
let navIndex = 0;
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function openSidebar() { sidebar?.classList.add('open'); overlay?.classList.add('show'); }
function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }

document.getElementById('openMenu')?.addEventListener('click', e => { e.stopPropagation(); openSidebar(); });
document.getElementById('menuToggle')?.addEventListener('click', closeSidebar);
document.getElementById('overlay')?.addEventListener('click', closeSidebar);

window.showSection = function(id) {
  document.querySelectorAll('.section').forEach(s => { s.style.display = 'none'; });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.style.animation = 'fadeUp 0.4s ease'; }
  document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
  closeSidebar();
  const titles = {
    home:'🏠 Home', browse:'🔍 Browse Equipment',
    bookings:'📅 My Bookings', listings:'📦 My Listings',
    wallet:'💳 Wallet', vip:'💎 VIP Plans',
    earnings:'💰 Earnings', teffai:'🤖 Teff AI',
    academy:'🎓 Academy', community:'👥 Community',
    tasks:'🌱 Daily Tasks', profile:'👤 Profile',
    settings:'⚙️ Settings', about:'ℹ️ About'
  };
  setEl('pageTitle', titles[id] || 'AgriEquip');
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
document.getElementById('backBtn')?.addEventListener('click', () => { if (navIndex > 0) { navIndex--; showSection(navHistory[navIndex]); } });
document.getElementById('fwdBtn')?.addEventListener('click', () => { if (navIndex < navHistory.length - 1) { navIndex++; showSection(navHistory[navIndex]); } });
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => { e.preventDefault(); showSection(l.dataset.section); }));

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (confirm('Sign out of AgriEquip?')) { await signOut(auth); window.location.href = 'login.html'; }
});

let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 60) return;
  if (dx > 60 && touchStartX < 40) document.getElementById('backBtn')?.click();
  if (dx < -60 && touchStartX > window.innerWidth - 40) document.getElementById('fwdBtn')?.click();
}, { passive: true });

function setEl(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${type==='success'?'linear-gradient(135deg,#22C55E,#16A34A)':'linear-gradient(135deg,#EF4444,#DC2626)'};color:white;padding:12px 20px;border-radius:14px;font-size:0.82rem;z-index:99999;max-width:300px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.4)`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = 'login.html'; return; }
  setEl('userEmail', user.email);
  setEl('userInitial', user.email[0].toUpperCase());
  setEl('profileEmail', user.email);
  setEl('sidebarInitial', user.email[0].toUpperCase());
  setEl('sidebarEmail', user.email);
  await initUser(user);
  await loadAll(user);
  setupForms(user);
});

async function initUser(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, email: user.email,
      displayName: user.displayName || '',
      role: 'farmer', vipLevel: 'free',
      rank: 'seedling', rankPoints: 0,
      walletBalance: 0,
      referralCode: 'AGR-' + user.uid.substring(0,6).toUpperCase(),
      referralCount: 0, referralEarnings: 0,
      verified: false,
      createdAt: serverTimestamp()
    });
  }
}

async function loadAll(user) {
  await Promise.all([
    loadStats(user), loadBrowse(),
    loadMyListings(user), loadBookings(user),
    loadWallet(user), loadVIP(user),
    loadEarnings(user), loadProfile(user),
    loadTasks(user), loadAcademy(),
    loadCommunity()
  ]);
}

async function loadStats(user) {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const vipLevel = data.vipLevel || 'free';
    const plan = VIP_PLANS[vipLevel] || VIP_PLANS.free;
    const balance = data.walletBalance || 0;
    const points = data.rankPoints || 0;
    const rank = getRank(points);
    const nextRank = RANKS.find(r => r.min > points);
    const progress = nextRank ? Math.round((points - rank.min) / (nextRank.min - rank.min) * 100) : 100;

    setEl('vipBadge', plan.badge + ' ' + plan.name);
    setEl('commissionRate', plan.commission + '%');
    setEl('walletBalance', balance + ' ETB');
    setEl('walletBalanceHome', balance + ' ETB');
    setEl('rankDisplay', rank.label);
    setEl('rankPoints', points + ' pts');
    setEl('profileVIP', plan.badge + ' ' + plan.name);
    setEl('profileRank', rank.label);
    setEl('sidebarName', data.fullName || data.displayName || user.email.split('@')[0]);
    setEl('sidebarVip', plan.badge + ' ' + plan.name);
    setEl('referralCode', data.referralCode || 'AGR-' + user.uid.substring(0,6).toUpperCase());

    const pb = document.getElementById('rankProgressBar');
    if (pb) pb.style.width = progress + '%';
    setEl('rankProgressTxt', nextRank ? `${points}/${nextRank.min} pts to ${nextRank.label}` : '👑 Max Rank!');

    const rentQ = query(collection(db, 'bookings'), where('renterId','==',user.uid));
    const rentSnap = await getDocs(rentQ);
    let active = 0;
    rentSnap.forEach(d => { if (d.data().status === 'active') active++; });
    setEl('totalBookings', rentSnap.size);
    setEl('activeBookings', active);

    const listQ = query(collection(db, 'equipment'), where('ownerId','==',user.uid));
    const listSnap = await getDocs(listQ);
    setEl('totalListings', listSnap.size);
    setEl('earningsListings', listSnap.size);
  } catch(e) { console.error('loadStats:', e); }
}

window.copyReferral = function() {
  const code = document.getElementById('referralCode')?.textContent;
  if (code && code !== 'Loading...') {
    navigator.clipboard.writeText('Join AgriEquip! Use my code: ' + code).then(() => showToast('📋 Referral code copied!'));
  }
};

async function loadBrowse() {
  const grid = document.getElementById('equipmentList');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(collection(db, 'equipment'));
    if (snap.empty) {
      grid.innerHTML = `<div class="empty-state"><p>🚜</p><p style="font-weight:600;margin-top:8px">No equipment listed yet</p><button class="action-btn" style="margin-top:14px;max-width:200px" onclick="showSection('listings')">➕ Add Listing</button></div>`;
      return;
    }
    grid.innerHTML = '';
    const catEmoji = {tractor:'🚜',pump:'💧',thresher:'⚙️',plow:'🔧',harvester:'🌾',other:'📦'};
    snap.forEach(d => {
      const q = d.data();
      const city = typeof q.location === 'object' ? q.location.city : (q.location || 'Ethiopia');
      grid.innerHTML += `
      <div class="equip-card">
        <div class="equip-badge">${catEmoji[q.category]||'📦'} ${q.category||'Equipment'}</div>
        <h3>${q.name}</h3>
        <p style="font-size:0.8rem;color:#64748B;margin:4px 0">📍 ${city}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1.05rem;margin:8px 0">${q.pricePerDay} ETB<span style="color:#64748B;font-weight:400;font-size:0.78rem">/day</span></p>
        ${q.description?`<p style="color:#64748B;font-size:0.78rem;margin-bottom:10px">${q.description}</p>`:''}
        <button class="action-btn" style="margin-top:10px" onclick="bookEquipment('${d.id}','${q.name}',${q.pricePerDay},'${q.ownerId}')">📅 Book Now</button>
      </div>`;
    });
  } catch(e) { grid.innerHTML = '<p class="empty-msg">Error loading.</p>'; console.error(e); }
}

document.getElementById('searchInput')?.addEventListener('input', () => {
  const s = document.getElementById('searchInput').value.toLowerCase();
  const c = document.getElementById('categoryFilter').value;
  document.querySelectorAll('.equip-card').forEach(card => {
    const t = card.textContent.toLowerCase();
    card.style.display = (!s||t.includes(s)) && (!c||t.includes(c)) ? 'block' : 'none';
  });
});
document.getElementById('categoryFilter')?.addEventListener('change', () => {
  document.getElementById('searchInput')?.dispatchEvent(new Event('input'));
});

window.bookEquipment = async function(equipId, name, price, ownerId) {
  const user = auth.currentUser;
  if (!user) return;
  if (ownerId === user.uid) { showToast('❌ Cannot book your own equipment', 'error'); return; }
  const days = prompt(`📅 Book "${name}"\n💰 ${price} ETB/day\n\nHow many days?`);
  if (!days || isNaN(days) || Number(days) < 1) return;
  const total = price * Number(days);
  if (!confirm(`Confirm Booking:\n📦 ${name}\n📅 ${days} day(s)\n💰 Total: ${total} ETB`)) return;
  try {
    await addDoc(collection(db, 'bookings'), {
      equipmentId: equipId, equipmentName: name,
      renterId: user.uid, renterEmail: user.email,
      ownerId, durationDays: Number(days),
      pricePerDay: price, totalPrice: total,
      commission: Math.round(total * 0.1),
      ownerEarnings: Math.round(total * 0.9),
      status: 'pending', paymentStatus: 'unpaid',
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db,'users',user.uid), { rankPoints: increment(20) });
    showToast('✅ Booking request sent!');
    await loadStats(user);
  } catch(e) { showToast('❌ Error: ' + e.message, 'error'); }
};

async function loadBookings(user) {
  const c = document.getElementById('bookingsList');
  if (!c) return;
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db,'bookings'), where('renterId','==',user.uid)));
    if (snap.empty) {
      c.innerHTML = `<div class="empty-state"><p>📭</p><p>No bookings yet</p><button class="action-btn" style="margin-top:14px;max-width:200px" onclick="showSection('browse')">🔍 Browse Equipment</button></div>`;
      return;
    }
    const colors = {pending:'#F59E0B',confirmed:'#06B6D4',active:'#22C55E',completed:'#8B5CF6',cancelled:'#EF4444'};
    c.innerHTML = '';
    snap.forEach(d => {
      const b = d.data();
      const color = colors[b.status]||'#64748B';
      c.innerHTML += `
      <div class="section-card" style="border-left:4px solid ${color};margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px">
          <div>
            <h3 style="font-size:0.92rem">${b.equipmentName}</h3>
            <p style="color:#64748B;font-size:0.78rem;margin-top:4px">📅 ${b.durationDays} day(s) · 💰 ${b.totalPrice} ETB</p>
          </div>
          <span style="background:${color}22;color:${color};padding:4px 10px;border-radius:50px;font-size:0.7rem;font-weight:700">${(b.status||'').toUpperCase()}</span>
        </div>
      </div>`;
    });
  } catch(e) { c.innerHTML = '<p class="empty-msg">Error loading.</p>'; }
}

async function loadMyListings(user) {
  const c = document.getElementById('myListings');
  if (!c) return;
  c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collection(db,'equipment'), where('ownerId','==',user.uid)));
    if (snap.empty) {
      c.innerHTML = `<div class="empty-state"><p>📦</p><p>No listings yet</p></div>`;
      return;
    }
    c.innerHTML = '';
    const catEmoji = {tractor:'🚜',pump:'💧',thresher:'⚙️',plow:'🔧',harvester:'🌾',other:'📦'};
    snap.forEach(d => {
      const eq = d.data();
      const city = typeof eq.location === 'object' ? eq.location.city : (eq.location || 'Ethiopia');
      c.innerHTML += `
      <div class="equip-card">
        <div class="equip-badge">${catEmoji[eq.category]||'📦'} ${eq.category}</div>
        <h3>${eq.name}</h3>
        <p style="font-size:0.8rem;color:#64748B;margin:4px 0">📍 ${city}</p>
        <p style="color:#22C55E;font-weight:700;font-size:1rem;margin:6px 0">${eq.pricePerDay} ETB/day</p>
      </div>`;
    });
  } catch(e) { console.error(e); }
}

async function loadWallet(user) {
  try {
    const balance = await getWalletBalance(user.uid);
    setEl('walletBalance', balance + ' ETB');
    setEl('walletBalanceHome', balance + ' ETB');
    await loadTransactions(user);
  } catch(e) { console.error(e); }
}

async function loadTransactions(user) {
  const c = document.getElementById('transactionHistory');
  if (!c) return;
  try {
    const hist = await getTransactionHistory(user.uid);
    if (!hist.length) { c.innerHTML = '<div class="empty-state" style="padding:20px"><p>📊</p><p>No transactions yet</p></div>'; return; }
    c.innerHTML = hist.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(t => `
    <div class="transaction-item">
      <div>
        <p style="font-weight:600;font-size:0.85rem">${t.type==='deposit'?'⬆️ Deposit':'⬇️ Withdrawal'}</p>
        <p style="color:#64748B;font-size:0.73rem">${t.bankName||'AgriEquip'}</p>
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;color:${t.type==='withdrawal'?'#EF4444':'#22C55E'}">${t.type==='withdrawal'?'-':'+'}${t.amount} ETB</p>
        <span style="font-size:0.68rem;padding:2px 8px;border-radius:50px;background:rgba(245,158,11,0.15);color:#F59E0B">${t.status}</span>
      </div>
    </div>`).join('');
  } catch(e) { console.error(e); }
}

async function loadVIP(user) {
  const container = document.getElementById('vipPlans');
  if (!container) return;
  const currentVIP = await getUserVIP(user.uid);
  const balance = await getWalletBalance(user.uid);
  container.innerHTML = Object.entries(VIP_PLANS).map(([key, plan]) => {
    const isCurrent = key === currentVIP;
    const canAfford = balance >= plan.fee;
    return `
    <div class="vip-card" style="border-color:${plan.color}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="vip-badge" style="background:${plan.color}">${plan.badge} ${plan.name}</div>
        ${isCurrent?'<span style="background:rgba(34,197,94,0.15);color:#22C55E;padding:4px 12px;border-radius:50px;font-size:0.7rem;font-weight:700">✅ ACTIVE</span>':''}
      </div>
      <div style="background:${plan.color}18;border-radius:10px;padding:12px;margin-bottom:12px">
        <p style="font-size:1.2rem;font-weight:800;color:${plan.color}">${plan.fee===0?'FREE':'ETB '+plan.fee}</p>
      </div>
      <ul class="vip-features">${(plan.features||[]).map(f=>`<li>✔️ ${f}</li>`).join('')}</ul>
      ${!isCurrent && plan.fee > 0 ? `<button class="action-btn" style="background:${plan.color};margin-top:14px" onclick="activateVIP('${key}','${plan.name}',${plan.fee})">${canAfford?'💎 Activate':'💳 Need '+plan.fee+' ETB'}</button>` : ''}
    </div>`;
  }).join('');
}

window.activateVIP = async function(planKey, planName, fee) {
  const user = auth.currentUser;
  if (!user) return;
  const balance = await getWalletBalance(user.uid);
  if (balance < fee) { showSection('wallet'); return; }
  if (!confirm(`Activate ${planName} for ${fee} ETB/month?`)) return;
  const result = await upgradeVIP(user.uid, planKey);
  showToast(result.success ? '🎉 ' + result.message : '❌ ' + result.message);
  if (result.success) await loadAll(user);
};

async function loadEarnings(user) {
  try {
    let total = 0, pending = 0, completed = 0;
    const snap = await getDocs(query(collection(db,'bookings'), where('ownerId','==',user.uid)));
    const snap2 = await getDoc(doc(db,'users',user.uid));
    const refEarnings = snap2.exists() ? (snap2.data().referralEarnings||0) : 0;
    const histEl = document.getElementById('earningsHistoryList');
    let html = '';
    const vipLevel = await getUserVIP(user.uid);
    const commission = VIP_PLANS[vipLevel]?.commission || 10;
    snap.forEach(d => {
      const r = d.data();
      const earn = r.ownerEarnings || Math.round((r.totalPrice||0) * (1 - commission/100));
      if (r.status==='completed') { total += earn; completed++; }
      if (r.status==='active') pending += (r.totalPrice||0);
    });
    if (histEl) histEl.innerHTML = html || '<div class="empty-state" style="padding:20px"><p>💰</p><p>No earnings yet</p></div>';
    setEl('totalEarnings', (total+refEarnings)+' ETB');
    setEl('earnings', (total+refEarnings)+' ETB');
    setEl('pendingEarnings', pending+' ETB');
    setEl('completedRentals', completed);
    setEl('referralEarnings', refEarnings+' ETB');
  } catch(e) { console.error(e); }
}

const TASKS = [
  { id:'tip', icon:'🌱', title:'Read Farming Tip', desc:'Read today\'s tip', points:10 },
  { id:'weather', icon:'🌤', title:'Check Weather', desc:'Check forecast', points:5 },
  { id:'quiz', icon:'📝', title:'Farming Quiz', desc:'Answer a question', points:20 },
  { id:'record', icon:'📊', title:'Farm Record', desc:'Log activity', points:15 },
  { id:'browse', icon:'🚜', title:'Browse Equipment', desc:'Explore equipment', points:5 }
];

async function loadTasks(user) {
  const c = document.getElementById('tasksList');
  if (!c) return;
  try {
    const today = new Date().toDateString();
    const snap = await getDoc(doc(db,'users',user.uid));
    const completedToday = snap.exists() ? (snap.data().completedTasksToday||{}) : {};
    const lastTaskDate = snap.exists() ? snap.data().lastTaskDate : null;
    const todayTasks = lastTaskDate === today ? completedToday : {};
    c.innerHTML = TASKS.map(task => {
      const done = todayTasks[task.id];
      return `
      <div class="section-card" style="margin-bottom:10px;opacity:${done?0.6:1}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;background:${done?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.05)'};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">${done?'✅':task.icon}</div>
          <div style="flex:1">
            <p style="font-weight:600;font-size:0.88rem">${task.title}</p>
            <p style="color:#64748B;font-size:0.75rem">${task.desc}</p>
          </div>
          <div style="text-align:right">
            <p style="color:#22C55E;font-weight:700;font-size:0.82rem">+${task.points} pts</p>
            ${done?'':`<button class="action-btn" style="width:auto;padding:6px 14px;font-size:0.75rem" onclick="completeTask('${task.id}',${task.points})">Start</button>`}
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

window.completeTask = async function(taskId, points) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const today = new Date().toDateString();
    await updateDoc(doc(db,'users',user.uid), {
      rankPoints: increment(points),
      [`completedTasksToday.${taskId}`]: true,
      lastTaskDate: today
    });
    showToast(`✅ +${points} points!`);
    await loadTasks(user);
    await loadStats(user);
  } catch(e) { showToast('❌ Error', 'error'); }
};

const LESSONS = [
  { id:'teff', icon:'🌾', title:'Teff Farming Guide', level:'Beginner', duration:'5 min', points:30 },
  { id:'coffee', icon:'☕', title:'Coffee Production', level:'Intermediate', duration:'8 min', points:40 },
  { id:'maize', icon:'🌽', title:'Maize Management', level:'Beginner', duration:'6 min', points:30 },
  { id:'tractor', icon:'🚜', title:'Tractor Safety', level:'Advanced', duration:'10 min', points:50 }
];

async function loadAcademy() {
  const c = document.getElementById('academyList');
  if (!c) return;
  c.innerHTML = LESSONS.map(l => `
  <div class="section-card" style="margin-bottom:10px;cursor:pointer" onclick="startLesson('${l.id}','${l.title}',${l.points})">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:48px;height:48px;background:rgba(34,197,94,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${l.icon}</div>
      <div style="flex:1">
        <p style="font-weight:600;font-size:0.88rem">${l.title}</p>
        <p style="color:#64748B;font-size:0.73rem">${l.level} · ${l.duration}</p>
      </div>
      <p style="color:#22C55E;font-weight:700;font-size:0.78rem">+${l.points} pts</p>
    </div>
  </div>`).join('');
}

window.startLesson = async function(id, title, points) {
  const user = auth.currentUser;
  if (!user) return;
  if (!confirm(`Start "${title}"? Earn ${points} points!`)) return;
  await updateDoc(doc(db,'users',user.uid), { rankPoints: increment(points) });
  showToast(`🎓 +${points} points!`);
  await loadStats(user);
};

async function loadCommunity() {
  const c = document.getElementById('communityFeed');
  if (!c) return;
  try {
    const snap = await getDocs(query(collection(db,'community'), orderBy('createdAt','desc'), limit(10)));
    if (snap.empty) {
      c.innerHTML = `<div class="empty-state"><p>👥</p><p>No posts yet</p></div>`;
      return;
    }
    c.innerHTML = '';
    snap.forEach(d => {
      const p = d.data();
      c.innerHTML += `
      <div class="section-card" style="margin-bottom:10px">
        <p style="font-weight:600;font-size:0.82rem">${p.authorName||'Farmer'}</p>
        <p style="font-size:0.84rem;margin-top:6px">${p.content}</p>
        <button onclick="likeCommunityPost('${d.id}')" style="background:none;border:none;color:#64748B;font-size:0.75rem;margin-top:8px">❤️ ${p.likes||0}</button>
      </div>`;
    });
  } catch(e) { console.error(e); }
}

window.likeCommunityPost = async function(postId) {
  try { await updateDoc(doc(db,'community',postId), { likes: increment(1) }); await loadCommunity(); } catch(e) {}
};

async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db,'users',user.uid));
    if (snap.exists()) {
      const d = snap.data();
      const fields = { profileName:'fullName', profileFatherName:'fatherName', profilePhone:'phoneNumber', profileCity:'address' };
      Object.entries(fields).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (el && d[key]) el.value = d[key];
      });
      if (d.fullName) setEl('profileFullName', d.fullName);
    }
  } catch(e) { console.error(e); }
}

function setupForms(user) {
  document.getElementById('addListingBtn')?.addEventListener('click', () => {
    const f = document.getElementById('addListingForm');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('submitListing')?.addEventListener('click', async () => {
    const name = document.getElementById('equipName')?.value.trim();
    const category = document.getElementById('equipCategory')?.value;
    const price = document.getElementById('equipPrice')?.value;
    const city = document.getElementById('equipLocation')?.value.trim();
    const desc = document.getElementById('equipDesc')?.value.trim();
    if (!name||!price||!city) { showToast('⚠️ Fill all required fields','error'); return; }
    try {
      await addDoc(collection(db,'equipment'), {
        name, category, pricePerDay: Number(price),
        location: { city, latitude: 0, longitude: 0 },
        description: desc, ownerId: user.uid, ownerEmail: user.email,
        availability: 'available', rating: 0, totalBookings: 0,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db,'users',user.uid), { rankPoints: increment(30) });
      showToast('✅ Listed! +30 points');
      document.getElementById('addListingForm').style.display = 'none';
      await loadMyListings(user);
      await loadBrowse();
      await loadStats(user);
    } catch(e) { showToast('❌ ' + e.message,'error'); }
  });

  document.getElementById('depositBtn')?.addEventListener('click', () => showBankSelect('deposit'));
  document.getElementById('withdrawBtn')?.addEventListener('click', () => showBankSelect('withdraw'));

  document.getElementById('submitPost')?.addEventListener('click', async () => {
    const content = document.getElementById('postContent')?.value.trim();
    const category = document.getElementById('postCategory')?.value || 'tip';
    if (!content) { showToast('⚠️ Write something first','error'); return; }
    try {
      const snap = await getDoc(doc(db,'users',user.uid));
      const name = snap.exists() ? (snap.data().fullName||user.email.split('@')[0]) : user.email.split('@')[0];
      await addDoc(collection(db,'community'), { authorId: user.uid, authorName: name, content, category, likes: 0, comments: 0, createdAt: serverTimestamp() });
      await updateDoc(doc(db,'users',user.uid), { rankPoints: increment(10) });
      showToast('✅ Posted! +10 points');
      document.getElementById('postContent').value = '';
      await loadCommunity();
    } catch(e) { showToast('❌ ' + e.message,'error'); }
  });

  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name = document.getElementById('profileName')?.value;
    const father = document.getElementById('profileFatherName')?.value;
    const phone = document.getElementById('profilePhone')?.value;
    const city = document.getElementById('profileCity')?.value;
    try {
      await setDoc(doc(db,'users',user.uid), { fullName: name, fatherName: father, displayName: name, phoneNumber: phone, address: city }, { merge: true });
      showToast('✅ Profile saved!');
      setEl('profileFullName', name);
      setEl('sidebarName', name);
    } catch(e) { showToast('❌ ' + e.message,'error'); }
  });
}

const BANKS = [
  {id:'cbe',name:'CBE',icon:'🏦',desc:'Commercial Bank of Ethiopia'},
  {id:'awash',name:'Awash Bank',icon:'🏦',desc:'Awash International Bank'},
  {id:'dashen',name:'Dashen Bank',icon:'🏦',desc:'Dashen Bank S.C.'},
  {id:'abyssinia',name:'Abyssinia Bank',icon:'🏦',desc:'Bank of Abyssinia'},
  {id:'telebirr',name:'Telebirr',icon:'📱',desc:'Ethio Telecom Wallet'},
  {id:'mpesa',name:'M-Pesa',icon:'📱',desc:'Safaricom Ethiopia'}
];

function showBankSelect(type) {
  const m = document.getElementById('bankModal');
  const body = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSubtitle');
  if (!m||!body) return;
  title.textContent = type==='deposit'?'⬆️ Deposit Funds':'⬇️ Withdraw Funds';
  sub.textContent = 'Select your bank';
  body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
    ${BANKS.map(b=>`<button onclick="selectBank('${b.id}','${b.name}','${type}')" style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px">
      <span style="font-size:1.8rem">${b.icon}</span><span style="color:white;font-weight:600;font-size:0.8rem">${b.name}</span></button>`).join('')}
  </div><button onclick="closeBankModal()" style="width:100%;padding:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:rgba(255,255,255,0.5);cursor:pointer">Cancel</button>`;
  m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

window.closeBankModal = function() {
  const m = document.getElementById('bankModal');
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
};

window.selectBank = function(bankId, bankName, type) {
  const body = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');
  if (type==='deposit') {
    title.textContent = `⬆️ Deposit via ${bankName}`;
    body.innerHTML = `
      <input type="number" id="depositAmt" placeholder="Amount (min 100 ETB)" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;margin-bottom:10px"/>
      <input type="text" id="depositRef" placeholder="Transaction reference" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;margin-bottom:14px"/>
      <button onclick="submitDeposit('${bankName}')" style="width:100%;padding:13px;background:linear-gradient(135deg,#22C55E,#16A34A);border:none;border-radius:12px;color:white;font-weight:700;cursor:pointer">✅ Submit Deposit</button>`;
  } else {
    title.textContent = `⬇️ Withdraw via ${bankName}`;
    body.innerHTML = `
      <input type="number" id="withdrawAmt" placeholder="Amount (min 200 ETB)" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;margin-bottom:10px"/>
      <input type="text" id="withdrawAcct" placeholder="Account number" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;margin-bottom:10px"/>
      <input type="text" id="withdrawName" placeholder="Account holder name" style="width:100%;padding:12px;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:white;margin-bottom:14px"/>
      <button onclick="submitWithdrawal('${bankName}')" style="width:100%;padding:13px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border:none;border-radius:12px;color:white;font-weight:700;cursor:pointer">✅ Submit Withdrawal</button>`;
  }
};

window.submitDeposit = async function(bankName) {
  const amount = document.getElementById('depositAmt')?.value;
  const ref = document.getElementById('depositRef')?.value.trim();
  const user = auth.currentUser;
  if (!user) return;
  if (!amount||Number(amount)<100) { showToast('❌ Min 100 ETB','error'); return; }
  if (!ref) { showToast('❌ Enter reference','error'); return; }
  const result = await requestDeposit(user.uid, amount, bankName, ref);
  if (result.success) { closeBankModal(); showToast('✅ Deposit submitted!'); await loadWallet(user); }
  else { showToast('❌ ' + result.message,'error'); }
};

window.submitWithdrawal = async function(bankName) {
  const amount = document.getElementById('withdrawAmt')?.value;
  const acct = document.getElementById('withdrawAcct')?.value.trim();
  const name = document.getElementById('withdrawName')?.value.trim();
  const user = auth.currentUser;
  if (!user) return;
  if (!amount||Number(amount)<200) { showToast('❌ Min 200 ETB','error'); return; }
  if (!acct||!name) { showToast('❌ Fill all fields','error'); return; }
  const result = await requestWithdrawal(user.uid, amount, bankName, acct);
  if (result.success) { closeBankModal(); showToast('✅ Withdrawal submitted!'); await loadWallet(user); }
  else { showToast('❌ ' + result.message,'error'); }
};
