import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Custom red marker icon
const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to change map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const SchoolMap = ({ schools, selectedSchool }) => {
  const schoolsWithCoordinates = schools.filter(
    school => school.latitude && school.longitude
  );

  // Default center (Indonesia)
  const defaultCenter = [-2.5489, 118.0149];
  const defaultZoom = 5;

  const getCenter = () => {
    if (selectedSchool && selectedSchool.latitude && selectedSchool.longitude) {
      return [parseFloat(selectedSchool.latitude), parseFloat(selectedSchool.longitude)];
    }
    if (schoolsWithCoordinates.length > 0) {
      return [parseFloat(schoolsWithCoordinates[0].latitude), parseFloat(schoolsWithCoordinates[0].longitude)];
    }
    return defaultCenter;
  };

  const getZoom = () => {
    if (selectedSchool) {
      return 15; // Zoom in close when a school is selected
    }
    if (schoolsWithCoordinates.length > 0) {
      return 10;
    }
    return defaultZoom;
  };

  const center = getCenter();
  const zoom = getZoom();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '600px' }}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {schoolsWithCoordinates.map(school => (
        <Marker
          key={school.id}
          position={[parseFloat(school.latitude), parseFloat(school.longitude)]}
          icon={redIcon}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h6 className="mb-2" style={{ fontWeight: 'bold' }}>{school.name}</h6>
              <p className="mb-1 small"><strong>NPSN:</strong> {school.npsn}</p>
              <p className="mb-1 small"><strong>Address:</strong> {school.address}</p>
              <p className="mb-0 small"><strong>Phone:</strong> {school.phone || '-'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SchoolMap;
