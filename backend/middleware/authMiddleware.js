const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'trymyday_super_secret_key_2026';

const authMiddleware = (req, res, next) => {
    // Check for token in headers
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request (e.g., req.user.email, req.user.id)
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
};

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
