import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BART_STATIONS, PlannedRoute } from "@/lib/bart-data";

const STATION_COORDS: Record<string, [number, number]> = {};
BART_STATIONS.forEach(s => { STATION_COORDS[s.name] = [s.lat, s.lng]; });

const BAY_AREA_CENTER: [number, number] = [37.8044, -122.2712];

interface Props {
  route?: PlannedRoute | null;
  userLocation?: [number, number] | null;
  height?: number;
  onStationClick?: (stationName: string) => void;
  selectedFrom?: string;
  selectedTo?: string;
  /** Only render segments from this index onwards (0 = full route). Used in trip to hide already-ridden segments. */
  fromSegmentIndex?: number;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
  useEffect(() => {
    if (points.length === 0) { map.setView(BAY_AREA_CENTER, 10); return; }
    if (points.length === 1) { map.setView(points[0], 13); return; }
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [50, 50], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t1 = setTimeout(fix, 100);
    const t2 = setTimeout(fix, 400);
    const t3 = setTimeout(fix, 900);
    window.addEventListener("resize", fix);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener("resize", fix); };
  }, [map]);
  return null;
}

export function BartGpsMap({ route, userLocation, height = 420, onStationClick, selectedFrom, selectedTo, fromSegmentIndex = 0 }: Props) {
  const isSelectionMode = !!onStationClick && !route;

  const activeSegments = useMemo(() => {
    if (!route) return [];
    return route.segments.slice(fromSegmentIndex);
  }, [route, fromSegmentIndex]);

  const routeSegments = useMemo(() => {
    return activeSegments.map(seg => ({
      color: seg.color, line: seg.line,
      coords: seg.stops.map(name => STATION_COORDS[name]).filter((c): c is [number, number] => !!c),
    }));
  }, [activeSegments]);

  const routeStationNames = useMemo(() => {
    const set = new Set<string>();
    activeSegments.forEach(seg => seg.stops.forEach(s => set.add(s)));
    // Always include the overall route start so the "Start" marker stays visible
    if (route && fromSegmentIndex === 0) set.add(route.from);
    return [...set];
  }, [activeSegments, route, fromSegmentIndex]);

  const stationColor = useMemo(() => {
    const m: Record<string, string> = {};
    activeSegments.forEach(seg => seg.stops.forEach(s => { if (!m[s]) m[s] = seg.color; }));
    return m;
  }, [activeSegments]);

  const legendLines = useMemo(() => {
    const seen = new Map<string, string>();
    activeSegments.forEach(seg => seen.set(seg.line, seg.color));
    return [...seen.entries()].map(([line, color]) => ({ line, color }));
  }, [activeSegments]);

  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    activeSegments.forEach(seg => seg.stops.forEach(name => { const c = STATION_COORDS[name]; if (c) pts.push(c); }));
    if (userLocation) pts.push(userLocation);
    return pts;
  }, [activeSegments, userLocation]);

  return (
    <div className="space-y-3">
      {isSelectionMode && (
        <p className="text-xs text-center text-muted-foreground font-semibold">
          {!selectedFrom
            ? "👆 Tap any station to set your starting point"
            : !selectedTo
            ? "👆 Now tap your destination station"
            : "Both stations selected — tap Find My Route below"}
        </p>
      )}
      <div
        className="transitbuddy-map rounded-3xl overflow-hidden shadow-md border border-border"
        style={{ height }}
        role="region"
        aria-label={route ? `Map showing your route from ${route.from} to ${route.to}` : "Map of BART stations in the Bay Area"}
      >
        <MapContainer center={BAY_AREA_CENTER} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapResizer />
          <FitBounds points={fitPoints} />

          {!route && BART_STATIONS.map(s => {
            const isFrom = s.name === selectedFrom;
            const isTo = s.name === selectedTo;
            const isSelected = isFrom || isTo;
            return (
              <CircleMarker
                key={s.name}
                center={[s.lat, s.lng]}
                radius={isSelected ? 10 : 6}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: isFrom ? "#3b82f6" : isTo ? "#ef4444" : isSelectionMode ? "#475569" : "#64748b",
                  fillOpacity: isSelected ? 1 : 0.85,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={onStationClick ? { click: () => onStationClick(s.name) } : {}}
                {...(onStationClick ? { bubblingMouseEvents: false } : {})}
              >
                <Tooltip permanent={isSelected} direction="top" offset={[0, -6]}>
                  {s.name}{isFrom ? " — Start" : isTo ? " — Destination" : ""}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {routeSegments.map((seg, i) => (
            <Polyline key={i} positions={seg.coords}
              pathOptions={{ color: seg.color, weight: 9, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
          ))}

          {route && routeStationNames.map(name => {
            const c = STATION_COORDS[name];
            if (!c) return null;
            const isStart = name === route.from;
            const isDest = name === route.to;
            const isEndpoint = isStart || isDest;
            return (
              <CircleMarker key={name} center={c} radius={isEndpoint ? 11 : 7}
                pathOptions={{ color: "#ffffff", fillColor: isStart ? "#3b82f6" : isDest ? "#ef4444" : (stationColor[name] || "#475569"), fillOpacity: 1, weight: 3 }}>
                <Tooltip permanent={isEndpoint} direction="top" offset={[0, -6]}>
                  {name}{isStart ? " — Start" : isDest ? " — Destination" : ""}
                </Tooltip>
              </CircleMarker>
            );
          })}

          {userLocation && (
            <CircleMarker center={userLocation} radius={11}
              pathOptions={{ color: "#ffffff", fillColor: "#3b82f6", fillOpacity: 1, weight: 4 }}>
              <Tooltip permanent direction="top" offset={[0, -6]}>You are here</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {legendLines.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          {legendLines.map(({ line, color }) => (
            <div key={line} className="flex items-center gap-2">
              <span className="inline-block w-6 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-semibold">{line}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-white shadow" />
            <span className="text-sm font-semibold">Start</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow" />
            <span className="text-sm font-semibold">Destination</span>
          </div>
        </div>
      )}
    </div>
  );
}
