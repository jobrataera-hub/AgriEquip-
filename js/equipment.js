import { db, storage, auth } from '../firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

// ============================================
// LIST EQUIPMENT (for browsing)
// ============================================

export async function getAvailableEquipment(category = null) {
  try {
    let q;
    if (category) {
      q = query(
        collection(db, 'equipment'),
        where('category', '==', category),
        where('availability', '==', 'available'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'equipment'),
        where('availability', '==', 'available'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
    
    const snapshot = await getDocs(q);
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
// GET EQUIPMENT BY OWNER
// ============================================

export async function getOwnerEquipment(ownerId) {
  try {
    const q = query(
      collection(db, 'equipment'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const equipment = [];
    snapshot.forEach(doc => {
      equipment.push({ id: doc.id, ...doc.data() });
    });
    return equipment;
  } catch (error) {
    console.error('Error fetching owner equipment:', error);
    return [];
  }
}

// ============================================
// GET SINGLE EQUIPMENT
// ============================================

export async function getEquipmentById(equipmentId) {
  try {
    const docSnap = await getDoc(doc(db, 'equipment', equipmentId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return null;
  }
}

// ============================================
// ADD NEW EQUIPMENT
// ============================================

export async function addEquipment(equipmentData, photoFiles = []) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    // Upload photos if provided
    const photoUrls = [];
    for (let file of photoFiles) {
      const storageRef = ref(storage, `equipment/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      photoUrls.push(url);
    }

    // Create equipment document
    const docRef = await addDoc(collection(db, 'equipment'), {
      ...equipmentData,
      ownerId: auth.currentUser.uid,
      photos: photoUrls,
      reviews: 0,
      totalBookings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Equipment added:', docRef.id);
    return { success: true, equipmentId: docRef.id };
  } catch (error) {
    console.error('Error adding equipment:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// UPDATE EQUIPMENT
// ============================================

export async function updateEquipment(equipmentId, updates) {
  try {
    const equipmentRef = doc(db, 'equipment', equipmentId);
    await updateDoc(equipmentRef, {
      ...updates,
      updatedAt: new Date()
    });
    console.log('Equipment updated:', equipmentId);
    return { success: true };
  } catch (error) {
    console.error('Error updating equipment:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// DELETE EQUIPMENT
// ============================================

export async function deleteEquipment(equipmentId) {
  try {
    await deleteDoc(doc(db, 'equipment', equipmentId));
    console.log('Equipment deleted:', equipmentId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SEARCH EQUIPMENT
// ============================================

export async function searchEquipment(searchTerm, category = null) {
  try {
    const allEquipment = await getAvailableEquipment(category);
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allEquipment.filter(item => 
      item.name.toLowerCase().includes(lowerSearchTerm) ||
      item.description.toLowerCase().includes(lowerSearchTerm) ||
      item.location.city.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching equipment:', error);
    return [];
  }
}
