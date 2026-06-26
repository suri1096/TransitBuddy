import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useSettings, formatDist } from "@/lib/settings-context";
import { MapPin, Clock, CheckCircle2, HeartHandshake, WifiOff, Wifi, Navigation, LinkIcon, Settings, Train } from "lucide-react";
import { LiveLocationMap } from "@/components/live-location-map";

interface TripProgress {
  currentStep: number;
  totalSteps: number;
  from: string;
  to: string;
  stepText: string;
  timestamp?: number;
  totalMinutes?: number;
  onTrain?: boolean;
  stopList?: string[];
  currentStopIndex?: number;
  lineColor?: string;
  gpsMinutesLeft?: number | null;
}

interface ApiLocation {
  lat: number;
  lng: number;
  accuracy: number;
  tripProgress: TripProgress | null;
  sharingEnabled: boolean;
  updatedAt: string;
}

interface Connection {
  id: number;
  caregiverId: number;
  travelerId: number;
  status: string;
  otherUser: {
    id: number;
    username: string;
    displayName: string;
    role: "traveler" | "caregiver";
    phone?: string | null;
  };
}

async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(path, { credentials: "include", ...opts, headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) } });
}

export default function CaregiverMode() {
  const { userName, user } = useAuth();
  const { units } = useSettings();
  const [_, setLocation] = useLocation();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [connsLoading, setConnsLoading] = useState(true);
  const [selectedTraveler, setSelectedTraveler] = useState<Connection | null>(null);
  const [apiLocation, setApiLocation] = useState<ApiLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const r = await apiFetch("/api/connections");
      if (r.ok) {
        const data: Connection[] = await r.json();
        const accepted = data.filter(c => c.status === "accepted" && c.otherUser?.role === "traveler");
        setConnections(accepted);
        if (accepted.length > 0 && !selectedTraveler) {
          setSelectedTraveler(accepted[0]);
        }
      }
    } catch {}
    setConnsLoading(false);
  }, [selectedTraveler]);

  useEffect(() => { fetchConnections(); }, []);

  const pollLocation = useCallback(async (conn: Connection) => {
    try {
      const r = await apiFetch(`/api/location/${conn.otherUser.id}`);
      if (r.ok) {
        const data: ApiLocation = await r.json();
        setApiLocation(data);
        setLastUpdate(Date.now());
      } else {
        setApiLocation(null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedTraveler) return;
    pollLocation(selectedTraveler);
    pollRef.current = setInterval(() => pollLocation(selectedTraveler), 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedTraveler, pollLocation]);

  const live = apiLocation?.tripProgress ?? null;
  const location = apiLocation?.sharingEnabled ? apiLocation : null;
  const isOnline = lastUpdate !== null && Date.now() - lastUpdate < 10000;

  const progress = live ? Math.round((live.currentStep / Math.max(live.totalSteps - 1, 1)) * 100) : 0;
  const isAtDestination = !!live && live.currentStep >= live.totalSteps - 1;
  const secondsAgo = lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null;
  const freshLabel = secondsAgo === null ? "Never" : secondsAgo < 5 ? "Just now" : secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.round(secondsAgo / 60)}m ago`;

  const minutesLeft =
    live?.gpsMinutesLeft != null ? live.gpsMinutesLeft :
    live?.totalMinutes != null
      ? Math.max(0, Math.round(live.totalMinutes * (1 - live.currentStep / Math.max(live.totalSteps, 1))))
      : null;
  const eta = minutesLeft != null ? new Date(Date.now() + minutesLeft * 60000) : null;
  const etaStr = eta ? eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const travelerName = selectedTraveler?.otherUser.displayName ?? "Your traveler";
  const onTrain = !!live?.onTrain;
  const stopList = live?.stopList ?? [];
  const currentStopIndex = live?.currentStopIndex ?? 0;
  const lineColor = live?.lineColor ?? "#6366f1";
  const currentStopName = stopList[currentStopIndex] ?? null;

  if (connsLoading) {
    return (
      <div className="p-5 pt-16 flex flex-col items-center justify-center gap-4 animate-in fade-in">
        <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-semibold">Loading connections…</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 pb-24 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-md">
          <HeartHandshake className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Caregiver View</h1>
          <p className="text-sm text-muted-foreground">Hi, {userName || user?.username || "Caregiver"}</p>
        </div>
        {selectedTraveler && (
          <div className="ml-auto flex flex-col items-end gap-1">
            <Badge className={`border-0 font-bold ${isOnline && live ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
              {isOnline && live ? "LIVE" : "WAITING"}
            </Badge>
            {lastUpdate && <span className="text-xs text-muted-foreground">{freshLabel}</span>}
          </div>
        )}
      </div>

      {connections.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm bg-muted/40">
          <CardContent className="p-6 space-y-4 text-center">
            <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-bold text-xl">No linked travelers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Go to Settings → Connections to link with a traveler using their username. Once they accept, you'll see their live trip updates here.
              </p>
            </div>
            <Button className="rounded-xl font-bold" onClick={() => setLocation("/settings")}>
              <Settings className="w-4 h-4 mr-2" /> Go to Settings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {connections.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Viewing traveler</label>
              <div className="flex flex-wrap gap-2">
                {connections.map(c => (
                  <button key={c.id} onClick={() => setSelectedTraveler(c)}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedTraveler?.id === c.id ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" : "border-border hover:border-purple-400"}`}>
                    {c.otherUser.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!live ? (
            <Card className="rounded-3xl border-none shadow-sm bg-muted/40">
              <CardContent className="p-5 flex items-center gap-4">
                <WifiOff className="w-8 h-8 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-bold text-lg">Waiting for {travelerName}…</p>
                  <p className="text-sm text-muted-foreground">
                    Updates appear here automatically when {travelerName} starts a trip on their device. Their location and progress update every few seconds.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status banner */}
              <Card className={`rounded-3xl border-none shadow-sm ${isAtDestination ? "bg-green-50 dark:bg-green-950/30" : onTrain ? "bg-indigo-50 dark:bg-indigo-950/20" : "bg-blue-50 dark:bg-blue-950/20"}`}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${isAtDestination ? "bg-green-500" : "bg-blue-500 animate-pulse"}`} />
                  {isAtDestination ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  ) : onTrain ? (
                    <Train className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <Wifi className="w-6 h-6 text-blue-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg ${isAtDestination ? "text-green-700 dark:text-green-300" : onTrain ? "text-indigo-700 dark:text-indigo-300" : "text-blue-700 dark:text-blue-300"}`}>
                      {isAtDestination ? `${travelerName} has arrived!` : onTrain ? `${travelerName} is on the train` : `${travelerName} is on their way`}
                    </p>
                    {onTrain && currentStopName ? (
                      <p className="text-sm font-semibold text-muted-foreground">
                        Currently near: <span className="text-foreground">{currentStopName}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground truncate">{live.stepText}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Live location map */}
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-primary shrink-0" />
                      <h2 className="font-bold text-lg">Live Location</h2>
                      {onTrain && <Badge className="border-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold text-xs">ON TRAIN</Badge>}
                    </div>
                    {location && (
                      <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-bold">GPS LIVE</Badge>
                    )}
                  </div>
                  {location ? (
                    <>
                      <LiveLocationMap
                        lat={location.lat}
                        lng={location.lng}
                        accuracy={location.accuracy}
                        label={travelerName}
                        stops={onTrain ? stopList : []}
                        currentStopIndex={currentStopIndex}
                        lineColor={lineColor}
                        height={onTrain ? 300 : 240}
                      />
                      <p className="text-xs text-muted-foreground">Accurate to ±{formatDist(location.accuracy, units)} · updated {freshLabel}</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-2xl">
                      <MapPin className="w-6 h-6 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground">{travelerName} hasn't shared GPS location yet. They can turn this on in Settings → Location Sharing.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trip progress */}
              <Card className="rounded-3xl border-none shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg">Trip Progress</h2>
                    <span className="text-sm font-semibold text-primary">{progress}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{live.from}</span>
                    <span className="mx-1">→</span>
                    <span className="font-bold text-primary">{live.to}</span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Step {live.currentStep + 1} of {live.totalSteps}</span>
                    <span>{isAtDestination ? "Arrived!" : minutesLeft != null ? `~${minutesLeft} min left` : `~${Math.max(0, live.totalSteps - live.currentStep - 1)} steps left`}</span>
                  </div>
                  {onTrain && stopList.length > 0 && (
                    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      <div className="flex items-center" style={{ minWidth: stopList.length * 52 }}>
                        {stopList.map((stop, i) => {
                          const past = i < currentStopIndex;
                          const current = i === currentStopIndex;
                          return (
                            <React.Fragment key={stop}>
                              <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 48 }}>
                                <div className={`rounded-full border-2 border-background shadow-sm transition-all ${current ? "animate-pulse scale-125" : ""}`}
                                  style={{
                                    width: i === 0 || i === stopList.length - 1 ? 12 : 9,
                                    height: i === 0 || i === stopList.length - 1 ? 12 : 9,
                                    backgroundColor: past || current ? lineColor : "#d1d5db",
                                  }}
                                />
                                <span className="text-[7px] font-bold text-center leading-tight text-foreground/50 truncate w-12">{stop}</span>
                              </div>
                              {i < stopList.length - 1 && (
                                <div className="flex-1 h-1 rounded-full" style={{ minWidth: 6, backgroundColor: past ? lineColor : "#e5e7eb" }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!onTrain && (
                    <div className="p-4 bg-muted/40 rounded-2xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current step</p>
                      <p className="font-semibold text-sm">{live.stepText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card className="rounded-2xl border-none shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold uppercase">Destination</span>
                    </div>
                    <p className="font-bold text-sm leading-snug">{live.to}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold uppercase">Est. Arrival</span>
                    </div>
                    <p className="font-bold text-base">{isAtDestination ? "Now ✓" : etaStr}</p>
                    {live.gpsMinutesLeft != null && !isAtDestination && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">GPS-accurate</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

        </>
      )}
    </div>
  );
}
