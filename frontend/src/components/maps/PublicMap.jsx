import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const purpleIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const PublicMap = ({ publics, selectedPublic }) => {
  const publicsWithCoordinates = publics.filter(
    entity => entity.latitude && entity.longitude
  );

  const defaultCenter = [-2.5489, 118.0149];
  const defaultZoom = 5;

  const getCenter = () => {
    if (selectedPublic && selectedPublic.latitude && selectedPublic.longitude) {
      return [parseFloat(selectedPublic.latitude), parseFloat(selectedPublic.longitude)];
    }
    if (publicsWithCoordinates.length > 0) {
      const first = publicsWithCoordinates[0];
      return [parseFloat(first.latitude), parseFloat(first.longitude)];
    }
    return defaultCenter;
  };

  const getZoom = () => {
    if (selectedPublic && selectedPublic.latitude && selectedPublic.longitude) {
      return 15;
    }
    if (publicsWithCoordinates.length > 0) {
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

      {publicsWithCoordinates.map(entity => (
        <Marker
          key={entity.id}
          position={[parseFloat(entity.latitude), parseFloat(entity.longitude)]}
          icon={purpleIcon}
        >
          <Popup>
            <div style={{ minWidth: '220px' }}>
              <h6 className="mb-2" style={{ fontWeight: 'bold' }}>{entity.name}</h6>
              {entity.category && (
                <p className="mb-1 small"><strong>Category:</strong> {entity.category}</p>
              )}
              {entity.address && (
                <p className="mb-1 small"><strong>Address:</strong> {entity.address}</p>
              )}
              <p className="mb-0 small"><strong>Phone:</strong> {entity.phone || '-'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default PublicMap;
