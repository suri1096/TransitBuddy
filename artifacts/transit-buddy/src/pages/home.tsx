import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Clock, MapPin, Search, ArrowRight, Play, CheckCircle2, Locate, ChevronDown, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { STATION_NAMES, findRoute, nearestStationWithDistance } from "@/lib/bart-data";
import { useSettings, formatDist } from "@/lib/settings-context";
import { useRoute } from "@/lib/route-context";
import { useAuth } from "@/lib/auth-context";
import { useTour } from "@/lib/tour-context";

import { BartGpsMap } from "@/components/bart-gps-map";
import { StationHelp } from "@/components/station-help";
import logoUrl from "@/assets/transit-buddy-logo.png";

const hl = (active: boolean) =>
  active ? "ring-4 ring-primary/60 ring-offset-2 rounded-2xl transition-all duration-300" : "";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { userName, userId } = useAuth();
  const { units } = useSettings();
  const { setRoute, plannedRoute, clearRoute } = useRoute();

  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLostOpen, setIsLostOpen] = useState(false);
  const [lostStep, setLostStep] = useState<"initial" | "solution">("initial");
  const [stationHelpOpen, setStationHelpOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const { startTour, highlightId } = useTour();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleGPS = useCallback(() => {
    if (!("geolocation" in navigator)) { setGpsInfo("Location not supported on this device. Please pick your station."); return; }
    setGpsLoading(true); setGpsInfo(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        const { station, distKm } = nearestStationWithDistance(pos.coords.latitude, pos.coords.longitude);
        setFromStation(station.name);
        const dist = formatDist(distKm * 1000, units);
        setGpsInfo(`📍 Nearest: ${station.name} (${dist} away)`);
        setGpsLoading(false);
      },
      () => { setGpsInfo("⚠ Could not get location — please select your station manually."); setGpsLoading(false); },
      { timeout: 8000 },
    );
  }, []);

  const handleFindRoute = useCallback(() => {
    setRouteError(null);
    if (!fromStation || !toStation) { setRouteError("Select both a starting station and a destination."); return; }
    if (fromStation === toStation) { setRouteError("Starting station and destination must be different."); return; }
    const route = findRoute(fromStation, toStation);
    if (!route) { setRouteError("No route found. Try different stations."); return; }
    setRoute(route);
  }, [fromStation, toStation, setRoute]);

  const handleStationClick = useCallback((name: string) => {
    setRouteError(null);
    if (!fromStation || (fromStation && toStation)) {
      setFromStation(name);
      setToStation("");
    } else {
      setToStation(name);
    }
  }, [fromStation, toStation]);

  const lineBadge = (line: string) => ({
    "Yellow Line": "bg-yellow-400 text-yellow-900",
    "Red Line":    "bg-red-500 text-white",
    "Orange Line": "bg-orange-500 text-white",
    "Green Line":  "bg-green-500 text-white",
    "Blue Line":   "bg-blue-500 text-white",
  }[line] || "bg-muted text-foreground");

  return (
    <>
    {/* ── FULLSCREEN MAP OVERLAY ─────────────────────────────────────────── */}
    {mapFullscreen && (
      <div className="fixed inset-0 z-[400] bg-background flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-bold">{plannedRoute ? `${plannedRoute.from} → ${plannedRoute.to}` : "BART Map"}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={() => setMapFullscreen(false)} aria-label="Close fullscreen map">
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <BartGpsMap
              route={plannedRoute}
              userLocation={userLocation}
              height={Math.max(window.innerHeight - 60, 400)}
              onStationClick={!plannedRoute ? handleStationClick : undefined}
              selectedFrom={fromStation}
              selectedTo={toStation}
            />
          </div>
        </div>
      </div>
    )}
    <div className="p-5 space-y-6 pb-24 animate-in fade-in duration-300">
      <header className="flex flex-col items-center gap-1">
        <img src={logoUrl} alt="TransitBuddy" className="w-auto object-contain" style={{ height: "8.75rem" }} />
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{greeting}, {userName || "there"}.</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 mt-1 text-sm">
            <Clock className="w-4 h-4" /> {currentTime}
          </p>
        </div>
      </header>

      <div data-tour-id="tour-lost" className={`flex items-center gap-3 ${hl(highlightId === "tour-lost")}`}>
        {/* Animated guide mascot — left side */}
        <div className="shrink-0">
          <img src="/train-calm.gif" alt="TransitBuddy guide" className="w-28 h-28 object-contain" style={{ mixBlendMode: "multiply" }} />
        </div>

        {/* Buttons stacked vertically on the right */}
        <div className="flex-1 flex flex-col gap-3">
          {/* I'm Lost */}
          <Dialog open={isLostOpen} onOpenChange={o => { setIsLostOpen(o); if (!o) setTimeout(() => setLostStep("initial"), 300); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full h-16 text-lg rounded-3xl bg-primary shadow-lg font-extrabold gap-2" data-testid="im-lost-home">
              <Search className="w-5 h-5 shrink-0" /> I'm Lost
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[90vw] p-6">
            <div className="flex justify-center -mt-2 mb-1">
              <img src="/train-lost.gif" alt="Confused train mascot" className="w-32 h-32 object-contain" style={{ mixBlendMode: "multiply" }} />
            </div>
            <DialogHeader><DialogTitle className="text-2xl text-center font-extrabold">You're not stuck.</DialogTitle></DialogHeader>
            <div className="py-4">
              {lostStep === "initial" ? (
                <div className="space-y-3">
                  <p className="text-center text-muted-foreground mb-5 text-lg">What do you see right now?</p>
                  {["I see a platform", "I see a bus stop", "I see signs", "I see a ticket machine", "I don't know"].map(opt => (
                    <Button key={opt} variant="outline" className="w-full h-13 text-base justify-start px-4 rounded-xl border-2" onClick={() => setLostStep("solution")}>
                      <span className="w-3 h-3 rounded-full bg-primary mr-3 shrink-0" />{opt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-center">Let's go step by step.</h3>
                  <div className="space-y-2">
                    {["Stay where you are for a moment.", "Look for a yellow BART sign nearby.", "Find a BART employee in a blue uniform.", "You can contact transit staff from the Support tab."].map((tip, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-xl items-start">
                        <span className="font-bold text-primary w-5 shrink-0">{i + 1}</span>
                        <p className="text-base">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button className="flex-1 h-13 rounded-xl font-bold" onClick={() => { setIsLostOpen(false); setLostStep("initial"); }}>I feel better</Button>
                    <Button variant="secondary" className="flex-1 h-13 rounded-xl font-bold" onClick={() => { setIsLostOpen(false); setLostStep("initial"); setStationHelpOpen(true); }}>Get Help</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

          {/* Need Help */}
          <StationHelp label="Need Help?" />
          <StationHelp open={stationHelpOpen} onOpenChange={setStationHelpOpen} />
        </div>
      </div>

      <section data-tour-id="tour-map" className={`space-y-3 ${hl(highlightId === "tour-map")}`}>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold flex-1">{plannedRoute ? "Route Map" : "BART Map"}</h2>
          {plannedRoute && (
            <Badge variant="secondary" className="font-bold">{plannedRoute.from} → {plannedRoute.to}</Badge>
          )}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
            onClick={() => setMapFullscreen(true)}
            aria-label="Fullscreen map"
          >
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <BartGpsMap
          route={plannedRoute}
          userLocation={userLocation}
          height={440}
          onStationClick={!plannedRoute ? handleStationClick : undefined}
          selectedFrom={fromStation}
          selectedTo={toStation}
        />
        <p className="text-xs text-muted-foreground text-center">
          {plannedRoute
            ? "Your route is color-coded by BART line. See the legend below the map."
            : "Tap stations on the map — or use the selectors below — to plan your trip."}
        </p>
      </section>

      <section data-tour-id="tour-plan" className={`space-y-3 ${hl(highlightId === "tour-plan")}`}>
        <h2 className="text-lg font-bold">Plan Your Trip</h2>
        <Card className="rounded-3xl border-none shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">From</label>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-primary rounded-full px-3" onClick={handleGPS} disabled={gpsLoading} data-testid="use-location">
                  <Locate className={`w-3 h-3 mr-1 ${gpsLoading ? "animate-spin" : ""}`} />
                  {gpsLoading ? "Locating..." : "Use my location"}
                </Button>
              </div>
              <div className="relative">
                <select value={fromStation} onChange={e => { setFromStation(e.target.value); setRouteError(null); }}
                  className="w-full h-14 pl-4 pr-10 rounded-2xl border-2 border-border bg-background font-semibold text-base appearance-none focus:outline-none focus:border-primary cursor-pointer"
                  data-testid="select-from">
                  <option value="">Select starting station...</option>
                  {STATION_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fromStation ? (
                  <button
                    onClick={() => { setFromStation(""); setRouteError(null); clearRoute(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    aria-label="Clear starting station"
                    data-testid="clear-from"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                )}
              </div>
              {gpsInfo && <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">{gpsInfo}</p>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <button onClick={() => { const t = fromStation; setFromStation(toStation); setToStation(t); }}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" data-testid="swap-stations">
                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
              </button>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">To</label>
              <div className="relative">
                <select value={toStation} onChange={e => { setToStation(e.target.value); setRouteError(null); }}
                  className="w-full h-14 pl-4 pr-10 rounded-2xl border-2 border-border bg-background font-semibold text-base appearance-none focus:outline-none focus:border-primary cursor-pointer"
                  data-testid="select-to">
                  <option value="">Select destination...</option>
                  {STATION_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {toStation ? (
                  <button
                    onClick={() => { setToStation(""); setRouteError(null); clearRoute(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    aria-label="Clear destination station"
                    data-testid="clear-to"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ) : (
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                )}
              </div>
            </div>

            {routeError && <p className="text-destructive text-sm font-semibold">{routeError}</p>}
            <Button className="w-full h-14 rounded-2xl font-bold text-base shadow-md" onClick={handleFindRoute} data-testid="find-route">
              <Search className="w-5 h-5 mr-2" /> Find My Route
            </Button>
          </CardContent>
        </Card>
      </section>

      {plannedRoute && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Your Route</h2>
          <Card className="rounded-3xl border-none shadow-md bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {plannedRoute.segments.map(seg => (
                      <Badge key={seg.line} className={`${lineBadge(seg.line)} border-0 font-bold px-3`}>
                        {seg.symbol} {seg.line}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-extrabold text-lg leading-tight">{plannedRoute.from} → {plannedRoute.to}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>~{plannedRoute.totalMinutes} min</span>
                    <span>·</span>
                    <span>{plannedRoute.segments.reduce((a, s) => a + s.numStops, 0)} stops</span>
                    {plannedRoute.segments.length > 1 && <><span>·</span><span>{plannedRoute.segments.length - 1} transfer</span></>}
                  </div>
                </div>
                <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0 mt-1" />
              </div>
              <Button className="w-full rounded-2xl h-13 font-bold shadow" onClick={() => setLocation("/trip")} data-testid="start-trip">
                <Play className="w-4 h-4 mr-2" /> Start Trip
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Replay tour guide — bottom of page */}
      <div className="flex justify-center pt-2 pb-6">
        <button
          onClick={startTour}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors px-4 py-2 rounded-2xl hover:bg-primary/8"
          aria-label="Replay tour guide"
        >
          <RotateCcw className="w-4 h-4" />
          Replay Tour Guide
        </button>
      </div>
    </div>
    </>
  );
}
