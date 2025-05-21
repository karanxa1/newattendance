const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');
const { doc, getDocs, collection, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/auth');

// Load all users (using Firestore)
router.get('/admin/users', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users')); // Assuming a 'users' collection
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Create a new user
router.post('/admin/users', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !role) {
            return res.status(400).json({ message: 'Username and role are required' });
        }
        
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if first user
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userRole = usersSnapshot.size === 0 ? 'admin' : role;
        
        const newUserRef = doc(collection(db, 'users'));
        await setDoc(newUserRef, {
            username,
            role: userRole,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        }); // In production, hash password with bcrypt
        res.status(201).json({ id: newUserRef.id, username, role });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Update a user
router.put('/users/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, password } = req.body;
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, { username, role, password });
        res.json({ id, username, role });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// Delete a user
router.delete('/users/:id', authenticate, authorize([ROLES.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        await deleteDoc(doc(db, 'users', id));
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
});

module.exports = router;