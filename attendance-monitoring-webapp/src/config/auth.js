require('dotenv').config();


module.exports = {
  secret: process.env.JWT_SECRET,
  options: { expiresIn: '8h' },
  ROLES: {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    STAFF: 'staff'
  }
};