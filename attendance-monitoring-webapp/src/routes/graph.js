const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');
const { doc, getDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

router.get('/attendance/:classId', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
    try {
        const { classId } = req.params;
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const classData = classDoc.data();
        const summary = classData.students.map(student => {
            const attendance = student.attendance || [];
            const presentCount = attendance.filter(a => a.status === 'Present').length;
            const absentCount = attendance.length - presentCount;
            return { id: student.id, name: student.name, presentCount, absentCount };
        });

        res.json(summary);
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).json({ message: 'Failed to fetch attendance data', error: error.message });
    }
});

module.exports = router;