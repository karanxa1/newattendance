const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

router.get('/classes', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
    try {
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const classes = classesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            strength: doc.data().strength
        }));
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Failed to fetch classes', error: error.message });
    }
});

router.get('/classes/:classId/students', authenticate, authorize([ROLES.ADMIN, ROLES.FACULTY]), async (req, res) => {
    try {
        const { classId } = req.params;
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const students = classDoc.data().students.map(student => ({
            id: student.id,
            name: student.name,
            rollNumber: student.id
        }));
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
});

router.post('/admin/classes', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { name, strength } = req.body;
        if (!name || !strength || strength <= 0) {
            return res.status(400).json({ error: 'Invalid class name or strength' });
        }

        const students = Array.from({ length: strength }, (_, i) => ({
            id: i + 1,
            name: `Student ${i + 1}`,
            attendance: []
        }));

        const classData = {
            name,
            strength,
            students,
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'classes', name), classData);
        res.status(201).json({ id: name, name, strength });
    } catch (error) {
        console.error('Error adding class:', error);
        res.status(500).json({ message: 'Failed to add class', error: error.message });
    }
});

// Update a class
router.put('/admin/classes/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, strength } = req.body;
        
        if (!name || !strength || strength <= 0) {
            return res.status(400).json({ error: 'Invalid class name or strength' });
        }
        
        const classRef = doc(db, 'classes', id);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }
        
        const classData = classDoc.data();
        const currentStudents = classData.students || [];
        
        // Adjust the number of students based on the new strength
        let students = currentStudents;
        if (strength > currentStudents.length) {
            // Add more students
            const newStudents = Array.from({ length: strength - currentStudents.length }, (_, i) => ({
                id: currentStudents.length + i + 1,
                name: `Student ${currentStudents.length + i + 1}`,
                attendance: []
            }));
            students = [...currentStudents, ...newStudents];
        } else if (strength < currentStudents.length) {
            // Remove excess students
            students = currentStudents.slice(0, strength);
        }
        
        await updateDoc(classRef, {
            name,
            strength,
            students,
            updatedAt: new Date().toISOString()
        });
        
        res.json({ id, name, strength });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ message: 'Failed to update class', error: error.message });
    }
});

// Delete a class
router.delete('/admin/classes/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const classRef = doc(db, 'classes', id);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists()) {
            return res.status(404).json({ message: 'Class not found' });
        }
        
        await deleteDoc(classRef);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Failed to delete class', error: error.message });
    }
});

module.exports = router;