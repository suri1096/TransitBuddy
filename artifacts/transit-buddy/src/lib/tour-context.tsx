import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface TourState {
  replayActive: boolean;
  highlightId: string | null;
  startTour: () => void;
  endTour: () => void;
  setHighlightId: (id: string | null) => void;
}

const TourContext = createContext<TourState>({
  replayActive: false,
  highlightId: null,
  startTour: () => {},
  endTour: () => {},
  setHighlightId: () => {},
});

export const useTour = () => useContext(TourContext);

export function TourProvider({ children }: { children: ReactNode }) {
  const [replayActive, setReplayActive] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const startTour = useCallback(() => setReplayActive(true), []);
  const endTour = useCallback(() => {
    setReplayActive(false);
    setHighlightId(null);
  }, []);

  return (
    <TourContext.Provider value={{ replayActive, highlightId, startTour, endTour, setHighlightId }}>
      {children}
    </TourContext.Provider>
  );
}
