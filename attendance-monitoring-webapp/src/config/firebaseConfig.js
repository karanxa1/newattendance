// src/config/firebaseConfig.js
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration (for temporary use)
const firebaseConfig = {
  apiKey: "AIzaSyDQdcFjbtugwpb3SG4J8O6tbOpG1pbHBos",
  authDomain: "mindcare-2d98a.firebaseapp.com",
  projectId: "mindcare-2d98a",
  storageBucket: "mindcare-2d98a.firebasestorage.app",
  messagingSenderId: "734092205516",
  appId: "1:734092205516:web:c46ef2f1be7cfc0ba09169"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };