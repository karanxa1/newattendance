const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sheets = require('../config/googleSheets');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');
const { users } = require('./auth');

// Simple logging utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err)
};

// Get all users
router.get('/users', authenticate, authorize([ROLES.ADMIN]), (req, res) => {
  const safeUsers = users.map(({ id, username, role }) => ({ id, username, role }));
  log.info('Fetching user list');
  res.json(safeUsers);
});

// Create a new user
router.post('/users', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    log.info('User creation failed: Missing username or password');
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (users.some(u => u.username === username)) {
    log.info(`User creation failed: Username ${username} already exists`);
    return res.status(400).json({ message: 'Username already exists' });
  }
  if (!Object.values(ROLES).includes(role)) {
    log.info(`User creation failed: Invalid role ${role}`);
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, username, password: hashedPassword, role };
    users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    log.info(`User created: ${username} (${role})`);
    res.status(201).json(safeUser);
  } catch (error) {
    log.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// Update a user
router.put('/users/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  const user = users.find(u => u.id === parseInt(id));
  if (!user) {
    log.info(`User update failed: User ID ${id} not found`);
    return res.status(404).json({ message: 'User not found' });
  }
  if (!username) {
    log.info('User update failed: Username is required');
    return res.status(400).json({ message: 'Username is required' });
  }
  if (users.some(u => u.username === username && u.id !== parseInt(id))) {
    log.info(`User update failed: Username ${username} already exists`);
    return res.status(400).json({ message: 'Username already exists' });
  }
  if (!Object.values(ROLES).includes(role)) {
    log.info(`User update failed: Invalid role ${role}`);
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    user.role = role;
    const { password: _, ...safeUser } = user;
    log.info(`User updated: ID ${id} to ${username} (${role})`);
    res.json(safeUser);
  } catch (error) {
    log.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete a user
router.delete('/users/:id', authenticate, authorize([ROLES.ADMIN]), (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === parseInt(id));
  if (index === -1) {
    log.info(`User deletion failed: User ID ${id} not found`);
    return res.status(404).json({ message: 'User not found' });
  }
  users.splice(index, 1);
  log.info(`User deleted: ID ${id}`);
  res.status(204).send();
});

// Create a new class (enhanced)
router.post('/classes', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { name, strength } = req.body;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // Validation
  if (!name || !name.trim()) {
    log.info('Class creation failed: Class name is required');
    return res.status(400).json({ message: 'Class name is required' });
  }
  if (!Number.isInteger(Number(strength)) || strength < 1 || strength > 1000) {
    log.info('Class creation failed: Strength must be a positive integer between 1 and 1000');
    return res.status(400).json({ message: 'Strength must be a positive integer between 1 and 1000' });
  }
  if (!spreadsheetId) {
    log.error('Class creation failed: SPREADSHEET_ID not configured');
    return res.status(500).json({ message: 'Server configuration error: Spreadsheet ID missing' });
  }

  try {
    // Check and initialize Classes sheet
    let classesResponse;
    try {
      classesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Classes!A2:C', // Skip header
      });
    } catch (err) {
      if (err.code === 400 || err.message.includes('Unable to parse range')) {
        log.info('Initializing Classes sheet with headers');
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Classes!A1:C1',
          valueInputOption: 'RAW',
          resource: { values: [['ID', 'Name', 'Strength']] }
        });
        classesResponse = { data: { values: [] } };
      } else {
        throw err;
      }
    }

    const existingClasses = classesResponse.data.values || [];
    const nextId = (existingClasses.length + 1).toString();

    // Prevent duplicate class names
    if (existingClasses.some(row => row[1].toLowerCase() === name.toLowerCase())) {
      log.info(`Class creation failed: Class name ${name} already exists`);
      return res.status(400).json({ message: 'A class with this name already exists' });
    }

    // Add class to Classes sheet
    const newClass = [nextId, name, strength.toString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Classes!A:C',
      valueInputOption: 'RAW',
      resource: { values: [newClass] }
    });

    // Initialize student sheet (Class_<id>)
    const studentSheetName = `Class_${nextId}`;
    try {
      await sheets.spreadsheets.values.get({ spreadsheetId, range: `${studentSheetName}!A1` });
    } catch (err) {
      if (err.code === 400 || err.message.includes('Unable to parse range')) {
        log.info(`Creating student sheet: ${studentSheetName}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${studentSheetName}!A1:C1`,
          valueInputOption: 'RAW',
          resource: { values: [['ID', 'Name', 'Roll Number']] }
        });
        const studentData = Array.from({ length: strength }, (_, i) => [
          (i + 1).toString(),
          `Student ${i + 1}`,
          `ROLL${nextId}${String(i + 1).padStart(3, '0')}`
        ]);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${studentSheetName}!A:C`,
          valueInputOption: 'RAW',
          resource: { values: studentData }
        });
      } else {
        throw err;
      }
    }

    // Initialize attendance sheet (Attendance_<id>)
    const attendanceSheetName = `Attendance_${nextId}`;
    try {
      await sheets.spreadsheets.values.get({ spreadsheetId, range: `${attendanceSheetName}!A1` });
    } catch (err) {
      if (err.code === 400 || err.message.includes('Unable to parse range')) {
        log.info(`Creating attendance sheet: ${attendanceSheetName}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${attendanceSheetName}!A1:A1`,
          valueInputOption: 'RAW',
          resource: { values: [['Date']] }
        });
      } else {
        throw err;
      }
    }

    log.info(`Class created: ${name} (ID: ${nextId}, Strength: ${strength}) with student and attendance sheets`);
    res.status(201).json({ id: nextId, name, strength });
  } catch (error) {
    log.error('Error adding class:', error);
    res.status(500).json({
      message: 'Failed to add class',
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Get attendance report
router.get('/attendance/:classId', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { classId } = req.params;
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) {
    log.info('Attendance fetch failed: Date range required');
    return res.status(400).json({ message: 'Date range is required' });
  }
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
    log.info(`Attendance fetched for class ${classId} from ${fromDate} to ${toDate}`);
    res.json(filteredRows.map(row => ({ date: row[0], attendance: row.slice(1) })));
  } catch (error) {
    log.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
});

// Edit a class (bonus)
router.put('/classes/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { id } = req.params;
  const { name, strength } = req.body;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!name || !name.trim()) return res.status(400).json({ message: 'Class name is required' });
  if (!Number.isInteger(Number(strength)) || strength < 1 || strength > 1000) {
    return res.status(400).json({ message: 'Strength must be a positive integer between 1 and 1000' });
  }

  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Classes!A2:C' });
    const classes = response.data.values || [];
    const rowIndex = classes.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      log.info(`Class update failed: Class ID ${id} not found`);
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classes.some((row, idx) => row[1].toLowerCase() === name.toLowerCase() && idx !== rowIndex)) {
      log.info(`Class update failed: Class name ${name} already exists`);
      return res.status(400).json({ message: 'A class with this name already exists' });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Classes!A${rowIndex + 2}:C${rowIndex + 2}`,
      valueInputOption: 'RAW',
      resource: { values: [[id, name, strength.toString()]] }
    });

    log.info(`Class updated: ID ${id} to ${name} (Strength: ${strength})`);
    res.json({ id, name, strength });
  } catch (error) {
    log.error('Error updating class:', error);
    res.status(500).json({ message: 'Failed to update class', error: error.message });
  }
});

// Delete a class (bonus)
router.delete('/classes/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
  const { id } = req.params;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Classes!A2:C' });
    const classes = response.data.values || [];
    const rowIndex = classes.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      log.info(`Class deletion failed: Class ID ${id} not found`);
      return res.status(404).json({ message: 'Class not found' });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Classes!A${rowIndex + 2}:C${rowIndex + 2}`
    });

    log.info(`Class deleted: ID ${id}`);
    res.status(204).send();
  } catch (error) {
    log.error('Error deleting class:', error);
    res.status(500).json({ message: 'Failed to delete class', error: error.message });
  }
});

module.exports = router;