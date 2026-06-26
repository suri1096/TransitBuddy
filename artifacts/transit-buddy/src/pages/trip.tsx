import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Volume2, VolumeX, Play, Pause, HelpCircle, Search, MapPin, Navigation, Train, Footprints, CheckCircle2, ArrowRight, TicketCheck, ArrowLeftRight, ChevronDown, ChevronUp, AlertTriangle, X, Bell, XCircle, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useRoute } from "@/lib/route-context";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { BartGpsMap } from "@/components/bart-gps-map";
import { BART_STATIONS } from "@/lib/bart-data";
import { motion, AnimatePresence } from "framer-motion";

// ── Module-level constants ────────────────────────────────────────────────────
const LINE_BADGE_COLORS: Record<string, string> = {
  "Yellow Line": "bg-yellow-400 text-yellow-900",
  "Red Line":    "bg-red-500 text-white",
  "Orange Line": "bg-orange-500 text-white",
  "Green Line":  "bg-green-500 text-white",
  "Blue Line":   "bg-blue-500 text-white",
};
const LINE_TRACK_COLORS: Record<string, string> = {
  "Yellow Line": "#F5A623",
  "Red Line":    "#E84040",
  "Orange Line": "#F97316",
  "Green Line":  "#22C55E",
  "Blue Line":   "#3B82F6",
};

// ── Utility ──────────────────────────────────────────────────────────────────
function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tryVibrate(pattern: number[]) {
  try { if ("vibrate" in navigator) navigator.vibrate(pattern); } catch {}
}

const STEP_ICONS: Record<string, React.ElementType> = {
  walk:     Footprints,
  station:  TicketCheck,
  platform: Navigation,
  train:    Train,
  transfer: ArrowLeftRight,
  arrive:   CheckCircle2,
};

const CONFUSED_QA = [
  { q: "Which train do I take?", a: "Check your step — it shows the line name (like Yellow ★) and the direction (the last stop on the sign above the platform). Match the sign to what TransitBuddy shows." },
  { q: "What stop do I get off at?", a: "Your step shows the destination station. Count the stops as the train goes — the conductor announces each one." },
  { q: "What does transfer mean?", a: "Transfer = switch trains. Stay inside the fare gates, follow the signs for the next line, and board the new train. Your Clipper card covers the whole trip." },
  { q: "I missed my stop!", a: "Stay calm. Get off at the very next stop. Cross to the other platform and ride one stop back. You'll be fine." },
  { q: "Am I going the right way?", a: "The sign above the platform shows the final destination. Match it to the direction your step says. If unsure, ask a BART employee in a blue uniform." },
];

function saveTripProgress(data: object) {
  try { localStorage.setItem("transitbuddy_trip_progress", JSON.stringify({ ...data, timestamp: Date.now() })); } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Trip() {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoAudio, setAutoAudio] = useState(true);
  const [audioRate, setAudioRate] = useState(0.85);
  const [paused, setPaused] = useState(false);
  const [manualSpeaking, setManualSpeaking] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [showWalkPrompt, setShowWalkPrompt] = useState(true);
  const [isLostOpen, setIsLostOpen] = useState(false);
  const [lostSel, setLostSel] = useState<"initial" | "solution">("initial");

  // Live location
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // GPS-based stop tracking (while on train)
  const [gpsStopIndex, setGpsStopIndex] = useState(0);
  const announcedStopsRef = useRef(new Set<string>());
  const stopBarRef = useRef<HTMLDivElement>(null);

  // 3-stage approach alert: "5min" | "1min" | "getoff" | null
  type AlertStage = "5min" | "1min" | "getoff";
  const [alertStage, setAlertStage] = useState<AlertStage | null>(null);
  const [getOffStation, setGetOffStation] = useState<string>("");
  const alertsFiredRef = useRef(new Set<AlertStage>());
  const [arrivedConfirmed, setArrivedConfirmed] = useState(false);
  const [arrivedDestination, setArrivedDestination] = useState("");

  const { toast } = useToast();
  const { tripSteps, plannedRoute, clearRoute } = useRoute();
  const { userName } = useAuth();
  const [_, setLocation] = useLocation();

  const step = tripSteps[currentStep];
  const nextStep = tripSteps[currentStep + 1];

  // ── Stable train-step derived values (used in effects below) ─────────────
  const firstTrainStep = useMemo(() => tripSteps.find(s => s.type === "train" && s.stopList), [tripSteps]);
  const currentTrainStep = useMemo(() => {
    const s = tripSteps[currentStep];
    return (s && s.type === "train" && s.stopList) ? s : null;
  }, [tripSteps, currentStep]);
  const stopList = useMemo(() => currentTrainStep?.stopList ?? [], [currentTrainStep]);
  const trainStepIndex = useMemo(() => currentTrainStep ? currentStep : -1, [currentTrainStep, currentStep]);

  // ── Save progress ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!plannedRoute || !step) return;
    const isOnTrain = step.type === "train";
    const lc = firstTrainStep?.route ? LINE_TRACK_COLORS[firstTrainStep.route] : "#6366f1";
    const exitStName = stopList[stopList.length - 1];
    const exitSt = exitStName ? BART_STATIONS.find(s => s.name === exitStName) ?? null : null;
    const gpsEta = (userCoords && exitSt && isOnTrain)
      ? Math.max(0, Math.round(distMeters(userCoords[0], userCoords[1], exitSt.lat, exitSt.lng) / (35000 / 60)))
      : null;
    saveTripProgress({
      currentStep, totalSteps: tripSteps.length,
      from: plannedRoute.from, to: plannedRoute.to,
      stepText: step.text, userName, totalMinutes: plannedRoute.totalMinutes,
      onTrain: isOnTrain, stopList, currentStopIndex: gpsStopIndex,
      lineColor: lc, gpsMinutesLeft: gpsEta,
    });
  }, [currentStep, plannedRoute, step, gpsStopIndex, userCoords, stopList]);

  // ── Auto-audio (gated: don't speak until walk-prompt is answered) ─────────
  useEffect(() => {
    const walkPromptVisible = showWalkPrompt && currentStep === 0 && trainStepIndex > 0;
    if (!autoAudio || !step || walkPromptVisible) return;
    setPaused(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utt = new SpeechSynthesisUtterance(`${step.text}. ${step.detail}`);
    utt.rate = audioRate; utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
    return () => { window.speechSynthesis.cancel(); };
  }, [currentStep, autoAudio, audioRate, showWalkPrompt, trainStepIndex]);

  // ── GPS watch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => { setUserCoords([pos.coords.latitude, pos.coords.longitude]); },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Exit station for current train step ───────────────────────────────────
  const exitStationObj = useMemo(() => {
    if (!step || step.type !== "train" || !step.stopList || step.stopList.length === 0) return null;
    const name = step.stopList[step.stopList.length - 1];
    return BART_STATIONS.find(s => s.name === name) ?? null;
  }, [step]);

  // ── 3-stage alert: fire only once per stage, skip lower urgency if higher already fired ─
  const fireAlert = useCallback((stage: "5min" | "1min" | "getoff", stationName: string, isTransfer = false, nextLine: string | null = null) => {
    const fired = alertsFiredRef.current;
    if (fired.has(stage)) return;
    const urgency = { "5min": 1, "1min": 2, "getoff": 3 };
    for (const s of fired) { if (urgency[s] > urgency[stage]) return; }
    fired.add(stage);
    setGetOffStation(stationName);
    setAlertStage(stage);

    if (stage === "5min") {
      tryVibrate([100, 80, 100]);
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const msg = isTransfer
        ? `You'll need to transfer at ${stationName} in about 5 minutes. Start gathering your things.`
        : `Your stop is coming up in about 5 minutes. Start getting ready.`;
      const utt5 = new SpeechSynthesisUtterance(msg);
      utt5.rate = audioRate; window.speechSynthesis.speak(utt5);
      setTimeout(() => setAlertStage(prev => prev === "5min" ? null : prev), 12000);
    } else if (stage === "1min") {
      tryVibrate([200, 100, 200, 100, 200]);
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const msg = isTransfer
        ? `Almost at ${stationName}! Get ready to exit and transfer to the ${nextLine ?? "next train"}.`
        : `Almost there! About one minute until your stop at ${stationName}. Get ready to exit.`;
      const utt1 = new SpeechSynthesisUtterance(msg);
      utt1.rate = audioRate; window.speechSynthesis.speak(utt1);
      setTimeout(() => setAlertStage(prev => prev === "1min" ? null : prev), 10000);
    } else {
      tryVibrate([500, 150, 500, 150, 800]);
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 900);
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const msg = isTransfer
        ? `Transfer now! Exit at ${stationName} and follow signs for the ${nextLine ?? "next train"}.`
        : `Time to get off! This is ${stationName}! Exit the train now.`;
      const uttOff = new SpeechSynthesisUtterance(msg);
      uttOff.rate = audioRate; uttOff.pitch = 1.1; uttOff.volume = 1;
      window.speechSynthesis.speak(uttOff);
    }
  }, [audioRate]);

  // ── Transfer detection for current train step ────────────────────────────
  const isTransferGetoff = step?.type === "train" && nextStep?.type === "transfer";
  const transferNextLine = isTransferGetoff ? (tripSteps[currentStep + 2]?.route ?? null) : null;

  // Active segment index for map filtering — must stay before any early returns
  const activeSegmentIndex = useMemo(() => {
    if (!plannedRoute) return 0;
    const idx = plannedRoute.segments.findIndex(seg => seg.line === step?.route);
    return idx >= 0 ? idx : 0;
  }, [plannedRoute, step?.route]);

  // ── GPS proximity → 3 distance thresholds ────────────────────────────────
  // 5 min @ ~50 km/h ≈ 4 km  |  1 min ≈ 800 m  |  get-off ≈ 400 m
  useEffect(() => {
    if (!userCoords || !exitStationObj) return;
    const d = distMeters(userCoords[0], userCoords[1], exitStationObj.lat, exitStationObj.lng);
    const name = exitStationObj.name;
    const isXfer = step?.type === "train" && nextStep?.type === "transfer";
    const nextLn = isXfer ? (tripSteps[currentStep + 2]?.route ?? null) : null;
    if (d < 400)       fireAlert("getoff", name, isXfer, nextLn);
    else if (d < 800)  fireAlert("1min",   name, isXfer, nextLn);
    else if (d < 4000) fireAlert("5min",   name, isXfer, nextLn);
  }, [userCoords, exitStationObj, fireAlert, step, nextStep, tripSteps, currentStep]);

  // ── Timer-based fallback (only when GPS unavailable) ─────────────────────
  useEffect(() => {
    const numStops = step?.stopList?.length;
    if (!step || step.type !== "train" || !numStops || userCoords) return;
    const stationName = step.stopList![step.stopList!.length - 1] ?? plannedRoute?.to ?? "your stop";
    const totalMs = numStops * 2.5 * 60 * 1000;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (totalMs > 6 * 60 * 1000)  timers.push(setTimeout(() => fireAlert("5min",   stationName), totalMs - 5 * 60 * 1000));
    if (totalMs > 90 * 1000)      timers.push(setTimeout(() => fireAlert("1min",   stationName), Math.max(0, totalMs - 60 * 1000)));
    timers.push(setTimeout(() => fireAlert("getoff", stationName), totalMs));
    return () => timers.forEach(clearTimeout);
  }, [currentStep, step?.type, step?.stopList?.length, userCoords]);

  // ── Reset alerts + stop tracking when step changes ───────────────────────
  useEffect(() => {
    alertsFiredRef.current = new Set();
    announcedStopsRef.current = new Set();
    setAlertStage(null);
    setGpsStopIndex(0);
  }, [currentStep]);

  // ── GPS stop tracking — nearest stop along route while on train ──────────
  // Uses a highwater mark: once a stop is visited it stays colored in
  useEffect(() => {
    if (!userCoords || step?.type !== "train" || stopList.length === 0) return;
    let minDist = Infinity, minIdx = 0;
    stopList.forEach((name, i) => {
      const st = BART_STATIONS.find(s => s.name === name);
      if (!st) return;
      const d = distMeters(userCoords[0], userCoords[1], st.lat, st.lng);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    // Only advance forward — never un-color a stop that was already visited
    setGpsStopIndex(prev => Math.max(prev, minIdx));
    // Announce next intermediate stop (exit stop is handled by 3-stage alerts)
    const nextIdx = minIdx + 1;
    if (nextIdx < stopList.length - 1 && minDist < 1800) {
      const nextStop = stopList[nextIdx];
      if (autoAudio && !announcedStopsRef.current.has(nextStop)) {
        announcedStopsRef.current.add(nextStop);
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utt = new SpeechSynthesisUtterance(`Next stop: ${nextStop}`);
        utt.rate = audioRate;
        window.speechSynthesis.speak(utt);
      }
    }
  }, [userCoords, step?.type, stopList, autoAudio, audioRate]);


  // ── Auto-scroll stop bar to keep current stop centered ───────────────────
  useEffect(() => {
    const bar = stopBarRef.current;
    if (!bar) return;
    const STOP_WIDTH = 54; // minWidth 48 + gap
    const target = gpsStopIndex * STOP_WIDTH - bar.clientWidth / 2 + STOP_WIDTH / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [gpsStopIndex]);

  // ── Manual advance ────────────────────────────────────────────────────────
  const triggerFlash = useCallback(() => {
    tryVibrate([300, 150, 300]);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 700);
  }, []);

  const handleAutoAudioToggle = (val: boolean) => {
    setAutoAudio(val);
    if (!val) { window.speechSynthesis.cancel(); setPaused(false); }
  };

  const pauseSpeech = () => { window.speechSynthesis.pause(); setPaused(true); };
  const resumeSpeech = () => { window.speechSynthesis.resume(); setPaused(false); };

  const speak = useCallback(() => {
    if (!step) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    setPaused(false);
    setManualSpeaking(true);
    const utt = new SpeechSynthesisUtterance(`${step.text}. ${step.detail}`);
    utt.rate = audioRate;
    utt.onend = () => setManualSpeaking(false);
    utt.onerror = () => setManualSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [step, audioRate]);

  const pauseManual = () => { window.speechSynthesis.pause(); setPaused(true); };
  const resumeManual = () => { window.speechSynthesis.resume(); setPaused(false); };
  const stopManual = () => { window.speechSynthesis.cancel(); setManualSpeaking(false); setPaused(false); };

  const advanceStep = () => {
    if (currentStep >= tripSteps.length - 1) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    if (next >= tripSteps.length - 1) {
      const dest = plannedRoute?.to ?? "";
      window.speechSynthesis.cancel();
      setArrivedDestination(dest);
      setArrivedConfirmed(true);
      try { localStorage.removeItem("transitbuddy_trip_progress"); } catch {}
      clearRoute();
      triggerFlash();
    }
  };

  const resetAudio = () => {
    window.speechSynthesis.cancel();
    setPaused(false);
    if (autoAudio && step) {
      window.speechSynthesis.resume();
      const utt = new SpeechSynthesisUtterance(`${step.text}. ${step.detail}`);
      utt.rate = audioRate;
      window.speechSynthesis.speak(utt);
    }
  };

  const handleArrived = () => {
    const dest = plannedRoute?.to ?? "";
    window.speechSynthesis.cancel();
    setAlertStage(null);
    setArrivedDestination(dest);
    setArrivedConfirmed(true);
    try { localStorage.removeItem("transitbuddy_trip_progress"); } catch {}
    clearRoute();
    triggerFlash();
  };

  // Tap after getting off at a transfer station — advance to the transfer step
  const handleTransferArrival = () => {
    window.speechSynthesis.cancel();
    setAlertStage(null);
    setCurrentStep(c => c + 1);
  };

  const cancelTrip = () => {
    window.speechSynthesis.cancel();
    try { localStorage.removeItem("transitbuddy_trip_progress"); } catch {}
    clearRoute();
    setLocation("/");
  };

  // Show arrival celebration immediately after route is cleared
  if (arrivedConfirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center pb-24 animate-in fade-in duration-300">
        {flashActive && (
          <div className="fixed inset-0 z-[100] pointer-events-none bg-yellow-300 dark:bg-yellow-500 animate-pulse" style={{ opacity: 0.7 }} />
        )}
        <div className="flex justify-center w-full">
          <img src="/train-celebrate.gif" alt="Celebrating train" className="w-40 h-40 object-contain" style={{ mixBlendMode: "multiply" }} />
        </div>
        <div className="space-y-2 -mt-4">
          <h2 className="text-3xl font-extrabold text-green-700 dark:text-green-300">You made it! 🎉</h2>
          <p className="text-lg text-green-600 dark:text-green-400 font-semibold">{arrivedDestination}</p>
          <p className="text-muted-foreground text-sm">Well done — you completed the trip!</p>
        </div>
        <Button size="lg" className="rounded-2xl h-14 font-bold px-8" onClick={() => setLocation("/")} data-testid="done-trip">
          Plan Another Trip
        </Button>
      </div>
    );
  }

  if (!plannedRoute || tripSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center pb-24">
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
          <Train className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-extrabold">No trip planned yet</h2>
        <p className="text-muted-foreground text-lg">Go to Home and use the route planner to choose where you want to go.</p>
        <Button size="lg" className="rounded-2xl h-14 font-bold px-8" onClick={() => setLocation("/")} data-testid="go-plan-trip">
          Plan a Trip
        </Button>
      </div>
    );
  }

  const step0 = step!;
  const StepIcon = STEP_ICONS[step0.type] || Navigation;
  const progress = Math.round((currentStep / tripSteps.length) * 100);
  const lineColor = step0.route ? (LINE_TRACK_COLORS[step0.route] ?? "#6366f1") : "#6366f1";

  // Use GPS-based stop index when GPS active on train, else step-based fallback
  const stepBasedStopIndex = currentStep > trainStepIndex ? Math.min(stopList.length - 1, currentStep - trainStepIndex) : 0;
  const effectiveStopIndex = (userCoords && step0.type === "train") ? gpsStopIndex : stepBasedStopIndex;

  // GPS-based minutes remaining (shown in header)
  const gpsMinutesLeft = (userCoords && exitStationObj && currentStep >= trainStepIndex && trainStepIndex >= 0)
    ? Math.max(0, Math.round(distMeters(userCoords[0], userCoords[1], exitStationObj.lat, exitStationObj.lng) / (35000 / 60)))
    : null;

  const preBoardingStep = step0.type === "walk" || step0.type === "station" || step0.type === "platform";
  const skipToBoarding = () => {
    if (trainStepIndex >= 0) setCurrentStep(trainStepIndex);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      {/* Flash overlay */}
      {flashActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none bg-yellow-300 dark:bg-yellow-500 animate-pulse" style={{ opacity: 0.7 }} />
      )}

      {/* ── WALK PROMPT ──────────────────────────────────────────────────────── */}
      <Dialog open={showWalkPrompt && currentStep === 0 && trainStepIndex > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-3xl max-w-[88vw] p-7 text-center space-y-5 [&>button]:hidden">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <Footprints className="w-9 h-9 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold leading-tight">Walk to the station?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm leading-relaxed">Would you like step-by-step walking directions to get to the station?</p>
          <div className="flex flex-col gap-3 pt-1">
            <Button className="w-full h-14 rounded-2xl text-base font-extrabold" onClick={() => setShowWalkPrompt(false)} data-testid="walk-yes-btn">
              Yes, guide me 🚶
            </Button>
            <Button variant="outline" className="w-full h-14 rounded-2xl text-base font-bold border-2" onClick={() => { setShowWalkPrompt(false); skipToBoarding(); }} data-testid="walk-skip-btn">
              Skip — I'm already at the station
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── FULLSCREEN MAP OVERLAY ───────────────────────────────────────────── */}
      {mapFullscreen && (
        <div className="fixed inset-0 z-[400] bg-background flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-bold">{userCoords ? "Live Map · GPS Active 📍" : "Route Map"}</span>
              {userCoords && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" onClick={() => setMapFullscreen(false)} aria-label="Close map">
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <BartGpsMap route={plannedRoute} userLocation={userCoords} height={Math.max(window.innerHeight - 60, 400)} fromSegmentIndex={activeSegmentIndex} />
            </div>
          </div>
        </div>
      )}

      {/* ── 5-MINUTE WARNING — slides up from bottom ─────────────────────── */}
      <AnimatePresence>
        {alertStage === "5min" && (
          <motion.div
            key="alert-5min"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-20 inset-x-0 z-[200] px-4"
          >
            <div className="bg-sky-500 dark:bg-sky-600 rounded-3xl p-5 shadow-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-400 dark:bg-sky-500 flex items-center justify-center shrink-0">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight">5 minutes to your stop!</p>
                <p className="text-sky-100 font-semibold text-sm mt-0.5 truncate">{getOffStation || plannedRoute.to}</p>
                <p className="text-sky-200 text-xs mt-0.5">Start gathering your things</p>
              </div>
              <button
                onClick={() => setAlertStage(null)}
                className="w-8 h-8 rounded-full bg-sky-400/50 flex items-center justify-center shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1-MINUTE WARNING — slides up from bottom ─────────────────────── */}
      <AnimatePresence>
        {alertStage === "1min" && (
          <motion.div
            key="alert-1min"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="fixed bottom-20 inset-x-0 z-[200] px-4"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: 2, duration: 0.4 }}
              className="bg-orange-500 dark:bg-orange-600 rounded-3xl p-5 shadow-2xl flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-400 dark:bg-orange-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-xl leading-tight">1 minute left!</p>
                <p className="text-orange-100 font-bold text-sm mt-0.5 truncate">{getOffStation || plannedRoute.to}</p>
                <p className="text-orange-200 text-xs mt-0.5">Get ready to get off the train now</p>
              </div>
              <button
                onClick={() => setAlertStage(null)}
                className="w-8 h-8 rounded-full bg-orange-400/50 flex items-center justify-center shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GET OFF NOW — full-screen ─────────────────────────────────────── */}
      <AnimatePresence>
        {alertStage === "getoff" && (
          <motion.div
            key="alert-getoff"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: 2, duration: 0.6, ease: "easeInOut" }}
              className="bg-background rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center space-y-4 border-2 border-primary/20"
            >
              <div className="text-5xl">{isTransferGetoff ? "🚉" : "🎉"}</div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground leading-tight">
                  {isTransferGetoff ? "Time to switch trains!" : "Your stop is here!"}
                </h2>
                <p className="text-xl font-bold text-primary mt-1.5">{getOffStation || plannedRoute.to}</p>
                <p className="text-muted-foreground font-medium mt-1 text-sm">
                  {isTransferGetoff
                    ? `Head to the platform for the ${transferNextLine ?? "next train"}`
                    : "Exit the train at this station — you made it!"}
                </p>
              </div>
              {isTransferGetoff ? (
                <>
                  <div className="bg-muted/50 rounded-2xl p-4 text-left space-y-2 w-full">
                    <p className="text-foreground font-bold text-sm mb-1">Transfer steps:</p>
                    {["Exit the train and stay inside the station.", `Follow signs for ${transferNextLine ?? "the next line"}.`, "Board the new train on the platform.", "You do NOT need a new ticket! ✅"].map((tip, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                        <span className="text-foreground text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-bold shadow"
                    onClick={handleTransferArrival}
                    data-testid="ive-arrived-btn"
                  >
                    🚉 Got it — switching now
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl text-base font-bold shadow"
                  onClick={handleArrived}
                  data-testid="ive-arrived-btn"
                >
                  🎉 I've arrived!
                </Button>
              )}
              <button
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                onClick={() => setAlertStage(null)}
              >
                Not yet — still on the train
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3 bg-background/95 backdrop-blur sticky top-0 z-10 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-xl font-extrabold">Your Trip</h1>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {plannedRoute.segments.map(seg => (
              <Badge key={seg.line} className={`${LINE_BADGE_COLORS[seg.line] || "bg-muted text-foreground"} border-0 font-bold text-xs`}>
                {seg.symbol} {seg.line}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{plannedRoute.from}</span>
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span className="text-primary font-semibold truncate">{plannedRoute.to}</span>
        </div>

        {stopList.length > 0 && (
          <div ref={stopBarRef} className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center" style={{ minWidth: stopList.length * 52, paddingBottom: 2 }}>
              {stopList.map((stop, i) => {
                const past = i < effectiveStopIndex;
                const current = i === effectiveStopIndex && currentStep >= trainStepIndex;
                return (
                  <React.Fragment key={stop}>
                    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 48 }}>
                      <div
                        className={`rounded-full border-2 border-background shadow-sm transition-all ${current ? "animate-pulse scale-125" : ""}`}
                        style={{
                          width: i === 0 || i === stopList.length - 1 ? 12 : 9,
                          height: i === 0 || i === stopList.length - 1 ? 12 : 9,
                          backgroundColor: past || current ? lineColor : "#d1d5db",
                          borderColor: current ? lineColor : "white",
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

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Step {currentStep + 1} / {tripSteps.length}</span>
          <span>{progress}%{gpsMinutesLeft !== null ? ` · ~${gpsMinutesLeft} min left` : ""}</span>
        </div>
      </div>

      <div className="p-5 space-y-4 pb-24">
        {/* Auto-audio controls */}
        <div className="bg-muted/30 rounded-2xl px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {paused ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
              <span className="text-sm font-bold">Auto-read steps aloud</span>
            </div>
            <div className="flex items-center gap-2">
              {autoAudio && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={resetAudio}
                    aria-label="Replay"
                    data-testid="reset-audio"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={paused ? resumeSpeech : pauseSpeech}
                    data-testid="pause-audio"
                    aria-label={paused ? "Resume" : "Pause"}
                  >
                    {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </Button>
                </>
              )}
              <Switch checked={autoAudio} onCheckedChange={handleAutoAudioToggle} data-testid="auto-audio" />
            </div>
          </div>
          {autoAudio && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground shrink-0">Speed</span>
              <div className="flex gap-1.5">
                {([["Slow", 0.5], ["Normal", 0.85], ["Fast", 1.2]] as const).map(([label, rate]) => (
                  <button
                    key={label}
                    onClick={() => setAudioRate(rate)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-colors ${
                      audioRate === rate
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                    data-testid={`speed-${label.toLowerCase()}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual play / pause — always visible */}
          <div className="flex gap-2 pt-0.5">
            {!manualSpeaking ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-xl font-bold text-xs gap-1.5"
                onClick={speak}
                data-testid="read-aloud-btn"
              >
                <Volume2 className="w-3.5 h-3.5" /> Read Aloud
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-xl font-bold text-xs gap-1.5"
                  onClick={paused ? resumeManual : pauseManual}
                  data-testid="manual-pause-btn"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl text-muted-foreground"
                  onClick={stopManual}
                  aria-label="Stop"
                  data-testid="manual-stop-btn"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── LIVE MAP — only shown while on train ─────────────────────────── */}
        {step0.type === "train" && (
          <div className="rounded-3xl overflow-hidden border border-border shadow-sm">
            <div className="flex items-center px-4 py-3 bg-muted/40 gap-2">
              <button
                className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                onClick={() => setMapExpanded(v => !v)}
                data-testid="toggle-map"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold">
                  {userCoords ? "Live Map · GPS Active 📍" : "Route Map"}
                </span>
                {userCoords && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
                onClick={() => setMapFullscreen(true)}
                aria-label="Fullscreen map"
                data-testid="fullscreen-map"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
                onClick={() => setMapExpanded(v => !v)}
                aria-label={mapExpanded ? "Collapse map" : "Expand map"}
              >
                {mapExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {mapExpanded && (
                <motion.div
                  key="map"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 240, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <BartGpsMap route={plannedRoute} userLocation={userCoords} height={240} fromSegmentIndex={activeSegmentIndex} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── CURRENT STEP CARD ─────────────────────────────────────────────── */}
        <Card className="rounded-3xl border-2 border-primary/20 shadow-md">
          <CardContent className="p-5 space-y-4">
            {step0.route && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
                style={{ backgroundColor: `${lineColor}20`, border: `1px solid ${lineColor}50`, color: lineColor }}>
                <span className="text-lg">{step0.symbol}</span>
                <span>{step0.route}</span>
                <span className="ml-auto opacity-70">{step0.time}</span>
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-3 py-1">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <StepIcon className="w-8 h-8 text-primary" strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-extrabold leading-tight">{step0.text}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{step0.detail}</p>
            </div>

            {/* Transfer step: numbered checklist */}
            {step0.type === "transfer" && (
              <div className="bg-muted/60 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">How to transfer</p>
                {[
                  "Exit the train — stay inside the station (don't tap out).",
                  `Follow the signs for ${step0.route ?? "the next line"} (look for the ${step0.symbol ?? "line"} symbol).`,
                  "Walk to the correct platform. It may be the same platform or across the hall.",
                  "Wait behind the yellow safety line and board the new train.",
                  "Your Clipper card covers the whole trip — no new ticket needed.",
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-black text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm leading-snug">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {step0.stopList && step0.stopList.length > 2 && (
              <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stops in order</p>
                {step0.stopList.map((stop, i) => {
                  const isPast = i < effectiveStopIndex;
                  const isCurrent = i === effectiveStopIndex;
                  const isExit = i === step0.stopList!.length - 1;
                  return (
                    <div key={stop} className={`flex items-center gap-3 ${isPast ? "opacity-40" : ""}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                        isPast ? "bg-muted-foreground/30 border-muted-foreground/30 text-muted-foreground" :
                        isExit ? "bg-green-500 border-green-500 text-white" :
                        isCurrent ? "text-white" : "border-muted-foreground"
                      }`} style={{
                        backgroundColor: isCurrent && !isExit ? lineColor : undefined,
                        borderColor: isCurrent && !isExit ? lineColor : undefined,
                      }}>
                        {isExit ? "★" : i + 1}
                      </div>
                      <span className={`text-sm flex-1 ${
                        isPast ? "line-through text-muted-foreground" :
                        isCurrent ? "font-black" :
                        isExit ? "text-green-600 dark:text-green-400 font-bold" : "text-muted-foreground"
                      }`} style={{ color: isCurrent && !isExit ? lineColor : undefined }}>
                        {stop}
                      </span>
                      {isCurrent && !isExit && (
                        <span className="text-xs font-bold shrink-0" style={{ color: lineColor }}>← here</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help button — always visible below the card */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full h-12 rounded-2xl font-bold" data-testid="im-confused-btn">
              <HelpCircle className="w-5 h-5 mr-2" /> Need Help?
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[92vw] max-h-[80vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center font-extrabold">It's okay to be confused.</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground mb-4 mt-2">Tap a question for the answer.</p>
            <div className="space-y-2">
              {CONFUSED_QA.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-border overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-sm select-none list-none">
                    {q}
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed bg-muted/30">{a}</div>
                </details>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Next step preview */}
        {nextStep && step0.type !== "arrive" && (
          <Card className="rounded-2xl bg-muted/40 border-none opacity-75">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {React.createElement(STEP_ICONS[nextStep.type] || Navigation, { className: "w-4 h-4 text-muted-foreground" })}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Next</p>
                <p className="font-semibold text-sm truncate">{nextStep.text}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons — hidden on arrive step */}
        {step0.type !== "arrive" && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-13 rounded-xl font-bold border-2" disabled={currentStep === 0} onClick={() => setCurrentStep(c => c - 1)} data-testid="prev-step">
              Back
            </Button>
            <Button className="flex-[2] h-13 rounded-xl font-bold text-base" disabled={currentStep >= tripSteps.length - 1} onClick={advanceStep} data-testid="next-step">
              Next Step →
            </Button>
          </div>
        )}

        {/* Arrival celebration — only after confirmed via "I've arrived" in getoff popup */}
        {arrivedConfirmed && step0.type === "arrive" && (
          <Card className="rounded-3xl border-none shadow-sm bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-6 text-center space-y-3">
              <img src="/train-celebrate.gif" alt="Celebrating train" className="w-32 h-32 object-contain mx-auto" style={{ mixBlendMode: "multiply" }} />
              <h3 className="text-2xl font-extrabold text-green-700 dark:text-green-300">You made it!</h3>
              <p className="text-green-600 dark:text-green-400">You've arrived at {plannedRoute.to}. Well done! 🎉</p>
              <Button variant="outline" className="w-full rounded-2xl h-13 font-bold" onClick={() => setLocation("/")} data-testid="done-trip">
                Plan Another Trip
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cancel Trip */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" variant="ghost" className="w-full h-12 rounded-2xl font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border" data-testid="cancel-trip">
              <XCircle className="w-5 h-5 mr-2" /> Cancel Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[88vw] p-7 text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">Cancel this trip?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-1 mb-5">You'll go back to the home screen. Your route won't be saved.</p>
            <div className="flex flex-col gap-3">
              <Button size="lg" variant="destructive" className="h-14 rounded-2xl text-base font-bold" onClick={cancelTrip} data-testid="confirm-cancel-trip">
                Yes, cancel trip
              </Button>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-14 rounded-2xl text-base font-bold border-2">
                  Keep going
                </Button>
              </DialogTrigger>
            </div>
          </DialogContent>
        </Dialog>

        {/* I'm Lost */}
        <Dialog open={isLostOpen} onOpenChange={o => { setIsLostOpen(o); if (!o) setTimeout(() => setLostSel("initial"), 300); }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="destructive" className="w-full h-14 rounded-2xl font-extrabold text-base shadow-md" data-testid="im-lost">
              <Search className="w-5 h-5 mr-2" /> I'm Lost
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[90vw] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center font-extrabold">You're not stuck.</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {lostSel === "initial" ? (
                <div className="space-y-3">
                  <p className="text-center text-muted-foreground mb-4 text-lg">What do you see around you?</p>
                  {["I see a platform", "I see a bus stop", "I see signs", "I see a ticket machine", "I'm not sure"].map(opt => (
                    <Button key={opt} variant="outline" className="w-full h-13 text-base justify-start px-4 rounded-xl border-2" onClick={() => setLostSel("solution")}>
                      <span className="w-3 h-3 rounded-full bg-primary mr-3 shrink-0" />{opt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold text-center">Take a breath. Here's what to do.</h3>
                  <div className="space-y-2">
                    {[
                      "Stop and stay where you are for a moment.",
                      "Look for a BART sign or map on the wall.",
                      `You're heading to ${plannedRoute.to} — check that your platform signs match.`,
                      "Find a BART employee in a blue uniform for help.",
                    ].map((tip, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-xl items-start">
                        <span className="font-bold text-primary w-5 shrink-0">{i + 1}</span>
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button className="flex-1 h-13 rounded-xl font-bold" onClick={() => setIsLostOpen(false)}>I feel better</Button>
                    <Button variant="secondary" className="flex-1 h-13 rounded-xl font-bold" onClick={() => { setIsLostOpen(false); setLocation("/support"); }}>Get Help</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
