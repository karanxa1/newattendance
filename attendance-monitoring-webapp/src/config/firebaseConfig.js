// src/config/firebaseConfig.js
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration
// For production, these values should be set as environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDyzx2zbkFltHkxVBE-BSOto_AnWF5CzFk",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fir-675f5.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "fir-675f5",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fir-675f5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "883541718161",
  appId: process.env.FIREBASE_APP_ID || "1:883541718161:web:e8d4244c19d3187facfb30",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-7W3P8TY0GJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };