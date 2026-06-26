import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTour } from "@/lib/tour-context";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, PhoneCall, CheckCircle2, ShieldAlert, RefreshCw, Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StationHelp } from "@/components/station-help";

// ── Breathing Bubble ─────────────────────────────────────────────────────────
const PHASES = [
  { name: "Breathe in", duration: 4, scale: 1.5 },
  { name: "Hold", duration: 4, scale: 1.5 },
  { name: "Breathe out", duration: 6, scale: 1.0 },
];

function BreathingBubble() {
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [seconds, setSeconds] = useState(PHASES[0].duration);

  useEffect(() => {
    if (!active) return undefined;
    if (seconds > 0) {
      const t = setTimeout(() => setSeconds(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
    const next = (phaseIdx + 1) % PHASES.length;
    setPhaseIdx(next);
    setSeconds(PHASES[next].duration);
    return undefined;
  }, [active, seconds, phaseIdx]);

  const toggle = () => {
    if (active) {
      setActive(false);
      setPhaseIdx(0);
      setSeconds(PHASES[0].duration);
    } else {
      setActive(true);
    }
  };

  const phase = PHASES[phaseIdx];
  const targetScale = active ? phase.scale : 1;

  return (
    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950 dark:to-blue-900">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-5">
        <h3 className="font-extrabold text-lg">Breathing Bubble</h3>
        <p className="text-sm text-muted-foreground">4-4-6 breathing. Tap to start or stop.</p>

        <div className="relative w-48 h-48 flex items-center justify-center cursor-pointer" onClick={toggle} data-testid="breathing-bubble">
          <motion.div
            className="absolute rounded-full bg-sky-300/30 dark:bg-sky-500/20"
            animate={{ scale: targetScale, width: 192, height: 192 }}
            transition={{ duration: active ? (phaseIdx === 2 ? 6 : 4) : 0.4, ease: "easeInOut" }}
            style={{ width: 192, height: 192 }}
          />
          <motion.div
            className="w-28 h-28 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full shadow-xl flex flex-col items-center justify-center"
            animate={{ scale: active ? (phase.scale - 1) * 0.4 + 1 : 1 }}
            transition={{ duration: active ? (phaseIdx === 2 ? 6 : 4) : 0.4, ease: "easeInOut" }}
          >
            <Heart className="w-6 h-6 text-white mb-1" />
            {active && <span className="text-white font-bold text-xl">{seconds}</span>}
          </motion.div>
        </div>

        <div className="text-center space-y-1">
          <p className={`font-extrabold text-xl transition-colors ${active ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"}`}>
            {active ? `${phase.name}...` : "Tap to begin"}
          </p>
          {active && (
            <p className="text-sm text-muted-foreground">
              {phaseIdx === 0 && "Fill your lungs slowly"}
              {phaseIdx === 1 && "Hold still and feel calm"}
              {phaseIdx === 2 && "Release slowly and fully"}
            </p>
          )}
        </div>

        {active && (
          <Button variant="outline" size="sm" onClick={toggle} className="rounded-full px-6" data-testid="stop-breathing">
            Stop
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Count the Shapes ─────────────────────────────────────────────────────────
const SHAPES = [
  { shape: "circle", color: "bg-red-400",    label: "red circle" },
  { shape: "circle", color: "bg-blue-400",   label: "blue circle" },
  { shape: "circle", color: "bg-yellow-400", label: "yellow circle" },
  { shape: "square", color: "bg-green-500",  label: "green square" },
  { shape: "square", color: "bg-purple-500", label: "purple square" },
  { shape: "square", color: "bg-orange-500", label: "orange square" },
  { shape: "circle", color: "bg-pink-400",   label: "pink circle" },
  { shape: "square", color: "bg-teal-500",   label: "teal square" },
];

function CountShapesGame() {
  const [target, setTarget] = useState(0);
  const [shownShapes, setShownShapes] = useState<typeof SHAPES>([]);
  const [userCount, setUserCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const newGame = useCallback(() => {
    const n = 3 + Math.floor(Math.random() * 5); // 3–7
    const shuffled = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, n);
    setShownShapes(shuffled);
    setTarget(n);
    setUserCount(0);
    setSubmitted(false);
  }, []);

  useEffect(() => { newGame(); }, [newGame]);

  const isCorrect = submitted && userCount === target;

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <CardContent className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-lg">Count the Shapes</h3>
          <Button variant="ghost" size="sm" onClick={newGame} className="rounded-full" data-testid="new-shapes-game">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">How many shapes do you see? Use the buttons to enter your count.</p>

        {/* Shapes display */}
        <div className="flex flex-wrap gap-3 justify-center items-center min-h-[100px] bg-white/60 dark:bg-white/5 rounded-2xl p-5">
          {shownShapes.map((s, i) => (
            <div
              key={i}
              data-testid={`shape-${i}`}
              className={`${s.color} ${s.shape === "circle" ? "rounded-full" : "rounded-lg"} w-12 h-12 shadow-sm`}
            />
          ))}
        </div>

        {/* Counter */}
        {!submitted && (
          <div className="flex items-center justify-center gap-5">
            <Button
              size="icon"
              variant="outline"
              className="w-14 h-14 rounded-2xl text-2xl font-bold border-2"
              onClick={() => setUserCount(c => Math.max(0, c - 1))}
              disabled={userCount === 0}
              data-testid="count-minus"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-5xl font-extrabold text-primary w-16 text-center">{userCount}</span>
            <Button
              size="icon"
              variant="outline"
              className="w-14 h-14 rounded-2xl text-2xl font-bold border-2"
              onClick={() => setUserCount(c => c + 1)}
              data-testid="count-plus"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}

        {!submitted ? (
          <Button className="w-full h-13 rounded-2xl font-bold text-base" onClick={() => setSubmitted(true)} data-testid="confirm-count">
            That's my count
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl text-center space-y-2 ${isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <p className="font-extrabold text-green-700 dark:text-green-300 text-lg">
                    That's right! There {target === 1 ? "was" : "were"} {target} shape{target !== 1 ? "s" : ""}.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-extrabold text-orange-700 dark:text-orange-300 text-lg">
                    Close! There {target === 1 ? "was" : "were"} actually {target} shape{target !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">That's okay — counting is good practice.</p>
                </>
              )}
              <Button variant="outline" className="mt-2 rounded-2xl h-11 font-bold" onClick={newGame} data-testid="new-shapes-again">
                Play Again
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}

// ── Route Symbol Match ────────────────────────────────────────────────────────
const CARD_PAIRS = [
  { pairId: 0, label: "Yellow ★", bg: "bg-yellow-400", fg: "text-yellow-900" },
  { pairId: 1, label: "Red ■",    bg: "bg-red-500",    fg: "text-white" },
  { pairId: 2, label: "Green ●",  bg: "bg-green-500",  fg: "text-white" },
  { pairId: 3, label: "Blue ◆",   bg: "bg-blue-500",   fg: "text-white" },
];

function shuffle<T>(arr: T[]): (T & { uid: number })[] {
  return [...arr, ...arr].map((v, i) => ({ v, sort: Math.random(), id: i })).sort((a, b) => a.sort - b.sort).map(({ v, id }) => ({ ...v, uid: id }));
}

function MatchGame() {
  const [cards, setCards] = useState(() => shuffle(CARD_PAIRS));
  const [faceUp, setFaceUp] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);

  const reset = () => {
    setCards(shuffle(CARD_PAIRS));
    setFaceUp([]);
    setMatched([]);
    setLocked(false);
    setMoves(0);
  };

  const flip = (uid: number) => {
    if (locked || faceUp.includes(uid) || matched.includes(uid)) return;
    const next = [...faceUp, uid];
    setFaceUp(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next.map(u => cards.find(c => c.uid === u)!);
      if (a.pairId === b.pairId) {
        setMatched(m => [...m, a.uid, b.uid]);
        setFaceUp([]);
        setLocked(false);
      } else {
        setTimeout(() => { setFaceUp([]); setLocked(false); }, 1000);
      }
    }
  };

  const allDone = matched.length === cards.length;

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-lg">BART Line Match</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-semibold">{moves} moves</span>
            <Button variant="ghost" size="sm" onClick={reset} className="rounded-full" data-testid="reset-match">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Find matching BART line pairs. Tap two cards to flip them.</p>

        <div className="grid grid-cols-4 gap-2">
          {cards.map(card => {
            const isUp = faceUp.includes(card.uid) || matched.includes(card.uid);
            const isMatched = matched.includes(card.uid);
            return (
              <button
                key={card.uid}
                onClick={() => flip(card.uid)}
                data-testid={`match-card-${card.uid}`}
                className="h-20 rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isUp ? (
                    <motion.div
                      key="face"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`w-full h-full rounded-2xl flex items-center justify-center ${card.bg} ${isMatched ? "ring-4 ring-green-400 ring-offset-1" : ""}`}
                    >
                      <span className={`font-extrabold text-sm text-center leading-tight px-1 ${card.fg}`}>{card.label}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full rounded-2xl bg-muted border-2 border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <span className="text-2xl text-muted-foreground font-bold">?</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {allDone && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-100 dark:bg-green-900/30 p-5 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <p className="font-extrabold text-green-700 dark:text-green-300 text-lg">All matched! {moves} moves.</p>
              <Button variant="outline" className="rounded-2xl h-11 font-bold" onClick={reset} data-testid="play-again-match">Play Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ── Grounding Card ────────────────────────────────────────────────────────────
function GroundingCard() {
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const found = ["Something red", "Something round", "A window or door", "Something made of wood", "A person or animal"];
  const allDone = checks.every(Boolean);

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-extrabold text-lg">Find 5 Things You Can See</h3>
        <p className="text-sm text-muted-foreground">Look around you right now. Each prompt is shown below — tap it once you spot that thing.</p>
        <div className="space-y-2">
          {checks.map((checked, i) => (
            <button
              key={i}
              onClick={() => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v))}
              data-testid={`ground-${i}`}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${checked ? "border-green-400 bg-green-50 dark:bg-green-900/30" : "border-border bg-white/60 dark:bg-white/5 hover:border-green-300"}`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-green-500 border-green-500" : "border-muted-foreground"}`}>
                {checked && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <span className={`font-semibold text-base ${checked ? "line-through text-muted-foreground" : ""}`}>
                {found[i]}
              </span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {allDone && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-green-100 dark:bg-green-900/40 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
              <p className="font-bold text-green-700 dark:text-green-300 text-base">Great. You are grounded and present.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ── Main Support Page ─────────────────────────────────────────────────────────
export default function Support() {
  const { highlightId } = useTour();
  const hl = (id: string) =>
    highlightId === id ? "ring-4 ring-primary/60 ring-offset-2 rounded-2xl transition-all duration-300" : "";

  return (
    <div className="p-5 space-y-6 pb-24 animate-in fade-in duration-300">
      <header className="pt-2 flex items-center gap-3">
        <div className="space-y-1 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Support & Calm</h1>
          <p className="text-muted-foreground">Take a breath. You've got this.</p>
        </div>
        <img src="/train-calm-support.gif" alt="Calm train mascot" className="w-24 h-24 object-contain shrink-0" style={{ mixBlendMode: "multiply" }} />
      </header>

      <section data-tour-id="tour-calm" className={`space-y-4 ${hl("tour-calm")}`}>
        <h2 className="text-xl font-bold">Calming Activities</h2>
        <BreathingBubble />
        <GroundingCard />
        <CountShapesGame />
        <MatchGame />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Need Help at the Station?</h2>
        <StationHelp label="Contact Transit Staff" />
      </section>
    </div>
  );
}
