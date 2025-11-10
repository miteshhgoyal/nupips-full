import { tokenService } from "../services/tokenService.js";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    try {
        const decoded = tokenService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
};