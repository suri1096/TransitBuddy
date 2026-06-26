import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { AppMode, RegisterData } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Train, HeartHandshake, ArrowRight, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "@/assets/transit-buddy-logo.png";

type Screen = "mode" | "login" | "register";

export default function Login() {
  const { login, register } = useAuth();
  const [screen, setScreen] = useState<Screen>("mode");
  const [selectedRole, setSelectedRole] = useState<"traveler" | "caregiver">("traveler");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setUsername(""); setDisplayName(""); setPassword("");
    setConfirmPassword(""); setPhone(""); setError(""); setShowPassword(false);
  };

  const handleModeSelect = (role: "traveler" | "caregiver") => {
    setSelectedRole(role);
    reset();
    setScreen("login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    const { error: err } = await login(username.trim(), password);
    setIsLoading(false);
    if (err) setError(err);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || !password) { setError("Please fill in all required fields."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setIsLoading(true);
    const payload: RegisterData = { username: username.trim(), displayName: displayName.trim(), password, role: selectedRole, phone: phone.trim() || undefined };
    const { error: err } = await register(payload);
    setIsLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="flex justify-center min-h-[100dvh] bg-gradient-to-br from-emerald-100/50 via-background to-purple-100/40 dark:from-emerald-950/30 dark:via-background dark:to-purple-950/30">
      <div className="w-full max-w-[430px] bg-background shadow-2xl border-x border-border/40 flex flex-col items-center justify-center p-8 space-y-8 min-h-[100dvh]">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center space-y-2">
          <img src={logoUrl} alt="TransitBuddy" className="w-48 h-48 object-contain mx-auto drop-shadow-sm" />
          <p className="text-muted-foreground text-lg -mt-4">Your calm Bay Area transit guide</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {screen === "mode" && (
            <motion.div key="mode" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full space-y-4">
              <p className="text-center font-bold text-xl">Who are you?</p>
              <p className="text-center text-muted-foreground text-sm">Choose how you'll use TransitBuddy.</p>

              <button onClick={() => handleModeSelect("traveler")} data-testid="mode-user"
                className="w-full p-6 rounded-3xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Train className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-xl">I'm Traveling</p>
                    <p className="text-muted-foreground text-sm mt-1">Step-by-step BART guidance, calming tools, and live updates</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              <button onClick={() => handleModeSelect("caregiver")} data-testid="mode-family"
                className="w-full p-6 rounded-3xl border-2 border-border bg-card hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all text-left group active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                    <HeartHandshake className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-xl">I'm a Caregiver</p>
                    <p className="text-muted-foreground text-sm mt-1">Track a family member's trip, see their progress, and stay connected</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </button>
            </motion.div>
          )}

          {screen === "login" && (
            <motion.div key="login" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full space-y-5">
              <div className="text-center space-y-1">
                <div className={`w-14 h-14 rounded-2xl ${selectedRole === "caregiver" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-primary/15"} flex items-center justify-center mx-auto mb-3`}>
                  {selectedRole === "caregiver" ? <HeartHandshake className="w-8 h-8 text-purple-600" /> : <Train className="w-8 h-8 text-primary" />}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => { reset(); setScreen("login"); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                  <button onClick={() => { reset(); setScreen("register"); }} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-bold flex items-center gap-1.5 hover:bg-muted/80">
                    <UserPlus className="w-3.5 h-3.5" /> Create Account
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Username</label>
                  <Input value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
                    placeholder="your-username" className="h-14 rounded-2xl text-lg font-semibold" autoFocus
                    data-testid="input-username" autoCapitalize="none" autoCorrect="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••" className="h-14 rounded-2xl text-lg font-semibold pr-12" data-testid="input-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-destructive text-sm font-semibold text-center">{error}</p>}

                <Button type="submit" size="lg" disabled={isLoading}
                  className={`w-full h-16 text-xl rounded-2xl font-extrabold shadow-lg ${selectedRole === "caregiver" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  data-testid="submit-login">
                  {isLoading ? "Signing in…" : "Sign In"} {!isLoading && <ArrowRight className="w-6 h-6 ml-2" />}
                </Button>
              </form>

              <Button type="button" variant="ghost" className="w-full" onClick={() => { reset(); setScreen("mode"); }}>← Back</Button>
            </motion.div>
          )}

          {screen === "register" && (
            <motion.div key="register" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full space-y-4">
              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl ${selectedRole === "caregiver" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-primary/15"} flex items-center justify-center mx-auto mb-3`}>
                  {selectedRole === "caregiver" ? <HeartHandshake className="w-8 h-8 text-purple-600" /> : <Train className="w-8 h-8 text-primary" />}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <button onClick={() => { reset(); setScreen("login"); }} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-bold flex items-center gap-1.5 hover:bg-muted/80">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Create Account
                  </button>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Username <span className="text-destructive">*</span></label>
                  <Input value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
                    placeholder="e.g. alex_bart" className="h-12 rounded-2xl font-semibold" autoFocus
                    autoCapitalize="none" autoCorrect="off" data-testid="input-username" />
                  <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only — this is how others find you.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Display Name <span className="text-destructive">*</span></label>
                  <Input value={displayName} onChange={e => { setDisplayName(e.target.value); setError(""); }}
                    placeholder="e.g. Alex" className="h-12 rounded-2xl font-semibold" data-testid="input-name" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Phone (optional)</label>
                  <Input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }}
                    placeholder="e.g. 555-867-5309" className="h-12 rounded-2xl font-semibold" data-testid="input-phone" />
                  <p className="text-xs text-muted-foreground">Lets your {selectedRole === "caregiver" ? "traveler" : "caregiver"} call you from the app.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Password <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="At least 8 characters" className="h-12 rounded-2xl font-semibold pr-12" data-testid="input-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Confirm Password <span className="text-destructive">*</span></label>
                  <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="••••••••" className="h-12 rounded-2xl font-semibold" data-testid="input-confirm-password" />
                </div>

                {error && <p className="text-destructive text-sm font-semibold text-center">{error}</p>}

                <Button type="submit" size="lg" disabled={isLoading}
                  className={`w-full h-16 text-xl rounded-2xl font-extrabold shadow-lg ${selectedRole === "caregiver" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  data-testid="submit-login">
                  {isLoading ? "Creating account…" : "Create Account"} {!isLoading && <ArrowRight className="w-6 h-6 ml-2" />}
                </Button>
              </form>

              <Button type="button" variant="ghost" className="w-full" onClick={() => { reset(); setScreen("mode"); }}>← Back</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
