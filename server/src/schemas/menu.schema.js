import { z } from 'zod';

const customizationOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  price: z.number().min(0, 'Option price must be non-negative'),
});

const customizationGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  allowMultiple: z.boolean().optional().default(false),
  isRequired: z.boolean().optional().default(false),
  options: z.array(customizationOptionSchema).min(1, 'Group must have at least one option'),
});

export const createMenuItemSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters'),
    description: z.string().trim().optional().default(''),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid Category ID is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    image: z.string().url('Image must be a valid URL'),
    isVeg: z.boolean().optional().default(true),
    isAvailable: z.boolean().optional().default(true),
    badge: z.string().trim().nullable().optional(),
    preparationTimeMinutes: z.number().int().min(1).max(120).optional().default(15),
    customizations: z.array(customizationGroupSchema).optional().default([]),
  }),
};

export const updateMenuItemSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID'),
  }),
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    price: z.number().min(0).optional(),
    image: z.string().url().optional(),
    isVeg: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    badge: z.string().trim().nullable().optional(),
    preparationTimeMinutes: z.number().int().min(1).max(120).optional(),
    customizations: z.array(customizationGroupSchema).optional(),
  }),
};

export const menuIdParamsSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID'),
  }),
};

export const createCategorySchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Category name is required'),
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().trim().optional().default(''),
    icon: z.string().trim().optional().default('Pizza'),
    displayOrder: z.number().int().optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
};

export const categoryIdParamsSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
  }),
};

