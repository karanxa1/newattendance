const express = require('express');
const router = express.Router();
const sheets = require('../config/googleSheets');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

router.get('/classes', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Classes!A2:C',
    });
    const rows = response.data.values || [];
    const classes = rows.map(row => ({ id: row[0], name: row[1], strength: row[2] }));
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
  }
});

router.get('/classes/:classId/students', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
  try {
    const { classId } = req.params;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Class_${classId}!A2:C`,
    });
    const rows = response.data.values || [];
    const students = rows.map(row => ({ id: row[0], name: row[1], rollNumber: row[2] }));
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});

module.exports = router;