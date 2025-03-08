const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sheets = require('../config/googleSheets');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');
const { users } = require('./auth');

router.get('/users', authenticate, authorize([ROLES.ADMIN]), (req, res) => {
  const safeUsers = users.map(({ id, username, role }) => ({ id, username, role }));
  res.json(safeUsers);
});

router.post('/users', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, username, password: hashedPassword, role };
    users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

router.put('/users/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  const user = users.find(u => u.id === parseInt(id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!username) return res.status(400).json({ message: 'Username is required' });
  if (users.some(u => u.username === username && u.id !== parseInt(id))) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    user.role = role;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

router.delete('/users/:id', authenticate, authorize([ROLES.ADMIN]), (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === parseInt(id));
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  users.splice(index, 1);
  res.status(204).send();
});

router.post('/classes', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { name, strength } = req.body;
  if (!name || !strength || strength < 1) {
    return res.status(400).json({ message: 'Valid class name and strength are required' });
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Classes!A:A',
    });
    const id = ((response.data.values?.length || 0) + 1).toString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Classes!A:C',
      valueInputOption: 'RAW',
      resource: { values: [[id, name, strength]] }
    });
    res.status(201).json({ id, name, strength });
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).json({ message: 'Failed to add class', error: error.message });
  }
});

router.get('/attendance/:classId', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { classId } = req.params;
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) return res.status(400).json({ message: 'Date range is required' });
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Attendance_${classId}!A:Z`,
    });
    const rows = response.data.values || [];
    const filteredRows = rows.filter(row => {
      const date = row[0];
      return date >= fromDate && date <= toDate;
    });
    res.json(filteredRows.map(row => ({ date: row[0], attendance: row.slice(1) })));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
});

module.exports = router;