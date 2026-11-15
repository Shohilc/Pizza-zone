import { z } from 'zod';

export const syncUserSchema = {
  body: z.object({
    name: z.string().trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().optional(),
  }),
};

export const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().trim().optional(),
    avatarUrl: z.string().optional(),
    aboutMe: z.string().optional(),
    deliveryAddress: z.string().optional(),
    savedAddresses: z.array(
      z.object({
        label: z.string().trim().default('Home'),
        addressLine: z.string().trim().min(5, 'Address line must be at least 5 characters'),
        landmark: z.string().trim().optional().default(''),
        city: z.string().trim().optional().default(''),
        isDefault: z.boolean().optional().default(false),
      })
    ).optional(),
  }),
};

export const googleAuthSchema = {
  body: z
    .object({
      idToken: z.string().optional(),
      email: z.string().email('Valid Google email required').optional(),
      name: z.string().optional(),
      uid: z.string().optional(),
      avatar: z.string().optional(),
    })
    .refine((data) => Boolean(data.idToken || data.email), {
      message: 'Either idToken or email is required for Google authentication',
    }),
};

export const claimAdminSchema = {
  body: z.object({
    secretKey: z.string().min(1, 'Admin secret key is required'),
  }),
};

