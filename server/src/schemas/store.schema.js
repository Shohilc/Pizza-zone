import { z } from 'zod';

export const updateStoreSettingSchema = {
  body: z.object({
    storeName: z.string().trim().min(2).optional(),
    storePhone: z.string().trim().min(7).optional(),
    storeAddress: z.string().trim().min(5).optional(),
    isOpen: z.boolean().optional(),
    closedNotice: z.string().trim().optional(),
    deliveryFee: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional(),
    estimatedDeliveryMinutes: z.number().int().min(5).max(180).optional(),
    estimatedPickupMinutes: z.number().int().min(5).max(120).optional(),
  }),
};

