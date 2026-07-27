// AgriEquip — app.js — single clean module
// Exposes all functions to window._app so bridge in HTML can reach them

import { auth, db } from '../firebase.js';
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
  0: `Teff (Eragrostis tef) is Ethiopia's most important staple crop, used to make injera. It thrives in a wide range of altitudes, from lowlands to highlands above 2,800m, making it one of the most adaptable cereals grown in the country.

Planting: Teff is typically sown at the start of the main rainy season (Meher), from June to July, though some regions also grow a smaller Belg-season crop. Seeds are broadcast rather than row-planted, and because they are extremely small, a fine, well-prepared seedbed is essential — clumped or rocky soil leads to poor germination.

Soil and water: Teff tolerates poor soils better than most cereals, but yields best in well-drained loam. Waterlogging in the early weeks is one of the most common causes of crop failure, so avoid planting in low-lying fields that pool water after rain.

Weeding: Because teff seedlings are thin and low to the ground early on, weed competition can sharply cut yield. Most farmers weed twice: once around 20 days after planting and again before the crop closes canopy.

Harvest: Teff is ready for harvest 2–6 months after planting depending on variety and altitude, when the plant turns golden-yellow and grains feel firm. Cut, dry in the field for a few days, then thresh — traditionally by driving livestock over the stalks, though mechanical threshers are increasingly common.

Storage tip: Dry the grain thoroughly before storage — teff stored above 12% moisture is prone to mold, which can ruin an entire harvest within weeks.`,

  1: `Wheat is Ethiopia's second most important cereal crop and the primary grain for bread, pasta, and local foods like ambasha. Ethiopia is one of Africa's top wheat producers, with major growing areas in Arsi, Bale, Shewa, and the highlands of Tigray.

Varieties: Choose certified varieties suited to your altitude. Kakaba and Danda'a are popular improved varieties for mid-highlands. Ask your local agricultural extension office for the most recommended variety in your specific zone.

Land preparation: Prepare land thoroughly with 2–3 ploughings before planting. Break clods well and level the seedbed so water drains evenly. Wheat does poorly in compacted or waterlogged soil.

Planting: Sow wheat in rows 20cm apart, 3–4cm deep, at a seed rate of 100–150 kg per hectare. Row planting gives better yields and easier weeding than broadcasting. Plant at the start of the main rains — in most highlands, this is October for Belg or July for Meher.

Fertilizer: Apply DAP (100 kg/ha) at planting to supply phosphorus. Apply Urea (100 kg/ha) as a top-dressing 30–40 days after planting when the crop is actively growing. Always apply fertilizer to moist soil — never dry.

Weeding: Weed twice — at 3 weeks and 6 weeks after germination. Weeds in wheat fields can reduce yield by 40% if not controlled.

Disease watch: Wheat rust (yellow, stem, and leaf rust) is the biggest threat to Ethiopian wheat. If you see orange or yellow powder on leaves, report immediately to your extension agent and spray fungicide early.

Harvest: Wheat matures 90–120 days after planting. Harvest when 90% of the grain is golden and the straw is dry. Thresh promptly to prevent losses from birds and rain damage.`,

  2: `Maize (corn) is Ethiopia's highest-yielding cereal and a key food security crop, especially in western, southern, and central regions including Oromia, SNNPR, and Amhara.

Seasons: In Ethiopia, maize is grown in two seasons. The main Meher season runs June–July planting with October–November harvest. The Belg season (March–April planting) is shorter and suits lower altitudes.

Land and spacing: Maize needs deep, fertile, well-drained soil. Plant in rows 75cm apart, with 25–30cm between plants within the row. This gives roughly 40,000–50,000 plants per hectare, which most improved varieties need for maximum yield.

Seed: Use certified hybrid or improved open-pollinated varieties such as BH-660, BHQPY-545, or Limu. These yield 3–5 times more than local varieties under good management. Never re-plant seeds from hybrid maize — buy fresh certified seed each season.

Fertilizer: Apply DAP (100 kg/ha) at planting in the planting hole. Apply Urea (100 kg/ha) when the plant is knee-high (about 4–6 weeks) as side-dressing, 5cm from the stem. Cover with soil to prevent nitrogen loss.

Weeding: Weed at 2 weeks and 5 weeks after emergence. Maize is highly sensitive to weeds in the first 6 weeks — competition during this time can cut yield in half.

Water: Maize needs consistent moisture, especially during tasselling and grain-fill (60–80 days after planting). Drought stress at this stage causes poor kernel development and low yield.

Harvest: Harvest when the husks are dry and the grain is hard. Delay causes bird and rodent losses. Dry grain to below 13% moisture before storage in bags or metal silos.`,

  3: `Coffee (Coffea arabica) originated in Ethiopia and remains the country's most important export crop, contributing over 30% of export revenue. Growing regions include Kaffa, Jimma, Sidama, Yirgacheffe, and Harrar — each producing distinct flavor profiles.

Types of coffee farming: Forest coffee grows wild under natural shade. Garden coffee is grown around homesteads. Semi-forest coffee is managed in natural forests. Plantation coffee is grown on large farms. Most smallholders in Ethiopia practice garden or semi-forest coffee farming.

Planting: Coffee seedlings are started in nurseries and transplanted when 30–40cm tall, usually at the onset of rains in June–July. Space trees 2.5–3 meters apart in rows. Plant in pits 60x60x60cm filled with compost and topsoil.

Shade management: Coffee thrives under shade — traditionally from Cordia africana, Albizia, or Erythrina trees. Shade reduces temperature stress, keeps moisture longer, and improves cup quality. Aim for 30–50% shade cover.

Pruning: Prune dead, diseased, and crossing branches after the main harvest each year. Remove suckers that sprout from the base to direct the tree's energy into fruiting branches. Well-pruned trees yield more and are easier to harvest.

Fertilizer: Apply compost at the base of each tree every year. Supplement with DAP and Urea according to soil test results. Coffee responds well to organic matter — prioritize compost from farm waste and coffee pulp.

Harvest: Coffee cherries are ready when fully red. Green or yellow cherries have not developed full flavor. Selectively pick only red cherries — stripping all cherries together reduces quality and fetches lower prices.

Processing: Wet-processed (washed) coffee commands premium prices. Remove the pulp within 24 hours of picking using a pulping machine, ferment for 36–72 hours, wash thoroughly, and dry on raised beds for 10–15 days.

Storage: Store dry parchment coffee in clean, dry, ventilated bags. Avoid mixing with other crops or storing near chemicals.`,

  4: `Sesame (Sesamum indicum) is one of Ethiopia's most valuable export crops, with major production in Tigray, Amhara (particularly Humera and Metema), Benishangul-Gumuz, and parts of Oromia. Ethiopia is among the world's top sesame exporters.

Why sesame: Sesame is drought-tolerant, grows on marginal soils, and brings good market prices — particularly white sesame for the international market. It requires less water than most cereals and can be a profitable cash crop on land not suitable for teff or maize.

Land preparation: Sesame needs well-drained, sandy-loam to clay-loam soils. Avoid heavy clay or waterlogged fields — sesame roots rot quickly in standing water. Plough 2–3 times to create a fine, weed-free seedbed.

Planting: Plant at the start of the rainy season (June–July in most areas). Broadcast or row-plant at 2–3 kg seed per hectare. Row planting at 40cm row spacing with 10cm between plants gives better results. Mix seed with sand for more even distribution when broadcasting.

Fertilizer: Sesame has moderate fertilizer needs. Apply DAP at 50 kg/ha at planting. Avoid excess nitrogen — it promotes leafy growth at the expense of seeds.

Weeding: Weed twice in the first 6 weeks. After canopy closure, sesame shades out most weeds. Early weed control is critical — sesame seedlings are slow to establish and easily outcompeted.

Harvest timing: This is the most critical part of sesame production. Harvest when the lower capsules begin to turn yellow and before the top capsules are fully dry — if you wait too long, capsules burst open and seeds shatter on the ground, causing 30–50% yield loss. Cut plants early morning when capsules are less likely to open.

Post-harvest: Bundle cut plants and stand upright in the field to dry for 5–7 days. Then thresh by beating bundles against a clean surface or tarpaulin. Clean and dry seed to below 6% moisture for export quality.`,

  5: `Vegetable farming offers Ethiopian smallholders the opportunity to earn income year-round, especially in peri-urban areas and irrigated lowlands. Key vegetables grown include tomato, onion, cabbage, pepper, potato, carrot, kale, and garlic.

Market selection: Before planting, know your market. Onions and tomatoes have high demand but also high supply — price drops at peak harvest. Consider growing less common but high-value crops like bell pepper, broccoli, or fresh herbs if you have urban market access.

Soil: Vegetables need rich, well-drained soil with plenty of organic matter. Add compost or well-rotted manure before planting — aim for 2–5 kg per square meter. Never use fresh manure as it burns roots and spreads disease.

Irrigation: Most vegetables need consistent, regular watering — drought stress during flowering or fruit development reduces yield sharply. Drip irrigation is most efficient, but furrow irrigation is widely used. Water in the morning, not the evening, to reduce fungal disease.

Onion production: Onions are Ethiopia's most profitable vegetable export. Start from seedlings in nurseries. Transplant at 4–6 weeks. Space 10x20cm. Reduce irrigation 2 weeks before harvest to improve storability. Cure harvested onions in shade for 2–3 weeks before selling.

Tomato production: Tomatoes are highly profitable but disease-prone. Use stakes or cages to keep plants off the ground. Remove suckers regularly. Watch for early blight, late blight, and bacterial wilt — report symptoms to extension agents early. Harvest when fully colored for best price.

Pest management: Common vegetable pests include aphids, whitefly, thrips, and caterpillars. Inspect crops every 2–3 days. Use yellow sticky traps, neem-based sprays, and remove infested leaves. Pesticide should be last resort — observe pre-harvest intervals carefully.`,

  6: `Fruit trees offer Ethiopian farmers a long-term income source. Once established, a well-managed fruit orchard can produce for 20–50 years. Common fruits grown in Ethiopia include mango, avocado, banana, papaya, citrus (orange, lemon, lime), guava, and apple (in highlands).

Site selection: Most fruit trees need deep, well-drained soil and 6+ hours of direct sunlight. Avocado and banana need higher rainfall or irrigation. Mango tolerates dry conditions once established. Apple requires cold highland conditions — best above 2,000m altitude.

Planting pit preparation: Dig pits 60x60x60cm (or larger for mango/avocado). Fill with a mixture of topsoil and 20kg compost. Allow to settle for 2 weeks before transplanting. This gives roots an excellent start.

Spacing: Mango: 8–10m apart. Avocado: 6–8m. Banana: 2–3m. Papaya: 2–3m. Citrus: 5–6m. Guava: 5m. Proper spacing ensures sunlight penetration and air circulation, reducing disease.

Establishment care: Water young trees every 2–3 days in dry weather for the first 2 years. Mulch around the base with dry grass or straw to retain moisture and reduce weeds. Protect from browsing animals with fencing or thorny branches.

Pruning: Prune fruit trees annually after harvest. Remove dead, diseased, crossing, and downward-growing branches. For mango, open up the center to allow light in. For banana, keep only 1 main stem and 1–2 ratoon shoots at a time.

Fertilizer: Apply compost annually at the drip line (edge of canopy). Supplement with DAP and Urea in the growing season according to tree age and soil test. Fruit trees respond strongly to potassium — banana and mango especially.

Harvest and post-harvest: Harvest at the right maturity — most fruits for local market are picked ripe; for distant markets, harvest slightly before full ripeness to survive transport. Store in cool, shaded, ventilated conditions.`,

  7: `Greenhouse farming — also called protected agriculture — is growing rapidly in Ethiopia, particularly around Addis Ababa and in export-oriented farms. A greenhouse controls temperature, humidity, and pests, allowing year-round production of high-value crops like tomatoes, peppers, cucumbers, roses, and herbs.

Types of greenhouses: Low-cost plastic tunnels (100,000–500,000 ETB range) are most accessible for smallholders. Net houses are cheaper and suitable for insect exclusion without full climate control. Glass or polycarbonate structures are used by large commercial farms.

Key benefits: Year-round production regardless of rain or dry season. Protection from hail, heavy rain, and insects. Higher yields — 3–5x more than open-field in the same area. Premium prices for off-season produce.

Ventilation: The most common greenhouse mistake is poor ventilation, which causes overheating and fungal disease. Open sides and ridge vents daily in morning, close before evening cold. Aim to keep temperature below 32°C for most vegetables.

Irrigation: Drip irrigation is standard in greenhouses. It delivers water directly to roots, keeps foliage dry (reducing disease), and uses 40–60% less water than furrow irrigation. Check drippers daily for blockages.

Growing media: Greenhouse crops can be grown in soil, or in soilless media (substrate culture using coco peat, perlite, or pumice). Soilless systems give highest yields and reduce soil-borne disease, but require careful nutrient management through fertigation (fertilizer in irrigation water).

Pest and disease in greenhouses: The enclosed environment can allow pests like whitefly, spider mite, and thrips to build up rapidly. Install sticky traps, introduce biological control agents (predatory insects), and scout every 2 days. Fungal diseases spread fast in humid conditions — maintain good air flow.

Economics: A well-managed 500m² greenhouse growing tomatoes can yield 15,000–25,000 kg per year and generate significant profit. Calculate your break-even point before investing — factor in structure cost, labor, seeds, fertilizer, and marketing.`,

  8: `Tractors are the most important piece of machinery on a modern Ethiopian farm. Proper operation and maintenance dramatically extends tractor life and prevents costly breakdowns during the critical planting and harvest windows.

Before starting — daily checks: Never skip the pre-operation inspection. Check engine oil level (use dipstick — should be between MIN and MAX marks). Check coolant level in radiator — engine should be cold when you check. Check fuel level. Check tire pressure — under-inflated tires increase fuel use and cause uneven tillage. Check all fluid levels including hydraulic oil and transmission oil.

Starting procedure: Set parking brake. Put transmission in neutral. Turn key to ON — check that warning lights illuminate then go off. Start engine. Let idle for 2–3 minutes before working — this allows oil to circulate fully. Never rev a cold engine.

Operating safely: Always use seat belt if fitted. Never allow passengers on the tractor unless a proper seat is provided. Keep PTO (power take-off) guards in place at all times. Be especially careful on slopes — never turn sharply on a hillside. When hitching implements, never stand between the tractor and implement with engine running.

Gear selection: Use the lowest practical gear for heavy tillage work. Higher gears for lighter operations and transport. Forcing a tractor in too high a gear under heavy load damages the transmission. If the engine is straining, shift down.

After operation: Let engine idle for 3–5 minutes before shutting off — allows turbocharger to cool. Park on flat ground. Apply parking brake. Remove key. Check for leaks under tractor while engine is warm.

Maintenance schedule: Change engine oil every 250 hours or as specified in manual. Change fuel filter every 500 hours. Check and adjust valve clearances annually. Grease all grease points every 50 hours. Keep a log of all maintenance performed.`,

  9: `Combine harvesters dramatically reduce labor costs and harvest losses for wheat, barley, teff, and maize. In Ethiopia, combines are increasingly available for hire through cooperatives, private operators, and service providers like AgriEquip.

How a combine works: The combine cuts the standing crop (header), feeds it into the threshing cylinder which separates grain from straw, then cleans the grain through sieves and fans, collecting it in a grain tank while blowing straw out the back.

Header adjustment: Set cutting height just above ground level — cutting too low picks up soil and stones which damage the threshing cylinder. For lodged (fallen) crops, use a crop lifter attachment and cut at a slight angle to the direction of lodging.

Ground speed: Match speed to crop density and yield. In thick, high-yielding crops, slow down — overfeeding causes blockages. In thin crops, increase speed to maintain efficiency. Watch the grain loss monitor and grain sample quality continuously.

Cylinder and concave settings: Higher cylinder speed and wider concave gap for dry, brittle crops (wheat at harvest). Lower speed and tighter gap for moist or tough-strawed crops. Incorrect settings cause either incomplete threshing (grain stays in straw) or cracked grain.

Cleaning system: Adjust fan speed and sieve opening to crop conditions. Too much wind blows light grain out with chaff — a loss. Too little wind leaves chaff in the grain tank — poor quality. Check the grain sample from the tank every 30 minutes.

Grain tank management: Monitor grain tank level — an overfull tank causes blockages and spillage. Unload regularly into a truck or trailer running alongside the combine.

Maintenance during harvest: Daily grease all grease points. Check belts and chains for wear and tension. Remove crop residue from around the engine and radiator area — fire risk. Clean the radiator screen every few hours to prevent overheating.`,

  10: `Ploughing is the foundation of good crop production. Proper tillage prepares a seedbed that allows roots to penetrate, water to infiltrate, and weeds to be buried — all critical for achieving good yield.

Types of ploughing: Primary tillage (deep ploughing) breaks up and turns the soil to 20–30cm depth using a mouldboard or disc plough. Secondary tillage (harrowing) breaks clods and levels the surface to create a fine seedbed. Most Ethiopian crops need both operations.

Timing: Plough when soil moisture is right — not too wet (soil compacts and smears) and not too bone-dry (too hard, high fuel use). Ideal soil crumbles when squeezed and does not stick together in a ball. Plough as early as possible before the rains to allow time for secondary tillage.

Ploughing depth: For teff and other small-seeded crops: 15–20cm is sufficient. For maize, sorghum, and root crops: 25–30cm gives roots more room. Avoid over-tilling — excessive tillage destroys soil structure and increases erosion risk.

Contour ploughing: On sloping land, always plough along the contour (across the slope) — never up-and-down the hill. Contour ploughing dramatically reduces soil erosion and retains rainwater on the field rather than letting it run off.

Tractor-drawn plough settings: Set the front furrow wheel in the previous furrow. Adjust the top link to keep the plough level front-to-back. Set side draft to keep the tractor pulling straight. Adjust working depth with the depth wheel. Check that all mouldboards are turning soil cleanly.

Animal-drawn tillage: The traditional Ethiopian maresha is suited to light soils and small plots. Use 2–3 ploughings at different angles for best seedbed preparation. Cross-ploughing (second pass at 90°) breaks clods effectively.

After ploughing: Harrow or disc immediately after ploughing to prevent soil drying and clod formation. Apply any pre-plant fertilizer before the final harrowing and incorporate into the soil.`,

  11: `Mechanical seeders — from simple hand-pushed jab planters to tractor-drawn precision planters — give more uniform planting than broadcasting, saving seed and improving yields.

Why use a seeder: Broadcasting wastes seed, creates uneven plant populations, and makes weeding difficult. A seeder places seed at the right depth, right spacing, and right quantity — consistently. Maize planted with a precision planter can yield 30–50% more than broadcast or hand-placed seed.

Types of seeders: Jab planter (manual): Injects a single seed at correct depth per push. Good for maize, sorghum, sunflower. Row seeder (animal or tractor drawn): Plants multiple rows simultaneously. Suitable for wheat, barley, teff, sorghum. Precision planter (tractor drawn): Meters out exact seed spacing — used for maize, sunflower, sesame.

Calibration: Before planting, always calibrate the seeder. Fill the hopper with the actual seed you will plant (seed size and shape vary between varieties and affect metering). Drive 100 meters, collect and count seeds deposited. Calculate seeds per meter and compare with target plant population. Adjust metering wheel or gate accordingly.

Seed preparation: Use only clean, graded seed — broken, undersized, or damaged seeds jam the metering mechanism. Dress seed with appropriate fungicide treatment before loading into hopper. Do not use seed that has been treated with pesticides in food-grade containers.

Operating the seeder: Maintain consistent tractor speed — speed changes alter seed spacing. Check seed flow regularly — hoppers can jam, especially with small-seeded crops. Walk behind periodically to check seed is being placed, not just rolling along the surface.

Maintenance: Clean hoppers thoroughly after each use — old seed rots and blocks metering mechanisms. Oil all moving parts. Check for worn or bent metering fingers. Store covered to prevent rust.`,

  12: `Irrigation pumps are the heart of smallholder irrigation in Ethiopia, drawing water from rivers, boreholes, ponds, and canals to fields. Proper maintenance prevents breakdowns at the worst possible time — during the dry season when crops are fully dependent on irrigation.

Types of irrigation pumps: Centrifugal pumps are most common — driven by diesel engine or electric motor. Submersible pumps are placed directly in a borehole or water source. Hand pumps are used for small plots and domestic water. Know which type you have and follow its specific maintenance schedule.

Daily checks before operation: Check engine oil level (if diesel driven). Check fuel — never run dry as it can damage fuel pump. Check all connections and pipes for leaks. Prime the pump if it has been sitting — most centrifugal pumps need priming before they can draw water. Check that the suction pipe is submerged and strainer is not blocked.

Priming: A centrifugal pump cannot pump air — it must be filled with water before starting. Pour water through the priming plug on top of the pump casing until full. Block the outlet and start the engine. Once pressure builds and water flows, open the outlet.

Strainer maintenance: The strainer (foot valve) at the end of the suction pipe prevents debris entering the pump. Clean it weekly — a clogged strainer reduces flow and can burn out the pump. Lift the suction pipe and clean strainer in a bucket of water.

After each operation: Flush pump with clean water if pumping from muddy source. Release pressure before disconnecting pipes. Run engine at idle for 2 minutes before shutting off (for cooling). Store in shade — UV light degrades rubber seals and hoses.

Long-term maintenance: Change engine oil every 250 hours. Replace impeller seals annually or when water leaks from shaft. Check and replace fuel filter every 6 months. Keep spare seals, a spare V-belt, and spark plugs (for petrol engines) on hand.`,

  13: `Regular maintenance is the single most cost-effective investment you can make in your farm equipment. A tractor or implement that breaks down during harvest can cost you far more in lost crop than the price of regular servicing.

Why maintenance matters: Equipment failure during planting or harvest season can cause 10–20% crop losses through delayed operations. Well-maintained equipment uses 15–20% less fuel. Machines that are regularly serviced last 2–3 times longer.

Maintenance schedule framework:

DAILY (before each use): Check all fluid levels (engine oil, coolant, hydraulic oil, fuel). Check tire pressure. Grease all fittings. Visual inspection for leaks, loose bolts, and damage. Clean air filter pre-cleaner.

WEEKLY (every 50 hours of operation): Check battery terminals and electrolyte. Clean full air filter element. Check fan belt tension — should deflect 1–1.5cm under firm pressure. Check and clean fuel system pre-filter. Inspect all hoses and connections.

MONTHLY (every 250 hours): Change engine oil and filter. Check and adjust valve clearances (tractor engines). Inspect and adjust brakes. Check and adjust clutch free play. Lubricate all cables and linkages. Check wheel nut torque.

ANNUALLY (every 500–1000 hours): Full service including fuel injector test, injection pump calibration, timing check, cylinder compression test, and complete hydraulic system check. This should be done by a qualified mechanic.

Record keeping: Keep a simple logbook with date, hours on meter, work done, parts replaced, and fuel used for every machine. This helps identify problems early, tracks costs, and proves service history if you sell the machine.

Common mistakes: Using the wrong grade of engine oil. Ignoring small leaks until they become big problems. Skipping oil changes to save money — this is false economy. Not cleaning the air filter in dusty conditions — a blocked filter can damage an engine within hours.`,

  14: `Fuel is one of the largest operating costs in mechanized farming. Simple operational practices and good equipment maintenance can reduce fuel consumption by 20–30% without reducing work output.

Understanding fuel use: A tractor uses fuel proportional to the load placed on the engine. Overloading (too-large implement, too-deep tillage in hard soil) causes high fuel use and slow work. Underloading (too-small implement for tractor size) wastes capacity. Matching implement size to tractor power is the most important fuel economy decision.

Tire inflation: Under-inflated tires dramatically increase rolling resistance and fuel consumption. For field work, use the correct inflation pressure for the load — many tractors use lower field pressure (0.8–1.2 bar) and higher road pressure (1.4–1.8 bar). Check and inflate daily.

Engine tune-up: A well-tuned engine burns fuel completely and efficiently. Black smoke from the exhaust means incomplete combustion — wasted fuel. Have injectors tested and cleaned annually. Replace fuel filters on schedule. A clean air filter allows proper air-fuel ratio.

Gear selection: Use the highest gear that allows the engine to pull comfortably without lugging (struggling). The correct approach in most modern tractors is: select a gear where the engine runs at 75–80% of rated speed under load. This is called "shift-up, throttle-back" — higher gear, lower RPM = less fuel.

Transport on roads: Raise implements fully for road travel. Reduce ballast weight when transporting between fields — extra weight means more fuel. Plan work schedules to reduce empty travel.

PTO-driven equipment: PTO (power take-off) driven implements like threshers and balers are most efficient when operating at the rated PTO speed (540 or 1000 RPM). Operating significantly above or below this wastes fuel and causes wear.

Fuel storage: Store diesel in clean, sealed containers away from direct sun. Water contamination in fuel causes injector damage. Drain water from fuel tank drain plug monthly. Use fuel within 6 months — old diesel degrades and causes injector problems.`,

  15: `Farm machinery causes thousands of injuries each year across Africa — most of which are entirely preventable. Following basic safety procedures protects you, your workers, and your family.

The most dangerous moments:

1. PTO (Power Take-Off) entanglement: The rotating PTO shaft can catch loose clothing in a fraction of a second, causing severe injury or death. ALWAYS keep the PTO shield (guard) in place. NEVER step over a rotating PTO. ALWAYS turn off the engine before connecting or disconnecting PTO-driven implements.

2. Getting on and off moving machinery: NEVER jump on or off a moving tractor. Always bring the machine to a complete stop. Use the steps and handles provided.

3. Hydraulic systems: Hydraulic oil under high pressure can inject through skin and cause serious injury. NEVER use bare hands to find hydraulic leaks — use cardboard. Before working under a raised implement, always lower it to the ground or use a safety prop.

4. Overturning on slopes: Tractors turn over quickly on hillsides. NEVER make sharp turns on slopes. Keep your speed slow on uneven ground. Never turn at the top or bottom of a slope. Always drive up and down slopes, never across steep hillsides.

5. Bystanders and children: Keep all bystanders, especially children, well away from operating machinery. Children should never ride on tractors unless a proper seat with restraint is fitted. Post a lookout when reversing.

6. Harvesting machinery: Keep hands and feet well away from rotating cutters, chains, and augers. Stop all moving parts before clearing blockages. Use a stick, never your hand, to clear jams.

Personal protective equipment: Wear safety boots, not sandals, around machinery. Use hearing protection near loud engines. Wear goggles when using angle grinders or handling chemicals.

Fire prevention: Keep a fire extinguisher on every tractor and combine. Clear dry crop residue from engine and exhaust areas regularly — this is a major cause of harvest fires.`,

  16: `Precision agriculture uses technology and data to apply the right input (seed, water, fertilizer) at the right place, in the right amount, at the right time. While high-tech precision agriculture (GPS, drones, sensors) is still developing in Ethiopia, the principles can be applied with simple tools.

The core idea: Instead of treating your entire farm the same way, precision agriculture recognizes that different parts of your field have different soil conditions, water availability, and yield potential. By managing these zones differently, you can increase average yield while reducing input costs.

Simple precision agriculture steps for Ethiopian smallholders:

Step 1 — Map your field: Walk your field and note where yields have been high or low in past seasons. Note where water pools, where soil is sandy or clay-heavy, where slopes face different directions. Draw a simple sketch.

Step 2 — Soil testing by zone: Take separate soil samples from different zones in your field (high-yield area, low-yield area, waterlogged area). Have each sample tested separately at an agricultural research station or private lab. Results will show different nutrient levels requiring different fertilizer rates.

Step 3 — Variable fertilizer application: Apply more DAP and Urea to high-potential zones where returns are greatest. Apply lime (if acidic) to zones where pH is low. Reduce inputs on chronically low-yield zones that may need different crops or drainage investment.

Step 4 — Yield monitoring: After harvest, weigh crop from different parts of the field separately. Keep records year by year. Patterns reveal which management changes are working.

Technology: Basic smartphone apps can help — GPS mapping apps (like Google Maps) to measure field size and mark zones. Weather apps for planning. AgriEquip and similar platforms for equipment access. Simple digital scales for yield monitoring.

The discipline of observing, recording, and responding to field data is the foundation of precision agriculture regardless of the technology level.`,

  17: `Healthy soil is the foundation of productive farming. In Ethiopia, much farmland has suffered from decades of intensive cultivation, erosion, and limited organic matter return — leading to declining yields even with the same fertilizer amounts.

Understanding soil pH: pH measures soil acidity or alkalinity on a scale of 0–14. Most crops grow best between pH 5.5–7.0. Ethiopian highland soils are often acidic (pH 4.5–5.5) due to rainfall leaching nutrients and leaving aluminum and hydrogen, which are toxic to roots at low pH. Acidic soils reduce fertilizer effectiveness significantly — even correct fertilizer amounts give poor response if pH is too low.

Lime application: Agricultural lime (calcium carbonate) raises soil pH in acidic soils. Apply 1–3 tons per hectare depending on pH test result and soil type. Incorporate into soil by ploughing. It takes 3–6 months to fully react, so apply before the planting season. The effect lasts 3–5 years. This single intervention can increase crop yield by 30–50% in acidic areas.

Soil organic matter: Organic matter improves soil structure, water-holding capacity, and nutrient supply. Ethiopian farmland typically has 1–2% organic matter — healthy soil should have 3–5%. Build organic matter by: returning crop residue to fields rather than burning, composting kitchen and animal waste, applying manure, and growing legumes as rotation crops.

Compost making: A basic compost pile uses crop residue, animal manure, kitchen waste, and a small amount of soil layered together. Keep moist but not wet. Turn every 2–3 weeks. Ready in 2–3 months when dark, crumbly, and earthy-smelling. Apply 2–5 tons per hectare before planting.

Fertilizer fundamentals: DAP (Diammonium Phosphate — 18% N, 46% P) supplies nitrogen and phosphorus at planting. Urea (46% N) supplies nitrogen for vegetative growth, applied 4–6 weeks after planting. Rates depend on crop, yield target, and soil test. Never guess — a soil test costs 200–500 ETB and can save thousands in misused fertilizer.

Signs of nutrient deficiency: Nitrogen — yellowing of older leaves, stunted growth. Phosphorus — purple/red tint on leaves, poor root development. Potassium — brown leaf edges. Iron/zinc — yellowing of young leaves while veins stay green (in high-pH soils).`,

  18: `Water is the most limiting factor for crop production in Ethiopia's dry seasons and drought-prone areas. Efficient irrigation can double or triple the productivity of available water resources.

Water-use efficiency defined: Crop water productivity measures how much yield you get per liter of water used. Drip irrigation can produce the same yield as furrow irrigation using 40–60% less water. This means more area can be irrigated from the same water source.

Furrow irrigation (most common in Ethiopia): Water flows down channels between crop rows. Efficiency is typically 40–60% — 40–60% of applied water actually reaches plant roots; the rest is lost to evaporation, runoff, and deep percolation. Improvements: shorten furrow length to reduce runoff at the end, use gentle slope, irrigate when soil is just dry (not after every rain).

Drip irrigation: Water delivered directly to root zone through emitters on surface or subsurface pipes. Efficiency 85–95%. Benefits: lower disease (foliage stays dry), less weeds (only the root zone is wetted), less labor after installation. Increasingly affordable for smallholders — a simple 500m² system can cost 15,000–40,000 ETB. Highly recommended for vegetables and fruit trees.

Sprinkler irrigation: Water sprayed over the crop. Efficiency 70–80%. Good for field crops on gentle slopes. Risk of fungal disease if leaves stay wet overnight — irrigate in morning so foliage dries during the day.

Irrigation scheduling: The biggest water waste is irrigating too often or too much. Irrigate based on crop need, not habit. Check soil moisture by feeling soil 10–15cm deep — if it forms a ball when squeezed, no irrigation needed yet. If it crumbles and falls apart, irrigate. Many crops have critical periods (flowering, grain fill) where water stress causes the most yield loss — prioritize water at these times.

Water harvesting: Collect rainwater in farm ponds, check dams, and half-moon catchments for use in dry spells. A simple farm pond of 500m³ capacity can irrigate 0.5 hectare of vegetables during the dry season.`,

  19: `Pests — insects, rodents, birds, and nematodes — cause 20–40% of crop losses in Ethiopia annually. Integrated pest management (IPM) uses multiple strategies to control pests economically and with minimum environmental impact.

The IPM approach: Rather than automatically spraying pesticide on a schedule, IPM starts with prevention, then uses biological and cultural controls, and only applies chemical pesticides when pest numbers exceed the economic threshold (when damage cost exceeds control cost).

Scouting: The foundation of IPM is regular crop inspection. Walk your field every 3–5 days. Look under leaves, at growing points, and on stems. Count pest numbers per plant and compare to action thresholds. Keep records — knowing when and where pests appear helps predict future outbreaks.

Cultural controls: Crop rotation breaks pest cycles — pests that specialize in one crop cannot survive when a different crop is grown. Early planting avoids peak pest periods. Resistant varieties tolerate or repel specific pests. Proper plant spacing improves air circulation and reduces fungal pest conditions.

Biological control: Natural enemies — parasitic wasps, predatory beetles, and spiders — kill many crop pests. Protect natural enemies by avoiding broad-spectrum insecticide sprays when pests are below threshold. Some biological control agents can be purchased and released — ask your extension agent what is available in your area.

Common Ethiopian crop pests:
- Stemborer (maize, sorghum): Larvae bore into stems causing dead heart. Use Bacillus thuringiensis (Bt) spray early when larvae are small.
- Aphids (vegetables, wheat): Cluster on shoots. Natural enemies usually control them. Spray insecticidal soap or neem extract if numbers are very high.
- Fall armyworm (maize): Check whorl for frass (droppings). Spray into whorl with recommended insecticide when found.
- Desert locust: Report immediately to agricultural authorities — locust control is organized at regional level.
- Rodents: Use snap traps in fields and stores. Keep storage clean and sealed.

Pesticide safety: Read the label before every use. Wear gloves, mask, and goggles. Never eat, drink, or smoke while handling pesticides. Observe the pre-harvest interval (days between last spray and harvest). Dispose of empty containers safely — never burn or reuse.`,

  20: `Plant diseases caused by fungi, bacteria, viruses, and nematodes can devastate crops quickly. Early detection and prevention are far more effective and cheaper than trying to control disease after it has spread.

The disease triangle: Disease only occurs when three conditions are present simultaneously: a susceptible crop variety, a disease-causing pathogen, and favorable environmental conditions (humidity, temperature). Remove any one of these and disease cannot develop. This is the basis of prevention.

Key prevention strategies:

1. Use certified, disease-free seed: Many diseases are seed-borne and spread from infected seed. Buying certified seed from reputable sources eliminates this entry point. Treat seed with recommended fungicide before planting for additional protection.

2. Crop rotation: Many pathogens survive in soil or on crop debris. Rotating to a non-host crop breaks the disease cycle. Never grow the same crop in the same field in consecutive seasons if you have had disease problems.

3. Resistant varieties: Plant breeding has produced varieties resistant to major diseases. Ethiopian farmers now have access to rust-resistant wheat, wilt-resistant tomatoes, and blight-resistant potato varieties. Use them.

4. Field hygiene: Remove and burn (do not compost) diseased plant material. Clean equipment between fields to avoid moving soil-borne pathogens. Don't walk from a diseased area to a healthy one without washing boots.

5. Optimum plant density: Overcrowding creates humidity and reduces air flow — ideal conditions for fungal disease. Follow recommended plant spacings. Prune lower leaves of tomato, coffee, and vegetables to improve air circulation.

Major Ethiopian crop diseases:
- Wheat rust (yellow, stem, leaf): Orange/yellow powder on leaves. Highly contagious. Report immediately. Spray triazole fungicide early.
- Coffee wilt (Gibberella xylarioides): Sudden wilting, brown discoloration inside stem. Remove and burn affected trees. No chemical cure — use resistant varieties.
- Maize lethal necrosis: Yellowing, death of plant. Spread by insects and through infected seed. Use certified seed, control thrips vectors.
- Tomato late blight: Brown water-soaked patches on leaves and fruit. Spray mancozeb or copper-based fungicide preventatively in rainy season.
- Banana Xanthomonas wilt: Yellow wilting, bacterial ooze in stem. Remove entire plant including mat. No chemical control.`,

  21: `Climate change is making Ethiopian farming more challenging. Rainfall is becoming less predictable, droughts are more frequent, and extreme weather events are increasing. Climate-smart agriculture adapts to these changes while also reducing greenhouse gas emissions.

Understanding climate impacts on your farm: Longer dry spells reduce soil moisture at critical crop stages. Heavier but shorter rains cause more surface runoff and soil erosion. Higher temperatures increase water evaporation and crop water demand. Unpredictable season onset makes planting timing decisions harder.

Adaptation strategies:

1. Drought-tolerant varieties: Use improved varieties selected for drought tolerance. Teff is naturally drought-tolerant once established. Drought-tolerant maize varieties (DT maize) can yield 20–30% more than standard varieties in dry years.

2. Soil water conservation: Every liter of rainwater you keep in your soil is water you don't need to irrigate later. Mulching with crop residue, compost, or dry grass reduces evaporation by 30–50%. Tied ridges (blocking the furrow at intervals) prevent runoff and harvest rainwater in the field.

3. Diversify crops: Grow several crops rather than depending on one. If drought or pest hits one crop, others may survive. Intercropping maize with beans, or teff with pulses, spreads risk and improves soil health.

4. Adjust planting calendar: Monitor seasonal forecasts from Ethiopia's National Meteorological Institute. Delay planting if early rains fail — planting too early in failed rains wastes seed. Use short-season varieties that can be planted later and still mature before season end.

5. Agroforestry: Integrate trees with crops and livestock. Trees provide shade reducing temperature stress, roots prevent erosion, falling leaves add organic matter, and trees can produce fruit or timber as additional income. Moringa, Faidherbia albida, and fruit trees are compatible with Ethiopian crop systems.

6. Soil carbon building: Increasing soil organic matter through compost, crop residue management, and reduced tillage helps soil absorb more water and releases it more slowly to plants — a natural drought buffer.

Climate information: Access weather forecasts and seasonal outlooks through Ethiopia's National Meteorological Institute (NMA), local radio agricultural programs, and the Teff AI assistant on AgriEquip.`,

  22: `Dairy farming is one of the most reliable income sources for Ethiopian smallholders — cows produce milk every day regardless of season. Ethiopia has the largest cattle population in Africa, yet milk production per animal is very low due to poor nutrition, breed, and management.

Dairy breeds: Local Zebu cattle are heat-tolerant and disease-resistant but produce only 1–3 liters/day. Crossbred cattle (Zebu x Holstein, or Zebu x Jersey) produce 8–15 liters/day under good feeding. Pure exotic breeds (Holstein, Friesian) produce 20–30+ liters but need intensive care and nutrition. Start with crossbreds — they balance productivity with manageability.

Housing: Dairy cows need shelter from rain, cold nights, and direct sun. A simple open-sided shed with a raised concrete or compacted earth floor that drains well is sufficient. Keep the shed clean — manure accumulation causes mastitis (udder infection) and hoof problems.

Nutrition: This is the most important factor in milk production. A high-producing dairy cow needs 50–70 kg fresh forage daily plus 3–5 kg concentrate feed. Grow improved forage: Napier grass (elephant grass) produces 60–80 tons/ha/year and is the most important dairy forage in highland Ethiopia. Supplement with hay, crop residue (treated with urea), and commercial dairy concentrate.

Water: A milking cow needs 60–80 liters of clean water daily. Poor water access is one of the most common causes of low milk production. Provide clean water at all times — dirty water reduces intake and spreads disease.

Milking: Milk at the same time every day — cows are creatures of habit and irregular milking reduces production. Clean the udder before milking with warm, clean water. Use a strip cup to detect mastitis before milking. Milk into clean containers. Cool milk quickly after milking to extend shelf life.

Mastitis prevention: Mastitis (udder infection) is the most costly dairy disease. After each milking, dip all 4 teats in iodine-based teat dip. Dry off cows with antibiotic dry-cow therapy to prevent infections during the non-milking period. Check for swelling, heat, or clots in milk — treat immediately.`,

  23: `Beef production offers Ethiopian farmers an opportunity to turn grass, crop residue, and by-products into high-value meat. Ethiopia has the potential to be a major beef exporter, but currently most cattle are marketed at low weights after long periods on poor nutrition.

Cattle selection for beef: Choose cattle with good body conformation — wide, deep body, well-muscled hindquarters. Boran and Ogaden breeds are naturally well-suited for beef. Crossbred bulls can also produce good beef under good management. Avoid very thin or sick animals regardless of price.

Fattening (feedlot) system: Short-term intensive feeding (60–90 days) transforms thin animals into well-finished beef cattle. This system is profitable because: feed conversion is most efficient in the first 90 days of fattening. Thin animals bought at low prices and sold at high finish weight generate profit from the price difference.

Fattening ration: A basic fattening diet consists of ad-lib roughage (hay, silage, or crop residue) plus concentrate supplement. Common concentrate mixes include: noug cake, cotton cake, wheat bran, maize bran. A target of 0.8–1.2 kg daily weight gain is achievable with a good ration.

Water: Provide clean water at all times. A fattening animal drinks 25–50 liters/day — restricted water dramatically reduces feed intake and growth rate.

Health management: Deworm all animals entering the feedlot with ivermectin or albendazole. Vaccinate for clostridial diseases (blackleg, anthrax in endemic areas). Check and treat for external parasites (ticks, lice). Isolate any sick animals immediately.

Marketing: Sell when animals reach their economic slaughter weight — continuing to feed after this point reduces profit as feed conversion efficiency declines. Know your buyers — abattoirs, butchers, and live animal traders each have different requirements. Record purchase price, all feed costs, and sale price to calculate actual profit per animal.`,

  24: `Poultry — chickens, ducks, turkeys, and guinea fowl — is Ethiopia's most widely kept livestock and an important source of nutrition and income for rural households, particularly women. Improving local flock management can triple production with modest investment.

Village chicken management: Village chickens kept in traditional scavenging systems have low productivity — 30–60 eggs/year and slow growth. Simple improvements dramatically increase output: supplementary feeding with grain or household scraps twice daily, providing clean water at all times, housing at night to prevent predator losses, and basic vaccination against Newcastle disease.

Improved breeds: Improved dual-purpose breeds like the Horro, Koekoek, and Sasso are better adapted to Ethiopian conditions than exotic commercial breeds. They tolerate heat, scavenge for food, and still produce 150–200 eggs/year under semi-intensive management.

Housing: Chickens need protection from predators (foxes, raptors, snakes), rain, cold nights, and direct sun. A simple raised wooden or bamboo henhouse with wire mesh sides is sufficient. Provide nest boxes (one per 5 hens), perches, and a litter floor (dry material like sawdust or rice husks — 5–10cm deep).

Feeding: Layer hens need a balanced diet including protein (25–30%), energy from grains, calcium (for eggshell formation — provide crushed bone or limestone), and minerals. A simple layer mash can be prepared on-farm from: maize (50%), wheat bran (20%), noug cake or soybean meal (20%), lime or crushed shells (8%), premix (2%).

Newcastle disease: This viral disease kills entire flocks within days and is the single biggest cause of village poultry mortality in Ethiopia. Vaccination is the only protection. Vaccinate all birds at 3 weeks of age with thermostable I-2 Newcastle vaccine delivered in drinking water. Revaccinate every 3–4 months.

Broiler production: Commercial meat chickens (broilers) reach 2kg liveweight in 42 days under intensive management. High-input (specialized feeds, controlled environment, all-in all-out biosecurity) but high-output. Requires significant capital and consistent market access.`,

  25: `Sheep and goats (small ruminants) are found in virtually every Ethiopian farming household. They are a flexible, accessible source of income — sold quickly in emergencies, given as gifts at festivals, and consumed for family nutrition. Ethiopia is one of Africa's largest sheep and goat producers.

Breed selection: For sheep, the Menz, Afar, and Horro breeds are well-adapted to their local environments. Dorper crossbreds grow faster but need better management. For goats, the Central Highland, Abergelle, and Somali breeds are productive in their respective zones. Use locally adapted breeds before introducing exotic genetics.

Feeding: Small ruminants are browsers (goats) and grazers (sheep) and can utilize rangeland, crop residue, and browse that cattle cannot efficiently use. Supplement during the dry season or late pregnancy with hay, crop residue treated with urea, and concentrates. Goats in particular need access to a wide variety of browse — monoculture grass diet alone does not meet their nutritional needs.

Water: Sheep and goats can survive on less water than cattle, but clean water at all times still maximizes productivity. In dry conditions, 3–5 liters/day per adult animal is the minimum requirement.

Reproduction management: Monitor females (ewes and does) for heat signs and ensure access to a healthy, fertile male. A ram can serve 30–40 ewes and a buck 25–30 does in a breeding season. Separate young males from females by 4 months of age to prevent unintended early breeding, which reduces dam productivity.

Internal parasites (worms): Gastrointestinal worms are the most common cause of poor growth and death in small ruminants. Signs include diarrhea, rough coat, swelling under the jaw (bottle jaw), and weight loss. Deworm with ivermectin or albendazole every 3–4 months and after moving animals to new pasture. Rotate pastures to reduce worm burden on grazing land.

Marketing: Small ruminants command premium prices before major festivals (Eid, Timkat, Christmas, Easter). Time sales to coincide with these periods. Finish animals on good feed for 30–60 days before festival sales to achieve heavier weights and higher prices.`,

  26: `Vaccination is the most cost-effective health intervention available to Ethiopian livestock farmers. A single vaccine dose costing 2–20 ETB can prevent disease losses worth thousands of ETB per animal.

Core principle: Vaccines work by exposing the animal's immune system to a harmless version of the disease-causing organism, enabling the animal to build defenses before encountering the real disease. Vaccines prevent disease — they cannot cure an already-sick animal.

Handling and storage (cold chain): Most livestock vaccines must be kept cold (2–8°C) at all times from manufacture to injection. A broken cold chain kills the vaccine — you may vaccinate animals but they will not be protected. Always: transport vaccines in a cooler with ice packs. Keep out of direct sunlight. Use vaccines within 2 hours of opening the vial. Never freeze vaccines labeled "do not freeze."

Core vaccination schedule for Ethiopian livestock:

CATTLE:
- Anthrax: Annual vaccination before the rainy season in endemic areas (lowlands). Highly fatal — vaccinate preventatively.
- Blackleg: Annual in highland areas where disease occurs.
- CBPP (Contagious Bovine Pleuropneumonia): As recommended by veterinary authorities.
- FMD (Foot and Mouth Disease): In high-risk areas, vaccinate every 6 months.
- LSD (Lumpy Skin Disease): As needed in outbreak areas.
- Brucellosis: Heifers 4–8 months old vaccinated once (Brucella S19 vaccine). Males are not vaccinated.

SHEEP AND GOATS:
- Sheep and Goat Pox: Annual vaccination before the rainy season.
- Pasteurellosis: Annual in highland areas.
- Anthrax: Annual in endemic lowland areas.

POULTRY:
- Newcastle Disease: All birds, every 3–4 months. Thermostable I-2 vaccine suitable for village conditions.
- Gumboro (IBD): Chicks at 14–21 days for intensive flocks.

PIGS (where kept):
- Swine Fever (Classical): Biannual vaccination.

Record keeping: Record vaccination date, vaccine name, batch number, and number of animals vaccinated for every flock/herd. This helps plan future vaccinations and proves disease protection status for market buyers.`,

  27: `Farm financial management is not just for large commercial operations — even a smallholder with one hectare makes dozens of financial decisions each season. Simple budgeting skills improve profitability dramatically.

Why budget: A budget lets you plan how much you need to spend, when you need the cash, and what profit you expect. Without a budget, many farmers find they have spent too much on inputs, have no cash left to hire labor at harvest time, or take loans at high interest rates in desperation.

A simple crop budget — step by step:

Step 1 — Expected income: Estimate yield (kg or quintals). Multiply by expected market price. Example: 15 quintals teff × 1,000 ETB/quintal = 15,000 ETB expected income.

Step 2 — Input costs: Seed: cost per kg × kg needed. Fertilizer: DAP and Urea cost × quantity. Pesticide/herbicide: as needed. Land preparation (tractor hire or draft animals). Labor for planting, weeding, harvesting, threshing.

Step 3 — Overhead costs: Land rent (if applicable). Transportation to market. Storage and processing. Loan interest payments.

Step 4 — Gross margin: Expected income minus all costs = gross margin (profit before family labor costs).

Step 5 — Cash flow timing: Identify when you need cash and when you receive it. Most costs come at the start of the season; income comes at harvest. Plan how to cover the gap — savings, cooperative credit, or produce advance.

Budgeting for multiple enterprises: If you grow two crops and keep livestock, budget each enterprise separately. This shows which is most profitable and helps you decide how to allocate land, water, and labor.

Record the actual results at the end of each season and compare to your budget. Understanding why results differed from predictions improves your planning each year.`,

  28: `Farm record keeping seems like extra work, but farmers who maintain simple records consistently make more money — they know their true costs, identify what is and isn't working, and have evidence of their farming history for bank loans and insurance.

What records to keep:

FIELD RECORDS: For each plot/field, record each season: crop and variety planted, planting date, seed rate and cost, fertilizer type, rate, date, and cost, pesticide and herbicide use, labor used (days and cost), irrigation water used, yield harvested (weigh accurately), selling price and buyer.

LIVESTOCK RECORDS: For each animal or herd/flock: births and deaths (date, cause), vaccination dates and products used, treatment dates and medicines used, weight at key stages (weaning, sale), feed purchased and costs, milk production (daily if dairy), sales (date, animal, price, buyer).

FINANCIAL RECORDS: Cash book: date, description, money in, money out, balance. Sales receipts. Purchase receipts. Loan records (amount, lender, interest rate, repayment schedule).

Simple record keeping tools: A hardcover notebook kept in a dry place works perfectly. Pre-printed record sheets from agricultural offices or NGOs provide structure. Smartphone apps — basic spreadsheet apps (Google Sheets, Excel) work well if you have smartphone access.

Tips for consistent record keeping: Record at the time the event happens — not from memory later. Keep it simple — a few key numbers are better than complex records you abandon after a month. Store books in a dry, safe place away from animals. Review records monthly to catch trends and problems early.

Using records: At season end, calculate your gross margin per crop. Compare to previous seasons and to neighbor farmers. Use records to apply for credit — banks and microfinance institutions respond much better to farmers who can demonstrate their financial history with actual records.`,

  29: `Getting good prices for your produce is as important as growing a good crop. Many Ethiopian farmers lose 30–50% of potential income through poor marketing decisions, selling at the wrong time, to the wrong buyer, at the wrong place.

Know your market options:

1. Farm gate sale: Selling directly to traders who come to your farm or village. Convenient but usually the lowest price — traders need margin for transport, storage, and their profit.

2. Local market: Selling at the nearest market yourself. Higher price but requires transport cost and your time.

3. Cooperative marketing: Selling through a farmers' cooperative pools volumes from many farmers, giving more bargaining power and access to premium buyers. In Ethiopia, cooperatives have secured export contracts for coffee and sesame, giving members significantly higher prices.

4. Direct to processor/buyer: Selling directly to mills, food companies, or exporters removes intermediaries. Requires meeting specific quality and quantity requirements and often advance agreements.

5. Forward contracts: Agreeing on price before harvest reduces price risk but sacrifices potential upside if prices rise.

Market information: Knowing current market prices before you sell is essential. Access market prices through: local radio agricultural programs, Ethiopia Commodity Exchange (ECX) prices (for major commodities), community market information systems, and the Teff AI assistant on AgriEquip.

Post-harvest quality: High-quality produce always commands premium prices. For grain: dry to correct moisture, clean and grade, store properly in clean bags or metal silos. For vegetables: grade by size, remove damaged items, pack carefully. For coffee: process properly (wet or natural) and present to buyers in correct grading.

Negotiation: Know your break-even price (cost of production per quintal) before you go to market — never sell below this. Compare offers from multiple buyers before accepting. Selling in groups gives more bargaining power than selling alone.

Timing: Prices are lowest immediately after harvest when everyone is selling. Farmers with storage capacity who wait 2–3 months typically receive 20–40% higher prices. Simple hermetic storage bags (like PICS bags) preserve grain quality for 6+ months.`,

  30: `Digital payment systems are rapidly transforming financial transactions for Ethiopian farmers, reducing the need to carry cash, enabling faster payments, and improving financial record keeping.

Telebirr: Ethio Telecom's mobile money platform is the largest in Ethiopia with over 40 million users. Works on any mobile phone, including basic feature phones using USSD menus (*127#). Functions include: send and receive money, pay for goods and services, save money (earn interest on savings), buy airtime. Registration requires only your phone number and ID — available at any Telebirr agent.

CBE Birr: Commercial Bank of Ethiopia's mobile banking app links to your CBE bank account. Available for smartphone users. Functions include: account balance checks, money transfers, bill payments, loan applications. If you have a CBE account, download CBE Birr from the app store.

M-Pesa: Safaricom's mobile money service, available in some parts of Ethiopia. Similar functions to Telebirr.

Using digital payments for farm business: Receive payment for equipment rental directly to your Telebirr or bank account — safer than cash. Pay labor wages digitally — both parties have a record of payment. Pay for inputs from agro-dealers who accept digital payment. Receive payment from buyers for produce — immediate and verifiable.

Security: Never share your PIN with anyone — not family, agents, or people claiming to be from the mobile money company. If you receive an unexpected payment, wait before spending — it may be a scam. Regularly check your transaction history for unauthorized activity.

Using the AgriEquip wallet: Your AgriEquip wallet works like a digital account for rental-related transactions. Rental fees, deposits, and withdrawals all flow through the wallet. All transactions are recorded and visible in your transaction history — this is a financial record you can use to demonstrate business activity.

Financial inclusion: For farmers without bank accounts, mobile money provides access to the formal financial system for the first time — building a digital transaction record that can support future loan applications.`,
};


const LESSON_IMAGES = {
};

const LESSON_FILES = {
};


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
let isAdminUser = false;
// ^ EDIT 2: added isAdminUser state
let currentSection = 'home';
let sectionHistory = ['home'];
let historyIndex = 0;
let teffHistory = [];
let selectedEquipFiles = [];       // File objects staged for upload on the listings form
let currentDetailImages = [];      // Images for the equipment detail overlay's gallery
let currentDetailIndex = 0;

// ─── Init ─────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  await loadUserProfile();
  isAdminUser = await checkIsAdmin();
  // ^ EDIT 3: admin check runs at login
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
  openEquipmentDetail, closeEquipmentDetail, detailPrevImage, detailNextImage,
  previewEquipPhotos, removeEquipPhoto,
  openBookingModal, closeBookingModal, updateBookingTotal, submitBookingRequest, respondBooking,
  deleteListing,
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

// EDIT 2 (continued): admin-check function
async function checkIsAdmin() {
  if (!currentUser) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', currentUser.uid));
    return snap.exists();
  } catch(e) { return false; }
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
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.section === id);
  });
  const item = NAV.find(n => n.id === id);
  setText('pageTitle', item ? item.icon + ' ' + item.label : id);
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
  const text  = LESSON_CONTENT[id] || lesson.desc;
  const image = LESSON_IMAGES[id];
  const file  = LESSON_FILES[id];
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
      ${image ? `<img src="${image}" alt="${lesson.title}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:14px" onerror="this.style.display='none'">` : ''}
      <div style="font-size:2rem;margin-bottom:6px">${lesson.emoji}</div>
      <h2 style="color:white;font-size:1.2rem;margin-bottom:12px">${lesson.title}</h2>
      <div style="color:#94A3B8;font-size:.86rem;line-height:1.85;white-space:pre-line">${text.replace(/</g,'&lt;')}</div>
      ${file ? `<a href="${file}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:16px;color:#22C55E;font-size:.82rem;text-decoration:none;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:8px 14px">📎 Download attachment</a>` : ''}
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
          <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:between;gap:10px">
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
          <label style="color:#64748B;font-size:.78rem;display:block;margin:4px 0 6px">📷 Photos (up to 5)</label>
          <input type="file" id="equipPhotos" accept="image/*" multiple class="form-input" onchange="previewEquipPhotos(event)">
          <div id="equipPhotoPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"></div>
          <button class="action-btn" id="submitListingBtn" onclick="submitListing()">✅ Submit Listing (+30 pts)</button>
          <button class="action-btn" style="background:#64748B;margin-top:8px" onclick="toggleListingForm()">✕ Cancel</button>
          <p id="listingMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
        </div>
        <div id="myListings"></div>`;
      loadMyListings();
      break;

    // ── BOOKINGS ─────────────────────────────────────────
    case 'bookings':
      root.innerHTML = `
        <div class="section-card" style="background:linear-gradient(135deg,#0F172A,#1a3a2a);margin-bottom:16px">
          <h3 style="color:white">📅 My Bookings</h3>
          <p style="color:rgba(255,255,255,.55);font-size:.82rem;margin-top:6px">Requests you've sent, and requests owners have sent you.</p>
        </div>
        <h3 style="margin:4px 0 10px;font-size:.92rem">📤 Sent by Me</h3>
        <div id="sentBookings"><p style="color:#64748B;text-align:center;padding:16px">Loading...</p></div>
        <h3 style="margin:20px 0 10px;font-size:.92rem">📥 Received (My Listings)</h3>
        <div id="receivedBookings"><p style="color:#64748B;text-align:center;padding:16px">Loading...</p></div>`;
      loadMyBookings();
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
          <button class="action-btn" id="profileSaveBtn" onclick="saveProfile()">💾 Save Changes</button>
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

// Races a promise against a timeout — Firestore's SDK has no built-in
// abort, so a genuinely stalled request would otherwise spin on
// "Loading..." forever with no error shown.
function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms))
  ]);
}

async function loadEquipment() {
  const el = document.getElementById('equipmentList');
  if (!el) return;
  el.innerHTML = `<p style="color:#64748B;text-align:center;padding:20px">Loading...</p>`;
  try {
    const snap = await withTimeout(
      getDocs(query(collection(db,'equipment'), where('availability','==','available'))),
      15000, '⏱️ Timed out — check your connection'
    );
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#64748B"><div style="font-size:3rem">🚜</div><p>No equipment listed yet.<br>Be the first!</p><button class="action-btn" style="margin-top:14px" onclick="showSection('listings')">+ List Equipment</button></div>`;
      return;
    }
    const icons = {tractor:'🚜',plow:'🔧',harvester:'🌾',pump:'💧',thresher:'⚙️',other:'📦'};
    // Client-side search/category filter — Firestore doesn't do free-text
    // search, so we fetch available equipment and filter here.
    const searchTerm = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const catFilter   = document.getElementById('categoryFilter')?.value || '';
    let docsToShow = snap.docs.filter(d => {
      const eq = d.data();
      if (catFilter && eq.category !== catFilter) return false;
      if (searchTerm) {
        const hay = `${eq.name||''} ${eq.category||''} ${eq.location?.city||''} ${eq.description||''}`.toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      return true;
    });
    if (docsToShow.length === 0) {
      el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#64748B"><div style="font-size:3rem">🔍</div><p>No equipment matches your search.</p></div>`;
      return;
    }
    el.innerHTML = docsToShow.map(d => {
      const eq = d.data();
      const thumb = (eq.images && eq.images.length)
        ? `<img src="${eq.images[0]}" alt="${eq.name}" style="width:100%;height:100%;object-fit:cover">`
        : (icons[eq.category]||'🚜');
      return `<div class="equipment-card" style="cursor:pointer" onclick="openEquipmentDetail('${d.id}')">
        <div class="equipment-img">${thumb}</div>
        <div class="equipment-info">
          <p class="equipment-name">${eq.name}</p>
          <p style="color:#64748B;font-size:.78rem">📍 ${eq.location?.city||'Ethiopia'} · ${eq.category||'Equipment'}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="color:#22C55E;font-weight:700">${(eq.pricePerDay||0).toLocaleString()} ETB/day</span>
            <button class="action-btn" style="width:auto;padding:6px 12px;font-size:.76rem" onclick="event.stopPropagation();openEquipmentDetail('${d.id}')">View</button>
            ${(isAdminUser && eq.ownerId !== currentUser.uid) ? `<button class="action-btn" style="background:#EF4444;width:auto;padding:6px 12px;font-size:.76rem;margin-left:6px" onclick="event.stopPropagation();deleteListing('${d.id}')">🗑 Admin</button>` : ''}
          </div>
        </div>
      </div>`;
      // ^ EDIT 6: admin delete button added above
    }).join('');
  } catch(e) { el.innerHTML = `<p style="color:#ef4444;text-align:center;padding:20px">${(e.message||'Error loading equipment').replace(/</g,'&lt;')}</p>`; }
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
      const thumb = (eq.images && eq.images.length)
        ? `<img src="${eq.images[0]}" alt="${eq.name}" style="width:100%;height:100%;object-fit:cover">`
        : (icons[eq.category]||'🚜');
      return `<div class="equipment-card" style="cursor:pointer" onclick="openEquipmentDetail('${d.id}')">
        <div class="equipment-img">${thumb}</div>
        <div class="equipment-info">
          <p class="equipment-name">${eq.name}</p>
          <p style="color:#64748B;font-size:.78rem">📍 ${eq.location?.city||''} · ${eq.pricePerDay||0} ETB/day</p>
          <span style="display:inline-block;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#22C55E;border-radius:6px;padding:3px 10px;font-size:.75rem;margin-top:6px">${eq.availability||'available'}</span>
          <button class="action-btn" style="background:#EF4444;width:auto;padding:5px 12px;font-size:.72rem;margin-top:8px" onclick="event.stopPropagation();deleteListing('${d.id}')">🗑 Delete Listing</button>
        </div>
      </div>`;
      // ^ EDIT 5: owner delete button added above
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

// ─── Equipment Detail Overlay ─────────────────────────────
async function openEquipmentDetail(id) {
  const overlay = document.createElement('div');
  overlay.id = 'equipDetailOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;display:flex;align-items:flex-end;justify-content:center';
  overlay.onclick = (e) => { if (e.target === overlay) closeEquipmentDetail(); };
  overlay.innerHTML = `
    <div style="background:#0F172A;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;border-radius:20px 20px 0 0;animation:sheetUp .3s ease">
      <div style="padding:16px;display:flex;justify-content:flex-end">
        <button onclick="closeEquipmentDetail()" style="background:rgba(255,255,255,.08);border:none;color:white;width:28px;height:28px;border-radius:8px;font-size:1rem;cursor:pointer">✕</button>
      </div>
      <div style="text-align:center;color:#64748B;padding:40px 20px">Loading...</div>
    </div>`;
  document.body.appendChild(overlay);

  try {
    const snap = await getDoc(doc(db, 'equipment', id));
    if (!snap.exists()) {
      overlay.querySelector('div > div:last-child').innerHTML = `<p style="text-align:center;color:#64748B;padding:20px">Listing not found — it may have been removed.</p>`;
      return;
    }
    const eq = snap.data();
    const icons = {tractor:'🚜',plow:'🔧',harvester:'🌾',pump:'💧',thresher:'⚙️',other:'📦'};
    currentDetailImages = (eq.images && eq.images.length) ? eq.images : [];
    currentDetailIndex = 0;
    const isOwner = currentUser && eq.ownerId === currentUser.uid;

    const sheet = overlay.querySelector('div');
    sheet.innerHTML = `
      <div style="position:relative">
        <div id="detailGallery" style="width:100%;aspect-ratio:4/3;background:#1E293B;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative">
          ${currentDetailImages.length
            ? `<img id="detailImg" src="${currentDetailImages[0]}" style="width:100%;height:100%;object-fit:cover">`
            : `<span style="font-size:4rem">${icons[eq.category]||'🚜'}</span>`}
          ${currentDetailImages.length > 1 ? `
            <button onclick="detailPrevImage()" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem">‹</button>
            <button onclick="detailNextImage()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem">›</button>
            <div id="detailDots" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px">
              ${currentDetailImages.map((_,i)=>`<span style="width:6px;height:6px;border-radius:50%;background:${i===0?'#22C55E':'rgba(255,255,255,.4)'}"></span>`).join('')}
            </div>` : ''}
        </div>
        <button onclick="closeEquipmentDetail()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.5);border:none;color:white;width:30px;height:30px;border-radius:8px;font-size:1rem;cursor:pointer">✕</button>
        ${isOwner ? `<span style="position:absolute;top:12px;left:12px;background:rgba(34,197,94,.85);color:white;font-size:.72rem;padding:4px 10px;border-radius:8px">Your listing</span>` : ''}
      </div>
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <h2 style="color:white;font-size:1.2rem">${eq.name||'Equipment'}</h2>
          <span style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#22C55E;border-radius:6px;padding:3px 10px;font-size:.75rem;white-space:nowrap">${eq.availability||'available'}</span>
        </div>
        <p style="color:#64748B;font-size:.82rem;margin-top:4px">📍 ${eq.location?.city||'Ethiopia'} · ${icons[eq.category]||'📦'} ${eq.category||'Equipment'}</p>
        <div style="color:#22C55E;font-weight:700;font-size:1.4rem;margin-top:12px">${(eq.pricePerDay||0).toLocaleString()} ETB<span style="color:#64748B;font-size:.8rem;font-weight:400">/day</span></div>

        ${eq.description ? `
        <div style="margin-top:16px">
          <h3 style="font-size:.85rem;margin-bottom:6px">📝 Description</h3>
          <p style="color:#94A3B8;font-size:.84rem;line-height:1.7">${eq.description.replace(/</g,'&lt;')}</p>
        </div>` : ''}

        <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)">
          <h3 style="font-size:.85rem;margin-bottom:6px">👤 Owner</h3>
          <p style="color:#94A3B8;font-size:.84rem">${eq.ownerEmail||'—'}</p>
        </div>

        ${isOwner
          ? `<button class="action-btn" style="margin-top:20px;background:#334155" onclick="showSection('listings');closeEquipmentDetail()">📦 Manage in My Listings</button>`
          : `<button class="action-btn" style="margin-top:20px" onclick="openBookingModal('${id}')">📩 Request to Book</button>`}
        ${(isAdminUser && !isOwner) ? `<button class="action-btn" style="margin-top:10px;background:#EF4444" onclick="deleteListing('${id}');closeEquipmentDetail()">🗑 Admin Delete Listing</button>` : ''}
      </div>`;
    
  } catch(e) {
    overlay.querySelector('div > div:last-child').innerHTML = `<p style="text-align:center;color:#ef4444;padding:20px">Error loading listing.</p>`;
  }
}

function closeEquipmentDetail() {
  document.getElementById('equipDetailOverlay')?.remove();
  currentDetailImages = [];
  currentDetailIndex = 0;
}

function detailPrevImage() {
  if (!currentDetailImages.length) return;
  currentDetailIndex = (currentDetailIndex - 1 + currentDetailImages.length) % currentDetailImages.length;
  renderDetailImage();
}
function detailNextImage() {
  if (!currentDetailImages.length) return;
  currentDetailIndex = (currentDetailIndex + 1) % currentDetailImages.length;
  renderDetailImage();
}
function renderDetailImage() {
  const img = document.getElementById('detailImg');
  if (img) img.src = currentDetailImages[currentDetailIndex];
  const dots = document.getElementById('detailDots');
  if (dots) {
    [...dots.children].forEach((dot,i) => { dot.style.background = i===currentDetailIndex ? '#22C55E' : 'rgba(255,255,255,.4)'; });
  }
}

// ─── Photo upload (listings form) ─────────────────────────
function previewEquipPhotos(event) {
  const files = Array.from(event.target.files || []).slice(0, 5);
  selectedEquipFiles = files;
  renderEquipPhotoPreview();
}

function removeEquipPhoto(idx) {
  selectedEquipFiles.splice(idx, 1);
  renderEquipPhotoPreview();
}

function renderEquipPhotoPreview() {
  const el = document.getElementById('equipPhotoPreview');
  if (!el) return;
  el.innerHTML = selectedEquipFiles.map((file, i) => `
    <div style="position:relative;width:64px;height:64px">
      <img src="${URL.createObjectURL(file)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
      <button onclick="removeEquipPhoto(${i})" style="position:absolute;top:-6px;right:-6px;background:#EF4444;border:none;color:white;width:20px;height:20px;border-radius:50%;font-size:.7rem;cursor:pointer;line-height:1">✕</button>
    </div>`).join('');
}

// Resize/compress an image file client-side before upload — keeps uploads
// fast and cheap on mobile data, which matters a lot for this audience.
function resizeImageFile(file, maxDim = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('Image compression failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

// Cloudinary free-tier image hosting — used instead of Firebase Storage,
// which requires the paid Blaze plan. Unsigned preset means no secret key
// needs to live in this public client-side file.
const CLOUDINARY_CLOUD_NAME   = 'gycdynp3';
const CLOUDINARY_UPLOAD_PRESET = 'agriequip_unsigned';

// Wraps fetch with a hard timeout — without this, a stalled network
// request just spins on "Uploading..." forever with no error shown.
function fetchWithTimeout(url, options = {}, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function uploadEquipmentImages(files, ownerId) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await resizeImageFile(files[i]);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `equipment/${ownerId}`);
    let res;
    try {
      res = await fetchWithTimeout(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
        20000
      );
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'Upload timed out — check your connection' : e.message);
    }
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    urls.push(data.secure_url);
  }
  return urls;
}

// ─── Delete Listing (owner or admin) ──────────────────────
// EDIT 4: new function
async function deleteListing(id) {
  if (!confirm('Delete this listing? This can\'t be undone.')) return;
  try {
    await deleteDoc(doc(db, 'equipment', id));
    showToast('🗑 Listing deleted');
    loadMyListings();
    if (currentSection === 'browse') loadEquipment();
  } catch(e) {
    showToast('❌ Failed to delete: ' + (e.message || 'Try again.'));
  }
}

// ─── Booking Request Flow ─────────────────────────────────
// Schema written to /bookings matches the fields already set up in
// Firestore: equipmentID, equipmentName, ownerID, renterID, startDate,
// endDate, durationDays, pricePerDay, totalAmount, commissionRate,
// commission, ownersEarning, paymentStatus, status, notes, createdAt, updatedAt.
//
// ⚠️ REMINDER (unresolved from earlier): this schema uses ownerID/renterID
// (capital ID), but the published Firestore rule for /bookings checks
// resource.data.ownerId / renterId (lowercase d). Those are different
// field names to Firestore — every write here is likely being silently
// denied until one side is changed to match the other. Flagging again
// since it wasn't part of this specific edit request.
const BOOKING_STATUS_STYLE = {
  pending:   { label:'⏳ Pending',   color:'#F59E0B' },
  accepted:  { label:'✅ Accepted',  color:'#22C55E' },
  declined:  { label:'❌ Declined',  color:'#EF4444' },
  completed: { label:'🏁 Completed', color:'#64748B' },
  cancelled: { label:'🚫 Cancelled', color:'#64748B' },
};

// Commission rate mirrors the VIP tier of the equipment OWNER (they're
// the one whose earnings the commission is deducted from), not the renter.
function commissionRateForVip(vipLevel) {
  const key = (vipLevel || 'free').toLowerCase().replace(/\s+/g,'');
  const map = { free:0.10, vip1:0.08, vip2:0.07, vip3:0.06, vip4:0.05, vip5:0.04 };
  return map[key] ?? 0.10;
}

async function openBookingModal(equipmentId) {
  if (!currentUser) return;
  let eq;
  try {
    const eqSnap = await getDoc(doc(db,'equipment',equipmentId));
    if (!eqSnap.exists()) { showToast('❌ Listing not found'); return; }
    eq = eqSnap.data();
  } catch(e) { showToast('❌ Could not load listing'); return; }
  if (eq.ownerId === currentUser.uid) { showToast('⚠️ This is your own listing'); return; }

  const today = new Date().toISOString().split('T')[0];
  const overlay = document.createElement('div');
  overlay.id = 'bookingModalOverlay';
  overlay.dataset.price = eq.pricePerDay || 0;
  overlay.dataset.ownerId = eq.ownerId;
  overlay.dataset.equipName = eq.name || 'Equipment';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2100;display:flex;align-items:flex-end;justify-content:center';
  overlay.onclick = (e) => { if (e.target === overlay) closeBookingModal(); };
  overlay.innerHTML = `
    <div style="background:#0F172A;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;border-radius:20px 20px 0 0;padding:20px 20px 28px;animation:sheetUp .3s ease">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-size:.75rem;color:#64748B">📅 Book Equipment</span>
        <button onclick="closeBookingModal()" style="background:rgba(255,255,255,.08);border:none;color:white;width:28px;height:28px;border-radius:8px;font-size:1rem;cursor:pointer">✕</button>
      </div>
      <h2 style="color:white;font-size:1.1rem;margin-bottom:4px">${eq.name||'Equipment'}</h2>
      <p style="color:#64748B;font-size:.8rem;margin-bottom:16px">${(eq.pricePerDay||0).toLocaleString()} ETB/day · 📍 ${eq.location?.city||'Ethiopia'}</p>

      <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Start Date *</label>
      <input type="date" id="bookStart" class="form-input" min="${today}" onchange="updateBookingTotal()">
      <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">End Date *</label>
      <input type="date" id="bookEnd" class="form-input" min="${today}" onchange="updateBookingTotal()">

      <label style="color:#64748B;font-size:.78rem;display:block;margin-bottom:4px">Message to owner (optional)</label>
      <textarea id="bookMessage" class="form-input" rows="2" placeholder="e.g. Need it for ploughing 4 hectares"></textarea>

      <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:12px;margin-top:10px" id="bookTotalBox">
        <p style="color:#64748B;font-size:.75rem">Select dates to see estimated total</p>
      </div>

      <button class="action-btn" id="submitBookingBtn" style="margin-top:16px" onclick="submitBookingRequest('${equipmentId}')">📩 Send Booking Request</button>
      <p id="bookingMsg" style="display:none;margin-top:8px;text-align:center;font-size:.85rem"></p>
    </div>`;
  document.body.appendChild(overlay);
}

function closeBookingModal() {
  document.getElementById('bookingModalOverlay')?.remove();
}

function updateBookingTotal() {
  const overlay = document.getElementById('bookingModalOverlay');
  const box = document.getElementById('bookTotalBox');
  if (!overlay || !box) return;
  const price = parseFloat(overlay.dataset.price) || 0;
  const start = document.getElementById('bookStart').value;
  const end   = document.getElementById('bookEnd').value;
  if (!start || !end) { box.innerHTML = `<p style="color:#64748B;font-size:.75rem">Select dates to see estimated total</p>`; return; }
  if (new Date(end) < new Date(start)) { box.innerHTML = `<p style="color:#EF4444;font-size:.78rem">⚠️ End date must be after start date</p>`; return; }
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  const total = days * price;
  box.innerHTML = `<p style="color:#64748B;font-size:.75rem">${days} day${days>1?'s':''} × ${price.toLocaleString()} ETB</p>
    <p style="color:#22C55E;font-weight:700;font-size:1.1rem;margin-top:4px">Est. ${total.toLocaleString()} ETB</p>
    <p style="color:#64748B;font-size:.68rem;margin-top:2px">Final total confirmed by owner. Payment isn't collected yet — coming soon.</p>`;
}

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
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function respondBooking(bookingId, status) {
  try {
    const bSnap = await getDoc(doc(db,'bookings',bookingId));
    if (!bSnap.exists()) { showToast('❌ Booking not found'); return; }
    const b = bSnap.data();
    await updateDoc(doc(db,'bookings',bookingId), { status, updatedAt: serverTimestamp() });
    if (status === 'accepted' && b.equipmentID) {
      // Best-effort — don't block the accept flow if this fails.
      try { await updateDoc(doc(db,'equipment',b.equipmentID), { totalbookings: increment(1) }); } catch(e) {}
    }
    showToast(status === 'accepted' ? '✅ Booking accepted!' : '❌ Booking declined');
    loadMyBookings();
  } catch(e) { showToast('❌ Failed to update booking'); }
}

async function loadMyBookings() {
  if (!currentUser) return;
  const sentEl = document.getElementById('sentBookings');
  const recvEl = document.getElementById('receivedBookings');
  if (!sentEl || !recvEl) return;
  try {
    const sentSnap = await getDocs(query(collection(db,'bookings'), where('renterID','==',currentUser.uid), orderBy('createdAt','desc')));
    sentEl.innerHTML = sentSnap.empty
      ? `<p style="color:#64748B;text-align:center;padding:16px">No booking requests sent yet.</p>`
      : sentSnap.docs.map(d => renderBookingCard(d.id, d.data(), false)).join('');
  } catch(e) { sentEl.innerHTML = `<p style="color:#ef4444;text-align:center;padding:16px">Error loading your bookings</p>`; }
  try {
    const recvSnap = await getDocs(query(collection(db,'bookings'), where('ownerID','==',currentUser.uid), orderBy('createdAt','desc')));
    recvEl.innerHTML = recvSnap.empty
      ? `<p style="color:#64748B;text-align:center;padding:16px">No booking requests received yet.</p>`
      : recvSnap.docs.map(d => renderBookingCard(d.id, d.data(), true)).join('');
  } catch(e) { recvEl.innerHTML = `<p style="color:#ef4444;text-align:center;padding:16px">Error loading requests</p>`; }
}

function fmtBookingDate(v) {
  if (!v) return '?';
  const d = v.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function renderBookingCard(id, b, isOwnerView) {
  const st = BOOKING_STATUS_STYLE[b.status] || BOOKING_STATUS_STYLE.pending;
  const dateRange = `${fmtBookingDate(b.startDate)} → ${fmtBookingDate(b.endDate)}`;
  return `<div class="section-card" style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div>
        <div style="font-weight:700;font-size:.9rem">${b.equipmentName||'Equipment'}</div>
        <div style="color:#64748B;font-size:.76rem;margin-top:2px">📅 ${dateRange} · ${b.durationDays||1} day${(b.durationDays||1)>1?'s':''}</div>
        ${isOwnerView ? `<div style="color:#64748B;font-size:.76rem;margin-top:2px">👤 ${b.renterEmail||''}</div>` : ''}
        ${b.notes ? `<div style="color:#94A3B8;font-size:.78rem;margin-top:6px;font-style:italic">"${b.notes.replace(/</g,'&lt;')}"</div>` : ''}
      </div>
      <span style="color:${st.color};font-size:.75rem;white-space:nowrap">${st.label}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px">
      <div>
        <div style="color:#22C55E;font-weight:700;font-size:.95rem">${(b.totalAmount||0).toLocaleString()} ETB</div>
        ${isOwnerView ? `<div style="color:#64748B;font-size:.7rem">Your earnings: ${(b.ownersEarning||0).toLocaleString()} ETB (after ${Math.round((b.commissionRate||0)*100)}% commission)</div>` : ''}
      </div>
      <span style="color:#64748B;font-size:.7rem">${b.paymentStatus||'unpaid'}</span>
    </div>
    ${isOwnerView && b.status === 'pending' ? `
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="action-btn" style="background:#22C55E" onclick="respondBooking('${id}','accepted')">✅ Accept</button>
      <button class="action-btn" style="background:#EF4444" onclick="respondBooking('${id}','declined')">❌ Decline</button>
    </div>` : ''}
  </div>`;
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
    await addDoc(collection(db,'equipment'), { ownerId:currentUser.uid, ownerEmail:currentUser.email, name, category:cat, description:desc||'', pricePerDay:price, location:{city}, images, availability:'available', createdAt:serverTimestamp() });
    completeTask('list_equipment', 30);
    flashMsg(msgEl,'✅ Equipment listed! (+30 XP)','#22C55E');
    selectedEquipFiles = [];
    setTimeout(() => { toggleListingForm(); loadMyListings(); }, 1500);
  } catch(e) { flashMsg(msgEl,'❌ Failed to list: ' + (e.message||'Try again.'),'#EF4444'); }
  finally { if (btn) btn.disabled = false; }
}

function filterEquipment() { loadEquipment(); }

async function saveProfile() {
  const msgEl = document.getElementById('profileMsg');
  const btn = document.getElementById('profileSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  try {
    // setDoc + merge instead of updateDoc: updateDoc THROWS if the target
    // document (or any assumption about its existing shape) is missing,
    // which silently fails the save and looks like data "resets" next visit.
    // merge:true creates the doc if needed and only touches these fields.
    await setDoc(doc(db,'users',currentUser.uid), {
      fullName:    val('profileName'),
      fatherName:  val('profileFatherName'),
      phoneNumber: val('profilePhone'),
      address:     val('profileCity'),
      updatedAt:   serverTimestamp()
    }, { merge: true });
    await loadUserProfile();
    flashMsg(msgEl,'✅ Profile updated!','#22C55E');
  } catch(e) {
    console.error('saveProfile failed:', e);
    flashMsg(msgEl,'❌ Failed to save: ' + (e.message || e.code || 'unknown error'),'#EF4444');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
  }
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
window.openEquipmentDetail = openEquipmentDetail;
window.closeEquipmentDetail = closeEquipmentDetail;
window.detailPrevImage  = detailPrevImage;
window.detailNextImage  = detailNextImage;
window.previewEquipPhotos = previewEquipPhotos;
window.removeEquipPhoto = removeEquipPhoto;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.updateBookingTotal = updateBookingTotal;
window.submitBookingRequest = submitBookingRequest;
window.respondBooking   = respondBooking;
window.deleteListing    = deleteListing;
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
