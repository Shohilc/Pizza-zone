/**
 * Location Controller for Google Maps Geocoding & Places API (New & Classic)
 */

export async function reverseGeocode(req, res) {
  try {
    const { lat, lng } = req.query;
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '').trim();

    if (apiKey && apiKey.length > 10 && !apiKey.includes('your_google_maps')) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components || [];

        const getComponent = (types) => {
          const comp = addressComponents.find((c) =>
            types.some((t) => c.types.includes(t))
          );
          return comp ? comp.long_name : '';
        };

        const streetNumber = getComponent(['street_number']);
        const route = getComponent(['route']);
        const sublocality = getComponent(['sublocality', 'sublocality_level_1', 'neighborhood']);
        const city = getComponent(['locality', 'administrative_area_level_2']);
        const state = getComponent(['administrative_area_level_1']);
        const postalCode = getComponent(['postal_code']);

        const street = [streetNumber, route].filter(Boolean).join(' ') || sublocality;

        return res.status(200).json({
          success: true,
          provider: 'google',
          address: {
            formattedAddress: result.formatted_address,
            street,
            landmark: sublocality,
            city,
            state,
            postalCode,
            lat: Number(lat),
            lng: Number(lng),
          },
        });
      }
    }

    // Resilient Fallback (OpenStreetMap Nominatim)
    const fallbackRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SnackCraftApp/1.0',
        },
      }
    );

    const fallbackData = await fallbackRes.json().catch(() => ({}));

    if (fallbackData?.display_name) {
      const addr = fallbackData.address || {};
      const street = addr.road || addr.suburb || addr.neighbourhood || '';
      const landmark = addr.suburb || addr.neighbourhood || addr.amenity || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const postalCode = addr.postcode || '';

      return res.status(200).json({
        success: true,
        provider: 'fallback',
        address: {
          formattedAddress: fallbackData.display_name,
          street,
          landmark,
          city,
          postalCode,
          lat: Number(lat),
          lng: Number(lng),
        },
      });
    }

    return res.status(200).json({
      success: true,
      provider: 'coordinates_only',
      address: {
        formattedAddress: `Location at (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
        street: '',
        landmark: '',
        city: '',
        postalCode: '',
        lat: Number(lat),
        lng: Number(lng),
      },
    });
  } catch (error) {
    console.error('[Reverse Geocode Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode location: ' + error.message,
    });
  }
}

export async function placeAutocomplete(req, res) {
  try {
    const { input, lat, lng } = req.query;
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '').trim();

    if (apiKey && apiKey.length > 10 && !apiKey.includes('your_google_maps')) {
      // 1. Google Places API (New) with optional local bias
      try {
        const requestBody = {
          input,
          includedRegionCodes: ['in'], // Focus on local/regional results
        };

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          requestBody.locationBias = {
            circle: {
              center: {
                latitude: Number(lat),
                longitude: Number(lng),
              },
              radius: 25000.0, // 25km local vicinity
            },
          };
        }

        const newPlacesRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const newPlacesData = await newPlacesRes.json();

        if (newPlacesData?.suggestions?.length > 0) {
          const predictions = newPlacesData.suggestions
            .filter((s) => s.placePrediction)
            .map((s) => {
              const p = s.placePrediction;
              return {
                placeId: p.placeId,
                description: p.text?.text || '',
                mainText: p.structuredFormat?.mainText?.text || p.text?.text || '',
                secondaryText: p.structuredFormat?.secondaryText?.text || '',
              };
            });

          return res.status(200).json({
            success: true,
            provider: 'google_places_new',
            predictions,
          });
        }
      } catch (err) {
        console.warn('[Places API New Warning]:', err.message);
      }
    }

    // 2. Fallback Nominatim search
    const fallbackRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        input
      )}&addressdetails=1&limit=6`,
      {
        headers: {
          'User-Agent': 'SnackCraftApp/1.0',
        },
      }
    );

    const fallbackData = await fallbackRes.json().catch(() => []);
    const predictions = (Array.isArray(fallbackData) ? fallbackData : []).map((item) => ({
      placeId: String(item.place_id),
      description: item.display_name,
      mainText: item.name || item.display_name.split(',')[0],
      secondaryText: item.display_name.split(',').slice(1).join(',').trim(),
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));

    return res.status(200).json({
      success: true,
      provider: 'fallback',
      predictions,
    });
  } catch (error) {
    console.error('[Autocomplete Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search places: ' + error.message,
    });
  }
}

export async function getPlaceDetails(req, res) {
  try {
    const { placeId } = req.query;
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '').trim();

    if (apiKey && apiKey.length > 10 && !apiKey.includes('your_google_maps')) {
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
        placeId
      )}?fields=id,displayName,formattedAddress,location,addressComponents`;

      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      });

      const data = await response.json();

      if (data?.location) {
        return res.status(200).json({
          success: true,
          place: {
            placeId: data.id,
            name: data.displayName?.text || '',
            formattedAddress: data.formattedAddress || '',
            lat: data.location.latitude,
            lng: data.location.longitude,
          },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Place details not found',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch place details: ' + error.message,
    });
  }
}
