import { auth, db } from '../firebase.js';
import { getCurrentUserData, logoutUser } from './auth.js';
import { getAvailableEquipment, getOwnerEquipment, addEquipment } from './equipment.js';
import { getUserBookings, getOwnerBookings, createBooking, checkEquipmentAvailability } from './booking.js';
import { getUserTransactions } from './payment.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

let currentUser = null;
let allEquipment = [];
let selectedEquipmentForBooking = null;

// ============================================
// INITIALIZATION
// ============================================

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  currentUser = user;
  await initializeDashboard();
});

async function initializeDashboard() {
  // Load user data
  const userData = await getCurrentUserData();
  
  // Update header
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('profileName').textContent = userData.displayName || 'User';
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent = userData.role === 'owner' ? 'Owner' : 'Renter';

  // Fill profile form
  document.getElementById('fullName').value = userData.displayName || '';
  document.getElementById('phoneNumber').value = userData.phoneNumber || '';
  document.getElementById('address').value = userData.address || '';
  document.getElementById('bio').value = userData.bio || '';

  // Load initial data
  await loadDashboardStats();
  await loadEquipment();
  setupEventListeners();
}

// ============================================
// NAVIGATION
// ============================================

function setupEventListeners() {
  // Section navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      
      // Update active state
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Logout
  document.querySelector('.logout-btn').addEventListener('click', async () => {
    await logoutUser();
    window.location.href = '/';
  });

  // Profile form submission
  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

  // Equipment modal
  setupEquipmentModal();
  setupBookingModal();
  setupFilters();
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  
  // Show selected section
  const section = document.getElementById(`${sectionName}-section`);
  if (section) {
    section.classList.add('active');
    
    // Update page title
    const titles = {
      home: 'Welcome to AgriEquip',
      browse: 'Browse Equipment',
      bookings: 'My Bookings',
      listings: 'My Equipment',
      profile: 'My Profile',
      earnings: 'Earnings & Transactions'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'AgriEquip';
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
  try {
    const userData = await getCurrentUserData();
    const userBookings = await getUserBookings();
    const ownerBookings = userData.role === 'owner' ? await getOwnerBookings() : [];
    const ownerEquipment = userData.role === 'owner' ? await getOwnerEquipment(currentUser.uid) : [];

    // Calculate stats
    const activeBookings = userBookings.filter(b => b.status === 'active').length;
    let totalEarnings = 0;
    
    ownerBookings.forEach(booking => {
      if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
        totalEarnings += booking.ownerEarnings || 0;
      }
    });

    document.getElementById('totalBookings').textContent = userBookings.length;
    document.getElementById('activeBookings').textContent = activeBookings;
    document.getElementById('earnings').textContent = totalEarnings + ' ETB';
    document.getElementById('equipment').textContent = ownerEquipment.length;
    document.getElementById('totalEarnings').textContent = totalEarnings + ' ETB';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ============================================
// EQUIPMENT BROWSING
// ============================================

async function loadEquipment() {
  try {
    allEquipment = await getAvailableEquipment();
    renderEquipment(allEquipment);
  } catch (error) {
    console.error('Error loading equipment:', error);
  }
}

function renderEquipment(equipment) {
  const grid = document.getElementById('equipmentGrid');
  grid.innerHTML = '';

  if (equipment.length === 0) {
    grid.innerHTML = '<p class="no-items">No equipment available</p>';
    return;
  }

  equipment.forEach(item => {
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.innerHTML = `
      <div class="equipment-image">
        <img src="${item.photos[0] || 'https://via.placeholder.com/300x200'}" alt="${item.name}">
      </div>
      <div class="equipment-info">
        <h3>${item.name}</h3>
        <p class="category">${item.category}</p>
        <p class="location">📍 ${item.location.city}</p>
        <p class="description">${item.description.substring(0, 100)}...</p>
        <div class="equipment-footer">
          <span class="price">${item.pricePerDay} ETB/day</span>
          <button class="btn btn-small" onclick="bookEquipment('${item.id}')">Book Now</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.bookEquipment = function(equipmentId) {
  selectedEquipmentForBooking = equipmentId;
  document.getElementById('bookingModal').style.display = 'block';
};

// ============================================
// FILTERS
// ============================================

function setupFilters() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allEquipment.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
    renderEquipment(filtered);
  });

  document.getElementById('categoryFilter').addEventListener('change', async (e) => {
    const category = e.target.value;
    const filtered = category ? allEquipment.filter(item => item.category === category) : allEquipment;
    renderEquipment(filtered);
  });
}

// ============================================
// EQUIPMENT MODAL
// ============================================

function setupEquipmentModal() {
  const modal = document.getElementById('addEquipmentModal');
  const btn = document.getElementById('addEquipmentBtn');
  const closeBtn = modal.querySelector('.close-modal');

  btn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('addEquipmentForm').addEventListener('submit', handleAddEquipment);
}

async function handleAddEquipment(e) {
  e.preventDefault();
  
  const equipmentData = {
    name: document.getElementById('equipmentName').value,
    category: document.getElementById('equipmentCategory').value,
    description: document.getElementById('equipmentDescription').value,
    pricePerDay: parseInt(document.getElementById('pricePerDay').value),
    location: {
      city: document.getElementById('equipmentLocation').value,
      latitude: 9.0320, // Default to Addis Ababa, can be updated with geolocation
      longitude: 38.7469
    },
    availability: 'available',
    specifications: {}
  };

  const photoFiles = document.getElementById('equipmentPhotos').files;
  
  const result = await addEquipment(equipmentData, Array.from(photoFiles));
  
  if (result.success) {
    alert('Equipment added successfully!');
    document.getElementById('addEquipmentModal').style.display = 'none';
    document.getElementById('addEquipmentForm').reset();
    await loadEquipment();
  } else {
    alert('Error adding equipment: ' + result.error);
  }
}

// ============================================
// BOOKING MODAL
// ============================================

function setupBookingModal() {
  const modal = document.getElementById('bookingModal');
  const closeBtn = modal.querySelector('.close-modal');

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('bookingForm').addEventListener('submit', handleBooking);

  // Calculate price on date change
  document.getElementById('startDate').addEventListener('change', calculateBookingPrice);
  document.getElementById('endDate').addEventListener('change', calculateBookingPrice);
}

function calculateBookingPrice() {
  if (!selectedEquipmentForBooking) return;
  
  const equipment = allEquipment.find(e => e.id === selectedEquipmentForBooking);
  if (!equipment) return;

  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  
  if (startDate && endDate && startDate < endDate) {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = days * equipment.pricePerDay;
    document.getElementById('totalPriceDisplay').textContent = totalPrice + ' ETB';
  }
}

async function handleBooking(e) {
  e.preventDefault();
  
  if (!selectedEquipmentForBooking) return;

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const notes = document.getElementById('bookingNotes').value;

  // Check availability
  const availability = await checkEquipmentAvailability(selectedEquipmentForBooking, startDate, endDate);
  if (!availability.available) {
    alert('Equipment not available: ' + availability.reason);
    return;
  }

  // Calculate total price
  const equipment = allEquipment.find(e => e.id === selectedEquipmentForBooking);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = days * equipment.pricePerDay;

  const result = await createBooking({
    equipmentId: selectedEquipmentForBooking,
    startDate: startDate,
    endDate: endDate,
    totalPrice: totalPrice,
    notes: notes
  });

  if (result.success) {
    alert('Booking created! Now proceed to payment.');
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingForm').reset();
  } else {
    alert('Error creating booking: ' + result.error);
  }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

async function handleProfileUpdate(e) {
  e.preventDefault();
  // TODO: Implement profile update to Firestore
  alert('Profile update not yet connected to backend');
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  const addModal = document.getElementById('addEquipmentModal');
  const bookingModal = document.getElementById('bookingModal');
  
  if (e.target === addModal) addModal.style.display = 'none';
  if (e.target === bookingModal) bookingModal.style.display = 'none';
});
