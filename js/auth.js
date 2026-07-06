import { auth } from '../firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      message.style.color = 'green';
      message.textContent = 'Registered! Check your email to verify.';
    } catch (error) {
      message.style.color = 'red';
      message.textContent = error.message;
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (error) {
      message.style.color = 'red';
      message.textContent = error.message;
    }
  });
}
