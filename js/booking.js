import { db, auth } from '../firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getEquipmentById, updateEquipment } from './equipment.js';

// ============================================
// CREATE BOOKING
// ============================================

export async function createBooking(bookingData) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    const { equipmentId, startDate, endDate, totalPrice } = bookingData;
    const equipment = await getEquipmentById(equipmentId);
    
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Calculate commission (10%)
    const commission = Math.round(totalPrice * 0.1);
    const ownerEarnings = totalPrice - commission;

    // Create booking
    const docRef = await addDoc(collection(db, 'bookings'), {
      equipmentId: equipmentId,
      equipmentName: equipment.name,
      ownerId: equipment.ownerId,
      renterId: auth.currentUser.uid,
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(end),
      durationDays: durationDays,
      pricePerDay: equipment.pricePerDay,
      totalPrice: totalPrice,
      commission: commission,
      ownerEarnings: ownerEarnings,
      status: 'pending', // pending, confirmed, active, completed, cancelled
      paymentStatus: 'unpaid', // unpaid, paid, refunded
      paymentMethod: null,
      transactionId: null,
      rentalTerms: '',
      notes: bookingData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Booking created:', docRef.id);
    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET USER BOOKINGS (as renter)
// ============================================

export async function getUserBookings() {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    const q = query(
      collection(db, 'bookings'),
      where('renterId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
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
// GET OWNER BOOKINGS
// ============================================

export async function getOwnerBookings() {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    const q = query(
      collection(db, 'bookings'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    return bookings;
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return [];
  }
}

// ============================================
// UPDATE BOOKING STATUS
// ============================================

export async function updateBookingStatus(bookingId, status) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: status,
      updatedAt: new Date()
    });
    console.log('Booking status updated:', bookingId, status);
    return { success: true };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// UPDATE PAYMENT STATUS
// ============================================

export async function updatePaymentStatus(bookingId, paymentStatus, paymentMethod, transactionId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      updatedAt: new Date()
    });
    console.log('Payment status updated:', bookingId, paymentStatus);
    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET BOOKING BY ID
// ============================================

export async function getBookingById(bookingId) {
  try {
    const docSnap = await getDoc(doc(db, 'bookings', bookingId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

// ============================================
// CHECK EQUIPMENT AVAILABILITY
// ============================================

export async function checkEquipmentAvailability(equipmentId, startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const q = query(
      collection(db, 'bookings'),
      where('equipmentId', '==', equipmentId),
      where('status', 'in', ['confirmed', 'active'])
    );
    
    const snapshot = await getDocs(q);
    
    for (let doc of snapshot.docs) {
      const booking = doc.data();
      const bookingStart = booking.startDate.toDate();
      const bookingEnd = booking.endDate.toDate();
      
      // Check if dates overlap
      if (start < bookingEnd && end > bookingStart) {
        return { available: false, reason: 'Equipment booked during this period' };
      }
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, reason: 'Error checking availability' };
  }
}
