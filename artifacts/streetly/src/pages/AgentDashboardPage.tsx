import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NIGERIA_STATES } from "@/data/nigeria-locations";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Building2, CheckCircle, Clock, Wallet, TrendingUp,
  User, MapPin, Phone, Globe, Camera, Upload, X,
  Loader2, Navigation, ChevronDown, AlertCircle,
  CreditCard, ShieldCheck, Star, ArrowRight, Plus,
  Edit2, Save, LayoutDashboard, List, Image as ImageIcon,
  XCircle, RefreshCw,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const COMMISSION_PER_LISTING = 100;

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "FCMB", "Sterling Bank", "Union Bank", "Fidelity Bank", "Wema Bank",
  "Polaris Bank", "Ecobank", "Stanbic IBTC", "Kuda Bank", "Opay", "Palmpay",
];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

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

// ── shared sub-components ────────────────────────────────────────────────────

function GlassInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all disabled:opacity-50"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

function GlassSelect({ value, onChange, children, disabled }: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all cursor-pointer disabled:opacity-50"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    approved: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    suspended: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  );
}

// ── GPS Picker ───────────────────────────────────────────────────────────────

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
      <div ref={divRef} style={{ height: 260, borderRadius: 12, overflow: "hidden" }} />
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

// ── Photo Panel ──────────────────────────────────────────────────────────────

function PhotoPanel({ photos, onChange }: {
  photos: Array<{ url: string; caption: string }>;
  onChange: (v: Array<{ url: string; caption: string }>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    if (remaining <= 0) return;
    setLoading(true);
    const items = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(items.map(async (f) => ({ url: await compressImage(f), caption: "" })));
    onChange([...photos, ...compressed]);
    setLoading(false);
  }, [photos, onChange]);

  return (
    <div className="space-y-3">
      <div
        onClick={() => photos.length < 10 && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${photos.length >= 10 ? "border-white/10 opacity-40 cursor-not-allowed" : "border-white/20 hover:border-[#4a9eff]/60 cursor-pointer"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[#4a9eff] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Compressing…
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 mx-auto mb-1.5 text-[#4a9eff]" />
            <p className="text-xs text-white/60">{photos.length === 0 ? "Upload business photos" : `Add more (${photos.length}/10)`}</p>
          </>
        )}
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden">
              <img src={photo.url} alt="" className="w-full h-20 object-cover" />
              <button type="button" onClick={() => { const n = [...photos]; n.splice(idx, 1); onChange(n); }}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Business Tab ─────────────────────────────────────────────────────────

interface BizForm {
  name: string; description: string; categoryId: string;
  stateName: string; cityName: string; areaName: string; streetName: string;
  address: string; phone: string; whatsapp: string; website: string;
  instagramUrl: string; facebookUrl: string; tiktokUrl: string; youtubeUrl: string;
  openingHours: string; latitude: string; longitude: string;
  photos: Array<{ url: string; caption: string }>;
}
const DEFAULT_BIZ: BizForm = {
  name: "", description: "", categoryId: "",
  stateName: "", cityName: "", areaName: "", streetName: "",
  address: "", phone: "", whatsapp: "", website: "",
  instagramUrl: "", facebookUrl: "", tiktokUrl: "", youtubeUrl: "",
  openingHours: "", latitude: "", longitude: "", photos: [],
};

function AddBusinessTab({ agentId, onSuccess }: { agentId: number; onSuccess: () => void }) {
  const [form, setForm] = useState<BizForm>(DEFAULT_BIZ);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof BizForm, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    fetch(`${BASE}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}` },
    }).then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  const selectedState = NIGERIA_STATES.find((s) => s.name === form.stateName);
  const selectedCity = selectedState?.cities.find((c) => c.name === form.cityName);

  const handleGps = (lat: string, lon: string, address: string) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lon, address: address || p.address }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Business name is required");
    if (!form.categoryId) return setError("Select a category");
    if (!form.cityName.trim()) return setError("City is required");
    if (!form.areaName.trim()) return setError("Area is required");
    if (!form.streetName.trim()) return setError("Street name is required");

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/agents/${agentId}/businesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setDone(true);
      setForm(DEFAULT_BIZ);
      setTimeout(() => { setDone(false); onSuccess(); }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Business Submitted!</h3>
        <p className="text-white/50 text-sm">Your listing is under review. You'll earn ₦{COMMISSION_PER_LISTING} when it's approved.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
        style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)" }}>
        <Star className="h-4 w-4 text-[#4a9eff] flex-shrink-0" />
        <span className="text-[#a8c0e8]">You earn <span className="text-white font-semibold">₦{COMMISSION_PER_LISTING}</span> for every listing approved by the admin.</span>
      </div>

      {/* Basic Info */}
      <SectionCard icon={Building2} title="Business Details">
        <div className="space-y-3">
          <div>
            <FieldLabel required>Business Name</FieldLabel>
            <GlassInput value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Mama Titi's Kitchen" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Category</FieldLabel>
              <GlassSelect value={form.categoryId} onChange={(v) => set("categoryId", v)}>
                <option value="" style={{ background: "#0a1628" }}>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: "#0a1628" }}>
                    {c.icon ? `${c.icon} ` : ""}{c.name}
                  </option>
                ))}
              </GlassSelect>
            </div>
            <div>
              <FieldLabel>Opening Hours</FieldLabel>
              <GlassInput value={form.openingHours} onChange={(v) => set("openingHours", v)} placeholder="Mon–Sat: 8am–8pm" />
            </div>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the business…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
        </div>
      </SectionCard>

      {/* Location */}
      <SectionCard icon={MapPin} title="Location">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>State</FieldLabel>
              <GlassSelect value={form.stateName} onChange={(v) => setForm((p) => ({ ...p, stateName: v, cityName: "", areaName: "" }))}>
                <option value="" style={{ background: "#0a1628" }}>Select state</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.name} style={{ background: "#0a1628" }}>{s.name}</option>
                ))}
              </GlassSelect>
            </div>
            <div>
              <FieldLabel required>City</FieldLabel>
              {selectedState ? (
                <GlassSelect value={form.cityName} onChange={(v) => setForm((p) => ({ ...p, cityName: v, areaName: "" }))}>
                  <option value="" style={{ background: "#0a1628" }}>Select city</option>
                  {selectedState.cities.map((c) => (
                    <option key={c.name} value={c.name} style={{ background: "#0a1628" }}>{c.name}</option>
                  ))}
                  <option value="__other__" style={{ background: "#0a1628" }}>Other…</option>
                </GlassSelect>
              ) : (
                <GlassInput value={form.cityName} onChange={(v) => set("cityName", v)} placeholder="e.g. Lagos" />
              )}
            </div>
          </div>
          {form.cityName === "__other__" && (
            <div>
              <FieldLabel required>City Name</FieldLabel>
              <GlassInput value="" onChange={(v) => set("cityName", v)} placeholder="Enter city" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Area / Neighbourhood</FieldLabel>
              {selectedCity?.areas ? (
                <GlassSelect value={form.areaName} onChange={(v) => set("areaName", v)}>
                  <option value="" style={{ background: "#0a1628" }}>Select area</option>
                  {selectedCity.areas.map((a) => (
                    <option key={a} value={a} style={{ background: "#0a1628" }}>{a}</option>
                  ))}
                  <option value="__other__" style={{ background: "#0a1628" }}>Other…</option>
                </GlassSelect>
              ) : (
                <GlassInput value={form.areaName === "__other__" ? "" : form.areaName} onChange={(v) => set("areaName", v)} placeholder="e.g. Victoria Island" />
              )}
            </div>
            <div>
              <FieldLabel required>Street Name</FieldLabel>
              <GlassInput value={form.streetName} onChange={(v) => set("streetName", v)} placeholder="e.g. Bode Thomas Street" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* GPS + Address */}
      <SectionCard icon={Navigation} title="GPS Location & Office Address">
        <p className="text-xs text-white/40 mb-3">
          Press <span className="text-[#4a9eff] font-medium">Get Address</span> to pin your exact location, or tap the map.
        </p>
        <GpsPickerMap lat={form.latitude} lon={form.longitude} onChange={handleGps} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <FieldLabel>Latitude</FieldLabel>
            <GlassInput type="number" value={form.latitude} onChange={(v) => set("latitude", v)} placeholder="e.g. 6.5244" />
          </div>
          <div>
            <FieldLabel>Longitude</FieldLabel>
            <GlassInput type="number" value={form.longitude} onChange={(v) => set("longitude", v)} placeholder="e.g. 3.3792" />
          </div>
        </div>
        {form.latitude && form.longitude && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#4a9eff]">
            <MapPin className="h-3 w-3" />
            Pinned at {parseFloat(form.latitude).toFixed(4)}°N, {parseFloat(form.longitude).toFixed(4)}°E
          </div>
        )}
        <div className="mt-3">
          <FieldLabel>Office Address</FieldLabel>
          <GlassInput value={form.address} onChange={(v) => set("address", v)} placeholder="e.g. Shop 3, 12 Bode Thomas Street, Surulere" />
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard icon={Phone} title="Contact Details">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Phone</FieldLabel>
            <GlassInput value={form.phone} onChange={(v) => set("phone", v)} placeholder="+234 801 234 5678" />
          </div>
          <div>
            <FieldLabel>WhatsApp</FieldLabel>
            <GlassInput value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+234 801 234 5678" />
          </div>
          <div className="col-span-2">
            <FieldLabel>Website</FieldLabel>
            <GlassInput value={form.website} onChange={(v) => set("website", v)} placeholder="https://example.com (optional)" />
          </div>
        </div>
      </SectionCard>

      {/* Social Media */}
      <SectionCard icon={Globe} title="Social Media (Optional)">
        <div className="space-y-3">
          <div>
            <FieldLabel>Instagram</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30 font-medium select-none">instagram.com/</span>
              <input
                type="text"
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="username"
                className="w-full pl-28 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Facebook</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30 font-medium select-none">facebook.com/</span>
              <input
                type="text"
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="pagename"
                className="w-full pl-28 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
          <div>
            <FieldLabel>TikTok</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30 font-medium select-none">tiktok.com/@</span>
              <input
                type="text"
                value={form.tiktokUrl}
                onChange={(e) => set("tiktokUrl", e.target.value)}
                placeholder="username"
                className="w-full pl-28 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
          <div>
            <FieldLabel>YouTube</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30 font-medium select-none">youtube.com/@</span>
              <input
                type="text"
                value={form.youtubeUrl}
                onChange={(e) => set("youtubeUrl", e.target.value)}
                placeholder="channel or handle"
                className="w-full pl-28 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Photos */}
      <SectionCard icon={Camera} title={`Business Photos (${form.photos.length}/10)`}>
        <PhotoPanel photos={form.photos} onChange={(v) => set("photos", v)} />
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Plus className="h-4 w-4" /> Submit Business for Review</>}
      </button>
    </form>
  );
}

// ── My Profile Tab ───────────────────────────────────────────────────────────

function ProfileTab({ agent, agentId, onRefresh }: {
  agent: Record<string, unknown>;
  agentId: number;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: (agent.fullName as string) ?? "",
    age: agent.age ? String(agent.age) : "",
    address: (agent.address as string) ?? "",
    bankName: (agent.bankName as string) ?? "",
    accountNumber: (agent.accountNumber as string) ?? "",
    accountName: (agent.accountName as string) ?? "",
    idType: (agent.idType as string) ?? "nin",
    idNumber: (agent.idNumber as string) ?? "",
    passportPhotoUrl: (agent.passportPhotoUrl as string) ?? "",
  });

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handlePhotoUpload = useCallback(async (file: File) => {
    const compressed = await compressImage(file, 800);
    setForm((p) => ({ ...p, passportPhotoUrl: compressed }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/agents/${agentId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: form.age ? Number(form.age) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setSuccess(true);
      setEditing(false);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-green-300"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle className="h-4 w-4" /> Profile updated successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Photo */}
      <SectionCard icon={Camera} title="Profile Photo">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {form.passportPhotoUrl ? (
              <img src={form.passportPhotoUrl} alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/15" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/8 border-2 border-dashed border-white/15 flex items-center justify-center">
                <User className="h-10 w-10 text-white/30" />
              </div>
            )}
            {editing && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#4a9eff] hover:bg-[#3a8ef0] text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
          </div>
          <div>
            <div className="text-base font-semibold text-white">{(agent.fullName as string) || (agent.userName as string) || "Agent"}</div>
            <div className="text-sm text-white/50 mt-0.5">{(agent.userEmail as string) || ""}</div>
            {agent.msaId && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#4a9eff]/10 border border-[#4a9eff]/25 text-[#4a9eff] text-[10px] font-mono font-bold tracking-wider">
                {agent.msaId as string}
              </span>
            )}
            <StatusBadge status={(agent.status as string) || "pending"} />
            {editing && (
              <p className="text-xs text-white/40 mt-2">Click the camera icon to change your photo</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Personal Info */}
      <SectionCard icon={User} title="Personal Information">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <GlassInput value={form.fullName} onChange={set("fullName")} placeholder="Your full legal name" disabled={!editing} />
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              <GlassInput type="number" value={form.age} onChange={set("age")} placeholder="e.g. 28" disabled={!editing} />
            </div>
          </div>
          <div>
            <FieldLabel>Address</FieldLabel>
            <GlassInput value={form.address} onChange={set("address")} placeholder="Your residential / office address" disabled={!editing} />
          </div>
        </div>
      </SectionCard>

      {/* Bank Details */}
      <SectionCard icon={CreditCard} title="Bank Details">
        <div className="space-y-3">
          <div>
            <FieldLabel>Bank Name</FieldLabel>
            {editing ? (
              <GlassSelect value={form.bankName} onChange={set("bankName")}>
                <option value="" style={{ background: "#0a1628" }}>Select bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b} style={{ background: "#0a1628" }}>{b}</option>
                ))}
              </GlassSelect>
            ) : (
              <GlassInput value={form.bankName} onChange={() => {}} disabled />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Account Number</FieldLabel>
              <GlassInput value={form.accountNumber} onChange={set("accountNumber")} placeholder="10-digit number" disabled={!editing} />
            </div>
            <div>
              <FieldLabel>Account Name</FieldLabel>
              <GlassInput value={form.accountName} onChange={set("accountName")} placeholder="As on bank statement" disabled={!editing} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ID Verification */}
      <SectionCard icon={ShieldCheck} title="Identity Verification">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>ID Type</FieldLabel>
            {editing ? (
              <GlassSelect value={form.idType} onChange={set("idType")}>
                <option value="nin" style={{ background: "#0a1628" }}>National ID (NIN)</option>
                <option value="bvn" style={{ background: "#0a1628" }}>BVN</option>
                <option value="voters_card" style={{ background: "#0a1628" }}>Voter's Card</option>
                <option value="drivers_license" style={{ background: "#0a1628" }}>Driver's License</option>
                <option value="intl_passport" style={{ background: "#0a1628" }}>International Passport</option>
              </GlassSelect>
            ) : (
              <GlassInput value={form.idType} onChange={() => {}} disabled />
            )}
          </div>
          <div>
            <FieldLabel>ID Number</FieldLabel>
            <GlassInput value={form.idNumber} onChange={set("idNumber")} placeholder="Enter ID number" disabled={!editing} />
          </div>
        </div>
      </SectionCard>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 transition-colors"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null); }}
              className="px-5 h-10 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.25)", color: "#4a9eff" }}
          >
            <Edit2 className="h-4 w-4" /> Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

type Tab = "overview" | "listings" | "add" | "profile";

export default function AgentDashboardPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [agentId, setAgentId] = useState<number | null>(null);
  const [dashData, setDashData] = useState<Record<string, unknown> | null>(null);
  const [allListings, setAllListings] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const fetchDash = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/agents/${id}/dashboard`);
      if (res.ok) setDashData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchListings = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/agents/${id}/listings`);
      if (res.ok) setAllListings(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) { navigate("/agents/apply"); return; }

    fetch(`${BASE}/api/agents/by-user`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) { navigate("/agents/apply"); return; }
      const data = await res.json();
      const id: number = data.id;
      setAgentId(id);
      fetchDash(id);
      fetchListings(id);
    }).catch(() => navigate("/agents/apply"));
  }, [navigate, fetchDash, fetchListings]);

  const agent = dashData?.agent as Record<string, unknown> | undefined;
  const recentListings = (dashData?.recentListings as unknown[]) ?? [];
  const recentWithdrawals = (dashData?.recentWithdrawals as unknown[]) ?? [];

  const filteredListings = (allListings as Array<Record<string, unknown>>).filter(
    (l) => statusFilter === "all" || l.status === statusFilter,
  );

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawing(true);
    try {
      const res = await fetch(`${BASE}/api/agents/${agentId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(withdrawAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      setShowWithdraw(false);
      setWithdrawAmount("");
      fetchDash();
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : "Failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "listings", label: "My Listings", icon: List },
    { id: "add", label: "Add Business", icon: Plus },
    { id: "profile", label: "My Profile", icon: User },
  ];

  /* ── Pending / Rejected gate ── */
  if (!loading && agent) {
    const agentStatus = agent.status as string;
    if (agentStatus === "pending") {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg,#060c1e 0%,#0a1628 100%)" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-2">Application Under Review</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Your field agent application has been submitted successfully. Our team is reviewing your details — you'll have full access to your dashboard once approved.
              </p>
              <div className="p-4 rounded-2xl mb-6 text-left space-y-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                  <span className="text-white/60">Identity & ID documents — <span className="text-yellow-400 font-semibold">Pending review</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                  <span className="text-white/40">Bank account verification</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                  <span className="text-white/40">Dashboard access granted</span>
                </div>
              </div>
              <p className="text-xs text-white/30">Usually takes 1–2 business days. Check back soon!</p>
            </motion.div>
          </div>
        </Layout>
      );
    }
    if (agentStatus === "rejected") {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg,#060c1e 0%,#0a1628 100%)" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-2">Application Not Approved</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Unfortunately your agent application was not approved at this time. Please contact support if you believe this is an error or would like to reapply.
              </p>
              <a href="mailto:support@streetly.ng"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                Contact Support
              </a>
            </motion.div>
          </div>
        </Layout>
      );
    }
  }

  return (
    <Layout>
      <div style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1628 100%)", minHeight: "100vh" }}>

        {/* Hero */}
        <div className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1a3a 60%, #060c1e 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full opacity-[0.07]"
              style={{ background: "radial-gradient(circle, #4a9eff, transparent 70%)", filter: "blur(50px)" }} />
          </div>
          <div className="relative z-10 container mx-auto px-4 py-10">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {loading ? (
                <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              ) : agent ? (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    {agent.passportPhotoUrl ? (
                      <img src={agent.passportPhotoUrl as string} alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#4a9eff]/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#4a9eff]" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[#4a9eff] font-bold uppercase tracking-widest">Agent Dashboard</p>
                      <h1 className="text-2xl font-extrabold text-white">
                        {(agent.fullName as string) || (agent.userName as string) || "Agent"}
                      </h1>
                      {agent.msaId && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#4a9eff]/15 border border-[#4a9eff]/30 text-[#4a9eff] text-xs font-mono font-bold tracking-wider">
                          {agent.msaId as string}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={agent.status as string} />
                </>
              ) : (
                <h1 className="text-2xl font-extrabold text-white">Agent Dashboard</h1>
              )}
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: "rgba(10,22,40,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-t-lg ${
                    tab === t.id
                      ? "text-[#4a9eff] border-b-2 border-[#4a9eff]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.id === "add" && (
                    <span className="w-5 h-5 rounded-full bg-[#4a9eff] text-white text-[10px] font-bold flex items-center justify-center">+</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-7 max-w-3xl">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                    ))}
                  </div>
                ) : agent ? (
                  <div className="space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Building2, label: "Total Listings", value: agent.totalListings as number, color: "text-[#4a9eff]", bg: "bg-[#4a9eff]/10" },
                        { icon: CheckCircle, label: "Approved", value: agent.approvedListings as number, color: "text-green-400", bg: "bg-green-500/10" },
                        { icon: TrendingUp, label: "Total Earned", value: fmt(agent.totalEarnings as number), color: "text-purple-400", bg: "bg-purple-500/10" },
                        { icon: Wallet, label: "Available", value: fmt(agent.availableBalance as number), color: "text-amber-400", bg: "bg-amber-500/10" },
                      ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                          </div>
                          <div className="text-xl font-bold text-white">{s.value}</div>
                          <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Commission Banner */}
                    <div className="rounded-2xl p-4 flex items-center gap-4"
                      style={{ background: "rgba(74,158,255,0.07)", border: "1px solid rgba(74,158,255,0.18)" }}>
                      <div className="w-10 h-10 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-[#4a9eff]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">Earn ₦{COMMISSION_PER_LISTING} per approved listing</div>
                        <div className="text-xs text-white/45 mt-0.5">Submit businesses and earn when the admin approves them.</div>
                      </div>
                      <button onClick={() => setTab("add")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#4a9eff] hover:underline whitespace-nowrap">
                        Add Business <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Withdrawal */}
                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <div className="text-xs text-white/50 mb-0.5">Available Balance</div>
                          <div className="text-2xl font-bold text-white">{fmt(agent.availableBalance as number)}</div>
                          <div className="text-xs text-white/40 mt-0.5">{agent.bankName} · {agent.accountNumber}</div>
                        </div>
                        {!showWithdraw && (
                          <button
                            onClick={() => setShowWithdraw(true)}
                            disabled={(agent.availableBalance as number) <= 0}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                            style={{ background: "rgba(74,158,255,0.18)", border: "1px solid rgba(74,158,255,0.3)" }}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {showWithdraw && (
                          <motion.form
                            onSubmit={handleWithdraw}
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-3"
                          >
                            <GlassInput
                              type="number"
                              value={withdrawAmount}
                              onChange={setWithdrawAmount}
                              placeholder={`Amount (min ₦500, max ${fmt(agent.availableBalance as number)})`}
                            />
                            {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}
                            <div className="flex gap-2">
                              <button type="submit" disabled={withdrawing}
                                className="flex-1 h-9 rounded-xl text-sm font-semibold text-white bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 transition-colors">
                                {withdrawing ? "Processing…" : "Confirm Withdrawal"}
                              </button>
                              <button type="button" onClick={() => { setShowWithdraw(false); setWithdrawError(null); }}
                                className="px-4 h-9 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
                                style={{ background: "rgba(255,255,255,0.05)" }}>
                                Cancel
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Recent Listings */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Recent Listings</h3>
                        <button onClick={() => setTab("listings")} className="text-xs text-[#4a9eff] hover:underline flex items-center gap-1">
                          View all <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                      {recentListings.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <Building2 className="h-8 w-8 mx-auto mb-3 text-white/20" />
                          <p className="text-sm text-white/40">No listings yet.</p>
                          <button onClick={() => setTab("add")} className="mt-3 text-xs text-[#4a9eff] hover:underline">Add your first business →</button>
                        </div>
                      ) : (
                        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                          {(recentListings as Array<Record<string, unknown>>).map((biz, i) => (
                            <div key={biz.id as number}
                              className={`flex items-center gap-3 p-3.5 ${i < recentListings.length - 1 ? "border-b border-white/5" : ""}`}
                              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                              <div className="w-8 h-8 rounded-xl bg-[#4a9eff]/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-4 w-4 text-[#4a9eff]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{biz.name as string}</div>
                                <div className="text-xs text-white/40">{biz.categoryName as string ?? "—"}</div>
                              </div>
                              <StatusBadge status={biz.status as string} />
                              {biz.status === "approved" && (
                                <div className="text-xs text-green-400 font-semibold ml-1">+₦{COMMISSION_PER_LISTING}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Withdrawal History */}
                    {recentWithdrawals.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Withdrawal History</h3>
                        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                          {(recentWithdrawals as Array<Record<string, unknown>>).map((w, i) => (
                            <div key={w.id as number}
                              className={`flex items-center gap-3 p-3.5 ${i < recentWithdrawals.length - 1 ? "border-b border-white/5" : ""}`}
                              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <Wallet className="h-4 w-4 text-amber-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-white">{fmt(w.amount as number)}</div>
                                <div className="text-xs text-white/40">{new Date(w.createdAt as string).toLocaleDateString()}</div>
                              </div>
                              <StatusBadge status={w.status as string} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <h2 className="text-lg font-bold text-white mb-2">No agent profile found</h2>
                    <p className="text-white/50 text-sm mb-5">Apply as an agent to access your dashboard.</p>
                    <Button onClick={() => navigate("/agents/apply")} className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white rounded-full">
                      Apply as Agent
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MY LISTINGS ── */}
            {tab === "listings" && (
              <motion.div key="listings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">All My Listings</h2>
                  <button onClick={() => { fetchListings(); fetchDash(); }}
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        statusFilter === f
                          ? "bg-[#4a9eff] text-white"
                          : "text-white/50 hover:text-white"
                      }`}
                      style={statusFilter !== f ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" } : {}}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredListings.length === 0 ? (
                  <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Building2 className="h-10 w-10 mx-auto mb-3 text-white/15" />
                    <p className="text-sm text-white/40">
                      {statusFilter === "all" ? "No listings yet. Add your first business!" : `No ${statusFilter} listings.`}
                    </p>
                    {statusFilter === "all" && (
                      <button onClick={() => setTab("add")} className="mt-3 text-xs text-[#4a9eff] hover:underline">
                        Add your first business →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredListings.map((biz) => (
                      <motion.div
                        key={biz.id as number}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#4a9eff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="h-5 w-5 text-[#4a9eff]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-white">{biz.name as string}</span>
                              <StatusBadge status={biz.status as string} />
                              {biz.status === "approved" && (
                                <span className="text-xs text-green-400 font-bold">+₦{COMMISSION_PER_LISTING} earned</span>
                              )}
                            </div>
                            <div className="text-xs text-white/40 mt-1">
                              {biz.categoryName as string ?? "—"} · {new Date(biz.createdAt as string).toLocaleDateString()}
                            </div>
                            {biz.address && (
                              <div className="flex items-center gap-1 text-xs text-white/35 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{biz.address as string}</span>
                              </div>
                            )}
                            {biz.phone && (
                              <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5">
                                <Phone className="h-3 w-3" />
                                {biz.phone as string}
                              </div>
                            )}
                            {biz.status === "pending" && (
                              <p className="text-[11px] text-amber-400/70 mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Under review · You'll earn ₦{COMMISSION_PER_LISTING} upon approval
                              </p>
                            )}
                            {biz.status === "rejected" && (
                              <p className="text-[11px] text-red-400/70 mt-2 flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Listing was not approved
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ADD BUSINESS ── */}
            {tab === "add" && (
              <motion.div key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-base font-semibold text-white mb-5">Register a Business</h2>
                <AddBusinessTab
                  agentId={agentId!}
                  onSuccess={() => { if (agentId) { fetchListings(agentId); fetchDash(agentId); } setTab("listings"); }}
                />
              </motion.div>
            )}

            {/* ── MY PROFILE ── */}
            {tab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-base font-semibold text-white mb-5">My Profile</h2>
                {agent ? (
                  <ProfileTab
                    agent={agent}
                    agentId={agentId!}
                    onRefresh={() => { if (agentId) fetchDash(agentId); }}
                  />
                ) : (
                  <div className="text-center py-20">
                    <User className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <p className="text-white/50">No agent profile found.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
