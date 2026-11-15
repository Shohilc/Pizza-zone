import { z } from 'zod';

export const reverseGeocodeSchema = {
  query: z.object({
    lat: z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    lng: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }),
};

export const placeAutocompleteSchema = {
  query: z.object({
    input: z.string().trim().min(2, 'Search query must be at least 2 characters').max(150),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  }),
};

export const placeDetailsSchema = {
  query: z.object({
    placeId: z.string().trim().min(2, 'Place ID is required'),
  }),
};
