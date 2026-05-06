import { Router } from 'express';
import { completeProfile, changeUserRole, seeProfile } from '../controllers/user.controller.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.patch(
    '/complete-profile', 
    verifyAccessToken, 
    completeProfile
);

router.get(
    '/profile',
    verifyAccessToken,
    seeProfile
);

router.patch(
    '/role/:userId',
    verifyAccessToken,
    authorizeRoles('admin'),
    changeUserRole
);



export default router;
