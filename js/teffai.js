// Teff AI - Premium AgriEquip AI Assistant
// Smart local knowledge base — works instantly, no API errors

export function initTeffAI() {
  const container = document.getElementById('teffaiContainer');
  if (!container || container.dataset.init === 'true') return;
  container.dataset.init = 'true';

  // Get user name from auth if available
  let userName = 'Farmer';
  try {
    const email = document.getElementById('userEmail')?.textContent;
    if (email) userName = email.split('@')[0];
  } catch(e) {}

  container.innerHTML = `
    <div class="teffai-wrap" id="teffaiWrap">
      <!-- Header -->
      <div class="teffai-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="teffai-avatar" id="teffAvatar">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <defs>
                <linearGradient id="avGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop stop-color="#22C55E"/><stop offset="1" stop-color="#06B6D4"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="18" fill="url(#avGrad)"/>
              <!-- Robot head -->
              <rect x="10" y="12" width="16" height="13" rx="4" fill="rgba(255,255,255,0.95)"/>
              <!-- Eyes -->
              <circle cx="15" cy="17" r="2.8" fill="#22C55E"/>
              <circle cx="21" cy="17" r="2.8" fill="#22C55E"/>
              <circle cx="15" cy="17" r="1.2" fill="white"/>
              <circle cx="21" cy="17" r="1.2" fill="white"/>
              <!-- Mouth -->
              <rect x="14" y="21" width="8" height="1.8" rx="0.9" fill="#94A3B8"/>
              <!-- Antenna -->
              <line x1="18" y1="12" x2="18" y2="7" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="18" cy="6" r="2.2" fill="#22C55E" style="animation:pulse 1.5s infinite"/>
              <!-- Ears -->
              <rect x="7" y="15" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.8)"/>
              <rect x="26" y="15" width="3" height="6" rx="1.5" fill="rgba(255,255,255,0.8)"/>
              <!-- Wheat -->
              <line x1="30" y1="10" x2="30" y2="5" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round"/>
              <ellipse cx="30" cy="4" rx="1.8" ry="3.5" fill="rgba(255,255,255,0.55)" transform="rotate(-12 30 4)"/>
            </svg>
          </div>
          <div>
            <p style="font-weight:700;font-size:0.94rem;color:white;line-height:1.2">Teff AI</p>
            <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
              <div class="status-dot"></div>
              <p style="color:#86EFAC;font-size:0.68rem;font-weight:500">Always Online • AgriEquip Assistant</p>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button onclick="toggleTeffTheme()" class="teff-icon-btn" title="Toggle theme">🎨</button>
          <button onclick="clearTeffAI()" class="teff-icon-btn" title="Clear chat">🗑</button>
        </div>
      </div>

      <!-- Language bar -->
      <div class="teff-lang-bar">
        <button class="lang-btn active" onclick="setTeffLang('en',this)">🇬🇧 EN</button>
        <button class="lang-btn" onclick="setTeffLang('am',this)">🇪🇹 አማ</button>
        <span style="flex:1"></span>
        <span style="color:rgba(255,255,255,0.3);font-size:0.68rem">v2.0 Premium</span>
      </div>

      <!-- Messages -->
      <div class="teffai-messages" id="teffaiMessages">
        <div class="bot-msg" style="animation:fadeUp 0.5s ease">
          <div class="bot-bubble premium">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <span style="font-size:1.2rem">👋</span>
              <strong>Salam, ${userName}! I'm Teff AI</strong>
            </div>
            <p style="opacity:0.8;font-size:0.82rem;margin-bottom:10px">Your AgriEquip intelligent assistant — named after Ethiopia's ancient grain 🌾</p>
            <div class="teff-menu-grid">
              <button class="teff-menu-item" onclick="askTeff('How do I deposit money?')">
                <span>💳</span><span>Deposits</span>
              </button>
              <button class="teff-menu-item" onclick="askTeff('How do I withdraw money?')">
                <span>💰</span><span>Withdrawals</span>
              </button>
              <button class="teff-menu-item" onclick="showSection('vip');closeTeffSidebar()">
                <span>👑</span><span>VIP Plans</span>
              </button>
              <button class="teff-menu-item" onclick="showSection('browse');closeTeffSidebar()">
                <span>🚜</span><span>Equipment</span>
              </button>
              <button class="teff-menu-item" onclick="showSection('earnings');closeTeffSidebar()">
                <span>📊</span><span>Earnings</span>
              </button>
              <button class="teff-menu-item" onclick="askTeff('Contact support information')">
                <span>📞</span><span>Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick suggestions -->
      <div class="teffai-quick" id="teffQuick">
        <button class="quick-btn" onclick="askTeff('How do I list equipment?')">📦 List equipment</button>
        <button class="quick-btn" onclick="askTeff('Which VIP plan is best?')">💎 Best VIP</button>
        <button class="quick-btn" onclick="askTeff('How do I earn more?')">💰 Earn more</button>
        <button class="quick-btn" onclick="askTeff('How does referral work?')">🎁 Referrals</button>
        <button class="quick-btn" onclick="askTeff('What banks are supported?')">🏦 Banks</button>
        <button class="quick-btn" onclick="askTeff('Show contact information')">📞 Contact</button>
      </div>

      <!-- Input area -->
      <div class="teffai-input-wrap">
        <button class="teff-attach-btn" onclick="handleVoice()" id="voiceBtn" title="Voice input">🎤</button>
        <input type="text" id="teffaiInput"
          placeholder="Ask Teff AI anything..."
          onkeypress="if(event.key==='Enter')sendToTeff()">
        <button onclick="sendToTeff()" class="send-btn">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M2 10L18 2L10 18L9 11L2 10Z" fill="white" stroke="white" stroke-width="0.5" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add premium CSS
  if (!document.getElementById('teffCss')) {
    const style = document.createElement('style');
    style.id = 'teffCss';
    style.textContent = `
      .teffai-wrap{display:flex;flex-direction:column;height:520px;border-radius:20px;overflow:hidden;border:1px solid rgba(34,197,94,0.2);box-shadow:0 8px 40px rgba(0,0,0,0.4)}
      .teffai-header{background:linear-gradient(135deg,#0a1628,#0d2818);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(34,197,94,0.15)}
      .teffai-avatar{width:40px;height:40px;border-radius:50%;box-shadow:0 0 20px rgba(34,197,94,0.4)}
      .status-dot{width:8px;height:8px;background:#22C55E;border-radius:50%;box-shadow:0 0 8px #22C55E}
      .teff-icon-btn{background:rgba(255,255,255,0.08);border:none;color:white;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:0.9rem;transition:all 0.2s}
      .teff-icon-btn:hover{background:rgba(255,255,255,0.15)}
      .teff-lang-bar{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.04)}
      .lang-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 10px;border-radius:20px;cursor:pointer;font-size:0.7rem;font-family:'Poppins',sans-serif;transition:all 0.2s}
      .lang-btn.active{background:rgba(34,197,94,0.2);border-color:rgba(34,197,94,0.4);color:#86EFAC}
      .teffai-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#080F1E,#0a1628)}
      .teffai-messages::-webkit-scrollbar{width:3px}
      .teffai-messages::-webkit-scrollbar-thumb{background:rgba(34,197,94,0.3);border-radius:3px}
      .bot-msg,.user-msg{display:flex;animation:fadeUp 0.35s ease}
      .user-msg{justify-content:flex-end}
      .bot-bubble{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:rgba(255,255,255,0.9);padding:12px 14px;border-radius:16px 16px 16px 4px;max-width:88%;font-size:0.83rem;line-height:1.6}
      .bot-bubble.premium{background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(6,182,212,0.08));border-color:rgba(34,197,94,0.25)}
      .user-bubble{background:linear-gradient(135deg,#22C55E,#16A34A);color:white;padding:10px 14px;border-radius:16px 16px 4px 16px;max-width:85%;font-size:0.83rem;line-height:1.55;box-shadow:0 4px 15px rgba(34,197,94,0.3)}
      .teff-menu-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:4px}
      .teff-menu-item{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);padding:8px 4px;border-radius:10px;cursor:pointer;font-size:0.7rem;font-family:'Poppins',sans-serif;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.2s}
      .teff-menu-item:hover{background:rgba(34,197,94,0.15);border-color:rgba(34,197,94,0.3);color:white}
      .teff-menu-item span:first-child{font-size:1.1rem}
      .teffai-quick{display:flex;gap:6px;padding:8px 12px;overflow-x:auto;background:rgba(0,0,0,0.25);border-top:1px solid rgba(255,255,255,0.04)}
      .teffai-quick::-webkit-scrollbar{height:2px}
      .quick-btn{white-space:nowrap;padding:6px 12px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#86EFAC;border-radius:50px;cursor:pointer;font-size:0.7rem;font-weight:600;font-family:'Poppins',sans-serif;transition:all 0.2s}
      .quick-btn:hover{background:rgba(34,197,94,0.25);color:white}
      .teffai-input-wrap{display:flex;gap:6px;padding:10px 12px;background:rgba(8,15,30,0.95);border-top:1px solid rgba(255,255,255,0.06)}
      .teff-attach-btn{background:rgba(255,255,255,0.06);border:none;color:rgba(255,255,255,0.5);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;transition:all 0.2s;flex-shrink:0}
      .teff-attach-btn:hover{background:rgba(34,197,94,0.15);color:white}
      .teff-attach-btn.recording{background:rgba(239,68,68,0.2);color:#EF4444;animation:blink 0.5s infinite}
      .teffai-input-wrap input{flex:1;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:white;font-size:0.85rem;font-family:'Poppins',sans-serif;outline:none;transition:all 0.3s}
      .teffai-input-wrap input:focus{border-color:#22C55E;background:rgba(34,197,94,0.07)}
      .teffai-input-wrap input::placeholder{color:rgba(255,255,255,0.2)}
      .send-btn{width:40px;height:40px;background:linear-gradient(135deg,#22C55E,#16A34A);border:none;border-radius:10px;color:white;cursor:pointer;font-size:1rem;transition:all 0.3s;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 15px rgba(34,197,94,0.3)}
      .send-btn:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(34,197,94,0.5)}
      .typing-dots{display:flex;gap:4px;padding:12px 16px;align-items:center}
      .typing-dot{width:8px;height:8px;background:#22C55E;border-radius:50%;animation:pulse 0.8s infinite}
      .typing-dot:nth-child(2){animation-delay:0.15s}
      .typing-dot:nth-child(3){animation-delay:0.3s}
      .action-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
      .action-chip{padding:6px 12px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.25);color:#86EFAC;border-radius:50px;cursor:pointer;font-size:0.72rem;font-weight:600;font-family:'Poppins',sans-serif;transition:all 0.2s}
      .action-chip:hover{background:rgba(34,197,94,0.3);color:white}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
    `;
    document.head.appendChild(style);
  }
}

window.closeTeffSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
};

let teffLang = 'en';
window.setTeffLang = function(lang, btn) {
  teffLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const msg = lang === 'am'
    ? 'ሰላም! 🇪🇹 አማርኛ ቋንቋ ተቀይሯል። ጥያቄዎን ያቅርቡ!'
    : 'Language switched to English! 🇬🇧 How can I help?';
  addTeffMsg(msg, 'bot');
};

let teffDark = true;
window.toggleTeffTheme = function() {
  teffDark = !teffDark;
  const wrap = document.getElementById('teffaiWrap');
  if (wrap) {
    wrap.style.filter = teffDark ? '' : 'invert(0.85) hue-rotate(180deg)';
  }
};

// ===== KNOWLEDGE BASE =====
const KB_EN = [
  {
    keys: ['deposit','add money','top up','fund','credit'],
    answer: `💳 <strong>How to Deposit:</strong><br><br>
1️⃣ Go to <strong>💳 Wallet</strong> in the menu<br>
2️⃣ Tap <strong>⬆️ Deposit</strong><br>
3️⃣ Select your bank:<br>
&nbsp;&nbsp;🏦 CBE • Awash • Dashen • Abyssinia<br>
&nbsp;&nbsp;📱 Telebirr • M-Pesa<br>
4️⃣ Enter amount <em>(minimum 100 ETB)</em><br>
5️⃣ Enter transaction reference number<br>
6️⃣ Submit — admin verifies within <strong>24 hours</strong>`,
    chips: [
      { label: '💳 Go to Wallet', action: "showSection('wallet')" },
      { label: '🏦 Bank list', action: "askTeff('What banks are supported?')" }
    ]
  },
  {
    keys: ['withdraw','cash out','take money','payout','withdrawal'],
    answer: `💰 <strong>How to Withdraw:</strong><br><br>
1️⃣ Go to <strong>💳 Wallet</strong><br>
2️⃣ Tap <strong>⬇️ Withdraw</strong><br>
3️⃣ Select your bank or mobile wallet<br>
4️⃣ Enter your account number<br>
5️⃣ Enter amount <em>(minimum <strong>200 ETB</strong>)</em><br>
6️⃣ Submit — processed within <strong>24 hours</strong><br><br>
⚠️ Make sure account details are correct!`,
    chips: [
      { label: '💳 Go to Wallet', action: "showSection('wallet')" }
    ]
  },
  {
    keys: ['vip','plan','upgrade','membership','tier','level','subscribe'],
    answer: `👑 <strong>VIP Membership Plans:</strong><br><br>
⚪ <strong>Free</strong> — 0 ETB/mo | 2 listings | 10% commission<br>
🟡 <strong>VIP 1</strong> — 200 ETB/mo | 5 listings | 8% commission<br>
🟠 <strong>VIP 2</strong> — 500 ETB/mo | 10 listings | 7% commission<br>
🔵 <strong>VIP 3</strong> — 1,000 ETB/mo | 20 listings | 6% commission<br>
🟣 <strong>VIP 4</strong> — 2,000 ETB/mo | 50 listings | 5% commission<br>
💎 <strong>VIP 5</strong> — 4,000 ETB/mo | Unlimited | 4% commission<br><br>
Higher VIP = more listings + lower commission = <strong>more profit!</strong>`,
    chips: [
      { label: '👑 View VIP Plans', action: "showSection('vip')" },
      { label: '💳 Deposit to upgrade', action: "showSection('wallet')" }
    ]
  },
  {
    keys: ['earn','income','profit','money from','how much earn','revenue'],
    answer: `💰 <strong>How to Earn on AgriEquip:</strong><br><br>
<strong>1. Rental Income</strong><br>
List your equipment → farmers rent it → you earn!<br><br>
<strong>Example:</strong><br>
Tractor 500 ETB/day × 20 days = 10,000 ETB<br>
- Free plan (10%): you keep <strong>9,000 ETB</strong><br>
- VIP 5 (4%): you keep <strong>9,600 ETB</strong> 🎉<br><br>
<strong>2. Referral Bonuses</strong><br>
Earn <strong>50 ETB</strong> per friend who joins & completes first rental!<br><br>
<strong>3. Tip:</strong> More listings + higher VIP = maximum earnings`,
    chips: [
      { label: '📦 List Equipment', action: "showSection('listings')" },
      { label: '💎 Upgrade VIP', action: "showSection('vip')" },
      { label: '📊 My Earnings', action: "showSection('earnings')" }
    ]
  },
  {
    keys: ['list','listing','add equipment','post equipment','how to list','sell'],
    answer: `📦 <strong>How to List Equipment:</strong><br><br>
1️⃣ Menu → <strong>My Listings</strong><br>
2️⃣ Tap <strong>➕ Add New Equipment</strong><br>
3️⃣ Fill in:<br>
&nbsp;&nbsp;• Name (e.g. John Deere Tractor)<br>
&nbsp;&nbsp;• Category & price per day (ETB)<br>
&nbsp;&nbsp;• Location & description<br>
4️⃣ Tap <strong>✅ Submit</strong><br><br>
Your equipment goes live instantly for farmers to book!`,
    chips: [
      { label: '📦 My Listings', action: "showSection('listings')" }
    ]
  },
  {
    keys: ['book','booking','rent','reserve','how to book','hire'],
    answer: `📅 <strong>How to Book Equipment:</strong><br><br>
1️⃣ Go to <strong>🔍 Browse Equipment</strong><br>
2️⃣ Search or filter by category<br>
3️⃣ Tap <strong>📅 Book Now</strong> on any listing<br>
4️⃣ Enter number of days<br>
5️⃣ Confirm total & submit<br><br>
Track status in <strong>My Bookings</strong>:<br>
🟡 Pending → ✅ Active → 🔵 Completed`,
    chips: [
      { label: '🔍 Browse Equipment', action: "showSection('browse')" },
      { label: '📅 My Bookings', action: "showSection('bookings')" }
    ]
  },
  {
    keys: ['referral','invite','code','agr-','share','friend bonus'],
    answer: `🎁 <strong>Referral Program:</strong><br><br>
1️⃣ Find your code in <strong>🏠 Home</strong> section<br>
2️⃣ Format: <strong>AGR-XXXXXX</strong><br>
3️⃣ Share with friends<br>
4️⃣ When they join & complete first rental → you earn <strong>50 ETB!</strong><br><br>
No limit — refer 100 friends = 5,000 ETB bonus! 🎉<br><br>
Track referral earnings in <strong>💰 Earnings</strong>`,
    chips: [
      { label: '🏠 Get My Code', action: "showSection('home')" },
      { label: '💰 Referral Earnings', action: "showSection('earnings')" }
    ]
  },
  {
    keys: ['contact','support','phone','email','whatsapp','telegram','help','fax','call us'],
    answer: `📞 <strong>AgriEquip Support:</strong><br><br>
📧 <strong>Email:</strong> support0agriequip.et@gmail.com<br>
📱 <strong>Phone:</strong> +251 993 920 750<br>
💬 <strong>WhatsApp:</strong> +251 993 920 750<br>
✈️ <strong>Telegram:</strong> @AgriEquipET<br>
📸 <strong>Instagram:</strong> @agriequip.et<br>
📠 <strong>FAX:</strong> +251 993 920 750<br>
📍 Addis Ababa, Ethiopia<br>
🕐 Mon–Fri 8AM–6PM EAT<br><br>
⚡ Average response: <strong>under 2 hours</strong>`,
    chips: [
      { label: '📋 Legal Info', action: "showSection('about')" }
    ]
  },
  {
    keys: ['bank','cbe','awash','dashen','abyssinia','telebirr','mpesa','supported'],
    answer: `🏦 <strong>Supported Banks & Services:</strong><br><br>
🏦 <strong>CBE</strong> — Commercial Bank of Ethiopia<br>
🏦 <strong>Awash Bank</strong> — Awash International<br>
🏦 <strong>Dashen Bank</strong> — Dashen Bank S.C.<br>
🏦 <strong>Abyssinia Bank</strong> — Bank of Abyssinia<br>
📱 <strong>Telebirr</strong> — Ethio Telecom<br>
📱 <strong>M-Pesa</strong> — Safaricom Ethiopia<br><br>
All transactions are secure and verified by our admin team.`
  },
  {
    keys: ['setting','theme','dark','light','black','appearance','language','color'],
    answer: `⚙️ <strong>App Settings:</strong><br><br>
Menu → <strong>⚙️ Settings</strong><br><br>
<strong>🎨 Themes:</strong><br>
🌑 Dark (default) | ☀️ Light | ⬛ Black | 🌿 Nature<br><br>
<strong>🌐 Language:</strong><br>
🇬🇧 English | 🇪🇹 Amharic (switching in Teff AI)<br><br>
<strong>🗺️ Navigation:</strong><br>
◀ ▶ Back/Forward | Swipe from edges`,
    chips: [
      { label: '⚙️ Open Settings', action: "showSection('settings')" }
    ]
  },
  {
    keys: ['pending','why pending','not approved','waiting','delayed'],
    answer: `⏳ <strong>Why is my request pending?</strong><br><br>
All deposits and withdrawals are manually verified by our admin team for security.<br><br>
<strong>Typical times:</strong><br>
- Deposits: verified within <strong>24 hours</strong><br>
- Withdrawals: processed within <strong>24 hours</strong><br><br>
If it's been more than 24 hours, please contact us:<br>
📱 <strong>+251 993 920 750</strong><br>
📧 <strong>support0agriequip.et@gmail.com</strong>`,
    chips: [
      { label: '💳 Check Wallet', action: "showSection('wallet')" },
      { label: '📞 Contact Support', action: "askTeff('Show contact information')" }
    ]
  },
  {
    keys: ['profile','name','account','bio','edit profile','my account'],
    answer: `👤 <strong>Your Profile:</strong><br><br>
Menu → <strong>👤 Profile</strong><br><br>
You can update:<br>
- Full name & father's name<br>
- Phone number (+251...)<br>
- City/location<br><br>
Tap <strong>💾 Save Changes</strong> to save.<br><br>
Your profile also shows your VIP status and referral code.`,
    chips: [
      { label: '👤 Open Profile', action: "showSection('profile')" }
    ]
  },
  {
    keys: ['security','safe','trust','protect','fraud','account security'],
    answer: `🛡️ <strong>Account Security:</strong><br><br>
AgriEquip uses enterprise-grade security:<br><br>
🔒 Firebase Authentication (Google-powered)<br>
🗄️ Encrypted Firestore database<br>
🌐 HTTPS on all connections<br>
👤 Role-based data access<br>
🔍 Manual transaction verification<br><br>
<strong>Tips to stay safe:</strong><br>
- Never share your password<br>
- Use a strong unique password<br>
- Report suspicious activity immediately<br><br>
📱 Security issues: <strong>+251 993 920 750</strong>`
  },
  {
    keys: ['agriequip','what is','about','how does it work','platform','marketplace'],
    answer: `🌾 <strong>About AgriEquip:</strong><br><br>
Ethiopia's premier agricultural equipment rental marketplace — connecting farmers nationwide.<br><br>
<strong>For Equipment Owners:</strong><br>
List idle equipment → earn rental income daily<br><br>
<strong>For Farmers:</strong><br>
Rent affordable equipment near you instead of buying<br><br>
<strong>Platform Features:</strong><br>
🚜 Equipment listings & bookings<br>
💳 Secure ETB wallet<br>
💎 VIP membership tiers<br>
🤖 Teff AI assistant<br>
🎁 50 ETB referral program<br><br>
📍 Addis Ababa, Ethiopia 🇪🇹`
  },
  {
    keys: ['salam','selam','hello','hi','hey','ሰላም','good morning','greetings','welcome'],
    answer: `Salam! 👋 Betam welcome to AgriEquip! 🌾<br><br>
I'm Teff AI, always here to help. What can I do for you today?<br><br>
Tap any button above or just type your question! 😊`
  },
  {
    keys: ['thank','thanks','amesegna','betam amesegnalehu','perfect','great','helpful'],
    answer: `Betam amesegnalehu! 🙏 (Thank you so much!)<br><br>
Always happy to help Ethiopian farmers grow and prosper with AgriEquip! 🌾💚<br><br>
Is there anything else I can help you with?`
  }
];

const KB_AM = [
  {
    keys: ['ብር','ማስቀመጥ','ዲፖዚት','ፈንድ'],
    answer: `💳 <strong>ብር ማስቀመጥ:</strong><br><br>
1️⃣ <strong>💳 ዋሌት</strong> ሂዱ<br>
2️⃣ <strong>⬆️ ዲፖዚት</strong> ን누누<br>
3️⃣ ባንክ ምረጡ (CBE, Awash, Telebirr...)<br>
4️⃣ መጠን ያስቀምጡ (ቢያንስ 100 ብር)<br>
5️⃣ የግብይት ማጣቀሻ ቁጥር ያስቀምጡ<br>
6️⃣ አስተዳዳሪ በ<strong>24 ሰዓት</strong> ያረጋግጣሉ`
  },
  {
    keys: ['ዋሌት','ቀሪ','ሒሳብ','ብር ማውጣት'],
    answer: `💰 <strong>ብር ማውጣት:</strong><br><br>
ቢያንስ <strong>200 ብር</strong> ማውጣት ይቻላል<br><br>
1️⃣ ዋሌት ሂዱ<br>
2️⃣ ⬇️ ዊዝድሮ누누<br>
3️⃣ ባንክ ምረጡ<br>
4️⃣ የሒሳብ ቁጥር ያስቀምጡ<br>
5️⃣ መጠን ያስቀምጡ<br><br>
<strong>24 ሰዓት</strong> ውስጥ ይሠራል`
  }
];

function smartReply(msg) {
  const lower = msg.toLowerCase().trim();
  const kb = teffLang === 'am' ? [...KB_AM, ...KB_EN] : KB_EN;

  let bestMatch = null;
  let bestScore = 0;
  for (const topic of kb) {
    for (const key of topic.keys) {
      if (lower.includes(key)) {
        if (key.length > bestScore) {
          bestScore = key.length;
          bestMatch = topic;
        }
      }
    }
  }
  return bestMatch;
}

// Voice input
window.handleVoice = function() {
  const btn = document.getElementById('voiceBtn');
  const input = document.getElementById('teffaiInput');

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    addTeffMsg('🎤 Voice input is not supported on your browser. Please type your question.', 'bot');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = teffLang === 'am' ? 'am-ET' : 'en-US';
  recognition.interimResults = false;

  btn.classList.add('recording');
  btn.textContent = '🔴';

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    input.value = transcript;
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    sendToTeff();
  };

  recognition.onerror = () => {
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    addTeffMsg('🎤 Could not hear audio. Please try again or type.', 'bot');
  };

  recognition.onend = () => {
    btn.classList.remove('recording');
    btn.textContent = '🎤';
  };

  recognition.start();
};

let teffHistory = [];

window.askTeff = function(q) {
  const input = document.getElementById('teffaiInput');
  if (input) { input.value = q; sendToTeff(); }
};

window.sendToTeff = function() {
  const input = document.getElementById('teffaiInput');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  input.focus();

  addTeffMsg(msg, 'user');
  teffHistory.push(msg);

  const typing = addTeffTyping();
  const delay = 400 + Math.random() * 300;

  setTimeout(() => {
    removeTeffTyping(typing);
    const match = smartReply(msg);
    if (match) {
      addTeffMsgWithChips(match.answer, match.chips);
    } else {
      addTeffMsgWithChips(defaultReply(msg), null);
    }
  }, delay);
};

function defaultReply(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('?') || lower.includes('how') || lower.includes('what') || lower.includes('why')) {
    return `Betam good question! 🤔<br><br>
I didn't quite catch that. Try asking about:<br>
💳 Deposits & withdrawals<br>
💎 VIP plans<br>
📦 Listing equipment<br>
💰 Earning money<br>
📞 Contact support<br><br>
Or reach us directly:<br>
📱 <strong>+251 993 920 750</strong><br>
📧 <strong>support0agriequip.et@gmail.com</strong>`;
  }
  return `Salam! 🌾 I understand "<em>${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}</em>"<br><br>
For this, please contact our team:<br>
📱 <strong>+251 993 920 750</strong><br>
📧 <strong>support0agriequip.et@gmail.com</strong><br><br>
We respond in under 2 hours! Eshi? 😊`;
}

window.clearTeffAI = function() {
  teffHistory = [];
  const msgs = document.getElementById('teffaiMessages');
  if (msgs) {
    msgs.innerHTML = `<div class="bot-msg"><div class="bot-bubble">Chat cleared! Salam! 😊🌾 How can I help you today?</div></div>`;
  }
};

function addTeffMsg(text, type) {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.style.animation = 'fadeUp 0.35s ease';
  div.innerHTML = `<div class="${type === 'user' ? 'user-bubble' : 'bot-bubble'}">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTeffMsgWithChips(text, chips) {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'bot-msg';
  div.style.animation = 'fadeUp 0.35s ease';

  let chipsHtml = '';
  if (chips && chips.length > 0) {
    chipsHtml = `<div class="action-chips">${chips.map(c =>
      `<button class="action-chip" onclick="${c.action}">${c.label}</button>`
    ).join('')}</div>`;
  }

  div.innerHTML = `<div class="bot-bubble">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}${chipsHtml}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTeffTyping() {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'bot-msg';
  div.innerHTML = `<div class="bot-bubble" style="padding:10px 16px"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTeffTyping(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}

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
              <line x1="30" y1="10" x2="30" y2="6" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round"/>
              <ellipse cx="30" cy="5" rx="1.5" ry="3" fill="rgba(255,255,255,0.55)" transform="rotate(-10 30 5)"/>
            </svg>
          </div>
          <div>
            <p style="font-weight:700;font-size:0.92rem;color:white">Teff AI</p>
            <div style="display:flex;align-items:center;gap:5px">
              <div style="width:7px;height:7px;background:#22C55E;border-radius:50%"></div>
              <p style="color:#86EFAC;font-size:0.68rem">Always Online • AgriEquip OS</p>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="setTeffLang('am')" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.68rem">🇪🇹 አማ</button>
          <button onclick="clearTeffAI()" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.5);padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem">🗑</button>
        </div>
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
        <button class="quick-btn" onclick="askTeff('How does the referral program work?')">🎁 Referrals</button>
        <button class="quick-btn" onclick="showSection('browse')">🔍 Browse Equipment</button>
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
    answer:`💳 <strong>How to Deposit:</strong><br><br>1️⃣ Menu → <strong>💳 Wallet</strong><br>2️⃣ Tap <strong>⬆️ Deposit</strong><br>3️⃣ Select your bank:<br>&nbsp;&nbsp;🏦 CBE • Awash • Dashen • Abyssinia<br>&nbsp;&nbsp;📱 Telebirr • M-Pesa<br>4️⃣ Enter amount (min <strong>100 ETB</strong>)<br>5️⃣ Enter transaction reference<br>6️⃣ Submit — approved within <strong>24 hours</strong>`,
    nav:'wallet' },
  { keys:['withdraw','cash out','take money','payout'],
    answer:`💰 <strong>How to Withdraw:</strong><br><br>1️⃣ Menu → <strong>💳 Wallet</strong><br>2️⃣ Tap <strong>⬇️ Withdraw</strong><br>3️⃣ Select your bank<br>4️⃣ Enter account number & amount<br>5️⃣ Minimum withdrawal: <strong>200 ETB</strong><br>6️⃣ Processed within <strong>24 hours</strong>`,
    nav:'wallet' },
  { keys:['vip','plan','upgrade','commission','membership'],
    answer:`💎 <strong>VIP Plans:</strong><br><br>⚪ Free — 0 ETB | 2 listings | 10%<br>🟡 VIP 1 — 200 ETB | 5 listings | 8%<br>🟠 VIP 2 — 500 ETB | 10 listings | 7%<br>🔵 VIP 3 — 1,000 ETB | 20 listings | 6%<br>🟣 VIP 4 — 2,000 ETB | 50 listings | 5%<br>💎 VIP 5 — 4,000 ETB | Unlimited | 4%<br><br>Paid from your wallet. Higher VIP = more profit!`,
    nav:'vip' },
  { keys:['rank','point','level','achievement','seedling','grower','legend'],
    answer:`🏆 <strong>Achievement Ranks:</strong><br><br>🌱 Seedling — 0 pts<br>🌿 Grower — 100 pts<br>🌾 Cultivator — 300 pts<br>🚜 Harvester — 600 pts<br>🔧 Mechanic — 1,000 pts<br>🏅 Expert Farmer — 1,500 pts<br>👑 Agricultural Legend — 2,500 pts<br><br>Earn points by: completing tasks, booking equipment, listing equipment, academy lessons, community posts!`,
    nav:'tasks' },
  { keys:['task','daily','tip','quiz','activity'],
    answer:`🌱 <strong>Daily Tasks:</strong><br><br>Complete daily tasks to earn points and rank up!<br><br>• 🌱 Read farming tip — <strong>10 pts</strong><br>• 🌤 Check weather — <strong>5 pts</strong><br>• 📝 Farming quiz — <strong>20 pts</strong><br>• 📊 Farm record — <strong>15 pts</strong><br>• 🚜 Browse equipment — <strong>5 pts</strong><br><br>New tasks available every day!`,
    nav:'tasks' },
  { keys:['academy','lesson','course','learn','training'],
    answer:`🎓 <strong>Farming Academy:</strong><br><br>Free lessons on:<br>🌾 Teff farming — 30 pts<br>☕ Coffee production — 40 pts<br>🌽 Maize management — 30 pts<br>🚜 Tractor safety — 50 pts<br>🌍 Soil health — 25 pts<br>💧 Irrigation planning — 35 pts<br><br>Complete lessons to earn points and rank up!`,
    nav:'academy' },
  { keys:['community','post','share','forum','question'],
    answer:`👥 <strong>Community:</strong><br><br>Share farming tips, ask questions, post harvest updates!<br><br>• Post a tip — <strong>+10 pts</strong><br>• Ask a question<br>• Share photos<br>• Help other farmers<br><br>Go to Community section to join!`,
    nav:'community' },
  { keys:['list','listing','add equipment','post equipment'],
    answer:`📦 <strong>List Your Equipment:</strong><br><br>1️⃣ Menu → <strong>My Listings</strong><br>2️⃣ Tap <strong>➕ Add New Equipment</strong><br>3️⃣ Fill: name, category, price/day, location<br>4️⃣ Tap <strong>✅ Submit</strong><br>5️⃣ Earn <strong>+30 points</strong> for listing!<br><br>Your equipment appears instantly in Browse.`,
    nav:'listings' },
  { keys:['book','booking','rent','reserve'],
    answer:`📅 <strong>Book Equipment:</strong><br><br>1️⃣ Menu → <strong>🔍 Browse Equipment</strong><br>2️⃣ Search or filter by category<br>3️⃣ Tap <strong>📅 Book Now</strong><br>4️⃣ Enter number of days<br>5️⃣ Confirm & submit<br>6️⃣ Earn <strong>+20 points</strong> per booking!`,
    nav:'browse' },
  { keys:['referral','invite','code','friend','bonus'],
    answer:`🎁 <strong>Referral Program:</strong><br><br>1️⃣ Find your code in <strong>🏠 Home</strong><br>2️⃣ Share: <strong>AGR-XXXXXX</strong><br>3️⃣ Friend joins with your code<br>4️⃣ They complete first rental<br>5️⃣ You earn <strong>50 ETB!</strong><br><br>No limit — refer 10 friends = 500 ETB bonus!`,
    nav:'home' },
  { keys:['contact','support','phone','email','whatsapp','help'],
    answer:`📞 <strong>AgriEquip Support:</strong><br><br>📧 support0agriequip.et@gmail.com<br>📱 +251 993 920 750<br>💬 WhatsApp: +251 993 920 750<br>✈️ Telegram: @AgriEquipET<br>📸 Instagram: @agriequip.et<br>🕐 Mon–Fri 8AM–6PM EAT<br><br>⚡ Response within 2 hours`,
    nav:'about' },
  { keys:['earn','income','profit','money'],
    answer:`💰 <strong>How to Earn:</strong><br><br>1. List equipment → get rentals → earn fees<br>2. Example: 500 ETB/day × 20 days = 10,000 ETB<br>3. Free (10% commission) → keep <strong>9,000 ETB</strong><br>4. VIP 5 (4% commission) → keep <strong>9,600 ETB</strong><br><br>Plus:<br>🎁 50 ETB per referral<br>💎 Lower commission with VIP upgrade`,
    nav:'earnings' },
  { keys:['weather','climate','rain','forecast'],
    answer:`🌤 <strong>Weather for Farming:</strong><br><br>Check today's weather before planning field work — it's one of your daily tasks!<br><br>Go to <strong>🌱 Daily Tasks</strong> → tap "Check Weather" to earn <strong>5 points</strong>.<br><br>AgriEquip OS will add a full weather dashboard in the next update!`,
    nav:'tasks' },
  { keys:['salam','hello','hi','selam','hey','ሰላም'],
    answer:`Salam! 👋 Welcome to AgriEquip OS! 🌾<br><br>I'm Teff AI, your farming assistant. How can I help you today?`,
    nav:null },
  { keys:['thank','thanks','amesegna','perfect','great'],
    answer:`Betam amesegnalehu! 🙏<br><br>Happy to help Ethiopian farmers grow and prosper! 🌾💚<br><br>Anything else I can help with?`,
    nav:null }
];

let teffLang = 'en';
window.setTeffLang = function(lang) {
  teffLang = lang;
  const msg = lang === 'am'
    ? 'ሰላም! 🇪🇹 አማርኛ ቋንቋ ተቀይሯል። ጥያቄዎን ያቅርቡ!'
    : 'Language switched to English! 🇬🇧';
  addTeffMsg(msg, 'bot');
};

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
        reply += `<br><br><button onclick="showSection('${match.nav}')" style="background:linear-gradient(135deg,#22C55E,#16A34A);border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.78rem;font-family:'Poppins',sans-serif;margin-top:6px">Open ${match.nav.charAt(0).toUpperCase()+match.nav.slice(1)} →</button>`;
      }
      addTeffMsg(reply, 'bot');
    } else {
      addTeffMsg(`Betam good question! 🤔<br><br>For this specific question, contact our team directly:<br>📱 <strong>+251 993 920 750</strong><br>📧 <strong>support0agriequip.et@gmail.com</strong><br><br>Or tap a quick button above! 😊`, 'bot');
    }
  }, 400 + Math.random() * 300);
};

window.clearTeffAI = function() {
  const msgs = document.getElementById('teffaiMessages');
  if (msgs) msgs.innerHTML = '<div class="bot-msg"><div class="bot-bubble">Chat cleared! Salam! 😊🌾 How can I help?</div></div>';
};

function addTeffMsg(text, type) {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.style.animation = 'fadeUp 0.35s ease';
  div.innerHTML = `<div class="${type==='user'?'user-bubble':'bot-bubble'}">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTeffTyping() {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'bot-msg';
  div.innerHTML = `<div class="bot-bubble" style="padding:12px 16px;display:flex;gap:5px;align-items:center">
    <span style="width:8px;height:8px;background:#22C55E;border-radius:50%;display:inline-block;animation:pulse 0.8s infinite"></span>
    <span style="width:8px;height:8px;background:#22C55E;border-radius:50%;display:inline-block;animation:pulse 0.8s 0.2s infinite"></span>
    <span style="width:8px;height:8px;background:#22C55E;border-radius:50%;display:inline-block;animation:pulse 0.8s 0.4s infinite"></span>
  </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTeffTyping(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}

