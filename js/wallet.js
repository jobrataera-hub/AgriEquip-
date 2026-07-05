import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

export async function getWalletBalance(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data().walletBalance || 0) : 0;
  } catch (e) { return 0; }
}

export async function requestDeposit(userId, amount) {
  try {
    await addDoc(collection(db, 'transactions'), { userId, type: 'deposit', amount: Number(amount), status: 'pending', createdAt: new Date().toISOString() });
    return { success: true, message: 'Deposit request submitted. Admin will approve shortly.' };
  } catch (e) { return { success: false, message: e.message }; }
}

export async function requestWithdrawal(userId, amount) {
  try {
    const balance = await getWalletBalance(userId);
    if (balance < amount) return { success: false, message: 'Insufficient balance.' };
    await addDoc(collection(db, 'transactions'), { userId, type: 'withdrawal', amount: Number(amount), status: 'pending', createdAt: new Date().toISOString() });
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
