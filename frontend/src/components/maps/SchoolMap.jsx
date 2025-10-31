import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom red marker icon
const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SchoolMap = ({ schools }) => {
  const schoolsWithCoordinates = schools.filter(
    school => school.latitude && school.longitude
  );

  // Default center (Indonesia)
  const defaultCenter = [-2.5489, 118.0149];

  // If we have schools, center on the first one
  const center = schoolsWithCoordinates.length > 0
    ? [parseFloat(schoolsWithCoordinates[0].latitude), parseFloat(schoolsWithCoordinates[0].longitude)]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={schoolsWithCoordinates.length > 0 ? 10 : 5}
      style={{ width: '100%', height: '600px' }}
    >
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
              <p className="mb-0 small"><strong>Phone:</strong> {school.phone_number || '-'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SchoolMap;
