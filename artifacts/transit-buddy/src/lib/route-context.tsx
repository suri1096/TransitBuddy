import React, { createContext, useContext, useState, ReactNode } from "react";
import { PlannedRoute, buildTripSteps } from "./bart-data";

interface TripStep {
  id: number;
  text: string;
  detail: string;
  time: string;
  type: string;
  stopList?: string[];
  symbol?: string;
  route?: string;
}

interface RouteState {
  plannedRoute: PlannedRoute | null;
  tripSteps: TripStep[];
  setRoute: (route: PlannedRoute) => void;
  clearRoute: () => void;
}

const RouteContext = createContext<RouteState>({
  plannedRoute: null,
  tripSteps: [],
  setRoute: () => {},
  clearRoute: () => {},
});

export const useRoute = () => useContext(RouteContext);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [tripSteps, setTripSteps] = useState<TripStep[]>([]);

  const setRoute = (route: PlannedRoute) => {
    setPlannedRoute(route);
    setTripSteps(buildTripSteps(route));
  };

  const clearRoute = () => {
    setPlannedRoute(null);
    setTripSteps([]);
  };

  return (
    <RouteContext.Provider value={{ plannedRoute, tripSteps, setRoute, clearRoute }}>
      {children}
    </RouteContext.Provider>
  );
}
