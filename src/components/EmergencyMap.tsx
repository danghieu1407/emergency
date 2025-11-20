"use client";

import { useEffect } from "react";
import { Icon } from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Coords } from "@/types/location";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type EmergencyMapProps = {
  coords: Coords | null;
  fallback: Coords;
  className?: string;
  accuracy?: number | null;
  onManualSelect?: (coords: Coords) => void;
};

function RecenterMap({ coords }: { coords: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords, map]);
  return null;
}

function ManualLocationPicker({
  onManualSelect,
}: {
  onManualSelect?: (coords: Coords) => void;
}) {
  useMapEvents({
    click(e) {
      onManualSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function EmergencyMap({
  coords,
  fallback,
  className,
  accuracy,
  onManualSelect,
}: EmergencyMapProps) {
  const displayCoords = coords ?? fallback;

  return (
    <MapContainer
      center={displayCoords}
      zoom={15}
      className={className}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ManualLocationPicker onManualSelect={onManualSelect} />
      {coords && <RecenterMap coords={coords} />}
      <Marker position={displayCoords} icon={markerIcon}>
        <Popup>
          {coords
            ? `Bạn đang ở: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : "Đang lấy vị trí..."}
        </Popup>
      </Marker>
      {coords && accuracy ? (
        <Circle
          center={coords}
          radius={Math.max(accuracy, 15)}
          pathOptions={{ color: "#2563eb", fillColor: "#93c5fd", fillOpacity: 0.2 }}
        />
      ) : null}
    </MapContainer>
  );
}


