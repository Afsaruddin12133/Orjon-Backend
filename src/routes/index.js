import { Router } from 'express';
import authRoutes from './auth.routes.js';
import protectedRoutes from './protected.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong'
  });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/protected', protectedRoutes);

export default router;
