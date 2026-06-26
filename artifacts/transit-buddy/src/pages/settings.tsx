import React, { useState, useEffect, useCallback } from "react";
import { useSettings, formatDist } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { useTour } from "@/lib/tour-context";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Type, Palette, HeartHandshake, LogOut, MapPin, Lock, Loader2, CheckCircle2, AlertTriangle, LinkIcon, UserPlus, UserCheck, UserX, Trash2, Clock, Ruler, Users } from "lucide-react";
import { useLocationSharing } from "@/lib/location-sharing";
import { Badge } from "@/components/ui/badge";

interface Connection {
  id: number;
  caregiverId: number;
  travelerId: number;
  status: string;
  initiatedByRole: "caregiver" | "traveler";
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

export default function Settings() {
  const { textSize, setTextSize, font, setFont, theme, setTheme, isDark, setIsDark, units, setUnits } = useSettings();
  const { mode, setMode, logout, userName, user } = useAuth();
  const { highlightId } = useTour();
  const [_, setLocation] = useLocation();

  const {
    enabled: locationSharing,
    choice: locationChoice,
    status: locationStatus,
    coords: locationCoords,
    setEnabled: handleLocationToggle,
    setChoice: handleLocationChoice,
  } = useLocationSharing();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [connsLoading, setConnsLoading] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadConnections = useCallback(async () => {
    setConnsLoading(true);
    try {
      const r = await apiFetch("/api/connections");
      if (r.ok) setConnections(await r.json());
    } catch {}
    setConnsLoading(false);
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    setAddLoading(true); setAddError(""); setAddSuccess("");
    try {
      const r = await apiFetch("/api/connections", { method: "POST", body: JSON.stringify({ targetUsername: addUsername.trim() }) });
      const data = await r.json();
      if (!r.ok) { setAddError(data.error ?? "Failed to send request"); }
      else { setAddSuccess(`Connection request sent to ${data.otherUser?.displayName || addUsername}!`); setAddUsername(""); loadConnections(); }
    } catch { setAddError("Network error — please try again."); }
    setAddLoading(false);
  };

  const handleAction = async (id: number, action: "accept" | "reject" | "delete") => {
    setActionLoadingId(id);
    try {
      if (action === "delete") {
        await apiFetch(`/api/connections/${id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/connections/${id}/${action}`, { method: "PUT" });
      }
      loadConnections();
    } catch {}
    setActionLoadingId(null);
  };

  const accepted = connections.filter(c => c.status === "accepted");
  const pendingIncoming = connections.filter(c => {
    if (c.status === "pending_traveler_accept" && user?.role === "traveler") return true;
    if (c.status === "pending_caregiver_accept" && user?.role === "caregiver") return true;
    return false;
  });
  const pendingOutgoing = connections.filter(c => {
    if (c.status === "pending_traveler_accept" && user?.role === "caregiver") return true;
    if (c.status === "pending_caregiver_accept" && user?.role === "traveler") return true;
    return false;
  });

  return (
    <div className="p-5 space-y-7 pb-24 animate-in fade-in duration-300">
      <header className="pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize TransitBuddy for your comfort.</p>
      </header>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-purple-500" /> Profile</h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <span className="text-2xl font-extrabold text-primary">{(userName || "?")[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-extrabold text-xl">{userName || "—"}</p>
                {user?.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                <p className="text-sm text-muted-foreground capitalize mt-0.5">
                  {user?.role === "caregiver" ? "Caregiver" : "Traveler"}
                  {user?.phone && ` · ${user.phone}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">App View</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={mode === "user" ? "default" : "outline"} className="rounded-xl h-12 font-bold" onClick={() => { setMode("user"); setLocation("/"); }} data-testid="mode-user-btn">Traveler</Button>
                <Button variant={mode === "family" ? "default" : "outline"} className={`rounded-xl h-12 font-bold ${mode === "family" ? "bg-purple-600 hover:bg-purple-700" : ""}`} onClick={() => { setMode("family"); setLocation("/caregiver"); }} data-testid="mode-family-btn">Caregiver</Button>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-2 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => { logout(); }} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Caregiver & Location — combined section */}
      <section data-tour-id="tour-connections" className={`space-y-3 ${highlightId === "tour-connections" ? "ring-4 ring-primary/60 ring-offset-2 rounded-2xl transition-all duration-300" : ""}`}>
        <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Caregiver &amp; Location</h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 space-y-6">

            {/* ── Link a caregiver ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Link a {mode === "family" ? "Traveler" : "Caregiver"}</span>
              </div>
              <p className="text-sm text-muted-foreground -mt-1">
                Enter their username to send a connection request. They'll need to accept.
              </p>

              <form onSubmit={handleAddConnection} className="flex gap-2">
                <Input value={addUsername} onChange={e => { setAddUsername(e.target.value); setAddError(""); setAddSuccess(""); }}
                  placeholder="Enter @username" className="h-11 rounded-xl flex-1 font-semibold"
                  autoCapitalize="none" autoCorrect="off" data-testid="connections-username-input" />
                <Button type="submit" disabled={addLoading || !addUsername.trim()} className="h-11 rounded-xl px-4 font-bold shrink-0" data-testid="connections-add-btn">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </form>
              {addError && <p className="text-destructive text-sm font-semibold">{addError}</p>}
              {addSuccess && <p className="text-green-600 dark:text-green-400 text-sm font-semibold">{addSuccess}</p>}

              {connsLoading && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!connsLoading && pendingIncoming.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Incoming Requests</label>
                  {pendingIncoming.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{c.otherUser.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{c.otherUser.username} · {c.otherUser.role}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" className="h-8 rounded-lg font-bold bg-green-500 hover:bg-green-600 text-white px-3"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handleAction(c.id, "accept")} data-testid={`accept-conn-${c.id}`}>
                          {actionLoadingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg font-bold px-3 border-destructive/30 text-destructive hover:bg-destructive/5"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handleAction(c.id, "reject")} data-testid={`reject-conn-${c.id}`}>
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!connsLoading && pendingOutgoing.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sent Requests</label>
                  {pendingOutgoing.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-muted/30">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{c.otherUser.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{c.otherUser.username} · awaiting acceptance</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                        disabled={actionLoadingId === c.id}
                        onClick={() => handleAction(c.id, "delete")}>
                        {actionLoadingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!connsLoading && accepted.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connected</label>
                  {accepted.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-300 bg-green-50 dark:bg-green-950/20">
                      <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">{c.otherUser.displayName[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{c.otherUser.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{c.otherUser.username} · {c.otherUser.role}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                        disabled={actionLoadingId === c.id}
                        onClick={() => handleAction(c.id, "delete")}>
                        {actionLoadingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!connsLoading && connections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-1">No connections yet. Enter a username above to get started.</p>
              )}
            </div>

            {/* divider */}
            <div className="border-t border-border" />

            {/* ── Location sharing ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Share Location</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold">Share location with caregiver</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Let a linked caregiver see your GPS during trips.</p>
                </div>
                <Switch checked={locationSharing} onCheckedChange={handleLocationToggle} className="scale-125 mt-1 shrink-0" data-testid="toggle-location" />
              </div>

              {locationSharing && (
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-border" data-testid="location-status">
                  {locationStatus === "active" && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                  {locationStatus === "requesting" && <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />}
                  {(locationStatus === "denied" || locationStatus === "unavailable") && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
                  {(locationStatus === "waiting" || locationStatus === "off") && <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />}
                  <p className="text-sm font-medium">
                    {locationStatus === "active" && locationCoords ? `Live — sharing your location (±${formatDist(locationCoords.accuracy, units)})`
                      : locationStatus === "requesting" ? "Getting your location…"
                      : locationStatus === "denied" ? "Location permission was blocked. Enable it in your browser settings."
                      : locationStatus === "unavailable" ? "Location isn't available on this device."
                      : locationStatus === "waiting" ? "Will start sharing automatically when your trip begins."
                      : "Location sharing is paused."}
                  </p>
                </div>
              )}

              {locationSharing && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">When to share</label>
                  <div className="space-y-2">
                    {([
                      { val: "trips", label: "During trips only", desc: "Only shares while you have an active trip" },
                      { val: "always", label: "Always", desc: "Shares your location continuously" },
                      { val: "never", label: "Never", desc: "Turn off location sharing" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => handleLocationChoice(opt.val)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${locationChoice === opt.val ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        data-testid={`location-choice-${opt.val}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${locationChoice === opt.val ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                          {locationChoice === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">Location is shared only with your linked caregiver via the app. No third parties.</p>
              </div>
            </div>

          </CardContent>
        </Card>
      </section>

      {/* Accessibility */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><Type className="w-5 h-5 text-primary" /> Accessibility</h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Text Size</label>
              <div className="grid grid-cols-2 gap-2">
                {["Small", "Medium", "Large", "Extra Large"].map(size => (
                  <Button key={size} variant={textSize === size ? "default" : "outline"} className="rounded-xl h-12 font-bold" onClick={() => setTextSize(size as any)} data-testid={`text-size-${size.toLowerCase().replace(" ", "-")}`}>{size}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Font Style</label>
              <div className="grid grid-cols-2 gap-2">
                {["Default", "Dyslexia-Friendly"].map(f => (
                  <Button key={f} variant={font === f ? "default" : "outline"} className="rounded-xl h-12 font-bold" onClick={() => setFont(f as any)} data-testid={`font-${f.toLowerCase().replace("-", "")}`}>{f}</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Display */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Display</h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><h3 className="font-bold text-lg">Dark Mode</h3><p className="text-sm text-muted-foreground">Easier at night</p></div>
              <Switch checked={isDark} onCheckedChange={setIsDark} className="scale-125" data-testid="toggle-dark" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> Distance Units</label>
              <div className="flex gap-2">
                <Button variant={units === "imperial" ? "default" : "outline"} className="flex-1 rounded-xl h-12 font-bold" onClick={() => setUnits("imperial")} data-testid="units-imperial">Imperial <span className="ml-1 font-normal text-xs opacity-70">mi / ft</span></Button>
                <Button variant={units === "metric" ? "default" : "outline"} className="flex-1 rounded-xl h-12 font-bold" onClick={() => setUnits("metric")} data-testid="units-metric">Metric <span className="ml-1 font-normal text-xs opacity-70">km / m</span></Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Theme</label>
              {[
                { label: "Standard", desc: "Colorful and vibrant", dot: "bg-primary" },
                { label: "Low-Stimulation", desc: "Muted and calm", dot: "bg-slate-400" },
                { label: "High Contrast", desc: "Bold and clear", dot: "bg-black dark:bg-white" },
              ].map(({ label, desc, dot }) => (
                <Button key={label} variant={theme === label ? "default" : "outline"} className="w-full justify-start rounded-xl h-13 px-4 font-bold" onClick={() => setTheme(label as any)} data-testid={`theme-${label.toLowerCase().replace(" ", "")}`}>
                  <div className={`w-4 h-4 rounded-full mr-3 shrink-0 ${dot}`} />
                  <div className="text-left">
                    <p>{label}</p>
                    <p className={`text-xs font-normal ${theme === label ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{desc}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
