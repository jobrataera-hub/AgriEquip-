// AgriEquip — app.js — single clean module
// Exposes all functions to window._app so bridge in HTML can reach them

import { auth, db } from '../firebase.js?v=2';
import {
  onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
  addDoc, query, where, orderBy, getDocs, serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
// ^ EDIT 1: added deleteDoc to imports

// ─── Constants ────────────────────────────────────────────
const NAV = [
  { id:'home',      icon:'🏠',  label:'Home' },
  { id:'browse',    icon:'🔍',  label:'Browse Equipment' },
  { id:'listings',  icon:'📦',  label:'My Listings' },
  { id:'bookings',  icon:'📅',  label:'My Bookings' },
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

const ACADEMY_LESSONS = [
  { id:0,  cat:'crop', emoji:'🌾', title:'Introduction to Teff Farming', pts:40, desc:'Planting, care, and harvest basics for Ethiopia\'s staple crop.' },
  { id:1,  cat:'crop', emoji:'🌾', title:'Wheat Farming Guide', pts:35, desc:'Highland wheat cultivation from seed to harvest.' },
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

// ─── Lesson content — PASTE HERE ──────────────────────────

 const LESSON_CONTENT = {
  0: `Teff (Eragrostis tef) is Ethiopia's most important staple crop, used to make injera. It thrives in a wide range of altitudes, from lowlands to highlands above 2,800m, making it one of the m[...]

Planting: Teff is typically sown at the start of the main rainy season (Meher), from June to July, though some regions also grow a smaller Belg-season crop. Seeds are broadcast rather than row-pl[...]

Soil and water: Teff tolerates poor soils better than most cereals, but yields best in well-drained loam. Waterlogging in the early weeks is one of the most common causes of crop failure, so avoi[...]

Weeding: Because teff seedlings are thin and low to the ground early on, weed competition can sharply cut yield. Most farmers weed twice: once around 20 days after planting and again before the c[...]

Harvest: Teff is ready for harvest 2–6 months after planting depending on variety and altitude, when the plant turns golden-yellow and grains feel firm. Cut, dry in the field for a few days, th[...]

Storage tip: Dry the grain thoroughly before storage — teff stored above 12% moisture is prone to mold, which can ruin an entire harvest within weeks.`,

  1: `Wheat is Ethiopia's second most important cereal crop and the primary grain for bread, pasta, and local foods like ambasha. Ethiopia is one of Africa's top wheat producers, with major growi[...]

Varieties: Choose certified varieties suited to your altitude. Kakaba and Danda'a are popular improved varieties for mid-highlands. Ask your local agricultural extension office for the most recom[...]

Land preparation: Prepare land thoroughly with 2–3 ploughings before planting. Break clods well and level the seedbed so water drains evenly. Wheat does poorly in compacted or waterlogged soil.

Planting: Sow wheat in rows 20cm apart, 3–4cm deep, at a seed rate of 100–150 kg per hectare. Row planting gives better yields and easier weeding than broadcasting. Plant at the start of the [...]

Fertilizer: Apply DAP (100 kg/ha) at planting to supply phosphorus. Apply Urea (100 kg/ha) as a top-dressing 30–40 days after planting when the crop is actively growing. Always apply fertilizer[...]

Weeding: Weed twice — at 3 weeks and 6 weeks after germination. Weeds in wheat fields can reduce yield by 40% if not controlled.

Disease watch: Wheat rust (yellow, stem, and leaf rust) is the biggest threat to Ethiopian wheat. If you see orange or yellow powder on leaves, report immediately to your extension agent and spra[...]

Harvest: Wheat matures 90–120 days after planting. Harvest when 90% of the grain is golden and the straw is dry. Thresh promptly to prevent losses from birds and rain damage.`,

  2: `Maize (corn) is Ethiopia's highest-yielding cereal and a key food security crop, especially in western, southern, and central regions including Oromia, SNNPR, and Amhara.

Seasons: In Ethiopia, maize is grown in two seasons. The main Meher season runs June–July planting with October–November harvest. The Belg season (March–April planting) is shorter and suits lowe[...]

Land and spacing: Maize needs deep, fertile, well-drained soil. Plant in rows 75cm apart, with 25–30cm between plants within the row. This gives roughly 40,000–50,000 plants per hectare, whic[...]

Seed: Use certified hybrid or improved open-pollinated varieties such as BH-660, BHQPY-545, or Limu. These yield 3–5 times more than local varieties under good management. Never re-plant seeds from [...]

Fertilizer: Apply DAP (100 kg/ha) at planting in the planting hole. Apply Urea (100 kg/ha) when the plant is knee-high (about 4–6 weeks) as side-dressing, 5cm from the stem. Cover with soil to preve[...]

Weeding: Weed at 2 weeks and 5 weeks after emergence. Maize is highly sensitive to weeds in the first 6 weeks — competition during this time can cut yield in half.

Water: Maize needs consistent moisture, especially during tasselling and grain-fill (60–80 days after planting). Drought stress at this stage causes poor kernel development and low yield.

Harvest: Harvest when the husks are dry and the grain is hard. Delay causes bird and rodent losses. Dry grain to below 13% moisture before storage in bags or metal silos.`,

  3: `Coffee (Coffea arabica) originated in Ethiopia and remains the country's most important export crop, contributing over 30% of export revenue. Growing regions include Kaffa, Jimma, Sidama, Y[...]

Types of coffee farming: Forest coffee grows wild under natural shade. Garden coffee is grown around homesteads. Semi-forest coffee is managed in natural forests. Plantation coffee is grown on large f[...]

Planting: Coffee seedlings are started in nurseries and transplanted when 30–40cm tall, usually at the onset of rains in June–July. Space trees 2.5–3 meters apart in rows. Plant in pits 60x60x60[...]

Shade management: Coffee thrives under shade — traditionally from Cordia africana, Albizia, or Erythrina trees. Shade reduces temperature stress, keeps moisture longer, and improves cup quality. Aim[...]

Pruning: Prune dead, diseased, and crossing branches after the main harvest each year. Remove suckers that sprout from the base to direct the tree's energy into fruiting branches. Well-pruned trees yi[...]

Fertilizer: Apply compost at the base of each tree every year. Supplement with DAP and Urea according to soil test results. Coffee responds well to organic matter — prioritize compost from farm wast[...]

Harvest: Coffee cherries are ready when fully red. Green or yellow cherries have not developed full flavor. Selectively pick only red cherries — stripping all cherries together reduces quality and f[...]

Processing: Wet-processed (washed) coffee commands premium prices. Remove the pulp within 24 hours of picking using a pulping machine, ferment for 36–72 hours, wash thoroughly, and dry on raised bed[...]

Storage: Store dry parchment coffee in clean, dry, ventilated bags. Avoid mixing with other crops or storing near chemicals.`,

  4: `Sesame (Sesamum indicum) is one of Ethiopia's most valuable export crops, with major production in Tigray, Amhara (particularly Humera and Metema), Benishangul-Gumuz, and parts of Oromia. Ethiop[...]

Why sesame: Sesame is drought-tolerant, grows on marginal soils, and brings good market prices — particularly white sesame for the international market. It requires less water than most cereals and [...]

Land preparation: Sesame needs well-drained, sandy-loam to clay-loam soils. Avoid heavy clay or waterlogged fields — sesame roots rot quickly in standing water. Plough 2–3 times to create a fine,[...]

Planting: Plant at the start of the rainy season (June–July in most areas). Broadcast or row-plant at 2–3 kg seed per hectare. Row planting at 40cm row spacing with 10cm between plants gives bette[...]

Fertilizer: Sesame has moderate fertilizer needs. Apply DAP at 50 kg/ha at planting. Avoid excess nitrogen — it promotes leafy growth at the expense of seeds.

Weeding: Weed twice in the first 6 weeks. After canopy closure, sesame shades out most weeds. Early weed control is critical — sesame seedlings are slow to establish and easily outcompeted.

Harvest timing: This is the most critical part of sesame production. Harvest when the lower capsules begin to turn yellow and before the top capsules are fully dry — if you wait too long, capsules b[...]

Post-harvest: Bundle cut plants and stand upright in the field to dry for 5–7 days. Then thresh by beating bundles against a clean surface or tarpaulin. Clean and dry seed to below 6% moisture for e[...]

  5: `Vegetable farming offers Ethiopian smallholders the opportunity to earn income year-round, especially in peri-urban areas and irrigated lowlands. Key vegetables grown include tomato, onion, cabb[...]

Market selection: Before planting, know your market. Onions and tomatoes have high demand but also high supply — price drops at peak harvest. Consider growing less common but high-value crops like b[...]

Soil: Vegetables need rich, well-drained soil with plenty of organic matter. Add compost or well-rotted manure before planting — aim for 2–5 kg per square meter. Never use fresh manure as it burns[...]

Irrigation: Most vegetables need consistent, regular watering — drought stress during flowering or fruit development reduces yield sharply. Drip irrigation is most efficient, but furrow irrigation i[...]

Onion production: Onions are Ethiopia's most profitable vegetable export. Start from seedlings in nurseries. Transplant at 4–6 weeks. Space 10x20cm. Reduce irrigation 2 weeks before harvest to impro[...]

Tomato production: Tomatoes are highly profitable but disease-prone. Use stakes or cages to keep plants off the ground. Remove suckers regularly. Watch for early blight, late blight, and bacterial wil[...]

Pest management: Common vegetable pests include aphids, whitefly, thrips, and caterpillars. Inspect crops every 2–3 days. Use yellow sticky traps, neem-based sprays, and remove infested leaves. Pest[...]

  6: `Fruit trees offer Ethiopian farmers a long-term income source. Once established, a well-managed fruit orchard can produce for 20–50 years. Common fruits grown in Ethiopia include mango, avocad[...]

Site selection: Most fruit trees need deep, well-drained soil and 6+ hours of direct sunlight. Avocado and banana need higher rainfall or irrigation. Mango tolerates dry conditions once established. A[...]

Planting pit preparation: Dig pits 60x60x60cm (or larger for mango/avocado). Fill with a mixture of topsoil and 20kg compost. Allow to settle for 2 weeks before transplanting. This gives roots an exce[...]

Spacing: Mango: 8–10m apart. Avocado: 6–8m. Banana: 2–3m. Papaya: 2–3m. Citrus: 5–6m. Guava: 5m. Proper spacing ensures sunlight penetration and air circulation, reducing disease.

Establishment care: Water young trees every 2–3 days in dry weather for the first 2 years. Mulch around the base with dry grass or straw to retain moisture and reduce weeds. Protect from browsing an[...]

Pruning: Prune fruit trees annually after harvest. Remove dead, diseased, crossing, and downward-growing branches. For mango, open up the center to allow light in. For banana, keep only 1 main stem an[...]

Fertilizer: Apply compost annually at the drip line (edge of canopy). Supplement with DAP and Urea in the growing season according to tree age and soil test. Fruit trees respond strongly to potassium [...]

Harvest and post-harvest: Harvest at the right maturity — most fruits for local market are picked ripe; for distant markets, harvest slightly before full ripeness to survive transport. Store in cool[...]

  7: `Greenhouse farming — also called protected agriculture — is growing rapidly in Ethiopia, particularly around Addis Ababa and in export-oriented farms. A greenhouse controls temperature, humi[...]

Types of greenhouses: Low-cost plastic tunnels (100,000–500,000 ETB range) are most accessible for smallholders. Net houses are cheaper and suitable for insect exclusion without full climate co[...]

Key benefits: Year-round production regardless of rain or dry season. Protection from hail, heavy rain, and insects. Higher yields — 3–5x more than open-field in the same area. Premium prices for [...]

Ventilation: The most common greenhouse mistake is poor ventilation, which causes overheating and fungal disease. Open sides and ridge vents daily in morning, close before evening cold. Aim to keep te[...]

Irrigation: Drip irrigation is standard in greenhouses. It delivers water directly to roots, keeps foliage dry (reducing disease), and uses 40–60% less water than furrow irrigation. Check drippers d[...]

Growing media: Greenhouse crops can be grown in soil, or in soilless media (substrate culture using coco peat, perlite, or pumice). Soilless systems give highest yields and reduce soil-borne disease, [...]

Pest and disease in greenhouses: The enclosed environment can allow pests like whitefly, spider mite, and thrips to build up rapidly. Install sticky traps, introduce biological control agents (predato[...]

Economics: A well-managed 500m² greenhouse growing tomatoes can yield 15,000–25,000 kg per year and generate significant profit. Calculate your break-even point before investing — factor in struc[...]

  8: `Tractors are the most important piece of machinery on a modern Ethiopian farm. Proper operation and maintenance dramatically extends tractor life and prevents costly breakdowns during the critic[...]

Before starting — daily checks: Never skip the pre-operation inspection. Check engine oil level (use dipstick — should be between MIN and MAX marks). Check coolant level in radiator — engine sho[...]

Starting procedure: Set parking brake. Put transmission in neutral. Turn key to ON — check that warning lights illuminate then go off. Start engine. Let idle for 2–3 minutes before working — thi[...]

Operating safely: Always use seat belt if fitted. Never allow passengers on the tractor unless a proper seat is provided. Keep PTO (power take-off) guards in place at all times. Be especially careful [...]

Gear selection: Use the lowest practical gear for heavy tillage work. Higher gears for lighter operations and transport. Forcing a tractor in too high a gear under heavy load damages the transmission.[...]

After operation: Let engine idle for 3–5 minutes before shutting off — allows turbocharger to cool. Park on flat ground. Apply parking brake. Remove key. Check for leaks under tractor while engine[...] ,

// ... (rest of file unchanged)

async function submitBookingRequest(equipmentId) {
  const overlay = document.getElementById('bookingModalOverlay');
  const msgEl   = document.getElementById('bookingMsg');
  const btn     = document.getElementById('submitBookingBtn');
  const start   = document.getElementById('bookStart').value;
  const end     = document.getElementById('bookEnd').value;
  const notes   = document.getElementById('bookMessage').value.trim();
  if (!start || !end) { flashMsg(msgEl,'⚠️ Choose start and end dates','#F59E0B'); return; }
  if (new Date(end) < new Date(start)) { flashMsg(msgEl,'⚠️ End date must be after start date','#F59E0B'); return; }
  const durationDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  const pricePerDay  = parseFloat(overlay.dataset.price) || 0;
  const ownerID      = overlay.dataset.ownerId;
  const equipmentName = overlay.dataset.equipName;
  if (ownerID === currentUser.uid) { flashMsg(msgEl,'⚠️ You can\'t book your own listing','#F59E0B'); return; }
  if (btn) btn.disabled = true;
  try {
    const totalAmount = durationDays * pricePerDay;
    // Commission is based on the OWNER's VIP tier — fetch their profile.
    let commissionRate = 0.10;
    try {
      const ownerSnap = await getDoc(doc(db,'users',ownerID));
      if (ownerSnap.exists()) commissionRate = commissionRateForVip(ownerSnap.data().vipLevel);
    } catch(e) { /* fall back to default 10% */ }
    const commission    = Math.round(totalAmount * commissionRate);
    const ownersEarning = totalAmount - commission;

    await addDoc(collection(db,'bookings'), {
      equipmentID: equipmentId,
      equipmentName,
      ownerID,
      renterID: currentUser.uid,
      renterEmail: currentUser.email,
      startDate: new Date(start),
      endDate: new Date(end),
      durationDays,
      pricePerDay,
      totalAmount,
      commissionRate,
      commission,
      ownersEarning,
      paymentStatus: 'unpaid',
      status: 'pending',
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    completeTask('first_booking_request', 20);
    flashMsg(msgEl, '✅ Booking request sent! The owner will respond soon.', '#22C55E');
    setTimeout(() => { closeBookingModal(); closeEquipmentDetail(); showSection('bookings'); }, 1500);
  } catch(e) {
    flashMsg(msgEl, '❌ Failed to send request: ' + (e.message || 'Try again.'), '#EF4444');
    throw e; // 👈 added to surface async errors to global handler
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ... (rest of file unchanged)

async function submitListing() {
  const name  = val('equipName');
  const cat   = val('equipCategory');
  const price = parseFloat(val('equipPrice'));
  const city  = val('equipLocation');
  const desc  = val('equipDesc');
  const msgEl = document.getElementById('listingMsg');
  const btn   = document.getElementById('submitListingBtn');
  if (!name)             { flashMsg(msgEl,'⚠️ Enter equipment name','#F59E0B'); return; }
  if (!price || price<=0){ flashMsg(msgEl,'⚠️ Enter a valid price','#F59E0B'); return; }
  if (!city)             { flashMsg(msgEl,'⚠️ Enter your city','#F59E0B'); return; }
  if (btn) { btn.disabled = true; }
  try {
    let images = [];
    if (selectedEquipFiles.length) {
      flashMsg(msgEl, `📤 Uploading ${selectedEquipFiles.length} photo${selectedEquipFiles.length>1?'s':''}...`, '#06B6D4');
      images = await uploadEquipmentImages(selectedEquipFiles, currentUser.uid);
    }
    await addDoc(collection(db,'equipment'), { ownerId:currentUser.uid, ownerEmail:currentUser.email, name, category:cat, description:desc||'', pricePerDay:price, location:{city}, images, availa[...]
    completeTask('list_equipment', 30);
    flashMsg(msgEl,'✅ Equipment listed! (+30 XP)','#22C55E');
    selectedEquipFiles = [];
    setTimeout(() => { toggleListingForm(); loadMyListings(); }, 1500);
  } catch(e) { 
    flashMsg(msgEl,'❌ Failed to list: ' + (e.message||'Try again.'),'#EF4444');
    throw e; // 👈 added so global ASYNC ERROR banner can capture the error
  } finally { if (btn) btn.disabled = false; }
}

// (No other changes)
