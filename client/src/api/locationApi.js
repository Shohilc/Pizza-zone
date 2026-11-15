import { api } from './client.js';

export const locationApi = {
  /**
   * Reverse geocode latitude and longitude into a detailed street address.
   * Uses OpenStreetMap Nominatim directly for instant, keyless client-side geocoding,
   * with seamless fallback to backend API.
   */
  reverseGeocode: async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const street = data.name || addr.road || addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const landmark = addr.suburb || addr.neighbourhood || addr.state_district || '';
          const pincode = addr.postcode || '';

          return {
            success: true,
            address: {
              formattedAddress: data.display_name,
              street,
              city,
              landmark,
              pincode,
              lat: Number(lat),
              lng: Number(lng),
            },
          };
        }
      }
    } catch (err) {
      console.warn('[locationApi] Client reverse geocode notice, trying backend fallback:', err.message);
    }

    // Fallback to backend API
    return api.get(`/location/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
  },

  /**
   * Fetch place suggestions as the user types (e.g. "yelburga", "bangalore").
   * Uses OpenStreetMap Nominatim directly on the client so search works 100% reliably
   * on Vercel without needing a backend server or Google Maps billing.
   */
  placeAutocomplete: async (input, lat = null, lng = null) => {
    if (!input || input.trim().length < 2) {
      return { success: true, predictions: [] };
    }

    try {
      const q = encodeURIComponent(input.trim());
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&addressdetails=1&limit=6`;
      
      // If user has map coordinates, bias towards user's approximate region
      if (lat && lng) {
        const delta = 0.5; // ~50km bounding box
        url += `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
      }

      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const predictions = data.map((item) => {
            const addr = item.address || {};
            const parts = (item.display_name || '').split(',');
            const mainText = item.name || addr.road || addr.suburb || addr.city || addr.town || addr.village || parts[0]?.trim() || input;
            const secondaryText = parts.slice(1).join(',').trim() || item.display_name;

            return {
              placeId: String(item.place_id || item.osm_id),
              description: item.display_name,
              mainText,
              secondaryText,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          return { success: true, predictions };
        }
      }
    } catch (err) {
      console.warn('[locationApi] Client autocomplete notice, trying backend fallback:', err.message);
    }

    // Fallback to backend API
    let fallbackUrl = `/location/autocomplete?input=${encodeURIComponent(input)}`;
    if (lat && lng) {
      fallbackUrl += `&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    }
    return api.get(fallbackUrl);
  },

  /**
   * Fetch place details (exact coordinates & formatted address) by placeId
   */
  getPlaceDetails: async (placeId) => {
    try {
      return await api.get(`/location/place-details?placeId=${encodeURIComponent(placeId)}`);
    } catch {
      return { success: false };
    }
  },

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
            accuracy: position.coords.accuracy,
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
