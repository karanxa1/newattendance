const jwt = require('jsonwebtoken');
const { secret } = require('../config/auth');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};