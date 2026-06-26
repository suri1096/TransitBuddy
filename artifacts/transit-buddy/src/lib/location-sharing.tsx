import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type LocationChoice = "trips" | "always" | "never";
export type SharingStatus = "off" | "waiting" | "requesting" | "active" | "denied" | "unavailable";

export interface LiveCoords {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface LocationSharingValue {
  enabled: boolean;
  choice: LocationChoice;
  status: SharingStatus;
  coords: LiveCoords | null;
  setEnabled: (v: boolean) => void;
  setChoice: (c: LocationChoice) => void;
}

const KEY_ENABLED = "transitbuddy_location_sharing";
const KEY_CHOICE = "transitbuddy_location_choice";
const KEY_LOCATION = "transitbuddy_location";
const KEY_TRIP = "transitbuddy_trip_progress";

const TRIP_FRESH_MS = 30000;

const Ctx = createContext<LocationSharingValue | null>(null);

export function useLocationSharing(): LocationSharingValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useLocationSharing must be used within LocationSharingProvider");
  return value;
}

function readBool(key: string): boolean {
  try { return localStorage.getItem(key) === "true"; } catch { return false; }
}

function readChoice(): LocationChoice {
  try {
    const raw = localStorage.getItem(KEY_CHOICE);
    if (raw === "trips" || raw === "always" || raw === "never") return raw;
  } catch { /* ignore */ }
  return "trips";
}

function clearStoredLocation() {
  try { localStorage.removeItem(KEY_LOCATION); } catch { /* ignore */ }
}

async function postLocationToApi(coords: LiveCoords, tripProgress: unknown) {
  try {
    await fetch("/api/location", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy, tripProgress }),
    });
  } catch { /* best-effort */ }
}

async function deleteLocationFromApi() {
  try {
    await fetch("/api/location", { method: "DELETE", credentials: "include" });
  } catch { /* best-effort */ }
}

function readTripProgress(): unknown {
  try {
    const raw = localStorage.getItem(KEY_TRIP);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function LocationSharingProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => readBool(KEY_ENABLED));
  const [choice, setChoiceState] = useState<LocationChoice>(() => readChoice());
  const [status, setStatus] = useState<SharingStatus>("off");
  const [coords, setCoords] = useState<LiveCoords | null>(null);
  const [tripActive, setTripActive] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem(KEY_TRIP);
        if (raw) {
          const data = JSON.parse(raw) as { timestamp?: number };
          setTripActive(!!data.timestamp && Date.now() - data.timestamp < TRIP_FRESH_MS);
          return;
        }
      } catch { /* ignore */ }
      setTripActive(false);
    };
    check();
    const id = window.setInterval(check, 3000);
    return () => window.clearInterval(id);
  }, []);

  const shouldShare =
    enabled && choice !== "never" && (choice === "always" || (choice === "trips" && tripActive));

  useEffect(() => {
    if (!shouldShare) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      clearStoredLocation();
      setCoords(null);
      setStatus(enabled && choice === "trips" ? "waiting" : "off");
      deleteLocationFromApi();
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    setStatus("requesting");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next: LiveCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        setCoords(next);
        setStatus("active");
        try { localStorage.setItem(KEY_LOCATION, JSON.stringify(next)); } catch { /* ignore */ }
        postLocationToApi(next, readTripProgress());
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    watchId.current = id;

    return () => {
      navigator.geolocation.clearWatch(id);
      if (watchId.current === id) watchId.current = null;
    };
  }, [shouldShare, enabled, choice]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try { localStorage.setItem(KEY_ENABLED, String(v)); } catch { /* ignore */ }
    if (!v) {
      clearStoredLocation();
      deleteLocationFromApi();
      return;
    }
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      setStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        () => { /* permission granted; the watch effect takes over */ },
        (err) => { setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"); },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 },
      );
    } else {
      setStatus("unavailable");
    }
  }, []);

  const setChoice = useCallback((c: LocationChoice) => {
    setChoiceState(c);
    try { localStorage.setItem(KEY_CHOICE, c); } catch { /* ignore */ }
    if (c === "never") { clearStoredLocation(); deleteLocationFromApi(); }
  }, []);

  return (
    <Ctx.Provider value={{ enabled, choice, status, coords, setEnabled, setChoice }}>
      {children}
    </Ctx.Provider>
  );
}
