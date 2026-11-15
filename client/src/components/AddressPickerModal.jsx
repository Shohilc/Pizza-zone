import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Check,
  AlertCircle,
  Building,
  CheckCircle2,
  AlertTriangle,
  Move,
  Edit3,
  PenTool,
} from 'lucide-react';
import { locationApi } from '../api/locationApi';

export function AddressPickerModal({ isOpen, onClose, onSelectAddress, initialAddress = '' }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Address data
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editableAddressText, setEditableAddressText] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [error, setError] = useState('');
  const [accuracyWarning, setAccuracyWarning] = useState('');
  const [currentCoords, setCurrentCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default center

  // Manual entry fields
  const [manualFlat, setManualFlat] = useState('');
  const [manualStreet, setManualStreet] = useState('');
  const [manualLandmark, setManualLandmark] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualPincode, setManualPincode] = useState('');

  const mapContainerRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const leafletMarkerInstance = useRef(null);

  // Initialize or re-render Map on modal open
  useEffect(() => {
    if (!isOpen || activeTab !== 'map') {
      if (leafletMapInstance.current) {
        try {
          leafletMapInstance.current.remove();
          leafletMapInstance.current = null;
          leafletMarkerInstance.current = null;
        } catch (e) {}
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!window.L) {
        console.warn('[Leaflet] Window.L not available yet. Retrying...');
        return;
      }

      const initialLat = selectedAddress?.lat || currentCoords.lat || 12.9716;
      const initialLng = selectedAddress?.lng || currentCoords.lng || 77.5946;

      if (!leafletMapInstance.current) {
        const map = window.L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        });

        // Standard OpenStreetMap tiles (FREE, reliable, NO watermark, NO API key required)
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Zoom controls on top right
        window.L.control.zoom({ position: 'topright' }).addTo(map);

        // Custom vibrant brand pin matching SnackCraft (#FA5D00)
        const customIcon = window.L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%); cursor: grab;">
              <div style="position: absolute; width: 40px; height: 40px; background: #FA5D00; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(250,93,0,0.5); border: 2.5px solid #FFFFFF;"></div>
              <div style="position: absolute; font-size: 18px; z-index: 2; margin-top: -4px;">📍</div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = window.L.marker([initialLat, initialLng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          setCurrentCoords({ lat: pos.lat, lng: pos.lng });
          await fetchReverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', async (e) => {
          marker.setLatLng(e.latlng);
          setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          await fetchReverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        leafletMapInstance.current = map;
        leafletMarkerInstance.current = marker;

        setTimeout(() => map.invalidateSize(), 200);
      } else {
        leafletMapInstance.current.setView([initialLat, initialLng], 15);
        leafletMarkerInstance.current?.setLatLng([initialLat, initialLng]);
        leafletMapInstance.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  // Clean reverse geocode fetcher
  const fetchReverseGeocode = async (lat, lng) => {
    try {
      setError('');
      const res = await locationApi.reverseGeocode(lat, lng);
      if (res?.success && res?.address) {
        setSelectedAddress(res.address);
        setEditableAddressText(res.address.formattedAddress || '');
        if (res.address.landmark && !landmark) {
          setLandmark(res.address.landmark);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  };

  // Search Autocomplete with locationBias
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setError('');
        const res = await locationApi.placeAutocomplete(
          searchQuery.trim(),
          currentCoords.lat,
          currentCoords.lng
        );
        if (res?.success && res?.predictions) {
          setPredictions(res.predictions);
        }
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentCoords]);

  // GPS Locate User
  const handleDetectLocation = async () => {
    try {
      setError('');
      setAccuracyWarning('');
      setIsLocating(true);

      const coords = await locationApi.getCurrentCoordinates();
      setCurrentCoords({ lat: coords.lat, lng: coords.lng });

      // If accuracy is poor (typical for desktop broadband / Wi-Fi ISP IP)
      if (coords.accuracy && coords.accuracy > 800) {
        const approxKm = Math.round(coords.accuracy / 1000);
        setAccuracyWarning(
          `Desktop/Wi-Fi detected your ISP router gateway (~${approxKm} km range). Desktop browsers lack GPS chips. Please search your local area/city above, or type your address manually.`
        );
      }

      // Pan Leaflet Map & Move Pin
      if (leafletMapInstance.current && leafletMarkerInstance.current) {
        leafletMapInstance.current.setView([coords.lat, coords.lng], 16, { animate: true });
        leafletMarkerInstance.current.setLatLng([coords.lat, coords.lng]);
        leafletMapInstance.current.invalidateSize();
      }

      await fetchReverseGeocode(coords.lat, coords.lng);
      setSearchQuery('');
      setPredictions([]);
    } catch (err) {
      setError(err.message || 'Failed to detect location.');
    } finally {
      setIsLocating(false);
    }
  };

  // Select place from autocomplete
  const handleSelectPrediction = async (prediction) => {
    setPredictions([]);
    setSearchQuery('');
    setAccuracyWarning('');

    try {
      let lat = prediction.lat;
      let lng = prediction.lng;
      let formattedAddress = prediction.description;

      if (prediction.placeId && (!lat || !lng)) {
        try {
          const detailRes = await locationApi.getPlaceDetails(prediction.placeId);
          if (detailRes?.success && detailRes?.place) {
            lat = detailRes.place.lat;
            lng = detailRes.place.lng;
            formattedAddress = detailRes.place.formattedAddress || formattedAddress;
          }
        } catch (e) {
          console.warn('Place details fetch failed:', e);
        }
      }

      if (lat && lng) {
        setCurrentCoords({ lat, lng });

        if (leafletMapInstance.current && leafletMarkerInstance.current) {
          leafletMapInstance.current.setView([lat, lng], 16, { animate: true });
          leafletMarkerInstance.current.setLatLng([lat, lng]);
          leafletMapInstance.current.invalidateSize();
        }

        setSelectedAddress({
          formattedAddress,
          street: prediction.mainText,
          landmark: prediction.secondaryText,
          lat,
          lng,
        });
        setEditableAddressText(formattedAddress);
      } else {
        setSelectedAddress({
          formattedAddress,
          street: prediction.mainText,
          landmark: prediction.secondaryText,
        });
        setEditableAddressText(formattedAddress);
      }
    } catch (e) {
      console.warn('Selection error:', e);
    }
  };

  // Confirm address
  const handleConfirm = () => {
    if (activeTab === 'manual') {
      if (!manualStreet.trim() || !manualCity.trim()) {
        setError('Please enter your street/area and city');
        return;
      }

      const fullManual = [
        manualFlat.trim(),
        manualStreet.trim(),
        manualLandmark.trim() ? `Near ${manualLandmark.trim()}` : '',
        manualCity.trim(),
        manualPincode.trim(),
      ]
        .filter(Boolean)
        .join(', ');

      onSelectAddress({
        address: fullManual,
        landmark: manualLandmark.trim(),
        street: manualStreet.trim(),
        city: manualCity.trim(),
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });

      onClose();
      return;
    }

    // Map tab confirm
    const finalAddressText = editableAddressText.trim() || selectedAddress?.formattedAddress;

    if (!finalAddressText) {
      setError('Please select on map, search, or type your address');
      return;
    }

    const fullAddress = [flatNumber.trim(), finalAddressText]
      .filter(Boolean)
      .join(', ');

    onSelectAddress({
      address: fullAddress,
      landmark: landmark.trim() || selectedAddress?.landmark || '',
      street: selectedAddress?.street || '',
      city: selectedAddress?.city || '',
      lat: selectedAddress?.lat || currentCoords.lat,
      lng: selectedAddress?.lng || currentCoords.lng,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-[36px] sm:rounded-[36px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                Delivery Location
              </h3>
              <p className="text-[11px] text-stone-400 font-medium">Pinpoint on Map or Type Directly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Map vs Manual */}
        <div className="flex border-b border-stone-100 px-6 bg-stone-50/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('map');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'map'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map & Search</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'manual'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Type Manually</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: MAP & SEARCH */}
          {activeTab === 'map' && (
            <>
              {accuracyWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-amber-900 text-xs font-medium leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{accuracyWarning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
                  >
                    <span>Switch to Manual Entry</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* Search Box with Real-Time Autocomplete */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (predictions.length > 0) {
                        handleSelectPrediction(predictions[0]);
                      } else if (searchQuery.trim().length >= 2) {
                        setIsSearching(true);
                        try {
                          const res = await locationApi.placeAutocomplete(searchQuery.trim());
                          if (res?.predictions?.length > 0) {
                            handleSelectPrediction(res.predictions[0]);
                          }
                        } finally {
                          setIsSearching(false);
                        }
                      }
                    }
                  }}
                  placeholder="Search your city, area, street, colony..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Autocomplete Predictions Dropdown */}
              {predictions.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xl divide-y divide-stone-100 overflow-hidden max-h-56 overflow-y-auto relative z-30">
                  {predictions.map((p) => (
                    <button
                      type="button"
                      key={p.placeId || p.description}
                      onClick={() => handleSelectPrediction(p)}
                      className="w-full p-3 px-4 text-left hover:bg-stone-50 transition flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900 truncate">{p.mainText}</div>
                        <div className="text-[10px] text-stone-400 truncate">{p.secondaryText || p.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Map with Draggable Pin */}
              <div className="relative rounded-[24px] overflow-hidden border border-stone-200 shadow-sm h-52 bg-stone-100">
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* Instruction Tag over Map */}
                <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm z-10 pointer-events-none">
                  <Move className="w-3 h-3 text-brand-400" />
                  <span>Drag pin or click map to adjust</span>
                </div>

                {/* Locate Me Floating Button */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="absolute bottom-2.5 right-2.5 z-10 bg-white text-stone-900 hover:text-brand-500 p-2.5 px-3 rounded-full shadow-md flex items-center gap-1.5 text-xs font-bold transition active:scale-95 border border-stone-100"
                  title="Detect device GPS location"
                >
                  <Navigation className={`w-4 h-4 text-brand-500 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'GPS'}</span>
                </button>
              </div>

              {/* Selected / Editable Address Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-[24px] p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Delivery Address (Click to edit)
                    </span>
                    <textarea
                      rows={2}
                      value={editableAddressText}
                      onChange={(e) => setEditableAddressText(e.target.value)}
                      placeholder="Street, locality, area..."
                      className="w-full mt-1 p-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-stone-900 leading-snug focus:outline-none focus:border-brand-500 resize-none"
                    />
                  </div>
                </div>

                {/* Extra Details: Flat / House No. & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-100">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      House / Flat / Floor *
                    </label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={flatNumber}
                        onChange={(e) => setFlatNumber(e.target.value)}
                        placeholder="e.g. Flat 304, Tower B"
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Nearby Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near City Hospital"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MANUAL ADDRESS ENTRY */}
          {activeTab === 'manual' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-2xl text-stone-700 text-xs leading-relaxed">
                <span className="font-bold text-brand-700">Direct Entry Mode:</span> Perfect for desktop users where Wi-Fi location might point to an ISP hub. Type your exact address below:
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  House / Flat / Floor / Building Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualFlat}
                  onChange={(e) => setManualFlat(e.target.value)}
                  placeholder="e.g. #42, Sunrise Enclave, 2nd Floor"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Street, Colony / Area / Locality *
                </label>
                <input
                  type="text"
                  required
                  value={manualStreet}
                  onChange={(e) => setManualStreet(e.target.value)}
                  placeholder="e.g. 5th Main, Gandhi Nagar"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="e.g. Mysuru"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={manualPincode}
                    onChange={(e) => setManualPincode(e.target.value)}
                    placeholder="e.g. 570001"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={manualLandmark}
                  onChange={(e) => setManualLandmark(e.target.value)}
                  placeholder="e.g. Opposite Post Office"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Confirm Button */}
        <div className="p-4 bg-white border-t border-stone-100">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-full shadow-float transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm Delivery Address</span>
          </button>
        </div>
      </div>
    </div>
  );
}
