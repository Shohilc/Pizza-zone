import { Router } from 'express';
import {
  getMe,
  syncUser,
  updateProfile,
  googleAuth,
  getAllCustomers,
  claimAdmin,
} from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  syncUserSchema,
  updateProfileSchema,
  googleAuthSchema,
  claimAdminSchema,
} from '../schemas/auth.schema.js';

const router = Router();

router.post('/google', validate(googleAuthSchema), googleAuth);
router.get('/me', requireAuth, getMe);
router.post('/sync', requireAuth, validate(syncUserSchema), syncUser);
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.get('/customers', requireAuth, requireAdmin, getAllCustomers);
router.post('/claim-admin', requireAuth, validate(claimAdminSchema), claimAdmin);

export default router;

