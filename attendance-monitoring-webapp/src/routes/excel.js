const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { db } = require('../config/firebaseConfig');
const { doc, getDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

// Export attendance data to Excel
router.post('/export-to-excel', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { classId, fromDate, toDate } = req.body;
        
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

        // Prepare data for the Excel file
        // First, collect all unique dates from all students' attendance records
        const allDates = new Set();
        attendanceData.forEach(student => {
            student.attendance.forEach(record => {
                allDates.add(record.date);
            });
        });
        
        // Sort dates chronologically
        const sortedDates = Array.from(allDates).sort();
        
        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Attendance Monitoring System';
        workbook.lastModifiedBy = 'Attendance Monitoring System';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        const worksheet = workbook.addWorksheet('Attendance Data', {
            properties: { tabColor: { argb: '4F81BD' } }
        });
        
        // Add header row with student names and dates
        const headerRow = ['Student ID', 'Student Name', ...sortedDates];
        worksheet.addRow(headerRow);
        
        // Style the header row
        const headerRowCells = worksheet.getRow(1);
        headerRowCells.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '4F81BD' }
            };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Add data rows for each student
        attendanceData.forEach(student => {
            const rowData = [student.id, student.name];
            
            // For each date, check if the student was present
            sortedDates.forEach(date => {
                const attendanceRecord = student.attendance.find(a => a.date === date);
                rowData.push(attendanceRecord ? attendanceRecord.status : 'N/A');
            });
            
            worksheet.addRow(rowData);
        });
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${className}_Attendance_${fromDate}_to_${toDate}.xlsx"`);
        
        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        
        // Provide more detailed error information for debugging
        let errorMessage = 'Failed to export to Excel';
        let statusCode = 500;
        
        res.status(statusCode).json({ 
            message: errorMessage, 
            error: error.message,
            details: error.stack
        });
    }
});

module.exports = router;