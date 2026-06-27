import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, User, CreditCard, ShieldCheck,
  MapPin, Camera, Loader2, Navigation, Upload, X, ChevronDown,
  Eye, EyeOff, Mail, Lock, AlertCircle, Clock,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "FCMB", "Sterling Bank", "Union Bank", "Fidelity Bank", "Wema Bank",
  "Polaris Bank", "Ecobank", "Stanbic IBTC", "Citibank", "Keystone Bank",
  "Heritage Bank", "Providus Bank", "Opay", "Palmpay", "Kuda Bank",
];

/* ── Image compression ── */
function compressImage(file: File, maxW = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW) { height = Math.round((height * maxW) / width); width = maxW; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ── Reverse geocode ── */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "Accept-Language": "en" } },
    );
    const d = await r.json();
    return d.display_name ?? "";
  } catch { return ""; }
}

/* ── Shared glass input ── */
function GlassInput({ value, onChange, placeholder, type = "text", disabled, required }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all disabled:opacity-50"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

function GlassSelect({ value, onChange, children, disabled }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all cursor-pointer disabled:opacity-50"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-[#4a9eff]" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── GPS Picker ── */
function GpsPickerMap({ lat, lon, onChange }: {
  lat: string; lon: string;
  onChange: (lat: string, lon: string, address: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  const placePin = useCallback(async (pLat: number, pLon: number) => {
    const map = mapRef.current;
    if (!map) return;
    const ll: L.LatLngExpression = [pLat, pLon];
    if (markerRef.current) markerRef.current.setLatLng(ll);
    else markerRef.current = L.marker(ll).addTo(map);
    map.setView(ll, 17);
    setGeocoding(true);
    const address = await reverseGeocode(pLat, pLon);
    setGeocoding(false);
    onChange(pLat.toFixed(6), pLon.toFixed(6), address);
  }, [onChange]);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => { setLocating(false); await placePin(pos.coords.latitude, pos.coords.longitude); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [placePin]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const initLat = lat ? parseFloat(lat) : 9.082;
    const initLon = lon ? parseFloat(lon) : 8.675;
    const map = L.map(divRef.current, { zoomControl: true }).setView([initLat, initLon], lat ? 14 : 6);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "© Esri" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
      { opacity: 0.8, maxZoom: 19 }).addTo(map);
    if (lat && lon) markerRef.current = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(map);
    map.on("click", async (e) => {
      const { lat: clat, lng: clon } = e.latlng;
      if (markerRef.current) markerRef.current.setLatLng([clat, clon]);
      else markerRef.current = L.marker([clat, clon]).addTo(map);
      setGeocoding(true);
      const address = await reverseGeocode(clat, clon);
      setGeocoding(false);
      onChange(clat.toFixed(6), clon.toFixed(6), address);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return;
    const ll: L.LatLngExpression = [parseFloat(lat), parseFloat(lon)];
    if (markerRef.current) markerRef.current.setLatLng(ll);
    else markerRef.current = L.marker(ll).addTo(mapRef.current);
    mapRef.current.setView(ll, 15);
  }, [lat, lon]);

  return (
    <div className="relative">
      <div ref={divRef} style={{ height: 240, borderRadius: 12, overflow: "hidden" }} />
      <button type="button" onClick={handleGetLocation} disabled={locating || geocoding}
        className="absolute top-2 right-2 z-[500] flex items-center gap-1.5 bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-colors">
        {locating ? <><Loader2 className="h-3 w-3 animate-spin" /> Locating…</> : <><Navigation className="h-3 w-3" /> Get Address</>}
      </button>
      {geocoding && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0a1628]/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-[500]">
          <Loader2 className="h-3 w-3 animate-spin" /> Looking up address…
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-[#0a1628]/80 backdrop-blur text-[#a8c0e8] text-[11px] px-2 py-1 rounded z-[500]">
        Tap map to pin · or press Get Address
      </div>
    </div>
  );
}

/* ── Photo Upload ── */
function PhotoUpload({ label, value, onChange, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; icon: React.ElementType;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try { onChange(await compressImage(file)); } finally { setLoading(false); }
  }, [onChange]);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        onClick={() => !value && inputRef.current?.click()}
        className={`relative rounded-xl overflow-hidden transition-all ${
          value ? "cursor-default" : "cursor-pointer hover:border-[#4a9eff]/50"
        }`}
        style={{ border: "2px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-40 object-cover" />
            <button type="button" onClick={() => onChange("")}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            {loading ? (
              <><Loader2 className="h-6 w-6 text-[#4a9eff] animate-spin" /><p className="text-xs text-white/50">Compressing…</p></>
            ) : (
              <><Icon className="h-7 w-7 text-white/25" /><p className="text-xs text-white/40">Click to upload {label}</p><Upload className="h-3.5 w-3.5 text-white/25" /></>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STEP 1 — Account Setup
════════════════════════════════════════ */
function AccountSetupStep({ onDone }: { onDone: (token: string, userName: string) => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (!name.trim()) return setError("Full name is required");
      if (!email.trim()) return setError("Email is required");
      if (password.length < 6) return setError("Password must be at least 6 characters");
      if (password !== confirm) return setError("Passwords do not match");
    } else {
      if (!email.trim() || !password) return setError("Email and password are required");
    }

    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { name: name.trim(), email: email.trim().toLowerCase(), password, role: "field_agent" }
        : { email: email.trim().toLowerCase(), password };

      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      // save token
      localStorage.setItem("streetly_token", data.token);
      localStorage.setItem("streetly_user", JSON.stringify(data.user));
      onDone(data.token, data.user.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#4a9eff]/15 border border-[#4a9eff]/25 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-[#4a9eff]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {mode === "register" ? "Create Your Agent Account" : "Log In to Continue"}
        </h2>
        <p className="text-sm text-white/50">
          {mode === "register"
            ? "These credentials will be your login details for the Streetly platform."
            : "Use your existing Streetly credentials."}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl p-1 mb-6"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {(["register", "login"] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === m ? "bg-[#4a9eff] text-white shadow" : "text-white/50 hover:text-white"
            }`}>
            {m === "register" ? "Create Account" : "Log In"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <GlassInput value={name} onChange={setName} placeholder="Your full legal name" required />
          </div>
        )}

        <div>
          <FieldLabel required>Email Address</FieldLabel>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
        </div>

        <div>
          <FieldLabel required>Password</FieldLabel>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div>
            <FieldLabel required>Confirm Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={loading}
          className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 transition-colors mt-2">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {mode === "register" ? "Creating account…" : "Logging in…"}</>
            : mode === "register" ? "Create Account & Continue" : "Log In & Continue"
          }
        </button>
      </form>

      {mode === "register" && (
        <p className="text-xs text-white/30 text-center mt-4">
          By creating an account you agree to our terms of service.
        </p>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════
   STEP 2 — Agent Application Form
════════════════════════════════════════ */
interface FormState {
  fullName: string; age: string; address: string;
  latitude: string; longitude: string;
  passportPhotoUrl: string; ninSlipUrl: string;
  bankName: string; accountNumber: string; accountName: string;
  idType: string; idNumber: string;
}
const DEFAULT: FormState = {
  fullName: "", age: "", address: "",
  latitude: "", longitude: "",
  passportPhotoUrl: "", ninSlipUrl: "",
  bankName: "", accountNumber: "", accountName: "",
  idType: "nin", idNumber: "",
};

function AgentApplicationForm({ userName }: { userName: string }) {
  const [form, setForm] = useState<FormState>({ ...DEFAULT, fullName: userName });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (val: string) => setForm(f => ({ ...f, [key]: val }));
  const handleGps = (lat: string, lon: string, address: string) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lon, address: address || f.address }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.bankName || !form.accountNumber || !form.accountName)
      return setError("All bank details are required");
    if (!form.idNumber.trim()) return setError("ID number is required");

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/agents/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
        },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : undefined,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-white/50 text-sm max-w-sm mx-auto">
          Your application is under review. We'll notify you once an admin approves your profile.
          In the meantime you can log in and check your status on the dashboard.
        </p>
        <div className="mt-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300 text-left">
            Approval typically takes 24-48 hours. You'll be able to start registering businesses once approved.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-green-400" />
          </div>
          <span className="text-xs text-green-400 font-semibold">Account created successfully</span>
        </div>
        <h2 className="text-xl font-bold text-white">Complete Your Agent Profile</h2>
        <p className="text-sm text-white/50 mt-1">Fill in your details to apply as a Streetly field agent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <SectionCard icon={User} title="Personal Information">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <GlassInput value={form.fullName} onChange={set("fullName")} placeholder="Your full legal name" />
              </div>
              <div>
                <FieldLabel>Age</FieldLabel>
                <GlassInput type="number" value={form.age} onChange={set("age")} placeholder="e.g. 28" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard icon={MapPin} title="Your Location">
          <p className="text-xs text-white/40 mb-3">
            Press <span className="text-[#4a9eff] font-medium">Get Address</span> to auto-fill your location, or tap the map.
          </p>
          <GpsPickerMap lat={form.latitude} lon={form.longitude} onChange={handleGps} />
          {form.latitude && form.longitude && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#4a9eff]">
              <MapPin className="h-3 w-3" />
              Pinned at {parseFloat(form.latitude).toFixed(4)}°N, {parseFloat(form.longitude).toFixed(4)}°E
            </div>
          )}
          <div className="mt-3">
            <FieldLabel>Office / Home Address</FieldLabel>
            <GlassInput value={form.address} onChange={set("address")} placeholder="e.g. 12 Bode Thomas Street, Surulere, Lagos" />
          </div>
        </SectionCard>

        {/* Bank Details */}
        <SectionCard icon={CreditCard} title="Bank Details">
          <div className="space-y-3">
            <div>
              <FieldLabel required>Bank Name</FieldLabel>
              <GlassSelect value={form.bankName} onChange={set("bankName")}>
                <option value="" style={{ background: "#0a1628" }}>Select bank</option>
                {NIGERIAN_BANKS.map(b => (
                  <option key={b} value={b} style={{ background: "#0a1628" }}>{b}</option>
                ))}
              </GlassSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Account Number</FieldLabel>
                <GlassInput value={form.accountNumber} onChange={set("accountNumber")} placeholder="10-digit number" />
              </div>
              <div>
                <FieldLabel required>Account Name</FieldLabel>
                <GlassInput value={form.accountName} onChange={set("accountName")} placeholder="As on bank statement" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Identity */}
        <SectionCard icon={ShieldCheck} title="Identity Verification">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>ID Type</FieldLabel>
                <GlassSelect value={form.idType} onChange={set("idType")}>
                  <option value="nin" style={{ background: "#0a1628" }}>National ID (NIN)</option>
                  <option value="bvn" style={{ background: "#0a1628" }}>BVN</option>
                  <option value="voters_card" style={{ background: "#0a1628" }}>Voter's Card</option>
                  <option value="drivers_license" style={{ background: "#0a1628" }}>Driver's License</option>
                  <option value="intl_passport" style={{ background: "#0a1628" }}>International Passport</option>
                </GlassSelect>
              </div>
              <div>
                <FieldLabel required>ID Number</FieldLabel>
                <GlassInput value={form.idNumber} onChange={set("idNumber")} placeholder="Enter ID number" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Photos */}
        <SectionCard icon={Camera} title="Photos">
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload label="Passport Photo" value={form.passportPhotoUrl} onChange={set("passportPhotoUrl")} icon={Camera} />
            <PhotoUpload label="ID / NIN Slip" value={form.ninSlipUrl} onChange={set("ninSlipUrl")} icon={ShieldCheck} />
          </div>
        </SectionCard>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={submitting}
          className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 transition-colors">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            : <><CheckCircle className="h-4 w-4" /> Submit Agent Application</>
          }
        </button>
      </form>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
type PageStep = "loading" | "account" | "form" | "already-applied";

export default function AgentApplyPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<PageStep>("loading");
  const [userName, setUserName] = useState("");
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  // On mount: check if already logged in and if already applied
  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) { setStep("account"); return; }

    // parse token to get role quickly (same base64 format)
    try {
      const stored = localStorage.getItem("streetly_user");
      const userObj = stored ? JSON.parse(stored) : null;
      if (userObj?.role !== "field_agent") { setStep("account"); return; }
      setUserName(userObj?.name ?? "");
    } catch { setStep("account"); return; }

    // Check if already has an agent application
    fetch(`${BASE}/api/agents/by-user`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (res.status === 404) { setStep("form"); return; }
      if (res.ok) {
        const data = await res.json();
        setExistingStatus(data.status ?? "pending");
        setStep("already-applied");
      } else {
        setStep("form");
      }
    }).catch(() => setStep("form"));
  }, []);

  const handleAccountDone = (token: string, name: string) => {
    void token;
    setUserName(name);
    // Check if already applied (unlikely for a brand-new account but handle it)
    fetch(`${BASE}/api/agents/by-user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}` },
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setExistingStatus(data.status ?? "pending");
        setStep("already-applied");
      } else {
        setStep("form");
      }
    }).catch(() => setStep("form"));
  };

  const stepIndex = step === "account" ? 0 : 1;

  return (
    <Layout>
      <div style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1628 100%)", minHeight: "100vh" }}>

        {/* Hero */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1a3a 60%, #060c1e 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full opacity-[0.06]"
              style={{ background: "radial-gradient(circle, #4a9eff, transparent 70%)", filter: "blur(60px)" }} />
          </div>
          <div className="relative z-10 container mx-auto px-4 py-10">
            <button onClick={() => navigate("/agents")}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <p className="text-xs text-[#4a9eff] font-bold uppercase tracking-widest mb-2">Field Agent Programme</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Become a Streetly Agent</h1>
            <p className="text-white/50 text-sm max-w-md">
              Register businesses in your area and earn ₦100 for every listing approved by our team.
            </p>
          </div>
        </div>

        {/* Progress Steps (only shown for account + form steps) */}
        {(step === "account" || step === "form") && (
          <div className="border-b border-white/7"
            style={{ background: "rgba(10,22,40,0.95)" }}>
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3 max-w-sm">
                {[
                  { n: 1, label: "Account Setup" },
                  { n: 2, label: "Agent Details" },
                ].map(({ n, label }, i) => (
                  <div key={n} className="flex items-center gap-2">
                    {i > 0 && <div className={`h-px flex-1 w-12 ${stepIndex >= i ? "bg-[#4a9eff]" : "bg-white/15"}`} />}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        stepIndex > i ? "bg-green-500 text-white" : stepIndex === i ? "bg-[#4a9eff] text-white" : "bg-white/10 text-white/40"
                      }`}>
                        {stepIndex > i ? <CheckCircle className="h-3.5 w-3.5" /> : n}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${stepIndex >= i ? "text-white" : "text-white/40"}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <AnimatePresence mode="wait">

            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 text-[#4a9eff] animate-spin" />
              </motion.div>
            )}

            {step === "account" && (
              <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AccountSetupStep onDone={handleAccountDone} />
              </motion.div>
            )}

            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AgentApplicationForm userName={userName} />
              </motion.div>
            )}

            {step === "already-applied" && (
              <motion.div key="applied" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16">
                {existingStatus === "approved" ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">You're Already an Approved Agent!</h2>
                    <p className="text-white/50 text-sm mb-6">Your agent account is active. Go to your dashboard to register businesses and track earnings.</p>
                    <button onClick={() => navigate("/agent-dashboard")}
                      className="px-6 py-3 rounded-xl font-semibold text-sm bg-[#4a9eff] hover:bg-[#3a8ef0] text-white transition-colors">
                      Go to Dashboard →
                    </button>
                  </>
                ) : existingStatus === "rejected" ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Application Not Approved</h2>
                    <p className="text-white/50 text-sm mb-4">Unfortunately, your agent application was not approved. Please contact support for more information.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                      <Clock className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Application Under Review</h2>
                    <p className="text-white/50 text-sm mb-4">You've already submitted your agent application. Our team is reviewing it — this usually takes 24–48 hours.</p>
                    <button onClick={() => navigate("/agent-dashboard")}
                      className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors text-[#4a9eff] hover:text-white"
                      style={{ background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.25)" }}>
                      View Dashboard Status
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
