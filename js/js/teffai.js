export function initTeffAI() {
  const container = document.getElementById('teffaiContainer');
  if (!container || container.dataset.init === 'true') return;
  container.dataset.init = 'true';

  const userName = document.getElementById('userEmail')?.textContent?.split('@')[0] || 'Farmer';

  container.innerHTML = `
    <div class="teffai-wrap">
      <div class="teffai-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="teffai-avatar">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <defs><linearGradient id="tg" x1="0" y1="0" x2="36" y2="36"><stop stop-color="#22C55E"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs>
              <circle cx="18" cy="18" r="18" fill="url(#tg)"/>
              <rect x="10" y="12" width="16" height="13" rx="4" fill="rgba(255,255,255,0.95)"/>
              <circle cx="15" cy="17" r="2.5" fill="#22C55E"/><circle cx="21" cy="17" r="2.5" fill="#22C55E"/>
              <circle cx="15" cy="17" r="1" fill="white"/><circle cx="21" cy="17" r="1" fill="white"/>
              <rect x="14" y="21" width="8" height="1.5" rx="0.75" fill="#94A3B8"/>
              <line x1="18" y1="12" x2="18" y2="7" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="18" cy="6" r="2" fill="#22C55E"/>
              <rect x="7" y="15" width="3" height="5" rx="1.5" fill="rgba(255,255,255,0.8)"/>
              <rect x="26" y="15" width="3" height="5" rx="1.5" fill="rgba(255,255,255,0.8)"/>
            </svg>
          </div>
          <div>
            <p style="font-weight:700;font-size:0.92rem;color:white">Teff AI</p>
            <div style="display:flex;align-items:center;gap:5px">
              <div style="width:7px;height:7px;background:#22C55E;border-radius:50%"></div>
              <p style="color:#86EFAC;font-size:0.68rem">Always Online</p>
            </div>
          </div>
        </div>
        <button onclick="clearTeffAI()" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.5);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem">🗑</button>
      </div>
      <div class="teffai-messages" id="teffaiMessages">
        <div class="bot-msg">
          <div class="bot-bubble">
            <strong>👋 Salam, ${userName}!</strong><br><br>
            I'm <strong>Teff AI</strong> — your AgriEquip OS assistant 🌾<br><br>
            I can help you with:<br>
            💳 Deposits & withdrawals<br>
            🚜 Equipment rentals<br>
            💎 VIP plans<br>
            🌱 Daily tasks & ranks<br>
            🎓 Farming academy<br>
            👥 Community<br>
            📞 Support & contact<br><br>
            <em style="opacity:0.6;font-size:0.78rem">Ask me anything!</em>
          </div>
        </div>
      </div>
      <div class="teffai-quick">
        <button class="quick-btn" onclick="askTeff('How do I deposit money?')">💳 Deposit</button>
        <button class="quick-btn" onclick="askTeff('How do I withdraw?')">💰 Withdraw</button>
        <button class="quick-btn" onclick="askTeff('Which VIP plan is best?')">💎 VIP plans</button>
        <button class="quick-btn" onclick="askTeff('How do I earn points and rank up?')">🏆 Ranks</button>
        <button class="quick-btn" onclick="askTeff('How do I list equipment?')">📦 List equipment</button>
        <button class="quick-btn" onclick="askTeff('Contact support')">📞 Support</button>
      </div>
      <div class="teffai-input-wrap">
        <input type="text" id="teffaiInput" placeholder="Ask Teff AI anything..." onkeypress="if(event.key==='Enter')sendToTeff()">
        <button onclick="sendToTeff()" class="send-btn">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M2 10L18 2L10 18L9 11L2 10Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;
}

const KB = [
  { keys:['deposit','add money','top up','fund'],
    answer:`💳 <strong>How to Deposit:</strong><br><br>1️⃣ Menu → <strong>💳 Wallet</strong><br>2️⃣ Tap <strong>⬆️ Deposit</strong><br>3️⃣ Select your bank<br>4️⃣ Enter amount (min <strong>100 ETB</strong>)<br>5️⃣ Enter transaction reference<br>6️⃣ Approved within <strong>24 hours</strong>`,
    nav:'wallet' },
  { keys:['withdraw','cash out','take money','payout'],
    answer:`💰 <strong>How to Withdraw:</strong><br><br>1️⃣ Menu → <strong>💳 Wallet</strong><br>2️⃣ Tap <strong>⬇️ Withdraw</strong><br>3️⃣ Select bank<br>4️⃣ Enter account & amount<br>5️⃣ Minimum: <strong>200 ETB</strong>`,
    nav:'wallet' },
  { keys:['vip','plan','upgrade','commission','membership'],
    answer:`💎 <strong>VIP Plans:</strong><br><br>⚪ Free — 0 ETB | 2 listings | 10%<br>🟡 VIP 1 — 200 ETB | 5 listings | 8%<br>🟠 VIP 2 — 500 ETB | 10 listings | 7%<br>🔵 VIP 3 — 1,000 ETB | 20 listings | 6%<br>🟣 VIP 4 — 2,000 ETB | 50 listings | 5%<br>💎 VIP 5 — 4,000 ETB | Unlimited | 4%`,
    nav:'vip' },
  { keys:['rank','point','level','achievement'],
    answer:`🏆 <strong>Achievement Ranks:</strong><br><br>🌱 Seedling — 0 pts<br>🌿 Grower — 100 pts<br>🌾 Cultivator — 300 pts<br>🚜 Harvester — 600 pts<br>🔧 Mechanic — 1,000 pts<br>🏅 Expert Farmer — 1,500 pts<br>👑 Legend — 2,500 pts`,
    nav:'tasks' },
  { keys:['task','daily','tip','quiz'],
    answer:`🌱 <strong>Daily Tasks:</strong><br><br>• Read farming tip — 10 pts<br>• Check weather — 5 pts<br>• Farming quiz — 20 pts<br>• Farm record — 15 pts<br>• Browse equipment — 5 pts`,
    nav:'tasks' },
  { keys:['academy','lesson','course','learn'],
    answer:`🎓 <strong>Farming Academy:</strong><br><br>🌾 Teff — 30 pts<br>☕ Coffee — 40 pts<br>🌽 Maize — 30 pts<br>🚜 Tractor safety — 50 pts`,
    nav:'academy' },
  { keys:['community','post','share','forum'],
    answer:`👥 <strong>Community:</strong><br><br>Share tips, ask questions, earn +10 pts per post!`,
    nav:'community' },
  { keys:['list','listing','add equipment'],
    answer:`📦 <strong>List Equipment:</strong><br><br>Menu → My Listings → Add New Equipment → fill details → Submit (+30 pts)`,
    nav:'listings' },
  { keys:['book','booking','rent'],
    answer:`📅 <strong>Book Equipment:</strong><br><br>Menu → Browse Equipment → tap Book Now → confirm days (+20 pts)`,
    nav:'browse' },
  { keys:['referral','invite','code'],
    answer:`🎁 <strong>Referral Program:</strong><br><br>Share your code, earn 50 ETB per friend who joins and rents!`,
    nav:'home' },
  { keys:['contact','support','phone','email'],
    answer:`📞 <strong>Support:</strong><br><br>📧 support0agriequip.et@gmail.com<br>📱 +251 993 920 750`,
    nav:'about' },
  { keys:['earn','income','profit'],
    answer:`💰 <strong>How to Earn:</strong><br><br>List equipment, get bookings, earn rental fees minus commission!`,
    nav:'earnings' },
  { keys:['salam','hello','hi'],
    answer:`Salam! 👋 Welcome to AgriEquip OS! How can I help?`,
    nav:null },
  { keys:['thank','thanks'],
    answer:`Betam amesegnalehu! 🙏 Anything else I can help with?`,
    nav:null }
];

function smartReply(msg) {
  const lower = msg.toLowerCase();
  let best = null, bestScore = 0;
  for (const topic of KB) {
    for (const key of topic.keys) {
      if (lower.includes(key) && key.length > bestScore) {
        bestScore = key.length;
        best = topic;
      }
    }
  }
  return best;
}

window.askTeff = function(q) {
  const input = document.getElementById('teffaiInput');
  if (input) { input.value = q; sendToTeff(); }
};

window.sendToTeff = function() {
  const input = document.getElementById('teffaiInput');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  addTeffMsg(msg, 'user');
  const typing = addTeffTyping();
  setTimeout(() => {
    removeTeffTyping(typing);
    const match = smartReply(msg);
    if (match) {
      let reply = match.answer;
      if (match.nav) {
        reply += `<br><br><button onclick="showSection('${match.nav}')" style="background:linear-gradient(135deg,#22C55E,#16A34A);border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.78rem;margin-top:6px">Open →</button>`;
      }
      addTeffMsg(reply, 'bot');
    } else {
      addTeffMsg(`Betam good question! 🤔<br><br>Contact us:<br>📱 +251 993 920 750<br>📧 support0agriequip.et@gmail.com`, 'bot');
    }
  }, 400 + Math.random() * 300);
};

window.clearTeffAI = function() {
  const msgs = document.getElementById('teffaiMessages');
  if (msgs) msgs.innerHTML = '<div class="bot-msg"><div class="bot-bubble">Chat cleared! Salam! 😊🌾</div></div>';
};

function addTeffMsg(text, type) {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.innerHTML = `<div class="${type==='user'?'user-bubble':'bot-bubble'}">${text.replace(/\n/g,'<br>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTeffTyping() {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'bot-msg';
  div.innerHTML = `<div class="bot-bubble" style="padding:12px 16px">···</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTeffTyping(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}
