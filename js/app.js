// AgriEquip — app.js — single clean module
// Exposes all functions to window._app so bridge in HTML can reach them

import { auth, db } from '../firebase.js';
import {
  onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, query, where, orderBy, getDocs, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// ─── Constants ────────────────────────────────────────────
const NAV = [
  { id:'home',      icon:'🏠',  label:'Home' },
  { id:'browse',    icon:'🔍',  label:'Browse Equipment' },
  { id:'listings',  icon:'📦',  label:'My Listings' },
  { id:'wallet',    icon:'💳',  label:'Wallet' },
  { id:'vip',       icon:'💎',  label:'VIP Plans' },
  { id:'tasks',     icon:'✅',  label:'Daily Tasks' },
  { id:'academy',   icon:'🎓',  label:'Academy' },
  { id:'community', icon:'👥',  label:'Community' },
  { id:'teffai',    icon:'🤖',  label:'Teff AI' },
  { id:'profile',   icon:'👤',  label:'Profile' },
  { id:'settings',  icon:'⚙️',  label:'Settings' },
  { id:'about',     icon:'ℹ️',  label:'About & Legal' },
];

const VIP_PLANS = [
  { badge:'⚪', name:'Free',  fee:'0 ETB/mo',     commission:10, listings:2,   perk:'Basic access'              },
  { badge:'🟡', name:'VIP 1', fee:'200 ETB/mo',   commission:8,  listings:5,   perk:'Standard badge'            },
  { badge:'🟠', name:'VIP 2', fee:'500 ETB/mo',   commission:7,  listings:10,  perk:'Featured placement'        },
  { badge:'🔵', name:'VIP 3', fee:'1,000 ETB/mo', commission:6,  listings:20,  perk:'Priority support'          },
  { badge:'🟣', name:'VIP 4', fee:'2,000 ETB/mo', commission:5,  listings:50,  perk:'Top search ranking'        },
  { badge:'💎', name:'VIP 5', fee:'4,000 ETB/mo', commission:4,  listings:999, perk:'Verified badge + analytics'},
];

const RANKS = [
  { icon:'🌱', name:'Seedling',              xp:0     },
  { icon:'🌿', name:'Grower',               xp:100   },
  { icon:'🚜', name:'Equipment Specialist', xp:300   },
  { icon:'🌾', name:'Harvest Master',       xp:700   },
  { icon:'🏅', name:'Expert Farmer',        xp:1500  },
  { icon:'👑', name:'Agricultural Legend',  xp:3000  },
];

const DAILY_TASKS = [
  { id:'read_tip',   icon:'📖', title:'Read Today\'s Farming Tip',          xp:50  },
  { id:'check_wx',   icon:'🌤', title:'Check Weather Before Field Work',    xp:30  },
  { id:'log_farm',   icon:'📝', title:'Record Today\'s Farm Activity',      xp:40  },
  { id:'farm_quiz',  icon:'🧠', title:'Complete a Farming Quiz',            xp:60  },
  { id:'watch_tut',  icon:'🎬', title:'Watch Tractor Maintenance Tutorial', xp:45  },
  { id:'crop_photo', icon:'📷', title:'Upload a Crop Photo',                xp:35  },
];

const EQUIP_TASKS = [
  { id:'maintain', icon:'🔧', title:'Complete Maintenance Checklist', xp:80  },
  { id:'schedule', icon:'📅', title:'Schedule Equipment Servicing',   xp:70  },
  { id:'safety',   icon:'🛡',  title:'Pass Safety Quiz',              xp:100 },
  { id:'learn_op', icon:'🎓', title:'Learn to Operate a New Machine', xp:90  },
];

const BANKS = [
  'CBE (Commercial Bank of Ethiopia)',
  'Awash Bank','Dashen Bank','Abyssinia Bank',
  'Telebirr','M-Pesa','Bank of Abyssinia',
  'Nib Bank','United Bank','Cooperative Bank of Oromia',
  'Bunna Bank','Zemen Bank',
];

const ACADEMY = [
  { emoji:'🌾', title:'Introduction to Teff Farming',       pts:40, desc:'Learn the basics of Ethiopia\'s most important crop.' },
  { emoji:'☕', title:'Coffee Cultivation Guide',            pts:50, desc:'From seedling to harvest — Ethiopian coffee farming.' },
  { emoji:'🚜', title:'Tractor Operation & Safety',          pts:60, desc:'How to safely operate and maintain a tractor.' },
  { emoji:'💧', title:'Efficient Irrigation Techniques',     pts:45, desc:'Reduce water waste and improve crop yield.' },
  { emoji:'🌱', title:'Soil Health & Fertilizer Guide',      pts:55, desc:'Understanding soil pH, nutrients, and fertilizers.' },
  { emoji:'🐄', title:'Livestock Management Basics',         pts:50, desc:'Cattle, sheep, and goat management fundamentals.' },
  { emoji:'🌦', title:'Reading Weather for Farming',         pts:35, desc:'Use weather patterns to plan planting and harvesting.' },
  { emoji:'💰', title:'Farm Financial Management',           pts:65, desc:'Track income, expenses, and plan for profit.' },
];

// ─── Academy (categorized) data ──────────────────────────
const ACADEMY_CATEGORIES = [
  { id:'crop', icon:'🌾', name:'Crop Production', desc:'Teff, wheat, maize, coffee & more', color:'#22C55E' },
  { id:'machinery', icon:'🚜', name:'Machinery Training', desc:'Tractors, harvesters, safety', color:'#06B6D4' },
  { id:'smart', icon:'🌱', name:'Smart Farming', desc:'Soil, irrigation, pest control', color:'#8B5CF6' },
  { id:'livestock', icon:'🐄', name:'Livestock', desc:'Dairy, poultry, animal care', color:'#F59E0B' },
  { id:'business', icon:'💰', name:'Farm Business', desc:'Budgeting, marketing, growth', color:'#EF4444' },
];

// Each lesson can optionally include:
//   content: the readable lesson text. Use \n\n between paragraphs.
//   image:   a URL to a header image (e.g. a path to a file you commit to /assets/academy/...)
//   file:    a URL to a downloadable attachment (PDF, etc.)
// If content/image/file are omitted, the reader falls back to showing just `desc`.
const ACADEMY_LESSONS = [
  { id:0,  cat:'crop', emoji:'🌾', title:'Introduction to Teff Farming', pts:40, desc:'Planting, care, and harvest basics for Ethiopia\'s staple crop.',
    image:'assets/academy/teff-field.jpg',
    content:'Teff (Eragrostis tef) is Ethiopia\'s most important staple crop, used to make injera. It thrives in a wide range of altitudes, from lowlands to highlands above 2,800m, making it one of the most adaptable cereals grown in the country.\n\nPlanting: Teff is typically sown at the start of the main rainy season (Meher), from June to July, though some regions also grow a smaller Belg-season crop. Seeds are broadcast rather than row-planted, and because they are extremely small, a fine, well-prepared seedbed is essential — clumped or rocky soil leads to poor germination.\n\nSoil and water: Teff tolerates poor soils better than most cereals, but yields best in well-drained loam. Waterlogging in the early weeks is one of the most common causes of crop failure, so avoid planting in low-lying fields that pool water after rain.\n\nWeeding: Because teff seedlings are thin and low to the ground early on, weed competition can sharply cut yield. Most farmers weed twice: once around 20 days after planting and again before the crop closes canopy.\n\nHarvest: Teff is ready for harvest 2-6 months after planting depending on variety and altitude, when the plant turns golden-yellow and grains feel firm. Cut, dry in the field for a few days, then thresh — traditionally by driving livestock over the stalks, though mechanical threshers are increasingly common.\n\nStorage tip: Dry the grain thoroughly before storage — teff stored above 12% moisture is prone to mold, which can ruin an entire harvest within weeks.' },
  { id:1,  cat:'crop', emoji:'🌾', title:'Wheat Farming Guide', pts:35, desc:'Highland wheat cultivation from seed to harvest.',
    content:'Wheat is grown widely across Ethiopia\'s highlands, typically above 1,500m, where cooler temperatures favor grain development.\n\n(Add your full lesson text here — planting windows, soil prep, fertilizer timing, pest watch-outs, and harvest signs.)' },
  { id:2,  cat:'crop', emoji:'🌽', title:'Maize Production Techniques', pts:35, desc:'Belg and meher season maize management.' },
  { id:3,  cat:'crop', emoji:'☕', title:'Coffee Cultivation Guide', pts:50, desc:'From seedling to harvest — Ethiopian coffee farming.' },
  { id:4,  cat:'crop', emoji:'🌻', title:'Sesame Farming Basics', pts:30, desc:'Growing sesame for export markets.' },
  { id:5,  cat:'crop', emoji:'🥬', title:'Vegetable Farming Guide', pts:30, desc:'High-value vegetable production techniques.' },
  { id:6,  cat:'crop', emoji:'🍎', title:'Fruit Tree Farming', pts:35, desc:'Planting and caring for fruit orchards.' },
  { id:7,  cat:'crop', emoji:'🏡', title:'Greenhouse Farming Intro', pts:45, desc:'Getting started with controlled environment farming.' },
  { id:8,  cat:'machinery', emoji:'🚜', title:'Tractor Operation & Safety', pts:60, desc:'How to safely operate and maintain a tractor.' },
  { id:9,  cat:'machinery', emoji:'🌾', title:'Combine Harvester Basics', pts:55, desc:'Operating combine harvesters efficiently.' },
  { id:10, cat:'machinery', emoji:'⚙️', title:'Ploughing Techniques', pts:35, desc:'Proper ploughing methods for different soils.' },
  { id:11, cat:'machinery', emoji:'🌱', title:'Seeder Operation Guide', pts:35, desc:'Using mechanical seeders for even planting.' },
  { id:12, cat:'machinery', emoji:'💧', title:'Irrigation Pump Maintenance', pts:40, desc:'Keeping your irrigation pumps running smoothly.' },
  { id:13, cat:'machinery', emoji:'🔧', title:'Machine Maintenance Basics', pts:45, desc:'Regular upkeep to extend equipment life.' },
  { id:14, cat:'machinery', emoji:'⛽', title:'Fuel-Saving Practices', pts:30, desc:'Reduce fuel costs on your equipment.' },
  { id:15, cat:'machinery', emoji:'🛡', title:'Equipment Safety Procedures', pts:50, desc:'Preventing accidents around farm machinery.' },
  { id:16, cat:'smart', emoji:'🎯', title:'Precision Agriculture Intro', pts:50, desc:'Using data to optimize every hectare.' },
  { id:17, cat:'smart', emoji:'🌍', title:'Soil Health & Fertilizer Guide', pts:55, desc:'Understanding soil pH, nutrients, and fertilizers.' },
  { id:18, cat:'smart', emoji:'💧', title:'Efficient Irrigation Techniques', pts:45, desc:'Reduce water waste and improve crop yield.' },
  { id:19, cat:'smart', emoji:'🐛', title:'Pest Management Guide', pts:40, desc:'Identify and control common crop pests.' },
  { id:20, cat:'smart', emoji:'🦠', title:'Disease Prevention Basics', pts:40, desc:'Spotting and preventing crop diseases early.' },
  { id:21, cat:'smart', emoji:'🌦', title:'Climate-Smart Farming', pts:45, desc:'Adapting farming practices to changing weather.' },
  { id:22, cat:'livestock', emoji:'🐄', title:'Dairy Farming Basics', pts:45, desc:'Milk production and dairy cattle care.' },
  { id:23, cat:'livestock', emoji:'🐂', title:'Beef Production Guide', pts:40, desc:'Raising cattle for meat production.' },
  { id:24, cat:'livestock', emoji:'🐔', title:'Poultry Management', pts:35, desc:'Chicken farming for eggs and meat.' },
  { id:25, cat:'livestock', emoji:'🐑', title:'Sheep & Goat Farming', pts:35, desc:'Small ruminant management basics.' },
  { id:26, cat:'livestock', emoji:'💉', title:'Vaccination Schedules', pts:30, desc:'Keeping livestock healthy with proper vaccination.' },
  { id:27, cat:'business', emoji:'📊', title:'Farm Budgeting Basics', pts:40, desc:'Planning your farm finances effectively.' },
  { id:28, cat:'business', emoji:'📝', title:'Farm Record Keeping', pts:30, desc:'Track expenses, income, and yields properly.' },
  { id:29, cat:'business', emoji:'📈', title:'Marketing Your Produce', pts:45, desc:'Get the best prices for what you grow.' },
  { id:30, cat:'business', emoji:'💳', title:'Digital Payments for Farmers', pts:25, desc:'Using mobile money and digital wallets.' },
];

const AGRI_RANKS = [
  { icon:'🌱', name:'Beginner Farmer', xp:0 },
  { icon:'🌿', name:'Skilled Farmer', xp:150 },
  { icon:'🌾', name:'Advanced Farmer', xp:400 },
  { icon:'🚜', name:'Equipment Specialist', xp:800 },
  { icon:'🧠', name:'Agri Expert', xp:1500 },
  { icon:'👑', name:'Agri Master', xp:3000 },
];

const DAILY_TIPS = [
  '🌱 Rotate your crops every season to keep soil healthy and reduce pest buildup.',
  '💧 Water early morning or late evening to reduce evaporation loss.',
  '🌾 Test your soil every 2-3 years to know exactly what nutrients it needs.',
  '🚜 Check tractor oil levels weekly during heavy use season.',
  '☕ Coffee cherries are ready to pick when fully red — check daily during harvest.',
];

const VIDEOS = [
  { emoji:'🎬', title:'How to Operate a Tractor Safely', dur:'8 min' },
  { emoji:'🎬', title:'Coffee Harvesting Techniques', dur:'6 min' },
  { emoji:'🎬', title:'Irrigation System Setup', dur:'10 min' },
  { emoji:'🎬', title:'Tractor Maintenance Basics', dur:'7 min' },
];
const ARTICLES = [
  { emoji:'📄', title:'Understanding Soil pH for Better Yields', read:'4 min' },
  { emoji:'📄', title:'Fertilizer Timing Guide for Ethiopian Crops', read:'5 min' },
  { emoji:'📄', title:'Pest Management Without Chemicals', read:'6 min' },
  { emoji:'📄', title:'Water Conservation Techniques for Farms', read:'4 min' },
];

// ─── State ────────────────────────────────────────────────
let currentUser = null;
let userProfile = null;
let currentSection = 'home';
let sectionHistory = ['home'];
let historyIndex = 0;
let teffHistory = [];

// ─── Init ─────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  await loadUserProfile();
  renderUserInfo();
  applyTheme(localStorage.getItem('agriequip_theme') || 'dark');
  showSection('home');
});

// ─── Expose to bridge ─────────────────────────────────────
window._app = {
  showSection, navBack, navForward, handleSignOut,
  copyReferral, setTheme, saveProfile,
  askTeff, sendTeff, clearTeffChat,
  completeTask, activateVIP,
  submitDeposit, submitWithdraw, showDepositForm, showWithdrawForm, backToWallet,
  submitListing, toggleListingForm, filterEquipment,
  setAcademyView, openLessonReader, closeLessonReader, completeLessonFromReader,
  showToast,
};

// ─── Profile ──────────────────────────────────────────────
async function loadUserProfile() {
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) userProfile = snap.data();
  } catch(e) { console.warn('Profile:', e.message); }
}

function renderUserInfo() {
  const email = currentUser?.email || '';
  const name  = userProfile?.fullName || userProfile?.displayName || '';
  const letter= (name || email).charAt(0).toUpperCase();
  setText('userInitial',   letter);
  setText('userEmail',     email.length > 16 ? email.slice(0,16)+'...' : email);
  setText('sidebarInitial',letter);
  setText('sidebarName',   name || 'AgriEquip User');
  setText('sidebarEmail',  email);
}

// ─── Navigation ───────────────────────────────────────────
function showSection(id) {
  currentSection = id;
  if (sectionHistory[historyIndex] !== id) {
    sectionHistory = sectionHistory.slice(0, historyIndex + 1);
    sectionHistory.push(id);
    historyIndex = sectionHistory.length - 1;
  }
  closeSidebar();
  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.section === id);
  });
  // Update page title
  const item = NAV.find(n => n.id === id);
  setText('pageTitle', item ? item.icon + ' ' + item.label : id);
  // Render
  renderSection(id);
}

function navBack() {
  if (historyIndex > 0) { historyIndex--; showSection(sectionHistory[historyIndex]); }
}
function navForward() {
  if (historyIndex < sectionHistory.length - 1) { historyIndex++; showSection(sectionHistory[historyIndex]); }
}

function openSidebar()  { document.getElementById('sidebar')?.classList.add('open'); document.getElementById('overlay')?.classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('overlay')?.classList.remove('active'); }

async function handleSignOut() {
  await signOut(auth);
  window.location.href = 'login.html';
}

// ─── Academy helpers (module scope — NOT inside the switch) ─
function getAcademyProgress() {
  return JSON.parse(localStorage.getItem('agriequip_academy') || '{"completed":[],"xp":0,"streak":0,"lastDay":null}');
}
function saveAcademyProgress(p) {
  localStorage.setItem('agriequip_academy', JSON.stringify(p));
}
function academyRank(xp) {
  return [...AGRI_RANKS].reverse().find(r => xp >= r.xp) || AGRI_RANKS[0];
}
function academyNextRank(xp) {
  return AGRI_RANKS.find(r => r.xp > xp) || null;
}

function setAcademyView(view, cat) {
  window._academyView = view;
  if (cat) window._academyCat = cat;
  renderSection('academy');
}

function openLessonReader(id) {
  const lesson = ACADEMY_LESSONS.find(l => l.id === id);
  if (!lesson) return;
  const prog = getAcademyProgress();
  const done = prog.completed.includes(id);
  const overlay = document.createElement('div');
  overlay.id = 'lessonReaderOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;display:flex;align-items:flex-end;justify-content:center';
  overlay.onclick = (e) => { if (e.target === overlay) closeLessonReader(); };
  overlay.innerHTML = `
    <div style="background:#0F172A;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;border-radius:20px 20px 0 0;padding:20px 20px 28px;animation:sheetUp .3s ease">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-size:.75rem;color:#64748B">📚 Lesson</span>
        <button onclick="closeLessonReader()" style="background:rgba(255,255,255,.08);border:none;color:white;width:28px;height:28px;border-radius:8px;font-size:1rem;cursor:pointer">✕</button>
      </div>
      ${lesson.image ? `<img src="${lesson.image}" alt="${lesson.title}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:14px" onerror="this.style.display='none'">` : ''}
      <div style="font-size:2rem;margin-bottom:6px">${lesson.emoji}</div>
      <h2 style="color:white;font-size:1.2rem;margin-bottom:12px">${lesson.title}</h2>
      <div style="color:#94A3B8;font-size:.86rem;line-height:1.85;white-space:pre-line">${(lesson.content || lesson.desc).replace(/</g,'&lt;')}</div>
      ${lesson.file ? `<a href="${lesson.file}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:16px;color:#22C55E;font-size:.82rem;text-decoration:none;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:8px 14px">📎 Download attachment</a>` : ''}
      <button class="action-btn" style="margin-top:20px" ${done?'disabled style="opacity:.5"':''} onclick="completeLessonFromReader(${id})">
        ${done ? '✅ Already Completed' : '✅ Mark Complete (+'+lesson.pts+' XP)'}
      </button>
    </div>`;
  document.body.appendChild(overlay);
}

function closeLessonReader() {
  document.getElementById('lessonReaderOverlay')?.remove();
}

function completeLessonFromReader(id) {
  const lesson = ACADEMY_LESSONS.find(l => l.id === id);
  if (!lesson) return;
  const prog = getAcademyProgress();
  if (prog.completed.includes(id)) return;
  prog.completed.push(id);
  prog.xp += lesson.pts;
  saveAcademyProgress(prog);
  showToast(`🎓 Lesson complete! +${lesson.pts} XP`);
  closeLessonReader();
  renderSection('academy');
}

function renderAcademyHome() {
  const prog = getAcademyProgress();
  const rank = academyRank(prog.xp);
  const dailyTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
  return `
    <div class="section-card" style="background:linear-gradient(135deg,#0F172A,#1a3a2a);margin-bottom:16px">
      <h3 style="color:white">🎓 AgriAcademy</h3>
      <p style="color:rgba(255,255,255,.6);font-size:.8rem;margin-top:4px;font-style:italic">"Learn. Grow. Succeed."</p>
      <div style="display:flex;align-items:center;gap:10px;margin-top:12px">
        <span style="font-size:1.6rem">${rank.icon}</span>
        <div>
          <div style="font-weight:700;color:#22C55E;font-size:.95rem">${rank.name}</div>
          <div style="color:rgba(255,255,255,.4);font-size:.72rem">${prog.xp.toLocaleString()} XP · ${prog.completed.length} lessons done</div>
        </div>
      </div>
      <button class="action-btn" style="margin-top:12px;background:rgba(255,255,255,.12)" onclick="setAcademyView('dashboard')">📊 View Learning Dashboard</button>
    </div>
    <div class="section-card">
      <h3>💡 Daily Farming Tip</h3>
      <p style="font-size:.86rem;line-height:1.6">${dailyTip}</p>
    </div>
    <div class="section-card">
      <h3>🧠 Ask Teff AI</h3>
      <p style="color:#64748B;font-size:.82rem;margin-bottom:10px">Not sure what to learn? Ask Teff AI for a lesson recommendation.</p>
      <button class="action-btn" onclick="showSection('teffai')">🤖 Ask Teff AI</button>
    </div>
    <h3 style="margin:16px 0 10px;font-size:.95rem">📚 Learning Categories</h3>
    ${ACADEMY_CATEGORIES.map(cat => {
      const count = ACADEMY_LESSONS.filter(l => l.cat === cat.id).length;
      const done = ACADEMY_LESSONS.filter(l => l.cat === cat.id && prog.completed.includes(l.id)).length;
      return `
      <div class="section-card" style="cursor:pointer;border-left:4px solid ${cat.color}" onclick="setAcademyView('category','${cat.id}')">
        <div style="display:flex;align-items:center;gap:14px">
          <span style="font-size:2rem">${cat.icon}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:.92rem">${cat.name}</div>
            <div style="color:#64748B;font-size:.78rem;margin-top:2px">${cat.desc}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.78rem;color:${cat.color};font-weight:700">${done}/${count}</div>
            <div style="font-size:.68rem;color:#64748B">lessons</div>
          </div>
        </div>
      </div>`;
    }).join('')}
    <div class="section-card" style="opacity:.6">
      <h3>👨‍🏫 Expert Center</h3>
      <p style="color:#64748B;font-size:.8rem">Live Q&A and expert consultations — coming soon!</p>
    </div>`;
}

function renderAcademyCategory(catId) {
  const cat = ACADEMY_CATEGORIES.find(c => c.id === catId);
  const lessons = ACADEMY_LESSONS.filter(l => l.cat === catId);
  const prog = getAcademyProgress();
  if (!cat) return renderAcademyHome();
  return `
    <button class="action-btn" style="width:auto;padding:8px 14px;margin-bottom:12px;background:#334155" onclick="setAcademyView('home')">← Back to Academy</button>
    <div class="section-card" style="background:linear-gradient(135deg,${cat.color}22,${cat.color}11);border-color:${cat.color}44;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:2.2rem">${cat.icon}</span>
        <div>
          <div style="font-weight:800;font-size:1.05rem">${cat.name}</div>
          <div style="color:#64748B;font-size:.8rem">${cat.desc}</div>
        </div>
      </div>
    </div>
    ${lessons.map(l => {
      const done = prog.completed.includes(l.id);
      return `
      <div class="section-card" style="cursor:pointer;${done?'opacity:.6':''}" onclick="openLessonReader(${l.id})">
        <div style="display:flex;align-items:center;gap:14px">
          <span style="font-size:2rem">${done?'✅':l.emoji}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:.92rem">${l.title}</div>
            <div style="color:#64748B;font-size:.78rem;margin-top:2px">${l.desc}</div>
          </div>
          <span style="background:${cat.color}18;color:${cat.color};border-radius:6px;padding:4px 8px;font-size:.75rem;white-space:nowrap">${done?'Done':'+'+l.pts+' XP'}</span>
        </div>
      </div>`;
    }).join('')}`;
}

function renderAcademyDashboard() {
  const prog = getAcademyProgress();
  const rank = academyRank(prog.xp);
  const next = academyNextRank(prog.xp);
  const pct = next ? Math.round((prog.xp - rank.xp) / (next.xp - rank.xp) * 100) : 100;
  const doneLessons = ACADEMY_LESSONS.filter(l => prog.completed.includes(l.id));
  return `
    <button class="action-btn" style="width:auto;padding:8px 14px;margin-bottom:12px;background:#334155" onclick="setAcademyView('home')">← Back to Academy</button>
    <div class="section-card" style="background:linear-gradient(135deg,#0F172A,#1a3a2a);margin-bottom:16px">
      <h3 style="color:white">📊 Learning Dashboard</h3>
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
        <span style="font-size:1.8rem">${rank.icon}</span>
        <div>
          <div style="font-weight:700;color:#22C55E;font-size:1rem">${rank.name}</div>
          <div style="color:rgba(255,255,255,.4);font-size:.75rem">${prog.xp.toLocaleString()} XP</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.1);border-radius:20px;height:8px;overflow:hidden;margin:10px 0">
        <div style="background:linear-gradient(90deg,#22C55E,#06B6D4);height:100%;width:${pct}%"></div>
      </div>
      <p style="color:rgba(255,255,255,.4);font-size:.72rem;text-align:center">
        ${next ? prog.xp+' / '+next.xp+' XP to '+next.name : '🎉 Max rank achieved!'}
      </p>
    </div>

    <div class="quick-stats">
      <div class="stat-card"><div class="stat-icon">📚</div><h3>${prog.completed.length}</h3><p>Lessons Done</p></div>
      <div class="stat-card"><div class="stat-icon">⭐</div><h3>${prog.xp.toLocaleString()}</h3><p>Total XP</p></div>
    </div>

    <div class="section-card">
      <h3>✅ Completed Lessons</h3>
      ${doneLessons.length === 0
        ? `<p style="color:#64748B;text-align:center;padding:16px">No lessons completed yet — start learning!</p>`
        : doneLessons.map(l => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-size:1.3rem">${l.emoji}</span>
            <div style="flex:1;font-size:.85rem">${l.title}</div>
            <span style="font-size:.72rem;color:#22C55E">✅ +${l.pts} XP</span>
          </div>`).join('')}
    </div>

    <div class="section-card">
      <h3>🏆 Academy Ranks</h3>
      ${AGRI_RANKS.map(r=>`
      <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
        <span style="font-size:1.5rem">${r.icon}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.88rem;${prog.xp>=r.xp?'color:#22C55E':''}">${r.name}</div>
          <div style="font-size:.72rem;color:#64748B">${r.xp.toLocaleString()} XP required</div>
        </div>
        <span style="font-size:.8rem">${prog.xp>=r.xp?'✅':'🔒'}</span>
      </div>`).join('')}
    </div>`;
}

// ─── Render Sections ──────────────────────────────────────
function renderSection(id) {
  const root = document.getElementById('pageContent');
  if (!root) return;

  switch(id) {

    // ── HOME ─────────────────────────────────────────────
    case 'home': {
      const xp   = getXP();
      const rank = currentRank(xp);
      const next = nextRank(xp);
      const pct  = next ? Math.round(((xp - rank.xp) / (next.xp - rank.xp)) * 100) : 100;
      const ref  = userProfile?.referralCode || 'AGR-' + (currentUser?.uid?.slice(0,6).toUpperCase());
      root.innerHTML = `
        <div class="welcome-card">
          <div class="welcome-tag">🌍 Ethiopia's Smart Agriculture Platform</div>
          <h2>Welcome to AgriEquip 👋</h2>
          <p>Rent equipment, complete tasks, learn, and grow with the community.</p>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
            <button class="action-btn" style="width:auto;padding:10px 18px;font-size:.82rem" onclick="showSection('browse')">🔍 Browse Now</button>
            <button class="action-btn" style="width:auto;padding:10px 18px;font-size:.82rem;background:rgba(255,255,255,.15);box-shadow:none" onclick="showSection('teffai')">🤖 Ask Teff AI</button>
          </div>
        </div>

        <div class="section-card">
          <h3>🏆 Your Rank</h3>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <p style="font-size:1.2rem;font-weight:700;color:#22C55E">${rank.icon} ${rank.name}</p>
            <p style="color:#64748B;font-size:.82rem">${xp.toLocaleString()} pts</p>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:20px;height:8px;overflow:hidden">
            <div style="background:linear-gradient(90deg,#22C55E,#06B6D4);height:100%;width:${pct}%;transition:width .5s"></div>
          </div>
          <p style="color:#64748B;font-size:.72rem;margin-top:6px;text-align:center">
            ${next ? xp+' / '+next.xp+' pts to '+next.name : '🎉 Max rank achieved!'}
          </p>
          <button class="action-btn" style="margin-top:12px" onclick="showSection('tasks')">✅ Complete Daily Tasks</button>
        </div>

        <div class="quick-stats">
          <div class="stat-card"><div class="stat-icon">📦</div><h3 id="hListings">0</h3><p>My Listings</p></div>
          <div class="stat-card"><div class="stat-icon">💰</div><h3 id="hBalance">0 ETB</h3><p>Wallet Balance</p></div>
          <div class="stat-card"><div class="stat-icon">💎</div><h3 id="hVip">Free</h3><p>VIP Level</p></div>
          <div class="stat-card"><div class="stat-icon">🎁</div><h3 id="hRefs">0</h3><p>Referrals</p></div>
        </div>

        <div class="section-card">
          <h3>⚡ Quick Actions</h3>
          <div class="quick-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
  <button class="action-btn" onclick="showSection('browse')">🚜 Rent Equipment</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#06B6D4,#0891B2)" onclick="showSection('teffai')">🤖 Ask AI</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED)" onclick="showSection('wallet')">💳 Wallet</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#F59E0B,#D97706)" onclick="showSection('academy')">🎓 Academy</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#64748B,#475569)" onclick="showToast('📷 Crop Scanner coming soon!')">📷 Scan Crop</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#64748B,#475569)" onclick="showToast('🌤 Weather coming soon!')">🌤 Weather</button>
  <button class="action-btn" style="background:linear-gradient(135deg,#EF4444,#DC2626)" onclick="showToast('🆘 Emergency SOS coming soon!')">🆘 Emergency SOS</button>
  <button class="action-btn" onclick="showSection('listings')">📦 My Listings</button>
</div>
        </div>
        <div class="section-card">
          <h3>📈 Live Market Prices</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[['🌾','Teff','8,200 ETB/qtl','+3.2%','#22C55E'],['☕','Coffee','12,400 ETB/qtl','+5.1%','#22C55E'],['🌽','Maize','2,900 ETB/qtl','-1.4%','#EF4444'],['🌾','Wheat','5,600 ETB/qtl','+0.8%','#22C55E']].map(([e,n,p,c,col])=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">
              <div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.2rem">${e}</span><span style="font-size:.85rem;font-weight:600">${n}</span></div>
              <div style="text-align:right"><div style="font-size:.85rem;font-weight:700">${p}</div><div style="font-size:.72rem;color:${col}">${c}</div></div>
            </div>`).join('')}
          </div>
          <p style="color:#64748B;font-size:.7rem;margin-top:8px;text-align:center">Addis Ababa market · Updated today</p>
        </div>
        <div class="section-card">
          <h3>🌱 My Farm Overview</h3>
          <div class="quick-stats" style="margin:0">
            <div class="stat-card" style="padding:12px"><div class="stat-icon">📏</div><h3 style="font-size:1rem" id="farmSize">—</h3><p>Farm Size</p></div>
            <div class="stat-card" style="padding:12px"><div class="stat-icon">🌾</div><h3 style="font-size:1rem" id="farmCrops">—</h3><p>Crops</p></div>
          </div>
          <button class="action-btn" style="margin-top:10px;background:linear-gradient(135deg,#64748B,#475569)" onclick="showToast('🚧 Farm profile coming soon!')">✏️ Set Up Farm Profile</button>
        </div>
        
        <div class="section-card">
          <h3>🎁 Referral Program</h3>
          <p style="color:#64748B;font-size:.82rem;margin-bottom:12px">Invite friends — earn <strong style="color:#22C55E">50 ETB</strong> per referral!</p>
          <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div>
              <p style="color:#64748B;font-size:.7rem;margin-bottom:2px">Your code</p>
              <span style="font-weight:700;font-size:1rem;letter-spacing:3px;color:#22C55E">${ref}</span>
            </div>
            <button class="action-btn" style="width:auto;padding:8px 14px;font-size:.76rem" onclick="copyReferral()">📋 Copy</button>
          </div>
        </div>`;
      loadHomeStats();
      break;
    }

    // ── BROWSE ───────────────────────────────────────────
    case 'browse':
      root.innerHTML = `
        <div class="search-container">
          <div class="search-bar">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" id="searchInput" placeholder="Search tractors, plows, harvesters..." oninput="filterEquipment()">
            </div>
            <select id="categoryFilter" onchange="filterEquipment()">
              <option value="">🌐 All Categories</option>
              <option value="tractor">🚜 Tractor</option>
              <option value="plow">🔧 Plow</option>
              <option value="harvester">🌾 Harvester</option>
              <option value="pump">💧 Pump</option>
              <option value="thresher">⚙️ Thresher</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
        </div>
        <div id="equipmentList" class="equipment-grid"></div>`;
      loadEquipment();
      break;

    // ── LISTINGS ─────────────────────────────────────────
    case 'listings':
      root.innerHTML = `
        <button class="action-btn" style="margin-bottom:16px" onclick="toggleListingForm()">➕ Add New Equipment</button>
        <div id="addListingForm" style="display:none" class="section-card">
          <h3>➕ List Your Equipment</h3>
          <input type="text"   id="equipName"     placeholder="Equipment name *"        class="form-input">
          <select              id="equipCategory"                                        class="form-input">
            <option value="tractor">🚜 Tractor</option>
            <option value="plow">🔧 Plow</option>
            <option value="harvester">🌾 Harvester</option>
            <option value="pump">💧 Pump</option>
            <option value="thresher">⚙️ Thresher</option>
            <option value="other">📦 Other</option>
          </select>
          <input type="number" id="equipPrice"    placeholder="Price per day (ETB) *"   class="form-input">
          <input type="text"   id="equipLocation" placeholder="Your city/location *"    class="form-input">
          <textarea            id="equipDesc"     placeholder="Describe your equipment..." class="form-input" rows="3"></textarea>
          <button class="action-btn" onclick="submitListing()">✅ Submit Listing (+30 pts)</button>
          <button class="action-btn" style="background:#64748B;margin-top:8px" onclick="toggleListingForm()">✕ Cancel</button>
          <p id="listingMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
        </div>
        <div id="myListings"></div>`;
      loadMyListings();
      break;

    // ── WALLET ───────────────────────────────────────────
    case 'wallet':
      root.innerHTML = `
        <div class="wallet-card">
          <p style="color:rgba(255,255,255,.55);font-size:.82rem">💳 Available Balance</p>
          <div class="wallet-balance" id="walletBalance">Loading...</div>
          <p style="color:rgba(255,255,255,.3);font-size:.7rem;margin-top:4px">Min withdrawal: 400 ETB • Deposits approved within 24hrs</p>
          <div class="wallet-actions">
            <button class="wallet-btn deposit" onclick="showDepositForm()">⬆️ Deposit</button>
            <button class="wallet-btn withdraw" onclick="showWithdrawForm()">⬇️ Withdraw</button>
          </div>
        </div>

        <!-- DEPOSIT FORM -->
        <div id="depositSection" style="display:none!important"  class="section-card">
          <h3>⬆️ Deposit Request</h3>
          <p style="color:#64748B;font-size:.82rem;margin-bottom:12px">Send money to AgriEquip first, then fill this form.</p>
          <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:14px;margin-bottom:14px;font-size:.83rem;line-height:2">
            🏦 <strong>CBE</strong> — Account: <strong>1000123456789</strong><br>
            📱 <strong>Telebirr</strong> — <strong>+251 993 920 750</strong><br>
            🏦 <strong>Awash Bank</strong> — Account: <strong>01320123456789</strong><br>
            <span style="opacity:.6;font-size:.75rem">Name: AgriEquip Platform</span>
          </div>
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Your Sender Bank *</label>
          <select class="form-input" id="senderBank"><option value="">Select bank</option>${BANKS.map(b=>`<option>${b}</option>`).join('')}</select>
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Your Account / Phone *</label>
          <input type="text" class="form-input" id="senderAccount" placeholder="1000XXXXXXXXX or 09XXXXXXXX">
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Amount (ETB) — Min 100 *</label>
          <input type="number" class="form-input" id="depositAmount" placeholder="Enter amount" min="100">
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Transaction Reference *</label>
          <input type="text" class="form-input" id="depositRef" placeholder="TXN-XXXXXXXXXX from your receipt">
          <button class="wallet-btn deposit" style="opacity:0.4;cursor:not-allowed" disabled>📤 Deposit — Coming Soon</button>
          <button class="action-btn" style="background:#334155;margin-top:8px" onclick="backToWallet()">← Back</button>
          <p id="depositMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
        </div>

        <!-- WITHDRAW FORM -->
        <div id="withdrawSection" style="display:none" class="section-card">
          <h3>⬇️ Withdrawal Request</h3>
          <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:10px;margin-bottom:12px;font-size:.8rem;color:#F59E0B">
            ⚠️ Minimum withdrawal is 400 ETB. Processed within 24 hours.
          </div>
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Receiving Bank *</label>
          <select class="form-input" id="withdrawBank"><option value="">Select bank</option>${BANKS.map(b=>`<option>${b}</option>`).join('')}</select>
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Account Number / Phone *</label>
          <input type="text" class="form-input" id="withdrawAccount" placeholder="Your account number or phone">
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Full Name (as on account) *</label>
          <input type="text" class="form-input" id="withdrawName" placeholder="e.g. Abebe Kebede">
          <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Amount (ETB) — Min 400 *</label>
          <input type="number" class="form-input" id="withdrawAmount" placeholder="Enter amount" min="400">
          <button class="action-btn" onclick="submitWithdraw()">📥 Submit Withdrawal</button>
          <button class="action-btn" style="background:#334155;margin-top:8px" onclick="backToWallet()">← Back</button>
          <p id="withdrawMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
        </div>

        <!-- BANKS LIST -->
        <div id="walletMain">
          
          <div class="section-card">
            <h3>📊 Transaction History</h3>
            <div id="transactionHistory"><p style="color:#64748B;text-align:center;padding:20px">Loading...</p></div>
          </div>
        </div>`;
      loadWalletBalance();
      loadTransactions();
      break;

    // ── VIP ──────────────────────────────────────────────
    case 'vip':
      root.innerHTML = `
        <div class="section-card" style="background:linear-gradient(135deg,#0F172A,#1a3a2a);margin-bottom:16px">
          <h3 style="color:white">💎 VIP Membership Plans</h3>
          <p style="color:rgba(255,255,255,.55);font-size:.82rem;margin-top:8px">Lower commission and more listings with each tier.</p>
        </div>
        <div class="vip-grid">
          ${VIP_PLANS.map(p => `
          <div class="vip-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="font-size:1rem;font-weight:700">${p.badge} ${p.name}</div>
              <div style="color:#22C55E;font-weight:700;font-size:.88rem">${p.fee}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
              <span class="vip-tag">📉 ${p.commission}% commission</span>
              <span class="vip-tag">📦 ${p.listings === 999 ? 'Unlimited' : p.listings} listings</span>
              <span class="vip-tag">✨ ${p.perk}</span>
            </div>
            ${p.name === 'Free'
              ? `<div style="text-align:center;color:#22C55E;font-size:.82rem;padding:8px;border:1px solid rgba(34,197,94,.3);border-radius:8px">✅ Current Plan</div>`
              : `<button class="action-btn" onclick="activateVIP('${p.name}','${p.fee}')">Activate ${p.name}</button>`}
          </div>`).join('')}
        </div>`;
      break;

    // ── TASKS ────────────────────────────────────────────
    case 'tasks': {
      const xp2   = getXP();
      const rank2 = currentRank(xp2);
      const next2 = nextRank(xp2);
      const done  = getDoneTasks();
      const pct2  = next2 ? Math.round(((xp2-rank2.xp)/(next2.xp-rank2.xp))*100) : 100;
      root.innerHTML = `
        <div class="section-card" style="background:linear-gradient(135deg,#0F172A,#1a3a2a);margin-bottom:16px">
          <h3 style="color:white">✅ Daily Tasks & Achievements</h3>
          <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
            <span style="font-size:1.8rem">${rank2.icon}</span>
            <div>
              <div style="font-weight:700;color:#22C55E;font-size:1rem">${rank2.name}</div>
              <div style="color:rgba(255,255,255,.4);font-size:.75rem">${xp2.toLocaleString()} XP</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,.1);border-radius:20px;height:8px;overflow:hidden;margin:10px 0">
            <div style="background:linear-gradient(90deg,#22C55E,#06B6D4);height:100%;width:${pct2}%"></div>
          </div>
          <p style="color:rgba(255,255,255,.4);font-size:.72rem;text-align:center">
            ${next2 ? xp2+' / '+next2.xp+' XP to '+next2.name : '🎉 Legendary Farmer!'}
          </p>
        </div>

        <div class="section-card">
          <h3>🌱 Daily Farming Tasks</h3>
          <p style="color:#64748B;font-size:.78rem;margin-bottom:12px">Resets daily at midnight</p>
          ${DAILY_TASKS.map(t => `
          <div class="task-item ${done.includes(t.id)?'done':''}" onclick="completeTask('${t.id}',${t.xp})">
            <span class="task-icon">${t.icon}</span>
            <div style="flex:1">
              <div style="font-size:.88rem;font-weight:600">${t.title}</div>
              <div style="font-size:.72rem;color:#64748B">Tap to complete</div>
            </div>
            <span class="task-xp" id="xplbl-${t.id}">${done.includes(t.id)?'✅ Done':'+'+t.xp+' XP'}</span>
          </div>`).join('')}
        </div>

        <div class="section-card">
          <h3>🚜 Equipment Tasks</h3>
          ${EQUIP_TASKS.map(t => `
          <div class="task-item ${done.includes(t.id)?'done':''}" onclick="completeTask('${t.id}',${t.xp})">
            <span class="task-icon">${t.icon}</span>
            <div style="flex:1">
              <div style="font-size:.88rem;font-weight:600">${t.title}</div>
              <div style="font-size:.72rem;color:#64748B">Equipment management</div>
            </div>
            <span class="task-xp" id="xplbl-${t.id}">${done.includes(t.id)?'✅ Done':'+'+t.xp+' XP'}</span>
          </div>`).join('')}
        </div>

        <div class="section-card">
          <h3>🏆 Achievement Ranks</h3>
          ${RANKS.map(r=>`
          <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-size:1.5rem">${r.icon}</span>
            <div style="flex:1">
              <div style="font-weight:700;font-size:.88rem;${xp2>=r.xp?'color:#22C55E':''}">${r.name}</div>
              <div style="font-size:.72rem;color:#64748B">${r.xp.toLocaleString()} XP required</div>
            </div>
            <span style="font-size:.8rem">${xp2>=r.xp?'✅':'🔒'}</span>
          </div>`).join('')}
        </div>`;
      break;
    }

    // ── ACADEMY ──────────────────────────────────────────
    case 'academy': {
      const view = window._academyView || 'home';
      if (view === 'category') {
        root.innerHTML = renderAcademyCategory(window._academyCat);
      } else if (view === 'dashboard') {
        root.innerHTML = renderAcademyDashboard();
      } else {
        root.innerHTML = renderAcademyHome();
      }
      break;
    }

    // ── COMMUNITY ────────────────────────────────────────
    case 'community':
      root.innerHTML = `
        <div class="section-card">
          <h3>✍️ Share with Community</h3>
          <textarea id="postContent" placeholder="Ask a question, share a tip, or post an update..." class="form-input" rows="3"></textarea>
          <select id="postCategory" class="form-input">
            <option value="tip">💡 Farming Tip</option>
            <option value="question">❓ Question</option>
            <option value="success">🎉 Success Story</option>
            <option value="photo">📷 Photo Update</option>
          </select>
          <button class="action-btn" onclick="submitPost()">📤 Post (+10 XP)</button>
        </div>
        <div id="communityFeed"><p style="color:#64748B;text-align:center;padding:20px">Loading community posts...</p></div>`;
      loadCommunity();
      break;

    // ── TEFF AI ──────────────────────────────────────────
    case 'teffai': {
      const uname = userProfile?.fullName || userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Farmer';
      root.innerHTML = `
        <div class="teffai-wrap section-card" style="padding:0;overflow:hidden">
          <div style="background:linear-gradient(135deg,#0d3d22,#0a2d18);padding:16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(34,197,94,.2)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:1.4rem">🌾</div>
              <div>
                <div style="font-weight:700;color:white;font-size:.95rem">Teff AI</div>
                <div style="color:#22C55E;font-size:.72rem">● Always Online • AgriEquip Assistant</div>
              </div>
            </div>
            <button onclick="clearTeffChat()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6);padding:5px 10px;border-radius:8px;cursor:pointer;font-size:.72rem;font-family:'Poppins',sans-serif">🗑 Clear</button>
          </div>

          <div id="teffMessages" style="height:360px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth">
            <div style="display:flex;gap:8px;align-items:flex-start">
              <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0">🌾</div>
              <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15);border-radius:0 14px 14px 14px;padding:12px 14px;font-size:.84rem;line-height:1.6;max-width:90%">
                👋 <strong>Salam, ${uname}!</strong> I'm <strong>Teff AI</strong> — named after Ethiopia's ancient grain 🌾<br><br>
                I can help with: 🚜 Equipment · 💳 Wallet · 💎 VIP Plans · ✅ Tasks · 🌱 Farming advice · 📞 Support<br><br>
                <em style="opacity:.6;font-size:.76rem">Ask me anything in English or አማርኛ!</em>
              </div>
            </div>
          </div>

          <div style="padding:8px 16px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.06)">
            <button class="quick-chip" onclick="askTeff('How do I list equipment?')">📦 List equipment</button>
            <button class="quick-chip" onclick="askTeff('How does wallet deposit work?')">💳 Deposit help</button>
            <button class="quick-chip" onclick="askTeff('Which VIP plan is best?')">💎 Best VIP</button>
            <button class="quick-chip" onclick="askTeff('How do I earn XP and rank up?')">✅ Tasks & XP</button>
            <button class="quick-chip" onclick="askTeff('What crops should I plant this season in Ethiopia?')">🌱 Crop advice</button>
            <button class="quick-chip" onclick="askTeff('Contact and support info')">📞 Support</button>
          </div>

          <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:10px">
            <input type="text" id="teffInput" placeholder="Ask Teff AI anything..." onkeypress="if(event.key==='Enter')sendTeff()"
              style="flex:1;padding:10px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:white;font-size:.84rem;font-family:'Poppins',sans-serif;outline:none">
            <button onclick="sendTeff()" style="width:42px;height:42px;background:#22C55E;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9L16 2L9 16L8 10L2 9Z" fill="white" stroke="white" stroke-width=".5" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>`;
      break;
    }

    // ── PROFILE ──────────────────────────────────────────
    case 'profile': {
      const p2   = userProfile || {};
      const xp3  = getXP();
      const rk   = currentRank(xp3);
      const ref2 = p2.referralCode || 'AGR-' + (currentUser?.uid?.slice(0,6).toUpperCase());
      root.innerHTML = `
        <div class="section-card" style="text-align:center">
          <div class="profile-avatar">👨‍🌾</div>
          <p style="font-weight:700;font-size:1rem;margin-bottom:2px">${p2.fullName||'AgriEquip User'}</p>
          <p style="color:#64748B;font-size:.82rem;margin-bottom:4px">${currentUser?.email||''}</p>
          <p style="color:#22C55E;font-size:.82rem">⚪ ${p2.vipLevel||'Free'} Member &nbsp;•&nbsp; ${rk.icon} ${rk.name}</p>
        </div>
        <div class="section-card">
          <h3>✏️ Edit Profile</h3>
          <input type="text" id="profileName"       placeholder="Full name"         class="form-input" value="${p2.fullName||''}">
          <input type="text" id="profileFatherName" placeholder="Father's name"     class="form-input" value="${p2.fatherName||''}">
          <input type="tel"  id="profilePhone"      placeholder="Phone (+251...)"   class="form-input" value="${p2.phoneNumber||''}">
          <input type="text" id="profileCity"       placeholder="City"              class="form-input" value="${p2.address||''}">
          <button class="action-btn" onclick="saveProfile()">💾 Save Changes</button>
          <p id="profileMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
        </div>
        <div class="section-card">
          <h3>🔗 Your Referral Code</h3>
          <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:1.3rem;font-weight:700;color:#22C55E;letter-spacing:3px">${ref2}</div>
            <div style="font-size:.75rem;color:#64748B;margin-top:4px">Share this code — earn 50 ETB per referral</div>
          </div>
          <button class="action-btn" style="margin-top:10px" onclick="copyReferral()">📋 Copy Code</button>
        </div>`;
      break;
    }

    // ── SETTINGS ─────────────────────────────────────────
    case 'settings': {
  const ct = localStorage.getItem('agriequip_theme') || 'dark';
  const lang = localStorage.getItem('agriequip_lang') || 'en';
  root.innerHTML = `
    <div class="section-card">
      <h3>🎨 App Theme</h3>
      <div class="theme-options">
        ${[['dark','Dark','#0F172A','#1E293B'],['light','White','#F8FAFC','#E2E8F0'],['black','Black','#000','#111'],['green','Nature','#052e16','#14532d']].map(([id,label,c1,c2])=>`
        <button class="theme-btn ${ct===id?'active':''}" onclick="setTheme('${id}')">
          <div class="theme-preview" style="background:linear-gradient(135deg,${c1},${c2})"></div>
          <span>${label}</span>
        </button>`).join('')}
      </div>
    </div>
    <div class="section-card">
      <h3>🌐 Language</h3>
      <div style="display:flex;gap:8px">
        <button class="action-btn" style="background:${lang==='en'?'#22C55E':'#334155'}" onclick="setLang('en')">🇬🇧 English</button>
        <button class="action-btn" style="background:${lang==='am'?'#22C55E':'#334155'}" onclick="setLang('am')">🇪🇹 አማርኛ</button>
      </div>
      <p style="color:#64748B;font-size:.75rem;margin-top:8px;text-align:center">Full Amharic translation coming soon</p>
    </div>
    <div class="section-card">
      <h3>🔔 Notifications</h3>
      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <span style="font-size:.85rem">Booking updates</span>
        <input type="checkbox" checked style="width:20px;height:20px">
      </label>
      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <span style="font-size:.85rem">Market price alerts</span>
        <input type="checkbox" checked style="width:20px;height:20px">
      </label>
      <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <span style="font-size:.85rem">Community activity</span>
        <input type="checkbox" style="width:20px;height:20px">
      </label>
    </div>
    <div class="section-card">
      <h3>🌾 Farm Profile</h3>
      <p style="color:#64748B;font-size:.82rem;margin-bottom:10px">Set up your farm details to get personalized advice</p>
      <button class="action-btn" onclick="showSection('profile')">Edit Farm Profile</button>
    </div>
    <div class="section-card">
      <h3>⚠️ Danger Zone</h3>
      <button class="action-btn" style="background:#EF4444" onclick="if(confirm('Clear cache and reset tasks?')){localStorage.clear();location.reload()}">🗑️ Clear Cache</button>
    </div>`;
  break;
    }
    

    // ── ABOUT ────────────────────────────────────────────
    case 'about':
  root.innerHTML = `
    <div class="welcome-card" style="text-align:center">
      <div style="font-size:2.5rem;margin-bottom:10px">🌾</div>
      <h2>AgriEquip</h2>
      <p style="margin-top:6px;opacity:.6;font-size:.82rem">v2.0 • Made in Ethiopia 🇪🇹</p>
    </div>
    <div class="section-card">
      <h3>📖 About AgriEquip</h3>
      <p style="color:#64748B;font-size:.83rem;line-height:1.8">AgriEquip is Ethiopia's agricultural equipment rental marketplace, connecting equipment owners with farmers who need machinery. Beyond rentals, AgriEquip offers a Farming Academy, daily tasks and achievement ranks, a community space for farmers to share knowledge, and Teff AI — an assistant for farming and platform questions.</p>
      <p style="color:#64748B;font-size:.83rem;line-height:1.8;margin-top:10px"><strong>Our mission:</strong> Make modern farming equipment and knowledge accessible to every Ethiopian farmer, regardless of location or farm size.</p>
    </div>
    <div class="section-card">
      <h3>📞 Contact & Support</h3>
      <ul style="list-style:none;color:#64748B;font-size:.85rem;line-height:2.5">
        <li>📧 <a href="mailto:support0agriequip.et@gmail.com" style="color:#22C55E">support0agriequip.et@gmail.com</a></li>
        <li>📱 <a href="tel:+251993920750" style="color:#22C55E">+251 993 920 750</a></li>
        <li>💬 <a href="https://wa.me/251993920750" style="color:#25D366">WhatsApp: +251 993 920 750</a></li>
        <li>✈️ Telegram: <a href="https://t.me/AgriEquipET" style="color:#22C55E">@AgriEquipET</a></li>
        <li>📸 Instagram: @agriequip.et</li>
        <li>📠 FAX: +251 993 920 750</li>
        <li>📍 Addis Ababa, Ethiopia</li>
        <li>🕐 Mon–Fri 8AM–6PM EAT</li>
      </ul>
    </div>
    <div class="section-card">
      <h3>⚖️ Legal & License</h3>
      <p style="color:#64748B;font-size:.82rem;line-height:1.8;margin-bottom:12px">AgriEquip connects farmers with equipment owners across Ethiopia. Commission is taken per completed rental. All data is secured via Google Firebase. No guaranteed investment returns — all earnings come from real equipment rentals only.</p>
      <p style="color:#64748B;font-size:.82rem;line-height:1.8">© 2026 AgriEquip. All rights reserved. Made in Ethiopia 🇪🇹</p>
    </div>
    <div class="section-card">
      <h3>📋 Terms of Service</h3>
      <p style="color:#64748B;font-size:.82rem;line-height:1.8">By using AgriEquip, you agree to list only equipment you own or have rights to rent, provide accurate information, and complete rentals in good faith. AgriEquip is a marketplace facilitator and is not liable for equipment condition, disputes between users, or crop outcomes from advice given.</p>
    </div>
    <div class="section-card">
      <h3>🔒 Privacy Policy</h3>
      <p style="color:#64748B;font-size:.82rem;line-height:1.8">We collect only information necessary to operate the platform: your name, contact details, farm information you provide, and transaction records. We never sell your data. Data is stored securely via Google Firebase.</p>
    </div>
    <div class="section-card">
      <h3>❓ FAQ</h3>
      ${[
        ['How do I deposit?','Go to Wallet → Deposit → Send to AgriEquip\'s account → Fill the form with your transaction reference.'],
        ['Minimum withdrawal?','400 ETB. Processed within 24 hours on business days.'],
        ['What is commission?','Free: 10% | VIP 1: 8% | VIP 2: 7% | VIP 3: 6% | VIP 4: 5% | VIP 5: 4%'],
        ['How do I list equipment?','My Listings → Add New Equipment → Fill details → Submit.'],
        ['What is Teff AI?','Your smart assistant for equipment, wallet, tasks, and farming advice.'],
        ['Is this an investment app?','No. AgriEquip is a rental marketplace. All earnings come from actual equipment rentals — never guaranteed returns.'],
      ].map(([q,a])=>`
      <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
        <strong style="font-size:.85rem;display:block;margin-bottom:4px">Q: ${q}</strong>
        <p style="color:#64748B;font-size:.82rem;line-height:1.6">${a}</p>
      </div>`).join('')}
    </div>`;
  break;

    default:
      root.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#64748B"><div style="font-size:3rem">🚧</div><p>Coming soon</p></div>`;
  }
}

// ─── Data Loaders ────────────────────────────────────────
async function loadHomeStats() {
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) {
      const d = snap.data();
      setText('hBalance', (d.walletBalance||0).toLocaleString() + ' ETB');
      setText('hVip',     d.vipLevel || 'Free');
      setText('hRefs',    (d.referralCount||0).toString());
    }
    const lSnap = await getDocs(query(collection(db,'equipment'), where('ownerId','==',currentUser.uid)));
    setText('hListings', lSnap.size.toString());
  } catch(e) {}
}

async function loadWalletBalance() {
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    const bal  = snap.exists() ? (snap.data().walletBalance || 0) : 0;
    setText('walletBalance', bal.toLocaleString() + ' ETB');
  } catch(e) { setText('walletBalance', '0 ETB'); }
}

async function loadTransactions() {
  if (!currentUser) return;
  const el = document.getElementById('transactionHistory');
  if (!el) return;
  try {
    const q    = query(collection(db,'transactions'), where('userId','==',currentUser.uid), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    if (snap.empty) { el.innerHTML = `<p style="color:#64748B;text-align:center;padding:16px">No transactions yet</p>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const tx   = d.data();
      const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('en-GB') : '—';
      const isC  = tx.type === 'deposit';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,.1);display:flex;align-items:center;justify-content:center">${isC?'⬆️':'⬇️'}</div>
        <div style="flex:1"><div style="font-size:.88rem;font-weight:600">${tx.type==='deposit'?'Deposit':'Withdrawal'}</div><div style="font-size:.72rem;color:#64748B">${date} · ${tx.status||'pending'}</div></div>
        <div style="font-weight:700;color:${isC?'#22C55E':'#EF4444'}">${isC?'+':'−'}${(tx.amount||0).toLocaleString()} ETB</div>
      </div>`;
    }).join('');
  } catch(e) { el.innerHTML = `<p style="color:#64748B;text-align:center;padding:16px">Error loading transactions</p>`; }
}

async function loadEquipment() {
  const el = document.getElementById('equipmentList');
  if (!el) return;
  el.innerHTML = `<p style="color:#64748B;text-align:center;padding:20px">Loading...</p>`;
  try {
    const snap = await getDocs(query(collection(db,'equipment'), where('availability','==','available')));
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#64748B"><div style="font-size:3rem">🚜</div><p>No equipment listed yet.<br>Be the first!</p><button class="action-btn" style="margin-top:14px" onclick="showSection('listings')">+ List Equipment</button></div>`;
      return;
    }
    el.innerHTML = snap.docs.map(d => {
      const eq = d.data();
      const icons = {tractor:'🚜',plow:'🔧',harvester:'🌾',pump:'💧',thresher:'⚙️',other:'📦'};
      return `<div class="equipment-card">
        <div class="equipment-img">${icons[eq.category]||'🚜'}</div>
        <div class="equipment-info">
          <p class="equipment-name">${eq.name}</p>
          <p style="color:#64748B;font-size:.78rem">📍 ${eq.location?.city||'Ethiopia'} · ${eq.category||'Equipment'}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="color:#22C55E;font-weight:700">${(eq.pricePerDay||0).toLocaleString()} ETB/day</span>
            <button class="action-btn" style="width:auto;padding:6px 12px;font-size:.76rem" onclick="showToast('📞 Contact owner via Teff AI')">Book</button>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) { el.innerHTML = `<p style="color:#ef4444;text-align:center;padding:20px">Error loading equipment</p>`; }
}

async function loadMyListings() {
  if (!currentUser) return;
  const el = document.getElementById('myListings');
  if (!el) return;
  try {
    const snap = await getDocs(query(collection(db,'equipment'), where('ownerId','==',currentUser.uid)));
    if (snap.empty) { el.innerHTML = `<p style="color:#64748B;text-align:center;padding:20px">No listings yet. Add your first above!</p>`; return; }
    const icons = {tractor:'🚜',plow:'🔧',harvester:'🌾',pump:'💧',thresher:'⚙️',other:'📦'};
    el.innerHTML = snap.docs.map(d => {
      const eq = d.data();
      return `<div class="equipment-card">
        <div class="equipment-img">${icons[eq.category]||'🚜'}</div>
        <div class="equipment-info">
          <p class="equipment-name">${eq.name}</p>
          <p style="color:#64748B;font-size:.78rem">📍 ${eq.location?.city||''} · ${eq.pricePerDay||0} ETB/day</p>
          <span style="display:inline-block;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#22C55E;border-radius:6px;padding:3px 10px;font-size:.75rem;margin-top:6px">${eq.availability||'available'}</span>
        </div>
      </div>`;
    }).join('');
  } catch(e) {}
}

async function loadCommunity() {
  const el = document.getElementById('communityFeed');
  if (!el) return;
  try {
    const snap = await getDocs(query(collection(db,'community'), orderBy('createdAt','desc')));
    if (snap.empty) { el.innerHTML = `<p style="color:#64748B;text-align:center;padding:20px">No posts yet. Share the first tip!</p>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const p = d.data();
      return `<div class="section-card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700">${(p.authorName||'U').charAt(0)}</div>
          <div><div style="font-size:.85rem;font-weight:600">${p.authorName||'User'}</div><div style="font-size:.72rem;color:#64748B">${p.category||'tip'}</div></div>
        </div>
        <p style="font-size:.85rem;line-height:1.6">${p.content||''}</p>
      </div>`;
    }).join('');
  } catch(e) {}
}

// ─── Actions ─────────────────────────────────────────────
function showDepositForm() {
  const m = document.getElementById('walletMain');
  const d = document.getElementById('depositSection');
  const w = document.getElementById('withdrawSection');
  if (m) m.style.display = 'none';
  if (d) d.style.display = 'block';
  if (w) w.style.display = 'none';
}
function showWithdrawForm() {
  const m = document.getElementById('walletMain');
  const d = document.getElementById('depositSection');
  const w = document.getElementById('withdrawSection');
  if (m) m.style.display = 'none';
  if (d) d.style.display = 'none';
  if (w) w.style.display = 'block';
}
function backToWallet() {
  const m = document.getElementById('walletMain');
  const d = document.getElementById('depositSection');
  const w = document.getElementById('withdrawSection');
  if (m) m.style.display = 'block';
  if (d) d.style.display = 'none';
  if (w) w.style.display = 'none';
}

async function submitDeposit() {
  const bank    = val('senderBank');
  const account = val('senderAccount');
  const amount  = parseFloat(val('depositAmount'));
  const ref     = val('depositRef');
  const msgEl   = document.getElementById('depositMsg');
  if (!bank)               { flashMsg(msgEl,'⚠️ Select your bank','#F59E0B'); return; }
  if (!account)            { flashMsg(msgEl,'⚠️ Enter your account number','#F59E0B'); return; }
  if (!amount || amount<100){ flashMsg(msgEl,'⚠️ Minimum deposit is 100 ETB','#F59E0B'); return; }
  if (!ref)                { flashMsg(msgEl,'⚠️ Enter the transaction reference','#F59E0B'); return; }
  try {
    await addDoc(collection(db,'transactions'), { userId:currentUser.uid, type:'deposit', amount, senderBank:bank, senderAccount:account, reference:ref, status:'pending', createdAt:serverTimestamp() });
    flashMsg(msgEl, `✅ Deposit of ${amount.toLocaleString()} ETB submitted! Approved within 24hrs.`, '#22C55E');
  } catch(e) { flashMsg(msgEl,'❌ Failed to submit. Try again.','#EF4444'); }
}

async function submitWithdraw() {
  const bank    = val('withdrawBank');
  const account = val('withdrawAccount');
  const name    = val('withdrawName');
  const amount  = parseFloat(val('withdrawAmount'));
  const msgEl   = document.getElementById('withdrawMsg');
  if (!bank)               { flashMsg(msgEl,'⚠️ Select your bank','#F59E0B'); return; }
  if (!account)            { flashMsg(msgEl,'⚠️ Enter your account number','#F59E0B'); return; }
  if (!name)               { flashMsg(msgEl,'⚠️ Enter your full name','#F59E0B'); return; }
  if (!amount || amount<400){ flashMsg(msgEl,'⚠️ Minimum withdrawal is 400 ETB','#F59E0B'); return; }
  try {
    const snap = await getDoc(doc(db,'users',currentUser.uid));
    const bal  = snap.exists() ? (snap.data().walletBalance||0) : 0;
    if (amount > bal) { flashMsg(msgEl,`⚠️ Insufficient balance. You have ${bal.toLocaleString()} ETB`,'#F59E0B'); return; }
    await addDoc(collection(db,'transactions'), { userId:currentUser.uid, type:'withdrawal', amount, receivingBank:bank, accountNumber:account, accountName:name, status:'pending', createdAt:serverTimestamp() });
    flashMsg(msgEl, `✅ Withdrawal of ${amount.toLocaleString()} ETB requested!`, '#22C55E');
  } catch(e) { flashMsg(msgEl,'❌ Failed. Try again.','#EF4444'); }
}

async function activateVIP(plan, fee) {
  if (!confirm(`Activate ${plan} for ${fee}?\nThis deducts from your wallet.`)) return;
  try {
    await updateDoc(doc(db,'users',currentUser.uid), { vipLevel: plan.toLowerCase().replace(' ',''), vipActivatedAt: serverTimestamp() });
    showToast(`✅ ${plan} activated!`);
    await loadUserProfile();
  } catch(e) { showToast('❌ Failed to activate VIP'); }
}

function completeTask(taskId, xp) {
  const done = getDoneTasks();
  if (done.includes(taskId)) return;
  done.push(taskId);
  localStorage.setItem('agriequip_tasks', JSON.stringify(done));
  const cur = getXP() + xp;
  localStorage.setItem('agriequip_xp', cur.toString());
  const lbl = document.getElementById('xplbl-' + taskId);
  const row = document.querySelector(`[onclick="completeTask('${taskId}',${xp})"]`);
  if (lbl) lbl.textContent = '✅ Done';
  if (row) row.classList.add('done');
  showToast(`🎉 +${xp} XP! Total: ${cur.toLocaleString()} XP`);
  const rOld = currentRank(cur - xp);
  const rNew = currentRank(cur);
  if (rNew.name !== rOld.name) setTimeout(() => showToast(`🏆 Rank up! You're now ${rNew.icon} ${rNew.name}`), 1500);
}

function toggleListingForm() {
  const f = document.getElementById('addListingForm');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function submitListing() {
  const name  = val('equipName');
  const cat   = val('equipCategory');
  const price = parseFloat(val('equipPrice'));
  const city  = val('equipLocation');
  const desc  = val('equipDesc');
  const msgEl = document.getElementById('listingMsg');
  if (!name)             { flashMsg(msgEl,'⚠️ Enter equipment name','#F59E0B'); return; }
  if (!price || price<=0){ flashMsg(msgEl,'⚠️ Enter a valid price','#F59E0B'); return; }
  if (!city)             { flashMsg(msgEl,'⚠️ Enter your city','#F59E0B'); return; }
  try {
    await addDoc(collection(db,'equipment'), { ownerId:currentUser.uid, ownerEmail:currentUser.email, name, category:cat, description:desc||'', pricePerDay:price, location:{city}, availability:'available', createdAt:serverTimestamp() });
    completeTask('list_equipment', 30);
    flashMsg(msgEl,'✅ Equipment listed! (+30 XP)','#22C55E');
    setTimeout(() => { toggleListingForm(); loadMyListings(); }, 1500);
  } catch(e) { flashMsg(msgEl,'❌ Failed. Try again.','#EF4444'); }
}

function filterEquipment() { loadEquipment(); }

async function saveProfile() {
  const msgEl = document.getElementById('profileMsg');
  try {
    await updateDoc(doc(db,'users',currentUser.uid), {
      fullName:    val('profileName'),
      fatherName:  val('profileFatherName'),
      phoneNumber: val('profilePhone'),
      address:     val('profileCity'),
      updatedAt:   serverTimestamp()
    });
    await loadUserProfile();
    flashMsg(msgEl,'✅ Profile updated!','#22C55E');
  } catch(e) { flashMsg(msgEl,'❌ Failed to save','#EF4444'); }
}

function copyReferral() {
  const code = userProfile?.referralCode || 'AGR-' + (currentUser?.uid?.slice(0,6).toUpperCase());
  navigator.clipboard?.writeText(code).then(() => showToast('✅ Referral code copied!')).catch(() => showToast('Code: ' + code));
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('agriequip_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase().startsWith(theme.charAt(0))));
  showToast('Theme: ' + theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

async function submitPost() {
  const content = val('postContent');
  const cat     = val('postCategory');
  if (!content) { showToast('⚠️ Write something first'); return; }
  try {
    await addDoc(collection(db,'community'), { content, category:cat, authorName: userProfile?.fullName || currentUser?.email?.split('@')[0], authorId: currentUser.uid, createdAt: serverTimestamp() });
    completeTask('community_post', 10);
    showToast('✅ Posted! (+10 XP)');
    document.getElementById('postContent').value = '';
    loadCommunity();
  } catch(e) { showToast('❌ Failed to post'); }
}

// ─── Teff AI ─────────────────────────────────────────────
const TEFF_SYSTEM = `You are Teff AI, the intelligent assistant for AgriEquip — Ethiopia's agricultural equipment rental marketplace. Named after Ethiopia's ancient grain. Be warm, helpful, concise. Use occasional Amharic greetings. Use emojis naturally.

AGRIEQUIP INFO:
- Equipment rental marketplace for Ethiopia
- VIP plans: Free=10% commission, VIP1=200ETB/mo 8%, VIP2=500 7%, VIP3=1000 6%, VIP4=2000 5%, VIP5=4000 4%
- Wallet: deposit min 100 ETB (24hr approval), withdrawal min 400 ETB (24hr)
- Deposit to: CBE 1000123456789, Telebirr +251993920750, Awash 01320123456789
- Tasks earn XP, ranks: Seedling→Grower→Equipment Specialist→Harvest Master→Expert Farmer→Agricultural Legend
- Referral: 50 ETB per successful referral
- Contact: support0agriequip.et@gmail.com, +251993920750, Telegram @AgriEquipET, Addis Ababa Mon-Fri 8AM-6PM EAT`;

function askTeff(q) {
  const input = document.getElementById('teffInput');
  if (input) input.value = q;
  sendTeff();
}

const TEFF_KB = [
  { k:['deposit','add money','fund'], a:'💳 <strong>Deposit:</strong> Wallet → Deposit → send to CBE 1000123456789 or Telebirr +251993920750 → fill form with reference. Min 100 ETB, approved in 24hrs.' },
  { k:['withdraw','cash out'], a:'💰 <strong>Withdraw:</strong> Wallet → Withdraw → enter bank details. Minimum 400 ETB, processed in 24hrs.' },
  { k:['vip','upgrade','commission'], a:'💎 <strong>VIP Plans:</strong> Free(10%) → VIP1 200ETB(8%) → VIP2 500ETB(7%) → VIP3 1000ETB(6%) → VIP4 2000ETB(5%) → VIP5 4000ETB(4%). Higher tier = less commission!' },
  { k:['task','xp','rank','level'], a:'✅ <strong>Tasks & Ranks:</strong> Complete daily tasks to earn XP. Ranks: 🌱Seedling→🌿Grower→🚜Specialist→🌾Harvest Master→🏅Expert→👑Legend' },
  { k:['list','equipment','rent out'], a:'📦 <strong>List Equipment:</strong> My Listings → Add New Equipment → fill name, category, price, location → Submit (+30 XP)' },
  { k:['book','rent','hire tractor'], a:'🚜 <strong>Rent Equipment:</strong> Go to Browse Equipment, find what you need, and tap Book to contact the owner via Teff AI or listed contact.' },
  { k:['yellow','disease','pest','sick plant'], a:'🌱 Yellowing leaves are often nitrogen deficiency or overwatering. For accurate diagnosis, check the Academy Soil Health lesson, or share a photo in Community for other farmers\' advice.' },
  { k:['teff plant','when plant teff','teff season'], a:'🌾 Teff is typically planted June–July (main rainy season, "Meher") in most highland areas. Check local extension advice for your specific zone.' },
  { k:['maize','planting maize'], a:'🌽 Maize planting in Ethiopia is usually April–May for the belg season or June–July for meher, depending on your region\'s rainfall pattern.' },
  { k:['fertilizer','which fertilizer'], a:'🌱 General guide: DAP at planting for phosphorus, Urea as top-dressing for nitrogen. Exact amounts depend on soil test — check the Academy fertilizer lesson.' },
  { k:['weather','rain','forecast'], a:'🌤 Weather integration is coming soon! For now, check local forecasts before major field work — it\'s one of your Daily Tasks.' },
  { k:['market price','crop price','sell price'], a:'📈 Check the Live Market Prices card on your Home screen for today\'s Teff, Coffee, Maize, and Wheat prices in Addis Ababa.' },
  { k:['crop','plant','season'], a:'🌱 For crop-specific advice, check the Academy section — lessons on Teff, Coffee, Maize, Soil Health, and Irrigation are available!' },
  { k:['referral','invite','code'], a:'🎁 Share your referral code (found on Home) with friends. Earn 50 ETB when they join and complete their first rental!' },
  { k:['contact','support','phone','email'], a:'📞 <strong>Contact:</strong><br>📧 support0agriequip.et@gmail.com<br>📱 +251 993 920 750<br>✈️ Telegram: @AgriEquipET' },
  { k:['salam','hello','hi','selam'], a:'Salam! 👋 How can I help you today?' },
  { k:['thank'], a:'Betam amesegnalehu! 🙏 Anything else?' },
];

function sendTeff() {
  const input = document.getElementById('teffInput');
  const msg   = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  addTeffBubble(msg, 'user');
  const typing = addTypingBubble();
  setTimeout(() => {
    typing?.remove();
    const lower = msg.toLowerCase();
    const hit = TEFF_KB.find(t => t.k.some(w => lower.includes(w)));
    const reply = hit ? hit.a : 'Betam good question! For this, please contact us: 📱 +251 993 920 750 or 📧 support0agriequip.et@gmail.com';
    addTeffBubble(reply, 'bot');
  }, 500);
}

function clearTeffChat() {
  teffHistory = [];
  const msgs = document.getElementById('teffMessages');
  if (msgs) msgs.innerHTML = `<div style="display:flex;gap:8px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0">🌾</div><div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15);border-radius:0 14px 14px 14px;padding:12px;font-size:.84rem">Chat cleared! Salam! How can I help? 😊</div></div>`;
}

function addTeffBubble(text, type) {
  const msgs = document.getElementById('teffMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  const fmt = text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  if (type === 'user') {
    div.style.cssText = 'display:flex;justify-content:flex-end';
    div.innerHTML = `<div style="background:linear-gradient(135deg,#22C55E,#16A34A);color:white;border-radius:14px 14px 0 14px;padding:10px 14px;font-size:.84rem;max-width:85%;line-height:1.5">${fmt}</div>`;
  } else {
    div.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
    div.innerHTML = `<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0">🌾</div><div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15);border-radius:0 14px 14px 14px;padding:12px 14px;font-size:.84rem;max-width:90%;line-height:1.6">${fmt}</div>`;
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTypingBubble() {
  const msgs = document.getElementById('teffMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
  div.innerHTML = `<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0">🌾</div><div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15);border-radius:0 14px 14px 14px;padding:14px 16px"><span style="display:inline-flex;gap:4px"><span style="width:7px;height:7px;border-radius:50%;background:#22C55E;animation:blink 1.2s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#22C55E;animation:blink 1.2s .2s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#22C55E;animation:blink 1.2s .4s infinite"></span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ─── Toast ───────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);background:#1E293B;border:1px solid rgba(34,197,94,.3);color:white;border-radius:12px;padding:12px 20px;font-size:.84rem;z-index:9999;opacity:0;transition:all .3s ease;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:Poppins,sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 3000);
}

// ─── XP helpers ──────────────────────────────────────────
function getXP()         { return parseInt(localStorage.getItem('agriequip_xp') || '0'); }
function getDoneTasks()  { return JSON.parse(localStorage.getItem('agriequip_tasks') || '[]'); }
function currentRank(xp) { return [...RANKS].reverse().find(r => xp >= r.xp) || RANKS[0]; }
function nextRank(xp)    { return RANKS.find(r => r.xp > xp) || null; }

// ─── DOM helpers ─────────────────────────────────────────
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function val(id)          { return (document.getElementById(id)?.value || '').trim(); }
function flashMsg(el, txt, color) { if (!el) return; el.style.cssText = `display:block;color:${color};margin-top:8px;text-align:center;font-size:.84rem`; el.textContent = txt; }

// ─── Expose everything the inline onclick="" HTML calls directly ──
window.showSection      = showSection;
window.navBack          = navBack;
window.navForward       = navForward;
window.handleSignOut    = handleSignOut;
window.copyReferral     = copyReferral;
window.setTheme         = setTheme;
window.saveProfile      = saveProfile;
window.askTeff          = askTeff;
window.sendTeff         = sendTeff;
window.clearTeffChat    = clearTeffChat;
window.completeTask     = completeTask;
window.activateVIP      = activateVIP;
window.submitDeposit    = submitDeposit;
window.submitWithdraw   = submitWithdraw;
window.showDepositForm  = showDepositForm;
window.showWithdrawForm = showWithdrawForm;
window.backToWallet     = backToWallet;
window.submitListing    = submitListing;
window.toggleListingForm= toggleListingForm;
window.filterEquipment  = filterEquipment;
window.submitPost       = submitPost;
window.setAcademyView   = setAcademyView;
window.openLessonReader = openLessonReader;
window.closeLessonReader = closeLessonReader;
window.completeLessonFromReader = completeLessonFromReader;
window.showToast        = showToast;
window.setLang = function(l) {
  localStorage.setItem('agriequip_lang', l);
  showToast(l === 'am' ? '🇪🇹 አማርኛ ተመርጧል' : '🇬🇧 English selected');
  showSection('settings');
};

// Inject blink keyframe
const st = document.createElement('style');
st.textContent = `@keyframes blink{0%,100%{opacity:.3}50%{opacity:1}} @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .quick-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);border-radius:99px;padding:6px 12px;font-size:.74rem;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .2s;white-space:nowrap}.quick-chip:hover{border-color:#22C55E;color:#22C55E}`;
document.head.appendChild(st);
