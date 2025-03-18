const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Example user data (replace with database logic)
const users = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { id: 2, username: 'faculty', password: bcrypt.hashSync('faculty123', 10), role: 'faculty' }
];

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role });
});

module.exports = router;