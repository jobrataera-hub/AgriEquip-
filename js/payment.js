import { db, auth } from '../firebase.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { updatePaymentStatus } from './booking.js';

// ============================================
// TELEBIRR PAYMENT INTEGRATION
// ============================================

export async function initiateTelebirmPayment(bookingId, amount, phoneNumber) {
  try {
    // This is a placeholder for Telebirr integration
    // In production, you'll need:
    // 1. Telebirr merchant account
    // 2. API credentials
    // 3. Server-side verification

    console.log('Initiating Telebirr payment...');
    console.log('Amount:', amount, 'ETB');
    console.log('Phone:', phoneNumber);
    console.log('Booking:', bookingId);

    // TODO: Implement actual Telebirr API call
    // This would typically:
    // 1. Call your backend server
    // 2. Server calls Telebirr API
    // 3. User completes payment on Telebirr
    // 4. Server receives webhook confirmation
    // 5. Update booking payment status

    // For now, return success placeholder
    return {
      success: true,
      message: 'Redirecting to Telebirr payment...',
      bookingId: bookingId
    };
  } catch (error) {
    console.error('Telebirr payment error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CHAPA PAYMENT INTEGRATION
// ============================================

export async function initiateChargePayment(bookingId, amount, email) {
  try {
    // This is a placeholder for Chapa integration
    // Similar to Telebirr, Chapa requires:
    // 1. Merchant account with Chapa
    // 2. API key
    // 3. Server-side handling

    console.log('Initiating Chapa payment...');
    console.log('Amount:', amount, 'ETB');
    console.log('Email:', email);
    console.log('Booking:', bookingId);

    // TODO: Implement actual Chapa API call
    // Similar flow to Telebirr

    return {
      success: true,
      message: 'Redirecting to Chapa payment...',
      bookingId: bookingId
    };
  } catch (error) {
    console.error('Chapa payment error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// RECORD TRANSACTION
// ============================================

export async function recordTransaction(transactionData) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    });

    console.log('Transaction recorded:', docRef.id);
    return { success: true, transactionId: docRef.id };
  } catch (error) {
    console.error('Error recording transaction:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET USER TRANSACTIONS
// ============================================

export async function getUserTransactions() {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// ============================================
// WEBHOOK HANDLER (Server-side, for reference)
// ============================================

// This is a reference for your backend server
// When Telebirr/Chapa calls your webhook with payment confirmation:

/*
export async function handlePaymentWebhook(webhookData) {
  const { bookingId, transactionId, status, amount } = webhookData;
  
  if (status === 'success') {
    // Update booking payment status
    await updatePaymentStatus(bookingId, 'paid', 'telebirr', transactionId);
    
    // Record transaction
    await recordTransaction({
      bookingId: bookingId,
      type: 'booking',
      amount: amount,
      currency: 'ETB',
      paymentMethod: 'telebirr',
      externalTransactionId: transactionId,
      status: 'completed'
    });
  }
}
*/
