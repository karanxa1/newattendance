const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { sheets, auth } = require('../config/googleSheets');
const { db } = require('../config/firebaseConfig');
const { doc, getDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

// Export attendance data to Google Sheets
router.post('/export-to-sheets', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { classId, fromDate, toDate, sheetName, email, spreadsheetId } = req.body;
        
        // Validate required parameters
        if (!classId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'Class ID, from date, and to date are required' });
        }

        // Get class data
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const classData = classDoc.data();
        const className = classData.name || 'Attendance';
        
        // Filter attendance records based on date range
        const attendanceData = classData.students.map(student => {
            const filteredAttendance = (student.attendance || []).filter(a => {
                const recordDate = new Date(a.date).toISOString().split('T')[0];
                return (!fromDate || recordDate >= fromDate) && (!toDate || recordDate <= toDate);
            });
            
            return {
                id: student.id,
                name: student.name,
                attendance: filteredAttendance
            };
        });

        // Use provided spreadsheetId or create a new spreadsheet
        let finalSpreadsheetId = spreadsheetId;
        
        if (!finalSpreadsheetId) {
            // Create a new spreadsheet if no ID was provided
            const spreadsheetTitle = `${className} Attendance Report (${fromDate} to ${toDate})`;
            const spreadsheet = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: spreadsheetTitle
                    },
                    sheets: [
                        {
                            properties: {
                                title: sheetName || 'Attendance Data'
                            }
                        }
                    ]
                }
            });
            
            finalSpreadsheetId = spreadsheet.data.spreadsheetId;
        }
        
        // Prepare data for the spreadsheet
        // First, collect all unique dates from all students' attendance records
        const allDates = new Set();
        attendanceData.forEach(student => {
            student.attendance.forEach(record => {
                allDates.add(record.date);
            });
        });
        
        // Sort dates chronologically
        const sortedDates = Array.from(allDates).sort();
        
        // Create header row with student names and dates
        const headerRow = ['Student ID', 'Student Name', ...sortedDates];
        
        // Create data rows for each student
        const dataRows = attendanceData.map(student => {
            const row = [student.id, student.name];
            
            // For each date, check if the student was present
            sortedDates.forEach(date => {
                const attendanceRecord = student.attendance.find(a => a.date === date);
                row.push(attendanceRecord ? attendanceRecord.status : 'N/A');
            });
            
            return row;
        });
        
        // Combine header and data rows
        const values = [headerRow, ...dataRows];
        
        // Update the spreadsheet with the data
        await sheets.spreadsheets.values.update({
            spreadsheetId: finalSpreadsheetId,
            range: 'A1',
            valueInputOption: 'RAW',
            requestBody: {
                values
            }
        });
        
        // Share the spreadsheet with the user
        try {
            // Use the Drive API to set permissions
            const drive = google.drive({ version: 'v3', auth });
            
            // Get the user's email from the request or use a configured email
            const userEmail = email || req.user.email || process.env.USER_EMAIL;
            
            if (userEmail) {
                await drive.permissions.create({
                    fileId: finalSpreadsheetId,
                    requestBody: {
                        type: 'user',
                        role: 'writer',
                        emailAddress: userEmail
                    },
                    fields: 'id'
                });
                console.log(`Spreadsheet shared with ${userEmail}`);
            } else {
                console.warn('No user email provided for sharing the spreadsheet');
            }
        } catch (shareError) {
            console.error('Error sharing spreadsheet:', shareError);
            // Continue even if sharing fails - at least the spreadsheet was created
        }
        
        // Get the spreadsheet URL
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`;
        
        res.json({
            message: 'Attendance data exported to Google Sheets successfully',
            spreadsheetId: finalSpreadsheetId,
            spreadsheetUrl
        });
    } catch (error) {
        console.error('Error exporting to Google Sheets:', error);
        
        // Provide more detailed error information for debugging
        let errorMessage = 'Failed to export to Google Sheets';
        let statusCode = 500;
        
        // Check for specific Google API errors
        if (error.code === 401 || error.code === 403) {
            errorMessage = 'Authentication error with Google API. Please check your credentials.';
            statusCode = 401;
        } else if (error.code === 404) {
            errorMessage = 'Spreadsheet not found. Please check the spreadsheet ID.';
            statusCode = 404;
        } else if (error.errors && error.errors.length > 0) {
            // Extract more specific error information from Google API response
            errorMessage = `Google API Error: ${error.errors[0].message}`;
        }
        
        res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: error.stack
        })
    }
});

module.exports = router;