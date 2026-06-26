import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Train, HeartHandshake, Settings, MessageCircle, RouteIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const USER_NAV = [
  { path: "/",        label: "Home",    icon: Home },
  { path: "/map",     label: "Lines",   icon: RouteIcon },
  { path: "/trip",    label: "Trip",    icon: Train },
  { path: "/support", label: "Calm",    icon: HeartHandshake },
  { path: "/settings",label: "Settings",icon: Settings },
];

const FAMILY_NAV = [
  { path: "/",        label: "Tracking", icon: HeartHandshake },
  { path: "/home",    label: "Home",     icon: Home },
  { path: "/map",     label: "Lines",    icon: RouteIcon },
  { path: "/support", label: "Calm",     icon: HeartHandshake },
  { path: "/settings",label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { mode, caregiverName } = useAuth();

  const navItems = mode === "family" ? FAMILY_NAV : USER_NAV;

  const isActive = (path: string) => {
    if (path === "/" && (location === "/" || location === "")) return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex justify-center min-h-[100dvh] bg-gradient-to-br from-emerald-100/40 via-background to-purple-100/30 dark:from-emerald-950/20 dark:via-background dark:to-purple-950/20">
      <div className="w-full max-w-[430px] bg-background shadow-2xl flex flex-col relative overflow-hidden border-x border-border/40 min-h-[100dvh]">

        {mode === "family" && (
          <div className="bg-purple-600 text-white text-center text-sm font-bold py-2 px-4 flex items-center justify-center gap-2 shrink-0">
            <HeartHandshake className="w-4 h-4" />
            Caregiver Mode — watching {caregiverName || "traveler"}
          </div>
        )}

        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "72px" }}>
          {children}
        </main>

        {/* Floating chat button */}
        {location !== "/chat" && (
          <Link href="/chat" data-testid="fab-chat"
            className="absolute bottom-[80px] right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95 z-50">
            <MessageCircle className="w-7 h-7" />
          </Link>
        )}

        {/* Bottom nav */}
        <nav className="absolute bottom-0 left-0 right-0 h-[72px] bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-1 z-40">
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path} data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center gap-0.5 w-[18%] h-14 rounded-2xl transition-all ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
