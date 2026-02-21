import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for the worker (Green)
const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

    socket.on('worker_arriving', (data) => {
      // Show specific toast or banner
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-green-500 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  🚀 Update!
                </p>
                <p className="mt-1 text-sm text-green-100">
                  {data.message || 'Worker is Arriving Soon!'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-green-600">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-100 hover:text-white focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 6000 });
    });

    return () => {
      socket.emit('leave_job', job._id);
      socket.off('worker_location');
      socket.off('worker_arriving');
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
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-md border border-gray-200 mt-4 relative z-0">
      <MapContainer 
        center={jobLocation} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Geofence 1km Circle */}
        {jobLocation && (
          <Circle 
            center={jobLocation} 
            radius={1000} 
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, dashArray: '10, 10' }} 
          />
        )}
        
        {/* Job Location Marker */}
        <Marker position={jobLocation}>
          <Popup>
            Job Location <br /> {job.title}
          </Popup>
        </Marker>

        {/* Worker Location Marker */}
        {workerLocation && (
          <>
            <Marker position={workerLocation} icon={workerIcon}>
              <Popup>
                <strong>Worker</strong><br/>
                Currently here
              </Popup>
            </Marker>
            
            {/* Draw Line between Worker and Job */}
            <Polyline 
              positions={[workerLocation, jobLocation]} 
              color="#2563eb" 
              weight={4} 
              opacity={0.8} 
              dashArray="10, 10" 
            />
            
            {/* Auto-center map on worker if user is customer */}
             {userRole === 'customer' && <RecenterMap position={workerLocation} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}
