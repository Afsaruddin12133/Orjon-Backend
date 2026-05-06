import { admin } from '../config/firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Firebase bearer token is required'
      });
    }

    if (admin.apps.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'Firebase Admin is not initialized'
      });
    }

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired Firebase token'
    });
  }
};
