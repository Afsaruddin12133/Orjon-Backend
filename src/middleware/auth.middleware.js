import User from '../models/User.js';
import { verifyJwt } from '../services/jwt.service.js';
import { authorizeRoles } from './role.middleware.js';

export const verifyAccessToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authorizationHeader.split(' ')[1];
    const decoded = verifyJwt(token);

    if (decoded.isStaticAdmin && decoded.role === 'admin') {
      req.user = {
        _id: 'static-admin',
        phone: null,
        role: 'admin',
        email: decoded.email || 'admin@orjon.com'
      };
      return next();
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token'
    });
  }
};

export { authorizeRoles };
