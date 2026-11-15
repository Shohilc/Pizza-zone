import { api } from './client.js';

export const locationApi = {
  /**
   * Reverse geocode latitude and longitude into a detailed street address
   */
  reverseGeocode: (lat, lng) =>
    api.get(`/location/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`),

  /**
   * Fetch place suggestions as the user types, with optional radius bias
   */
  placeAutocomplete: (input, lat = null, lng = null) => {
    let url = `/location/autocomplete?input=${encodeURIComponent(input)}`;
    if (lat && lng) {
      url += `&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    }
    return api.get(url);
  },

  /**
   * Fetch place details (exact coordinates & formatted address) by placeId
   */
  getPlaceDetails: (placeId) =>
    api.get(`/location/place-details?placeId=${encodeURIComponent(placeId)}`),

  /**
   * Get device GPS position via HTML5 Geolocation with accuracy
   */
  getCurrentCoordinates: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy, // In meters (e.g., 20m for mobile GPS, 40000m for desktop Wi-Fi IP)
          });
        },
        (error) => {
          let msg = 'Unable to retrieve your location.';
          if (error.code === 1) msg = 'Location access was denied. Please allow location access in your browser.';
          else if (error.code === 2) msg = 'Location information is currently unavailable.';
          else if (error.code === 3) msg = 'Location request timed out. Please try again.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  },
};
