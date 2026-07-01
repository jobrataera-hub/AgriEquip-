import { db, auth } from '../firebase.js';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Check if user is admin (requires custom claims set in Firebase Console)
export async function isAdmin() {
  if (!auth.currentUser) return false;
  const idTokenResult = await auth.currentUser.getIdTokenResult();
  return idTokenResult.claims.admin === true;
}

// ============================================
// GET ALL USERS (Admin only)
// ============================================

export async function getAllUsers() {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const snapshot = await getDocs(collection(db, 'users'));
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// ============================================
// GET ALL BOOKINGS (Admin only)
// ============================================

export async function getAllBookings() {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const snapshot = await getDocs(collection(db, 'bookings'));
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

// ============================================
// GET ALL EQUIPMENT (Admin only)
// ============================================

export async function getAllEquipment() {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const snapshot = await getDocs(collection(db, 'equipment'));
    const equipment = [];
    snapshot.forEach(doc => {
      equipment.push({ id: doc.id, ...doc.data() });
    });
    return equipment;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
}

// ============================================
// GET DASHBOARD METRICS (Admin only)
// ============================================

export async function getDashboardMetrics() {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const users = await getDocs(collection(db, 'users'));
    const equipment = await getDocs(collection(db, 'equipment'));
    const bookings = await getDocs(collection(db, 'bookings'));
    const transactions = await getDocs(collection(db, 'transactions'));

    let totalRevenue = 0;
    let completedBookings = 0;
    let avgBookingValue = 0;

    bookings.forEach(doc => {
      const booking = doc.data();
      if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
        totalRevenue += booking.commission || 0;
        completedBookings++;
      }
    });

    avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalUsers: users.size,
      totalEquipment: equipment.size,
      totalBookings: bookings.size,
      completedBookings: completedBookings,
      totalRevenue: totalRevenue,
      avgBookingValue: Math.round(avgBookingValue),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }
}

// ============================================
// VERIFY EQUIPMENT (Admin only)
// ============================================

export async function verifyEquipment(equipmentId) {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const equipmentRef = doc(db, 'equipment', equipmentId);
    await updateDoc(equipmentRef, {
      verified: true,
      verifiedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error verifying equipment:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// VERIFY USER (Admin only)
// ============================================

export async function verifyUser(userId) {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      verified: true,
      verificationDate: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error verifying user:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SUSPEND USER (Admin only)
// ============================================

export async function suspendUser(userId, reason) {
  try {
    if (!await isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      suspended: true,
      suspensionReason: reason,
      suspendedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }
}
