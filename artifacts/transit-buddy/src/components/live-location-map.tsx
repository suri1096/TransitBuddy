import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BART_STATIONS } from "@/lib/bart-data";

interface Props {
  lat: number;
  lng: number;
  accuracy?: number;
  label?: string;
  height?: number;
  stops?: string[];
  currentStopIndex?: number;
  lineColor?: string;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t1 = setTimeout(fix, 100);
    const t2 = setTimeout(fix, 400);
    const t3 = setTimeout(fix, 900);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() < 13 ? 15 : map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
}

export function LiveLocationMap({
  lat, lng, accuracy, label = "Live location", height = 240,
  stops = [], currentStopIndex = 0, lineColor = "#6366f1",
}: Props) {
  const stopsWithCoords = stops.map((name, i) => {
    const st = BART_STATIONS.find(s => s.name === name);
    return st ? { name, lat: st.lat, lng: st.lng, index: i } : null;
  }).filter((s): s is { name: string; lat: number; lng: number; index: number } => s !== null);

  const polylineCoords: [number, number][] = stopsWithCoords.map(s => [s.lat, s.lng]);

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-md border border-border"
      style={{ height }}
      role="region"
      aria-label="Map showing the traveler's live location"
    >
      <MapContainer center={[lat, lng]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Recenter lat={lat} lng={lng} />

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{ color: lineColor, weight: 6, opacity: 0.8, lineCap: "round", lineJoin: "round" }}
          />
        )}

        {stopsWithCoords.map((s) => {
          const isPassed = s.index < currentStopIndex;
          const isCurrent = s.index === currentStopIndex;
          const isLast = s.index === stops.length - 1;
          const isFirst = s.index === 0;
          return (
            <CircleMarker
              key={s.name}
              center={[s.lat, s.lng]}
              radius={isFirst || isLast ? 9 : isCurrent ? 8 : 6}
              pathOptions={{
                color: "#ffffff",
                fillColor: isPassed ? "#9ca3af" : isLast ? "#ef4444" : lineColor,
                fillOpacity: isPassed ? 0.55 : 1,
                weight: isCurrent ? 3 : 2,
              }}
            >
              {(isFirst || isLast || isCurrent) && (
                <Tooltip permanent direction="top" offset={[0, -8]}>
                  {s.name}{isFirst ? " — Start" : isLast ? " — Get off" : " ← Here"}
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}

        {accuracy && accuracy > 0 && (
          <Circle
            center={[lat, lng]}
            radius={accuracy}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1 }}
          />
        )}

        <CircleMarker
          center={[lat, lng]}
          radius={11}
          pathOptions={{ color: "#ffffff", fillColor: "#3b82f6", fillOpacity: 1, weight: 4 }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]}>{label}</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
