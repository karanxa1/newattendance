const express = require('express');
const router = express.Router();
const sheets = require('../config/googleSheets');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

router.post('/attendance', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
  try {
    const { classId, date, presentStudents } = req.body;
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Attendance_${classId}!A:A`,
    });
    const dates = checkResponse.data.values || [];
    let rowIndex = dates.findIndex(row => row[0] === date);

    const studentsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Class_${classId}!A2:A`,
    });
    const students = studentsResponse.data.values || [];
    const attendanceData = students.map(student => {
      const studentId = student[0];
      return presentStudents.includes(studentId) ? 'Present' : 'Absent';
    });
    attendanceData.unshift(date);

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `Attendance_${classId}!A:Z`,
        valueInputOption: 'RAW',
        resource: { values: [attendanceData] }
      });
    } else {
      rowIndex += 1; // Adjust for 1-based index and header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Attendance_${classId}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'RAW',
        resource: { values: [attendanceData] }
      });
    }
    res.json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
});

module.exports = router;