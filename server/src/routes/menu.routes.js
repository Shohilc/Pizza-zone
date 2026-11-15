import { Router } from 'express';
import multer from 'multer';
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  uploadImage,
} from '../controllers/menu.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuIdParamsSchema,
  createCategorySchema,
} from '../schemas/menu.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = Router();

// Public routes
router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:id', validate(menuIdParamsSchema), getMenuItemById);

// Admin routes
router.get('/admin/categories', requireAuth, requireAdmin, getAllCategoriesAdmin);
router.post('/categories', requireAuth, requireAdmin, validate(createCategorySchema), createCategory);
router.post('/items', requireAuth, requireAdmin, validate(createMenuItemSchema), createMenuItem);
router.put('/items/:id', requireAuth, requireAdmin, validate(updateMenuItemSchema), updateMenuItem);
router.patch('/items/:id/toggle', requireAuth, requireAdmin, validate(menuIdParamsSchema), toggleItemAvailability);
router.delete('/items/:id', requireAuth, requireAdmin, validate(menuIdParamsSchema), deleteMenuItem);
router.post('/upload-image', requireAuth, requireAdmin, upload.single('image'), uploadImage);

export default router;

