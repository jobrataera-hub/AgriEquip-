import { 
  auth, 
  db 
} from '../firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  collection,
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// ============================================
// AUTHENTICATION STATE MANAGEMENT
// ============================================

let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    // User is signed in
    console.log('User logged in:', user.email);
    await updateUIForLoggedInUser();
  } else {
    // User is signed out
    console.log('User logged out');
    updateUIForLoggedOutUser();
  }
});

// ============================================
// REGISTER NEW USER
// ============================================

export async function registerUser(formData) {
  try {
    const { email, password, phoneNumber, displayName, role } = formData;

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: displayName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      displayName: displayName,
      phoneNumber: phoneNumber,
      role: role, // 'renter' or 'owner'
      profilePhoto: null,
      bio: '',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      walletBalance: 0,
      verified: false,
      verificationDate: null
    });

    console.log('User registered successfully:', user.email);
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LOGIN USER
// ============================================

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User logged in:', user.email);
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LOGOUT USER
// ============================================

export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('User logged out');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET CURRENT USER DATA
// ============================================

export async function getCurrentUserData() {
  if (!currentUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  return null;
}

// ============================================
// UI STATE UPDATES
// ============================================

async function updateUIForLoggedInUser() {
  const authButtons = document.querySelector('.auth-buttons');
  const userMenu = document.querySelector('.user-menu');
  const loginBtn = document.querySelector('.login-btn');
  const registerBtn = document.querySelector('.register-btn');

  if (authButtons) {
    authButtons.style.display = 'none';
  }
  if (userMenu) {
    userMenu.style.display = 'flex';
    const userData = await getCurrentUserData();
    if (userData) {
      const userNameEl = userMenu.querySelector('.user-name');
      if (userNameEl) {
        userNameEl.textContent = userData.displayName || currentUser.email;
      }
    }
  }
  
  // Hide login/register pages
  if (loginBtn) loginBtn.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'none';
  
  // Show dashboard if exists
  const dashboard = document.querySelector('.dashboard');
  if (dashboard) {
    dashboard.style.display = 'block';
  }
}

function updateUIForLoggedOutUser() {
  const authButtons = document.querySelector('.auth-buttons');
  const userMenu = document.querySelector('.user-menu');
  
  if (authButtons) {
    authButtons.style.display = 'flex';
  }
  if (userMenu) {
    userMenu.style.display = 'none';
  }
}

// ============================================
// FORM HANDLERS
// ============================================

// Register form handler
if (document.querySelector('#registerForm')) {
  document.querySelector('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirmPassword').value;
    const phoneNumber = document.querySelector('#phone').value;
    const displayName = document.querySelector('#name').value;
    const role = document.querySelector('#role').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const result = await registerUser({
      email,
      password,
      phoneNumber,
      displayName,
      role
    });

    if (result.success) {
      alert('Registration successful! Redirecting to dashboard...');
      window.location.href = '/dashboard.html';
    } else {
      alert('Registration failed: ' + result.error);
    }
  });
}

// Login form handler
if (document.querySelector('#loginForm')) {
  document.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    const result = await loginUser(email, password);

    if (result.success) {
      alert('Login successful! Redirecting...');
      window.location.href = '/dashboard.html';
    } else {
      alert('Login failed: ' + result.error);
    }
  });
}

// Logout handler
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const result = await logoutUser();
    if (result.success) {
      window.location.href = '/';
    }
  });
}

export { currentUser };
