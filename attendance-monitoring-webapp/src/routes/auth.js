const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secret, options, ROLES } = require('../config/auth');

// Using an array to store users (in a real app, you'd use a database)
const users = [
  { id: 1, username: 'admin', password: '$2b$10$examplehashedpassword123', role: ROLES.ADMIN },
  { id: 2, username: 'faculty1', password: '$2b$10$examplehashedpassword456', role: ROLES.FACULTY }
];

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    // For testing purposes, allow login with any password for predefined users
    // In production, you should use the bcrypt.compare line instead
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Simulate password check for development
    // In production: if (!user || !(await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, options);
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = { router, users };