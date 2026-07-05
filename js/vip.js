import { db } from '../firebase.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

export const VIP_PLANS = {
  free: { name: 'Free',  fee: 0,    commission: 10, listings: 2,   badge: '⚪', color: '#94A3B8' },
  vip1: { name: 'VIP 1', fee: 200,  commission: 8,  listings: 5,   badge: '🟡', color: '#F59E0B' },
  vip2: { name: 'VIP 2', fee: 500,  commission: 7,  listings: 10,  badge: '🟠', color: '#F97316' },
  vip3: { name: 'VIP 3', fee: 1000, commission: 6,  listings: 20,  badge: '🔵', color: '#3B82F6' },
  vip4: { name: 'VIP 4', fee: 2000, commission: 5,  listings: 50,  badge: '🟣', color: '#8B5CF6' },
  vip5: { name: 'VIP 5', fee: 4000, commission: 4,  listings: 999, badge: '💎', color: '#22C55E' }
};

export async function getUserVIP(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data().vipLevel || 'free') : 'free';
  } catch (e) { return 'free'; }
}

export async function upgradeVIP(userId, planKey) {
  try {
    const plan = VIP_PLANS[planKey];
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const wallet = userDoc.exists() ? (userDoc.data().walletBalance || 0) : 0;
    if (wallet < plan.fee) return { success: false, message: `Need ${plan.fee} ETB. Your balance: ${wallet} ETB.` };
    await updateDoc(userRef, { vipLevel: planKey, walletBalance: wallet - plan.fee, vipUpgradedAt: new Date().toISOString() });
    return { success: true, message: `Upgraded to ${plan.name}!` };
  } catch (e) { return { success: false, message: e.message }; }
}

export const getCommissionRate = (vip) => VIP_PLANS[vip]?.commission || 10;
export const getListingLimit = (vip) => VIP_PLANS[vip]?.listings || 2;
