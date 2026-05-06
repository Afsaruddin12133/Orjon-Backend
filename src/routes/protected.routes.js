import { Router } from 'express';
import { authorizeRoles, verifyAccessToken } from '../middleware/auth.middleware.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.middleware.js';

const router = Router();

router.get('/secure', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Protected Firebase route reached',
    user: req.firebaseUser
  });
});

router.get('/profile', verifyAccessToken, authorizeRoles('user', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile route reached',
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});

router.get('/admin', verifyAccessToken, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin route reached',
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});

export default router;
