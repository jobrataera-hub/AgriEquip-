import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

export async function getWalletBalance(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data().walletBalance || 0) : 0;
  } catch (e) { return 0; }
}

export async function requestDeposit(userId, amount, bankName = 'AgriEquip', reference = '') {
  try {
    await addDoc(collection(db, 'transactions'), {
      userId, type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      bankName, reference,
      createdAt: new Date().toISOString()
    });
    return { success: true, message: 'Deposit request submitted.' };
  } catch (e) { return { success: false, message: e.message }; }
}

export async function requestWithdrawal(userId, amount, bankName = 'AgriEquip', accountNo = '') {
  try {
    const balance = await getWalletBalance(userId);
    if (balance < 200) return { success: false, message: 'Minimum withdrawal is 200 ETB.' };
    if (balance < amount) return { success: false, message: 'Insufficient balance.' };
    await addDoc(collection(db, 'transactions'), {
      userId, type: 'withdrawal',
      amount: Number(amount),
      status: 'pending',
      bankName, accountNo,
      createdAt: new Date().toISOString()
    });
    return { success: true, message: 'Withdrawal request submitted.' };
  } catch (e) { return { success: false, message: e.message }; }
}

export async function getTransactionHistory(userId) {
  try {
    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
}
