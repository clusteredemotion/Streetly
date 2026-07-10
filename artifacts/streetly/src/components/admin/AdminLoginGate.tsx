import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle, X, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();
const RESET_DESTINATION = "madebayo68@gmail.com";

interface Props {
  onUnlock: (token: string) => void;
  allowedRoles?: string[];
  portalLabel?: string;
}

export default function AdminLoginGate({ onUnlock, allowedRoles = ["admin"], portalLabel = "Admin Portal" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Invalid username or password.");
        return;
      }
      if (!allowedRoles.includes(data.user?.role ?? "")) {
        setError("Access denied. You don't have permission for this portal.");
        return;
      }
      localStorage.setItem("streetly_token", data.token);
      onUnlock(data.token);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (!resetEmail.trim()) {
      setResetError("Please enter the admin email address.");
      return;
    }
    setResetLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setResetLoading(false);
    setResetSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1428 50%, #060c1a 100%)" }}>

      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4a9eff 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.3)" }}>
            <ShieldCheck className="h-7 w-7 text-[#4a9eff]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">STREETLY</h1>
          <p className="text-xs text-white/30 mt-1">{portalLabel}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(20px)" }}>
          <h2 className="text-base font-semibold text-white mb-1">Sign in to continue</h2>
          <p className="text-xs text-white/30 mb-6">Admin access only</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="user@mail.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    caretColor: "#4a9eff",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    caretColor: "#4a9eff",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2.5 border border-red-400/20"
                >
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold mt-1"
              style={{ background: "linear-gradient(135deg, #1a56db 0%, #4a9eff 100%)", color: "#fff" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Reset link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setResetOpen(true); setResetSent(false); setResetEmail(""); setResetError(""); }}
              className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-[#4a9eff] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Password
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reset modal */}
      <AnimatePresence>
        {resetOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResetOpen(false)} />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl p-7"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <button onClick={() => setResetOpen(false)}
                className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
                <X className="h-4 w-4" />
              </button>

              {!resetSent ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(74,158,255,0.15)" }}>
                      <RotateCcw className="h-4 w-4 text-[#4a9eff]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Reset Admin Password</h3>
                      <p className="text-[11px] text-white/40">Enter the admin mail to receive a reset link.</p>
                    </div>
                  </div>

                  <form onSubmit={handleReset} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-white/50">Admin Mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={e => { setResetEmail(e.target.value); setResetError(""); }}
                          placeholder="Enter admin email"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: `1px solid ${resetError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                            caretColor: "#4a9eff",
                          }}
                          onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
                          onBlur={e => (e.target.style.borderColor = resetError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)")}
                        />
                      </div>
                      {resetError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{resetError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full rounded-xl py-3 text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, #1a56db 0%, #4a9eff 100%)", color: "#fff" }}
                    >
                      {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {resetLoading ? "Sending…" : "Send Reset Link"}
                    </Button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-4 py-4"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Reset link sent!</p>
                    <p className="text-white/40 text-xs leading-relaxed">
                      A password reset link has been sent to<br />
                      <span className="text-[#4a9eff] font-medium">{RESET_DESTINATION}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => setResetOpen(false)}
                    className="rounded-xl px-6 text-sm"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
                  >
                    Done
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
