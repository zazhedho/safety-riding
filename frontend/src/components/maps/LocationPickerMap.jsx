import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom blue marker icon for selected location
const blueIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper function to extract address data from Nominatim response
const extractAddressData = (data) => {
  const address = data.address || {};

  // Extract school name from various possible fields
  const schoolName = address.school ||
                    address.university ||
                    address.college ||
                    address.building ||
                    address.amenity ||
                    '';

  // Build full address
  const road = address.road || address.street || '';
  const houseNumber = address.house_number || '';
  const fullAddress = [houseNumber, road].filter(Boolean).join(' ').trim() ||
                     address.neighbourhood ||
                     address.suburb ||
                     data.display_name;

  // Extract location hierarchy
  const province = address.state || address.province || '';
  const regency = address.regency ||
               address.town ||
               address.region ||
               address.municipality ||
               address.city_district ||
               address.county ||
               '';
  const district = address.suburb ||
                   address.neighbourhood ||
                   address.village ||
                   address.hamlet ||
                   '';

  const postalCode = address.postcode || '';

  return {
    schoolName,
    address: fullAddress,
    province,
    regency,
    district,
    postalCode,
    fullDisplayName: data.display_name,
    rawAddress: address
  };
};

// Component to handle map clicks
const LocationMarker = ({ position, setPosition, onLocationSelect, onAddressDataReceived }) => {
  const map = useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);

      // Reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
          if (data.display_name) {
            // Update the position with address info
            setPosition([e.latlng.lat, e.latlng.lng, data.display_name]);

            // Extract and send address data
            const addressData = extractAddressData(data);
            onLocationSelect(e.latlng.lat, e.latlng.lng, addressData);
            onAddressDataReceived(addressData);
          }
        })
        .catch(err => console.error('Reverse geocoding error:', err));
    },
  });

  return position ? (
    <Marker position={[position[0], position[1]]} icon={blueIcon}>
      <Popup>
        <div>
          <strong>Selected Location</strong><br />
          <small>Lat: {position[0].toFixed(6)}</small><br />
          <small>Lng: {position[1].toFixed(6)}</small>
          {position[2] && (
            <>
              <hr className="my-1" />
              <small>{position[2]}</small>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null;
};

const LocationPickerMap = ({ onLocationSelect, onAddressDataReceived, initialLat, initialLng }) => {
  const [position, setPosition] = useState(
    initialLat && initialLng ? [parseFloat(initialLat), parseFloat(initialLng)] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const [center, setCenter] = useState(
    initialLat && initialLng
      ? [parseFloat(initialLat), parseFloat(initialLng)]
      : [-2.5489, 118.0149] // Indonesia center
  );
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      const newPosition = [parseFloat(initialLat), parseFloat(initialLng)];
      setPosition(newPosition);
      setCenter(newPosition);
    }
  }, [initialLat, initialLng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=id&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Get detailed address data
    try {
      const detailResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const detailData = await detailResponse.json();
      const addressData = extractAddressData(detailData);

      setPosition([lat, lng, result.display_name]);
      setCenter([lat, lng]);
      setSelectedAddressData(addressData);
      onLocationSelect(lat, lng, addressData);
      if (onAddressDataReceived) {
        onAddressDataReceived(addressData);
      }
    } catch (error) {
      console.error('Error getting address details:', error);
      setPosition([lat, lng, result.display_name]);
      setCenter([lat, lng]);
      onLocationSelect(lat, lng, null);
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleClearLocation = () => {
    setPosition(null);
    setSelectedAddressData(null);
    onLocationSelect(null, null, null);
    if (onAddressDataReceived) {
      onAddressDataReceived(null);
    }
  };

  const handleAddressDataReceived = (addressData) => {
    setSelectedAddressData(addressData);
  };

  return (
    <div className="location-picker-container">
      {/* Search Box */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search location (e.g., SMA Negeri 1 Jakarta, Jl. Sudirman...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-search"></i>
                  )}
                </button>
              </div>
            </div>
            {position && (
              <div className="col-auto">
                <button className="btn btn-outline-danger" onClick={handleClearLocation}>
                  <i className="bi bi-x-circle me-1"></i>Clear
                </button>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="list-group mt-2">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  className="list-group-item list-group-item-action text-start"
                  onClick={() => handleResultClick(result)}
                >
                  <i className="bi bi-geo-alt me-2"></i>
                  <small>{result.display_name}</small>
                </button>
              ))}
            </div>
          )}

          {/* Current Selection Info */}
          {position && (
            <div className="alert alert-info mt-2 mb-0">
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle me-2 mt-1"></i>
                <div className="flex-grow-1">
                  <strong>Selected Location:</strong><br />
                  <small>
                    Coordinates: <code>{position[0].toFixed(6)}, {position[1].toFixed(6)}</code>
                  </small>
                  {selectedAddressData && (
                    <>
                      {selectedAddressData.schoolName && (
                        <>
                          <br />
                          <small><strong>Name:</strong> {selectedAddressData.schoolName}</small>
                        </>
                      )}
                      {selectedAddressData.address && (
                        <>
                          <br />
                          <small><strong>Address:</strong> {selectedAddressData.address}</small>
                        </>
                      )}
                      {selectedAddressData.district && (
                        <>
                          <br />
                          <small><strong>District:</strong> {selectedAddressData.district}</small>
                        </>
                      )}
                      {selectedAddressData.regency && (
                        <>
                          <br />
                          <small><strong>City/Regency:</strong> {selectedAddressData.regency}</small>
                        </>
                      )}
                      {selectedAddressData.province && (
                        <>
                          <br />
                          <small><strong>Province:</strong> {selectedAddressData.province}</small>
                        </>
                      )}
                      {selectedAddressData.postalCode && (
                        <>
                          <br />
                          <small><strong>Postal Code:</strong> {selectedAddressData.postalCode}</small>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="card">
        <div className="card-header">
          <small className="text-muted">
            <i className="bi bi-cursor me-1"></i>
            Click anywhere on the map to set the location
          </small>
        </div>
        <div className="card-body p-0">
          <MapContainer
            center={center}
            zoom={position ? 15 : 5}
            style={{ width: '100%', height: '400px' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={position}
              setPosition={setPosition}
              onLocationSelect={onLocationSelect}
              onAddressDataReceived={handleAddressDataReceived}
            />
          </MapContainer>
        </div>
      </div>

      <div className="alert alert-warning mt-3 mb-0">
        <i className="bi bi-lightbulb me-2"></i>
        <strong>Tip:</strong> You can search for the school location or click directly on the map to set coordinates.
      </div>
    </div>
  );
};

export default LocationPickerMap;
