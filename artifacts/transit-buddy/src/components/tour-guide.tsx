import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Map, Bell, Users, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useTour } from "@/lib/tour-context";

interface TourStep {
  id: string;
  text: string;
  subText?: string;
  variant?: "overview" | "outro";
  highlight?: string;
  route: string;
  highlightId?: string;
  mascot?: "buddy" | "pal";
}

const STEPS: TourStep[] = [
  {
    id: "pal-intro",
    text: "Hi! I'm Pal! 👋 Nice to meet you — I'll be your traveling companion on TransitBuddy!",
    subText: "Let me introduce you to my friend who'll give you the grand tour…",
    route: "/",
    mascot: "pal",
  },
  {
    id: "buddy-intro",
    text: "Hey! I'm Buddy — the green train! 🟢 I'll be your tour guide today.",
    subText: "Together, Pal and I will help you travel BART like a pro. Let's go! 🚀",
    route: "/",
    mascot: "buddy",
  },
  {
    id: "overview",
    variant: "overview",
    text: "Here's an overview of what we can do together:",
    route: "/",
    mascot: "buddy",
  },
  {
    id: "nav",
    text: "Tap stations on the map, or type them into Plan Your Trip below. I'll track your ride in real-time!",
    subText: "🔵 Blue = starting point · 🔴 Red = destination",
    highlight: "🗺️ Station Guide & Navigation",
    route: "/",
    highlightId: "tour-map",
    mascot: "buddy",
  },
  {
    id: "plan-trip",
    text: "You can also plan your trip manually! Pick a starting station and a destination — I'll find your route and show it on the map. 🗓️",
    highlight: "📋 Plan Your Trip",
    route: "/",
    highlightId: "tour-plan",
    mascot: "buddy",
  },
  {
    id: "lines",
    text: "Want to see every BART line and all their stops? Check out the Lines page — all 5 lines are always shown with every station. 🚉",
    highlight: "🚦 BART Lines",
    route: "/map",
    highlightId: "tour-lines",
    mascot: "buddy",
  },
  {
    id: "buddy-chat",
    text: "The purple button in the bottom right takes you here! On this page, you can chat with me and ask anything about BART routes, fares, or what to do if you feel lost. 💬",
    highlight: "💬 Chat with Buddy",
    route: "/chat",
    highlightId: "tour-chat",
    mascot: "buddy",
  },
  {
    id: "caregiver",
    text: "Go to Connections and enter your caregiver's username so they can see your trip progress. They'll just need to create an account first! 👨‍👩‍👧",
    highlight: "👥 Caregiver Mode",
    route: "/settings",
    highlightId: "tour-connections",
    mascot: "buddy",
  },
  {
    id: "calm",
    text: "Head to the CALM tab for breathing exercises and games. In Settings you can customize your text size, fonts, and display style. 🧘",
    highlight: "🎮 CALM & Settings",
    route: "/support",
    highlightId: "tour-calm",
    mascot: "buddy",
  },
  {
    id: "lost",
    text: "Most importantly: if you get confused, tap I'm Lost. It works you through what to do. ❤️",
    highlight: "🆘 The I'm Lost Button",
    route: "/",
    highlightId: "tour-lost",
    mascot: "buddy",
  },
  {
    id: "outro",
    variant: "outro",
    text: "That's it — you're all set!",
    subText: "Tap Replay Tour Guide at the bottom of the home screen anytime. Happy travels from Pal & Buddy! 🚇",
    route: "/",
    mascot: "pal",
  },
];

const OVERVIEW_ITEMS = [
  { icon: Map,      label: "Trip Planner",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { icon: Bell,     label: "Smart Alerts",  color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { icon: Users,    label: "Caregivers",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { icon: Gamepad2, label: "Comfort Zone",  color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
];

const TOUR_KEY = (userId: number) => `transitbuddy_tour_seen_${userId}`;

interface TourGuideProps {
  userId: number;
  onReplay?: boolean;
  onClose?: () => void;
}

export function TourGuide({ userId, onReplay, onClose }: TourGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dir, setDir] = useState(1);
  const [, setLocation] = useLocation();
  const { setHighlightId } = useTour();

  useEffect(() => {
    if (onReplay) {
      setStepIndex(0);
      setVisible(true);
      setLocation("/");
      setHighlightId(STEPS[0].highlightId ?? null);
      return undefined;
    }
    const seen = localStorage.getItem(TOUR_KEY(userId));
    if (seen) return undefined;

    const justRegistered = localStorage.getItem("transitbuddy_show_tour") === "1";
    if (justRegistered) {
      localStorage.removeItem("transitbuddy_show_tour");
      setVisible(true);
      setHighlightId(STEPS[0].highlightId ?? null);
      return undefined;
    }

    const t = setTimeout(() => {
      setVisible(true);
      setHighlightId(STEPS[0].highlightId ?? null);
    }, 600);
    return () => clearTimeout(t);
  }, [userId, onReplay]);

  const dismiss = useCallback((markSeen = true) => {
    setVisible(false);
    setHighlightId(null);
    if (markSeen) localStorage.setItem(TOUR_KEY(userId), "1");
    setLocation("/");
    onClose?.();
  }, [userId, onClose, setLocation, setHighlightId]);

  const scrollToHighlight = useCallback((highlightId?: string) => {
    if (!highlightId) return;
    setTimeout(() => {
      const el = document.querySelector(`[data-tour-id="${highlightId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 420);
  }, []);

  const goToStep = useCallback((idx: number, direction = 1) => {
    setDir(direction);
    const next = STEPS[idx];
    if (next) {
      setLocation(next.route);
      setHighlightId(next.highlightId ?? null);
      scrollToHighlight(next.highlightId);
    }
    setStepIndex(idx);
  }, [setLocation, setHighlightId, scrollToHighlight]);

  const next = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1, 1);
    } else {
      dismiss(true);
    }
  }, [stepIndex, dismiss, goToStep]);

  const back = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1, -1);
  }, [stepIndex, goToStep]);

  if (!visible) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const progress = (stepIndex / (STEPS.length - 1)) * 100;
  const mascotSrc = step.mascot === "pal" ? "/train-pal.gif" : "/train-guide.gif";
  const mascotAlt = step.mascot === "pal" ? "Pal the purple train" : "Buddy the green train";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="card"
          className="fixed bottom-20 left-0 right-0 z-[201] flex justify-center px-4"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
        >
          <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex justify-between items-center px-5 pt-4 pb-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Step {stepIndex + 1} of {STEPS.length}
              </span>
              <button
                onClick={() => dismiss(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
                aria-label="Skip tour"
              >
                <X className="w-3.5 h-3.5" /> Skip
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted mx-5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="px-5 pt-4 pb-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: dir * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -dir * 30 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="flex gap-4 items-start">
                    <div className="shrink-0">
                      <img
                        src={mascotSrc}
                        alt={mascotAlt}
                        className={`object-contain ${step.mascot === "pal" ? "w-28 h-28" : "w-20 h-20"}`}
                        style={{ mixBlendMode: "multiply" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {step.highlight && (
                        <p className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">
                          {step.highlight}
                        </p>
                      )}
                      <p className="text-base font-semibold leading-snug">{step.text}</p>
                      {step.subText && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{step.subText}</p>
                      )}
                    </div>
                  </div>

                  {step.variant === "overview" && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {OVERVIEW_ITEMS.map(({ icon: Icon, label, color }) => (
                        <div key={label} className={`flex items-center gap-2 p-3 rounded-2xl ${color} font-semibold text-sm`}>
                          <Icon className="w-5 h-5 shrink-0" />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.variant === "outro" && (
                    <div className="flex justify-center gap-3 mt-4 items-end">
                      <img src="/train-pal.gif" alt="Pal" className="w-20 h-20 object-contain" style={{ mixBlendMode: "multiply" }} />
                      <div className="flex gap-1 text-2xl mb-1">
                        {["🌟", "🚇", "🌟"].map((ch, i) => (
                          <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * i, type: "spring" }}>
                            {ch}
                          </motion.span>
                        ))}
                      </div>
                      <img src="/train-guide.gif" alt="Buddy" className="w-14 h-14 object-contain" style={{ mixBlendMode: "multiply" }} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex gap-2 mt-4">
                {!isFirst && (
                  <Button variant="outline" className="h-12 rounded-2xl font-bold px-4" onClick={back} aria-label="Go back">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button className="flex-1 h-12 rounded-2xl font-bold shadow" onClick={next}>
                  {isLast ? "Let's Go! 🚀" : (
                    <span className="flex items-center gap-1.5">
                      {isFirst ? "Meet Buddy →" : "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
