import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

const greenIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const EventMap = ({ events = [], height = '400px' }) => {
  // Default center NTB
  const defaultCenter = [-8.5833, 116.1167];
  const defaultZoom = 8;

  const getCenter = () => {
    if (events.length > 0) {
      return [events[0].latitude, events[0].longitude];
    }
    return defaultCenter;
  };

  return (
    <MapContainer center={getCenter()} zoom={defaultZoom} style={{ width: '100%', height }}>
      <ChangeView center={getCenter()} zoom={defaultZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map(event => (
        <Marker key={event.id} position={[event.latitude, event.longitude]} icon={greenIcon}>
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h6 className="mb-2" style={{ fontWeight: 'bold' }}>{event.title}</h6>
              <p className="mb-1 small"><strong>Date:</strong> {event.event_date}</p>
              <p className="mb-1 small"><strong>Type:</strong> {event.event_type}</p>
              <p className="mb-1 small"><strong>Venue:</strong> {event.venue_name} ({event.venue_type})</p>
              <p className="mb-1 small"><strong>Location:</strong> {event.location}</p>
              <p className="mb-0 small"><strong>Attendees:</strong> {event.attendees_count}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default EventMap;
