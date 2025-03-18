const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');
const { doc, getDoc, updateDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

router.post('/attendance', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
    try {
        const { classId, date, presentStudents } = req.body;
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const classData = classDoc.data();
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        const updatedStudents = classData.students.map(student => {
            const isPresent = presentStudents.includes(student.id.toString());
            student.attendance = student.attendance || [];
            student.attendance.push({
                date: attendanceDate,
                status: isPresent ? 'Present' : 'Absent'
            });
            return student;
        });

        await updateDoc(doc(db, 'classes', classId), { students: updatedStudents });
        res.json({ message: 'Attendance recorded successfully' });
    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ message: 'Failed to record attendance', error: error.message });
    }
});

router.get('/attendance/:classId', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
    try {
        const { classId } = req.params;
        const { fromDate, toDate } = req.query;
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const classData = classDoc.data();
        const report = classData.students.map(student => {
            const attendanceRecords = (student.attendance || []).filter(a => {
                const recordDate = new Date(a.date).toISOString().split('T')[0];
                return (!fromDate || recordDate >= fromDate) && (!toDate || recordDate <= toDate);
            });
            return {
                date: attendanceRecords.map(a => a.date),
                attendance: attendanceRecords.map(a => `${student.name} (${a.status})`)
            };
        });

        res.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
});

module.exports = router;