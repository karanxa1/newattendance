const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secret, options, ROLES } = require('../config/auth');

const users = [
  { id: 1, username: 'admin', password: '$2b$10$examplehashedpassword123', role: ROLES.ADMIN },
  { id: 2, username: 'faculty1', password: '$2b$10$examplehashedpassword456', role: ROLES.FACULTY }
];

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, options);
  res.json({ token, role: user.role });
});

module.exports = { router, users };