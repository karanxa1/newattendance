const jwt = require('jsonwebtoken');
// Make sure dotenv is loaded
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = {
            uid: decoded.id,
            token: {
                role: decoded.role
            }
        };
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};