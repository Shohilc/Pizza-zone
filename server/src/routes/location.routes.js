import { Router } from 'express';
import { reverseGeocode, placeAutocomplete, getPlaceDetails } from '../controllers/location.controller.js';
import { validate } from '../middleware/validate.js';
import { reverseGeocodeSchema, placeAutocompleteSchema, placeDetailsSchema } from '../schemas/location.schema.js';

const router = Router();

router.get('/reverse-geocode', validate(reverseGeocodeSchema), reverseGeocode);
router.get('/autocomplete', validate(placeAutocompleteSchema), placeAutocomplete);
router.get('/place-details', validate(placeDetailsSchema), getPlaceDetails);

export default router;
