// Teff AI - AgriEquip Local Knowledge Assistant
// Uses smart local knowledge base - works offline, no connection needed

export function initTeffAI() {
  const container = document.getElementById('teffaiContainer');
  if (!container || container.dataset.init === 'true') return;
  container.dataset.init = 'true';

  container.innerHTML = `
    <div class="teffai-wrap">
      <div class="teffai-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="teffai-avatar">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="17" fill="url(#tg)"/>
              <defs><linearGradient id="tg" x1="0" y1="0" x2="34" y2="34">
                <stop stop-color="#22C55E"/><stop offset="1" stop-color="#06B6D4"/>
              </linearGradient></defs>
              <rect x="9" y="11" width="16" height="12" rx="4" fill="rgba(255,255,255,0.95)"/>
              <circle cx="14" cy="16" r="2.5" fill="#22C55E"/>
              <circle cx="20" cy="16" r="2.5" fill="#22C55E"/>
              <circle cx="14" cy="16" r="1" fill="white"/>
              <circle cx="20" cy="16" r="1" fill="white"/>
              <rect x="13" y="20" width="8" height="1.5" rx="0.75" fill="#94A3B8"/>
              <line x1="17" y1="11" x2="17" y2="7" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="17" cy="6" r="2" fill="#22C55E"/>
              <rect x="6" y="14" width="3" height="5" rx="1.5" fill="rgba(255,255,255,0.8)"/>
              <rect x="25" y="14" width="3" height="5" rx="1.5" fill="rgba(255,255,255,0.8)"/>
              <line x1="28" y1="10" x2="28" y2="6" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" stroke-linecap="round"/>
              <ellipse cx="28" cy="5" rx="1.5" ry="3" fill="rgba(255,255,255,0.6)" transform="rotate(-10 28 5)"/>
            </svg>
          </div>
          <div>
            <p style="font-weight:700;font-size:0.92rem;color:white">Teff AI</p>
            <div style="display:flex;align-items:center;gap:5px">
              <div style="width:7px;height:7px;background:#22C55E;border-radius:50%"></div>
              <p style="color:#86EFAC;font-size:0.68rem">AgriEquip Assistant • Always Online</p>
            </div>
          </div>
        </div>
        <button onclick="clearTeffAI()" style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.5);padding:5px 10px;border-radius:7px;cursor:pointer;font-size:0.7rem;font-family:'Poppins',sans-serif">🗑 Clear</button>
      </div>

      <div class="teffai-messages" id="teffaiMessages">
        <div class="bot-msg">
          <div class="bot-bubble">
            <strong>Salam! 👋 I'm Teff AI</strong><br><br>
            Your AgriEquip assistant — named after Ethiopia's ancient grain 🌾<br><br>
            I can instantly help with:<br>
            🚜 <strong>Equipment</strong> — listing, booking, searching<br>
            💳 <strong>Wallet</strong> — deposits, withdrawals, banks<br>
            💎 <strong>VIP Plans</strong> — which plan suits you best<br>
            💰 <strong>Earnings</strong> — how to maximize income<br>
            🎁 <strong>Referrals</strong> — earn from inviting friends<br>
            📞 <strong>Support</strong> — contact & legal info<br><br>
            <em style="opacity:0.6;font-size:0.78rem">Ask me anything about AgriEquip!</em>
          </div>
        </div>
      </div>

      <div class="teffai-quick">
        <button class="quick-btn" onclick="askTeff('How do I list my equipment?')">📦 List equipment</button>
        <button class="quick-btn" onclick="askTeff('How does the wallet work?')">💳 Wallet help</button>
        <button class="quick-btn" onclick="askTeff('Which VIP plan is best for me?')">💎 Best VIP plan</button>
        <button class="quick-btn" onclick="askTeff('How do I earn money on AgriEquip?')">💰 Earn money</button>
        <button class="quick-btn" onclick="askTeff('How does the referral program work?')">🎁 Referrals</button>
        <button class="quick-btn" onclick="askTeff('Contact and support information')">📞 Contact us</button>
        <button class="quick-btn" onclick="askTeff('How do I book equipment?')">📅 Book equipment</button>
        <button class="quick-btn" onclick="askTeff('How do I change the theme?')">⚙️ Settings</button>
      </div>

      <div class="teffai-input-wrap">
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
}

// ===== COMPLETE KNOWLEDGE BASE =====
const KB = [
  {
    keys: ['list','listing','add equipment','my listing','add listing','how to list','post equipment'],
    answer: `📦 <strong>How to List Your Equipment:</strong><br><br>
1️⃣ Tap ☰ menu → tap <strong>My Listings</strong><br>
2️⃣ Tap <strong>➕ Add New Equipment</strong><br>
3️⃣ Fill in the form:<br>
&nbsp;&nbsp;• Equipment name (e.g. John Deere Tractor)<br>
&nbsp;&nbsp;• Category (Tractor, Plow, Harvester, etc.)<br>
&nbsp;&nbsp;• Price per day in ETB<br>
&nbsp;&nbsp;• Your city/location<br>
&nbsp;&nbsp;• Description (optional but helps!)<br>
4️⃣ Tap <strong>✅ Submit Listing</strong><br><br>
Your equipment instantly appears in Browse for all users!<br><br>
💡 <em>Good descriptions and accurate location = more bookings!</em>`
  },
  {
    keys: ['book','booking','rent','how to book','reserve','borrow'],
    answer: `📅 <strong>How to Book Equipment:</strong><br><br>
1️⃣ Go to <strong>🔍 Browse Equipment</strong><br>
2️⃣ Search by name or filter by category<br>
3️⃣ Find equipment you need<br>
4️⃣ Tap <strong>📅 Book Now</strong><br>
5️⃣ Enter number of days needed<br>
6️⃣ Confirm total cost and submit<br><br>
<strong>Booking Status:</strong><br>
🟡 Pending — waiting for owner confirmation<br>
✅ Active — rental in progress<br>
🔵 Completed — rental finished<br>
❌ Cancelled — booking cancelled<br><br>
📍 Check <strong>My Bookings</strong> to track all your rentals<br><br>
⚠️ <em>You cannot book your own listed equipment.</em>`
  },
  {
    keys: ['wallet','deposit','withdraw','balance','bank','cbe','awash','dashen','abyssinia','telebirr','mpesa','m-pesa','money transfer'],
    answer: `💳 <strong>AgriEquip Wallet Guide:</strong><br><br>
<strong>⬆️ To Deposit:</strong><br>
1. Go to Wallet → tap ⬆️ Deposit<br>
2. Choose your bank or mobile wallet<br>
3. Enter amount (minimum <strong>100 ETB</strong>)<br>
4. Enter your transaction reference<br>
5. Admin verifies & credits within <strong>24 hours</strong><br><br>
<strong>⬇️ To Withdraw:</strong><br>
1. Go to Wallet → tap ⬇️ Withdraw<br>
2. Choose your bank<br>
3. Enter account number & amount<br>
4. Minimum withdrawal: <strong>200 ETB</strong><br>
5. Processed within <strong>24 hours</strong><br><br>
<strong>🏦 Supported Banks:</strong><br>
CBE • Awash Bank • Dashen Bank<br>
Abyssinia Bank • Telebirr • M-Pesa<br><br>
❓ Issues? Call <strong>+251 993 920 750</strong>`
  },
  {
    keys: ['vip','plan','upgrade','commission','subscription','membership','tier'],
    answer: `💎 <strong>VIP Membership Plans:</strong><br><br>
⚪ <strong>Free</strong> — 0 ETB/month<br>
&nbsp;&nbsp;📋 2 listings &nbsp;|&nbsp; 💸 10% commission<br><br>
🟡 <strong>VIP 1</strong> — 200 ETB/month<br>
&nbsp;&nbsp;📋 5 listings &nbsp;|&nbsp; 💸 8% commission<br><br>
🟠 <strong>VIP 2</strong> — 500 ETB/month<br>
&nbsp;&nbsp;📋 10 listings &nbsp;|&nbsp; 💸 7% commission<br><br>
🔵 <strong>VIP 3</strong> — 1,000 ETB/month<br>
&nbsp;&nbsp;📋 20 listings &nbsp;|&nbsp; 💸 6% commission<br><br>
🟣 <strong>VIP 4</strong> — 2,000 ETB/month<br>
&nbsp;&nbsp;📋 50 listings &nbsp;|&nbsp; 💸 5% commission<br><br>
💎 <strong>VIP 5</strong> — 4,000 ETB/month<br>
&nbsp;&nbsp;📋 Unlimited listings &nbsp;|&nbsp; 💸 4% commission<br><br>
<strong>How to activate:</strong><br>
Go to 💎 VIP Plans → tap Activate → paid from your wallet<br><br>
💡 Need funds? Go to Wallet → Deposit first!`
  },
  {
    keys: ['earn','income','how much','profit','rental income','money from'],
    answer: `💰 <strong>How to Earn on AgriEquip:</strong><br><br>
<strong>1️⃣ Rental Income</strong><br>
List equipment → farmers rent it → you earn!<br>
AgriEquip takes a small commission, you keep the rest.<br><br>
<strong>2️⃣ Example Calculation:</strong><br>
Tractor at 500 ETB/day × 20 days = 10,000 ETB<br>
Free plan (10%): you earn <strong>9,000 ETB</strong><br>
VIP 5 (4%): you earn <strong>9,600 ETB</strong> 🎉<br><br>
<strong>3️⃣ Reduce Commission</strong><br>
Upgrade VIP → lower % → keep more per rental<br><br>
<strong>4️⃣ Referral Bonuses</strong><br>
Earn 50 ETB per friend who joins & completes first rental<br><br>
<strong>5️⃣ Tips to Earn More:</strong><br>
- List multiple equipment<br>
- Write good descriptions<br>
- Add accurate location<br>
- Upgrade to VIP for lower commission`
  },
  {
    keys: ['referral','invite','code','friend','bonus','share','agr-'],
    answer: `🎁 <strong>Referral Program:</strong><br><br>
<strong>How it works:</strong><br>
1️⃣ Find your unique code in <strong>Home</strong> section<br>
2️⃣ Your code looks like: <strong>AGR-ABC123</strong><br>
3️⃣ Share it with friends:<br>
&nbsp;&nbsp;<em>"Join AgriEquip: agriequip.et - use my code AGR-XXXXX!"</em><br>
4️⃣ When they register with your code AND complete their first rental...<br>
5️⃣ You earn <strong>50 ETB instantly!</strong> 🎉<br><br>
<strong>Track your earnings:</strong><br>
Go to 💰 Earnings → see Referral Earnings section<br><br>
💡 No limit on referrals! Refer 10 friends = 500 ETB bonus!`
  },
  {
    keys: ['contact','support','phone','email','whatsapp','telegram','instagram','help','fax','call'],
    answer: `📞 <strong>AgriEquip Contact & Support:</strong><br><br>
📧 Email: <a href="mailto:support0agriequip.et@gmail.com" style="color:#22C55E">support0agriequip.et@gmail.com</a><br>
📱 Phone: <strong>+251 993 920 750</strong><br>
💬 WhatsApp: <strong>+251 993 920 750</strong><br>
✈️ Telegram: <strong>@AgriEquipET</strong><br>
📸 Instagram: <strong>@agriequip.et</strong><br>
📠 FAX: <strong>+251 993 920 750</strong><br>
📍 Location: Addis Ababa, Ethiopia<br>
🕐 Hours: Mon–Fri, 8AM–6PM EAT<br><br>
⚡ <em>Average response time: under 2 hours</em>`
  },
  {
    keys: ['setting','theme','dark','light','black','green','appearance','color','language'],
    answer: `⚙️ <strong>App Settings:</strong><br><br>
Go to ☰ Menu → tap <strong>⚙️ Settings</strong><br><br>
<strong>🎨 Available Themes:</strong><br>
🌑 Dark — deep navy (default)<br>
☀️ Light — clean white<br>
⬛ Black — pure black<br>
🌿 Nature — forest green<br><br>
<strong>🗺️ Navigation:</strong><br>
◀ ▶ Back/Forward buttons in topbar<br>
Swipe from screen edge to navigate<br><br>
<strong>🌐 Language:</strong><br>
🇬🇧 English — available now<br>
🇪🇹 Amharic — coming soon!`
  },
  {
    keys: ['profile','name','phone number','city','account info','personal'],
    answer: `👤 <strong>Your Profile:</strong><br><br>
Go to ☰ Menu → tap <strong>👤 Profile</strong><br><br>
You can update:<br>
- Full name<br>
- Father's name<br>
- Phone number (+251...)<br>
- City/location<br><br>
Tap <strong>💾 Save Changes</strong> to update.<br><br>
Your profile shows:<br>
- Your email address<br>
- Current VIP plan<br>
- Your referral code`
  },
  {
    keys: ['salam','selam','hello','hi','hey','ሰላም','good morning','good afternoon','greetings'],
    answer: `Salam! 👋 Eshi, betam amesegnalehu for using AgriEquip! 🌾<br><br>
How can I help you today? You can:<br>
📦 Ask about listing equipment<br>
💳 Ask about wallet & payments<br>
💎 Ask about VIP plans<br>
💰 Ask about earnings<br>
📞 Get contact information<br><br>
<em>Just ask — I'm always here! 😊</em>`
  },
  {
    keys: ['thank','thanks','amesegna','betam','good','great','amazing','helpful','perfect','nice'],
    answer: `Betam amesegnalehu! 🙏<br><br>
I'm so glad I could help! AgriEquip is here to connect Ethiopian farmers and make agricultural equipment accessible to everyone. 🌾🚜<br><br>
Is there anything else you'd like to know?`
  },
  {
    keys: ['agriequip','what is','about app','platform','marketplace','how does it work'],
    answer: `🌾 <strong>About AgriEquip:</strong><br><br>
AgriEquip is Ethiopia's agricultural equipment rental marketplace — connecting farmers who own equipment with farmers who need it.<br><br>
<strong>For Equipment Owners:</strong><br>
List your idle tractors, plows, harvesters → earn rental income every day they're used!<br><br>
<strong>For Farmers:</strong><br>
Browse & rent equipment near you instead of buying expensive machinery<br><br>
<strong>Key Features:</strong><br>
🚜 Equipment listings & bookings<br>
💳 Secure wallet (ETB)<br>
💎 VIP membership tiers<br>
🤖 Teff AI assistant<br>
🎁 Referral program<br><br>
📍 Based in Addis Ababa, Ethiopia 🇪🇹`
  },
  {
    keys: ['google','sign in google','login google','google account'],
    answer: `🔐 <strong>Google Sign-In:</strong><br><br>
You can sign in quickly using your Google account:<br><br>
1️⃣ On the login screen, tap <strong>"Continue with Google"</strong><br>
2️⃣ Select your Google account<br>
3️⃣ You're in! ✅<br><br>
No password to remember — just tap Google and you're done!<br><br>
Your Google email will be used as your AgriEquip account email.`
  },
  {
    keys: ['security','safe','secure','trust','protect','data','privacy'],
    answer: `🛡️ <strong>Security & Trust:</strong><br><br>
AgriEquip uses industry-standard security:<br><br>
- 🔒 Firebase Authentication (Google-powered)<br>
- 🗄️ Secure Firestore database<br>
- 🌐 HTTPS on all connections<br>
- 👤 Users only access their own data<br><br>
<strong>Privacy Policy:</strong><br>
Your data is never sold to third parties. We only collect what's needed to operate the platform.<br><br>
📧 Questions? Email: <strong>support0agriequip.et@gmail.com</strong>`
  }
];

function smartReply(msg) {
  const lower = msg.toLowerCase().trim();
  // Find best matching topic
  let bestMatch = null;
  let bestScore = 0;
  for (const topic of KB) {
    for (const key of topic.keys) {
      if (lower.includes(key)) {
        const score = key.length; // longer key = more specific match
        if (score > bestScore) {
          bestScore = score;
          bestMatch = topic;
        }
      }
    }
  }
  return bestMatch ? bestMatch.answer : null;
}

function generateSuggestions(msg) {
  const lower = msg.toLowerCase();
  // Return related topics
  const suggestions = [];
  if (lower.includes('earn') || lower.includes('money')) suggestions.push('💎 Check VIP plans to earn more');
  if (lower.includes('vip') || lower.includes('upgrade')) suggestions.push('💳 Go to Wallet to deposit first');
  if (lower.includes('book') || lower.includes('rent')) suggestions.push('🔍 Browse available equipment');
  return suggestions;
}

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

  // Show typing indicator briefly
  const typing = addTeffTyping();

  setTimeout(() => {
    removeTeffTyping(typing);

    // Try knowledge base first
    const reply = smartReply(msg);
    if (reply) {
      const suggestions = generateSuggestions(msg);
      let fullReply = reply;
      if (suggestions.length > 0) {
        fullReply += `<br><br><em style="opacity:0.6;font-size:0.78rem">💡 ${suggestions[0]}</em>`;
      }
      addTeffMsg(fullReply, 'bot');
      return;
    }

    // Default helpful response
    addTeffMsg(defaultResponse(msg), 'bot');
  }, 500 + Math.random() * 300); // Natural delay
};

function defaultResponse(msg) {
  const lower = msg.toLowerCase();

  // Detect questions
  if (lower.includes('how') || lower.includes('what') || lower.includes('when') || lower.includes('where') || lower.includes('why')) {
    return `Betam good question! 🤔<br><br>
I'm not sure about "<em>${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}</em>" specifically.<br><br>
Try asking about:<br>
📦 Equipment listing<br>
💳 Wallet & deposits<br>
💎 VIP plans<br>
💰 Earnings<br>
📞 Contact support<br><br>
Or contact us directly:<br>
📱 <strong>+251 993 920 750</strong><br>
📧 <strong>support0agriequip.et@gmail.com</strong>`;
  }

  return `Salam! 🌾 I understand you said: "<em>${msg.substring(0, 35)}${msg.length > 35 ? '...' : ''}</em>"<br><br>
Try tapping one of the quick buttons above, or contact our support team:<br>
📱 <strong>+251 993 920 750</strong><br>
📧 <strong>support0agriequip.et@gmail.com</strong><br><br>
We respond in under 2 hours! Eshi? 😊`;
}

window.clearTeffAI = function() {
  teffHistory = [];
  const msgs = document.getElementById('teffaiMessages');
  if (msgs) {
    msgs.innerHTML = '<div class="bot-msg"><div class="bot-bubble">Chat cleared! Salam! How can I help you today? 😊🌾</div></div>';
  }
};

function addTeffMsg(text, type) {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.style.animation = 'fadeUp 0.35s ease';
  div.innerHTML = `<div class="${type === 'user' ? 'user-bubble' : 'bot-bubble'}">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTeffTyping() {
  const msgs = document.getElementById('teffaiMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'bot-msg typing-indicator';
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
