import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { RouteProvider } from "@/lib/route-context";
import { SettingsProvider } from "@/lib/settings-context";
import { LocationSharingProvider } from "@/lib/location-sharing";
import { TourProvider, useTour } from "@/lib/tour-context";
import { AppLayout } from "@/components/layout";
import { TourGuide } from "@/components/tour-guide";

import Login from "@/pages/login";
import Home from "@/pages/home";
import Trip from "@/pages/trip";
import Support from "@/pages/support";
import BartMap from "@/pages/bartmap";
import Settings from "@/pages/settings";
import Chatbot from "@/pages/chatbot";
import Caregiver from "@/pages/caregiver";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AuthGatedRouter() {
  const { isLoggedIn, isLoading, mode, userId } = useAuth();
  const [, setLocation] = useLocation();
  const { replayActive, endTour } = useTour();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-emerald-100/50 via-background to-purple-100/40 dark:from-emerald-950/30 dark:via-background dark:to-purple-950/30">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={mode === "family" ? Caregiver : Home} />
        <Route path="/home" component={Home} />
        <Route path="/trip" component={Trip} />
        <Route path="/support" component={Support} />
        <Route path="/map" component={BartMap} />
        <Route path="/settings" component={Settings} />
        <Route path="/chat" component={Chatbot} />
        <Route path="/caregiver" component={Caregiver} />
        <Route path="/login">{() => { setLocation("/"); return null; }}</Route>
        <Route component={NotFound} />
      </Switch>

      {userId && (
        <TourGuide
          userId={userId}
          onReplay={replayActive}
          onClose={endTour}
        />
      )}
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <SettingsProvider>
            <RouteProvider>
              <LocationSharingProvider>
                <TooltipProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <AuthGatedRouter />
                  </WouterRouter>
                  <Toaster />
                </TooltipProvider>
              </LocationSharingProvider>
            </RouteProvider>
          </SettingsProvider>
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
