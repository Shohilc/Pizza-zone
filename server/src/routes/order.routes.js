import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrder,
  getOrderStatsAdmin,
} from '../controllers/order.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  orderIdParamsSchema,
  orderQuerySchema,
} from '../schemas/order.schema.js';

const router = Router();

// Customer endpoints (requireAuth)
router.post('/', requireAuth, validate(createOrderSchema), createOrder);
router.get('/my-orders', requireAuth, getMyOrders);
router.get('/:id', requireAuth, validate(orderIdParamsSchema), getOrderById);

// Cancellation endpoint (accessible by admin or customer for their pending order)
router.post('/:id/cancel', requireAuth, validate(cancelOrderSchema), cancelOrder);

// Admin only endpoints
router.get('/admin/all', requireAuth, requireAdmin, validate(orderQuerySchema), getAllOrdersAdmin);
router.get('/admin/stats', requireAuth, requireAdmin, getOrderStatsAdmin);
router.patch('/:id/status', requireAuth, requireAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;

