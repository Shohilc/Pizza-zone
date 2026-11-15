import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/store.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateStoreSettingSchema } from '../schemas/store.schema.js';

const router = Router();

// Public: get store status and configuration
router.get('/', getStoreSettings);

// Admin: update store settings
router.put('/', requireAuth, requireAdmin, validate(updateStoreSettingSchema), updateStoreSettings);

export default router;

