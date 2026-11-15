import { z } from 'zod';
import { ORDER_STATUSES, CANCEL_REASONS, PAYMENT_METHODS } from '../models/Order.js';

export const createOrderSchema = {
  body: z.object({
    orderType: z.enum(['DELIVERY', 'TAKEAWAY']),
    customer: z.object({
      name: z.string().trim().min(2, 'Customer name must be at least 2 characters').max(100),
      phone: z.string().trim().min(7, 'Valid contact phone number required').max(18),
      address: z.string().trim().optional().default(''),
      landmark: z.string().trim().optional().default(''),
    }).refine((data) => {
      // If delivery, address is required
      return true;
    }),
    items: z.array(
      z.object({
        menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid menu item ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50),
        selectedCustomizations: z.array(
          z.object({
            groupName: z.string().min(1),
            name: z.string().min(1),
          })
        ).optional().default([]),
      })
    ).min(1, 'At least one item is required to place an order'),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: 'Payment method must be CASH_ON_DELIVERY or PAY_AT_STORE' }),
    }),
    customerNotes: z.string().max(300).optional().default(''),
  }).refine((data) => {
    if (data.orderType === 'DELIVERY' && (!data.customer.address || data.customer.address.trim().length < 5)) {
      return false;
    }
    return true;
  }, {
    message: 'Delivery address is required for delivery orders',
    path: ['customer', 'address'],
  }),
};

export const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID format'),
  }),
  body: z.object({
    status: z.enum(
      ORDER_STATUSES.filter((s) => s !== 'CANCELLED'),
      { errorMap: () => ({ message: 'Invalid order transition status' }) }
    ),
    note: z.string().max(200).optional().default(''),
  }),
};

export const cancelOrderSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID format'),
  }),
  body: z.object({
    cancelReason: z.enum(CANCEL_REASONS, {
      errorMap: () => ({ message: 'Cancel reason must be NOT_REACHABLE, CUSTOMER_DECLINED, FAKE_ORDER, or OUT_OF_STOCK' }),
    }),
    cancelNote: z.string().max(300).optional().default(''),
  }),
};

export const orderIdParamsSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID format'),
  }),
};

export const orderQuerySchema = {
  query: z.object({
    status: z.enum([...ORDER_STATUSES, 'ALL']).optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

