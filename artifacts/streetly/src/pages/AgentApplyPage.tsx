import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, User, CreditCard, ShieldCheck,
  MapPin, Camera, FileText, Loader2, Navigation, Upload, X, ChevronDown,
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

/* ── GPS Picker ── */
function GpsPickerMap({ lat, lon, onChange }: {
  lat: string; lon: string;
  onChange: (lat: string, lon: string, address: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);

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
      <div ref={divRef} style={{ height: 260, borderRadius: 12, overflow: "hidden" }} />
      {geocoding && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0a1628]/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-[500]">
          <Loader2 className="h-3 w-3 animate-spin" /> Looking up address…
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-[#0a1628]/80 backdrop-blur text-[#a8c0e8] text-[11px] px-2 py-1 rounded z-[500]">
        Click map to pin your location
      </div>
    </div>
  );
}

/* ── Photo Upload ── */
function PhotoUpload({ label, value, onChange, icon: Icon }: {
  label: string; value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  return (
    <div>
      {value ? (
        <div className="relative group">
          <img src={value} alt={label}
            className="w-full h-36 object-cover rounded-xl border border-white/10" />
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
              Change
            </button>
            <button type="button"
              onClick={() => onChange("")}
              className="bg-red-500/70 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
              Remove
            </button>
          </div>
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">{label}</div>
        </div>
      ) : (
        <button type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-white/15 hover:border-[#4a9eff]/50 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 transition-all group">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#4a9eff]" />
          ) : (
            <>
              <Icon className="h-7 w-7 group-hover:text-[#4a9eff] transition-colors" />
              <span className="text-xs font-medium">{label}</span>
              <span className="text-[10px] opacity-60">JPG, PNG · Click to upload</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

/* ── Styled Input ── */
function GlassInput({ value, onChange, placeholder, type = "text", required }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

function GlassSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-4 pr-9 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all cursor-pointer"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#4a9eff]" />
        </div>
        <h2 className="font-semibold text-white text-base">{title}</h2>
      </div>
      {children}
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

/* ── Main Component ── */
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

export default function AgentApplyPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>(DEFAULT);
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
      <Layout>
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1628 100%)" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="text-center px-6 max-w-md"
          >
            <div className="w-24 h-24 rounded-3xl mx-auto mb-7 flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Application Submitted!</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              Your agent application has been received. Our team will review it within 24–48 hours and notify you.
            </p>
            <Button
              onClick={() => navigate("/agents")}
              className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white rounded-full px-8 h-11"
            >
              Back to Agents Page
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1a3a 60%, #060c1e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #4a9eff, transparent 70%)", filter: "blur(50px)" }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => navigate("/agents")}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Street Scouts</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Agent Application</h1>
            <p className="text-white/50 text-base max-w-lg">
              Join Nigeria's growing network of field agents. Complete your profile below to start earning.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="min-h-screen" style={{ background: "#060c1e" }}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1 — Personal Information */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <SectionCard icon={User} title="Personal Information">
                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Full Name</FieldLabel>
                    <GlassInput value={form.fullName} onChange={set("fullName")} placeholder="Your full legal name" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Age</FieldLabel>
                      <GlassInput type="number" value={form.age} onChange={set("age")} placeholder="e.g. 28" required />
                    </div>
                    <div>
                      <FieldLabel>Phone Number</FieldLabel>
                      <GlassInput value={form.bankName && ""} onChange={() => {}} placeholder="+234 801 234 5678" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Home Address</FieldLabel>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => set("address")(e.target.value)}
                      placeholder="Your residential address (auto-filled from map)"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* 2 — GPS Location */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SectionCard icon={Navigation} title="Your Location (GPS)">
                <p className="text-xs text-white/40 mb-4">
                  Click anywhere on the map to pin your location. This helps us assign you to the right area.
                </p>
                <GpsPickerMap lat={form.latitude} lon={form.longitude} onChange={handleGps} />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <FieldLabel>Latitude</FieldLabel>
                    <GlassInput type="number" value={form.latitude} onChange={set("latitude")} placeholder="e.g. 6.5244" />
                  </div>
                  <div>
                    <FieldLabel>Longitude</FieldLabel>
                    <GlassInput type="number" value={form.longitude} onChange={set("longitude")} placeholder="e.g. 3.3792" />
                  </div>
                </div>
                {form.latitude && form.longitude && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#4a9eff]">
                    <MapPin className="h-3.5 w-3.5" />
                    Pinned at {parseFloat(form.latitude).toFixed(4)}°N, {parseFloat(form.longitude).toFixed(4)}°E
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* 3 — Photo Documents */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <SectionCard icon={Camera} title="Photo Documents">
                <p className="text-xs text-white/40 mb-4">
                  Upload clear, well-lit photos. Images are auto-compressed for upload.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Passport Photograph</FieldLabel>
                    <PhotoUpload
                      label="Passport Photo"
                      value={form.passportPhotoUrl}
                      onChange={set("passportPhotoUrl")}
                      icon={Camera}
                    />
                    <p className="text-[10px] text-white/30 mt-1.5">Clear face photo on white background</p>
                  </div>
                  <div>
                    <FieldLabel>NIN Slip / ID Document</FieldLabel>
                    <PhotoUpload
                      label="NIN Slip / ID"
                      value={form.ninSlipUrl}
                      onChange={set("ninSlipUrl")}
                      icon={FileText}
                    />
                    <p className="text-[10px] text-white/30 mt-1.5">National ID, NIN slip, or other valid ID</p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* 4 — Bank Details */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SectionCard icon={CreditCard} title="Bank Details">
                <div className="space-y-4">
                  <div>
                    <FieldLabel required>Bank Name</FieldLabel>
                    <GlassSelect value={form.bankName} onChange={set("bankName")}>
                      <option value="" style={{ background: "#0a1628" }}>Select your bank</option>
                      {NIGERIAN_BANKS.map(b => (
                        <option key={b} value={b} style={{ background: "#0a1628" }}>{b}</option>
                      ))}
                    </GlassSelect>
                  </div>
                  <div>
                    <FieldLabel required>Account Number</FieldLabel>
                    <GlassInput
                      value={form.accountNumber}
                      onChange={set("accountNumber")}
                      placeholder="10-digit account number"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel required>Account Name</FieldLabel>
                    <GlassInput
                      value={form.accountName}
                      onChange={set("accountName")}
                      placeholder="As shown on your bank statement"
                      required
                    />
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* 5 — Identity Verification */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <SectionCard icon={ShieldCheck} title="Identity Verification">
                <div className="space-y-4">
                  <div>
                    <FieldLabel>ID Type</FieldLabel>
                    <GlassSelect value={form.idType} onChange={set("idType")}>
                      <option value="nin" style={{ background: "#0a1628" }}>National ID (NIN)</option>
                      <option value="bvn" style={{ background: "#0a1628" }}>BVN</option>
                      <option value="voters_card" style={{ background: "#0a1628" }}>Voter's Card</option>
                      <option value="drivers_license" style={{ background: "#0a1628" }}>Driver's License</option>
                      <option value="intl_passport" style={{ background: "#0a1628" }}>International Passport</option>
                    </GlassSelect>
                  </div>
                  <div>
                    <FieldLabel>ID Number</FieldLabel>
                    <GlassInput
                      value={form.idNumber}
                      onChange={set("idNumber")}
                      placeholder="Enter your ID number"
                    />
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            {/* Terms */}
            <div className="rounded-xl px-4 py-3 text-xs text-white/35 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              By applying, you agree to our field agent terms of service. Commissions are paid weekly upon approval of each business listing you submit.
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-red-300"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <X className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white font-semibold rounded-xl text-base gap-2 shadow-lg shadow-[#4a9eff]/20"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting Application…</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Submit Agent Application</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
