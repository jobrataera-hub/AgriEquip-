import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

export async function getWalletBalance(userId) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data().walletBalance || 0) : 0;
  } catch(e) { return 0; }
}

export async function requestDeposit(userId, amount, bankName, accountRef) {
  try {
    await addDoc(collection(db, 'transactions'), {
      userId, type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      bankName, accountRef,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch(e) { return { success: false, message: e.message }; }
}

export async function requestWithdrawal(userId, amount, bankName, accountNumber) {
  try {
    const balance = await getWalletBalance(userId);
    if (Number(amount) < 200) return { success: false, message: 'Minimum withdrawal is 200 ETB.' };
    if (Number(amount) > balance) return { success: false, message: `Insufficient balance. You have ${balance} ETB.` };
    await addDoc(collection(db, 'transactions'), {
      userId, type: 'withdrawal',
      amount: Number(amount),
      status: 'pending',
      bankName, accountNumber,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch(e) { return { success: false, message: e.message }; }
}

export async function getTransactionHistory(userId) {
  try {
    const snap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', userId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
}
