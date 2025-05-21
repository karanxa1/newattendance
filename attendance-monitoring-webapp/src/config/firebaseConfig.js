// src/config/firebaseConfig.js
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration (for temporary use)
const firebaseConfig = {
  apiKey: "AIzaSyDyzx2zbkFltHkxVBE-BSOto_AnWF5CzFk",
  authDomain: "fir-675f5.firebaseapp.com",
  projectId: "fir-675f5",
  storageBucket: "fir-675f5.appspot.com",
  messagingSenderId: "883541718161",
  appId: "1:883541718161:web:e8d4244c19d3187facfb30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };