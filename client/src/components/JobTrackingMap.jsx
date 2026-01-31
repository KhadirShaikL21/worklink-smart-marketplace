import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when position changes
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function JobTrackingMap({ job, userRole }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [workerLocation, setWorkerLocation] = useState(null);
  const [jobLocation, setJobLocation] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (job?.location?.coordinates) {
      // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      setJobLocation([job.location.coordinates[1], job.location.coordinates[0]]);
      setIsReady(true);
    }
  }, [job]);

  useEffect(() => {
    if (!socket || !job?._id) return;

    // Join job room
    socket.emit('join_job', job._id);

    // Listen for updates
    socket.on('worker_location', (data) => {
      setWorkerLocation(data.location);
    });

    return () => {
      socket.emit('leave_job', job._id);
      socket.off('worker_location');
    };
  }, [socket, job]);

  // If I am the worker, I should emit my location
  useEffect(() => {
    if (userRole === 'worker' && job?.status === 'en_route' && socket) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = [latitude, longitude];
          setWorkerLocation(location);
          socket.emit('update_location', {
            jobId: job._id,
            location
          });
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [userRole, job, socket]);

  if (!isReady) return null;

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-md border border-gray-200 mt-4">
      <MapContainer 
        center={jobLocation} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Job Location Marker */}
        <Marker position={jobLocation}>
          <Popup>
            Job Location <br /> {job.title}
          </Popup>
        </Marker>

        {/* Worker Location Marker */}
        {workerLocation && (
          <>
            <Marker position={workerLocation}>
              <Popup>
                Worker is here
              </Popup>
            </Marker>
            {/* Auto-center only if user is tracking (maybe optional) */}
             {userRole === 'customer' && <RecenterMap position={workerLocation} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}
