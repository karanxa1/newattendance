const { ROLES } = require('../config/auth');

module.exports = (allowedRoles) => (req, res, next) => {
    if (!req.user?.token?.role || !allowedRoles.includes(req.user.token.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
};