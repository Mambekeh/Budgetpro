// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGk3L_fevBx-wF4Fk_yb4opzmDOS5w4hA",
  authDomain: "esr-budget-app.firebaseapp.com",
  projectId: "esr-budget-app",
  storageBucket: "esr-budget-app.firebasestorage.app",
  messagingSenderId: "634091814776",
  appId: "1:634091814776:web:29b2230213eed316bc528d",
  measurementId: "G-CVPRTJJS76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;