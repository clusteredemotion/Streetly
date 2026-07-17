import { useState, useEffect, useRef, useCallback } from "react";
import { Country, State, City as CSCCity } from "country-state-city";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import { getApiBase } from "@/lib/utils";
import { getCurrentPosition, geoErrorMessage } from "@/lib/geolocation";
import "leaflet/dist/leaflet.css";
import {
  Building2, CheckCircle, MapPin, Phone, Globe, Camera, Upload, X,
  Loader2, Navigation, ChevronDown, AlertCircle, Plus,
  Image as ImageIcon, Package, ArrowRight
} from "lucide-react";

const BASE = getApiBase();

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

// ── helpers ──────────────────────────────────────────────────────────────────

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
  const [geoError, setGeoError] = useState<string | null>(null);

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

  const handleGetLocation = useCallback(async () => {
    if (!mapRef.current) return;
    setLocating(true);
    setGeoError(null);
    const result = await getCurrentPosition();
    setLocating(false);
    if (result.ok) {
      await placePin(result.latitude, result.longitude);
    } else {
      setGeoError(geoErrorMessage(result.reason));
    }
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
      {geoError && (
        <div className="absolute top-12 right-2 bg-red-900/90 backdrop-blur text-red-200 text-[11px] px-3 py-1.5 rounded-lg z-[500] max-w-[200px] text-center">
          {geoError}
        </div>
      )}
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

// ── Products Panel ───────────────────────────────────────────────────────────

interface ProductForm {
  name: string; description: string; price: string; imageUrl: string;
}
const EMPTY_PRODUCT: ProductForm = { name: "", description: "", price: "", imageUrl: "" };

function ProductsPanel({ products, onChange }: {
  products: ProductForm[];
  onChange: (v: ProductForm[]) => void;
}) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const addProduct = () => onChange([...products, { ...EMPTY_PRODUCT }]);
  const removeProduct = (idx: number) => onChange(products.filter((_, i) => i !== idx));
  const updateProduct = (idx: number, patch: Partial<ProductForm>) =>
    onChange(products.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const handleImage = async (idx: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const dataUrl = await compressImage(file);
      updateProduct(idx, { imageUrl: dataUrl });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      {products.map((p, idx) => (
        <div key={idx} className="rounded-xl p-3 space-y-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Product {idx + 1}</span>
            <button type="button" onClick={() => removeProduct(idx)} className="text-white/40 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-3">
            <label
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed ${p.imageUrl ? "border-transparent" : "border-white/20 hover:border-[#4a9eff]/60"}`}
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {uploadingIdx === idx ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#4a9eff]" />
              ) : p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-white/25" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(idx, e.target.files?.[0])} />
            </label>
            <div className="flex-1 space-y-2">
              <input
                value={p.name}
                onChange={(e) => updateProduct(idx, { name: e.target.value })}
                placeholder="Product name"
                className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
              <div className="flex gap-2">
                <input
                  type="number" min="0"
                  value={p.price}
                  onChange={(e) => updateProduct(idx, { price: e.target.value })}
                  placeholder="Price (₦)"
                  className="w-28 px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
                <input
                  value={p.description}
                  onChange={(e) => updateProduct(idx, { description: e.target.value })}
                  placeholder="Description (optional)"
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addProduct}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-[#4a9eff] border border-dashed border-[#4a9eff]/30 hover:bg-[#4a9eff]/5 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Product
      </button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

interface BizForm {
  name: string; description: string; categoryId: string;
  countryName: string; stateName: string; cityName: string; areaName: string; streetName: string;
  address: string; phone: string; whatsapp: string; website: string;
  instagramUrl: string; facebookUrl: string; tiktokUrl: string; youtubeUrl: string;
  openingHours: string; latitude: string; longitude: string;
  photos: Array<{ url: string; caption: string }>;
  products: ProductForm[];
}

const DEFAULT_BIZ: BizForm = {
  name: "", description: "", categoryId: "",
  countryName: "Nigeria", stateName: "", cityName: "", areaName: "", streetName: "",
  address: "", phone: "", whatsapp: "", website: "",
  instagramUrl: "", facebookUrl: "", tiktokUrl: "", youtubeUrl: "",
  openingHours: "", latitude: "", longitude: "", photos: [], products: [],
};

const BIZ_ONBOARD_LOC_KEY = "streetly_loc_biz_onboard";

export default function BusinessOnboardingPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<BizForm>(() => {
    try {
      const saved = sessionStorage.getItem(BIZ_ONBOARD_LOC_KEY);
      if (saved) {
        const loc = JSON.parse(saved) as { latitude: string; longitude: string; address: string };
        return { ...DEFAULT_BIZ, latitude: loc.latitude, longitude: loc.longitude, address: loc.address };
      }
    } catch { /* ignore */ }
    return DEFAULT_BIZ;
  });
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const set = (key: keyof BizForm, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) {
      navigate("/auth/login");
      return;
    }
    fetch(`${BASE}/api/auth/me`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.role !== "business_owner") {
          setError("Only business owners can access this page.");
        }
        setUserRole(d.role);
      })
      .catch(() => navigate("/auth/login"))
      .finally(() => setLoadingUser(false));

    fetch(`${BASE}/api/categories`).then((r) => r.json()).then(setCategories).catch(() => {});
  }, [navigate]);

  const [dbCitiesData, setDbCitiesData] = useState<Array<{ id: number; name: string; state: string; country: string }>>([]);
  const [apiAreas, setApiAreas] = useState<Array<{ id: number; name: string }>>([]);
  useEffect(() => {
    fetch(`${BASE}/api/cities`).then(r => r.json()).then(setDbCitiesData).catch(() => {});
  }, []);

  const allCountriesList = Country.getAllCountries();
  const selectedCountryObj = allCountriesList.find(c => c.name === form.countryName);
  const locationStates = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
  const selectedStateObj = locationStates.find(s => s.name === form.stateName);
  const dbCitiesForState = dbCitiesData.filter(c => (!form.countryName || c.country === form.countryName) && (!form.stateName || c.state === form.stateName));
  const locationCities: Array<{ id: number; name: string }> = dbCitiesForState.length > 0
    ? dbCitiesForState
    : (selectedCountryObj && selectedStateObj
        ? CSCCity.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode).map(c => ({ id: 0, name: c.name }))
        : []);
  const selectedApiCity = dbCitiesData.find(c => c.name === form.cityName && (!form.countryName || c.country === form.countryName));

  useEffect(() => {
    if (!selectedApiCity) { setApiAreas([]); return; }
    fetch(`${BASE}/api/cities/${selectedApiCity.id}/areas`).then(r => r.json()).then(setApiAreas).catch(() => setApiAreas([]));
  }, [selectedApiCity?.id]);

  const handleGps = (lat: string, lon: string, address: string) => {
    setForm((p) => {
      const newAddress = address || p.address;
      sessionStorage.setItem(BIZ_ONBOARD_LOC_KEY, JSON.stringify({ latitude: lat, longitude: lon, address: newAddress }));
      return { ...p, latitude: lat, longitude: lon, address: newAddress };
    });
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
      const res = await fetch(`${BASE}/api/businesses/self-register`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      sessionStorage.removeItem(BIZ_ONBOARD_LOC_KEY);
      setDone(true);
      setForm(DEFAULT_BIZ);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (userRole !== "business_owner") {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center max-w-md bg-card border rounded-2xl p-8 shadow-sm">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{error || "Only business owners can register businesses."}</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (done) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Pending Verification</h2>
            <p className="text-muted-foreground mb-8">
              Your business has been successfully submitted! Our team will review your listing and notify you once it's live on Streetly.
            </p>
            <Button size="lg" className="w-full gap-2" onClick={() => navigate("/owner-dashboard")}>
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#0a1628] min-h-screen text-white pb-20">
        <div className="bg-gradient-to-r from-[#0547B6] to-[#1a6de8] py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Onboard Your Business</h1>
            <p className="text-blue-100">Fill in the details below to list your business on Streetly.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <SectionCard icon={Building2} title="Business Details">
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Business Name</FieldLabel>
                  <GlassInput value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Mama Titi's Kitchen" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <SearchableSelect
                      value={form.countryName}
                      onChange={(v) => setForm((p) => ({ ...p, countryName: v, stateName: "", cityName: "", areaName: "" }))}
                      options={allCountriesList.map((c) => ({ value: c.name, label: c.name }))}
                      placeholder="Select country"
                      searchPlaceholder="Search country…"
                      variant="glass"
                    />
                  </div>
                  <div>
                    <FieldLabel>State / Region</FieldLabel>
                    <SearchableSelect
                      value={form.stateName}
                      onChange={(v) => setForm((p) => ({ ...p, stateName: v, cityName: "", areaName: "" }))}
                      options={locationStates.map((s) => ({ value: s.name, label: s.name }))}
                      placeholder="Select state"
                      searchPlaceholder="Search state…"
                      variant="glass"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>City</FieldLabel>
                    {locationCities.length > 0 ? (
                      <GlassSelect value={form.cityName} onChange={(v) => setForm((p) => ({ ...p, cityName: v, areaName: "" }))}>
                        <option value="" style={{ background: "#0a1628" }}>Select city</option>
                        {locationCities.map((c, idx) => (
                          <option key={`${c.name}-${idx}`} value={c.name} style={{ background: "#0a1628" }}>{c.name}</option>
                        ))}
                      </GlassSelect>
                    ) : (
                      <GlassInput value={form.cityName} onChange={(v) => set("cityName", v)} placeholder="e.g. Lagos" />
                    )}
                  </div>
                  <div>
                    <FieldLabel required>Area / Neighbourhood</FieldLabel>
                    {apiAreas.length > 0 ? (
                      <GlassSelect value={form.areaName} onChange={(v) => set("areaName", v)}>
                        <option value="" style={{ background: "#0a1628" }}>Select area</option>
                        {apiAreas.map((a) => (
                          <option key={a.id} value={a.name} style={{ background: "#0a1628" }}>{a.name}</option>
                        ))}
                      </GlassSelect>
                    ) : (
                      <GlassInput value={form.areaName} onChange={(v) => set("areaName", v)} placeholder="e.g. Ikeja" />
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel required>Street Name</FieldLabel>
                  <GlassInput value={form.streetName} onChange={(v) => set("streetName", v)} placeholder="e.g. Allen Avenue" />
                </div>
              </div>
            </SectionCard>

            {/* GPS + Address */}
            <SectionCard icon={Navigation} title="GPS Location & Office Address">
              <p className="text-xs text-white/40 mb-3">
                Press <span className="text-[#4a9eff] font-medium">Get Address</span> to pin your exact location, or tap the map.
              </p>
              <GpsPickerMap lat={form.latitude} lon={form.longitude} onChange={handleGps} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <FieldLabel>Latitude</FieldLabel>
                  <GlassInput type="number" value={form.latitude} onChange={(v) => set("latitude", v)} placeholder="e.g. 6.5244" />
                </div>
                <div>
                  <FieldLabel>Longitude</FieldLabel>
                  <GlassInput type="number" value={form.longitude} onChange={(v) => set("longitude", v)} placeholder="e.g. 3.3792" />
                </div>
              </div>
              <div className="mt-4">
                <FieldLabel>Full Address</FieldLabel>
                <GlassInput value={form.address} onChange={(v) => set("address", v)} placeholder="e.g. Shop 3, 12 Bode Thomas Street, Surulere" />
              </div>
            </SectionCard>

            {/* Contact */}
            <SectionCard icon={Phone} title="Contact Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <GlassInput value={form.phone} onChange={(v) => set("phone", v)} placeholder="+234 801 234 5678" />
                </div>
                <div>
                  <FieldLabel>WhatsApp Number</FieldLabel>
                  <GlassInput value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+234 801 234 5678" />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Website</FieldLabel>
                  <GlassInput value={form.website} onChange={(v) => set("website", v)} placeholder="https://example.com" />
                </div>
              </div>
            </SectionCard>

            {/* Social Media */}
            <SectionCard icon={Globe} title="Social Media (Optional)">
              <div className="space-y-4">
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
                      placeholder="channel"
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

            {/* Products */}
            <SectionCard icon={Package} title={`Products (${form.products.length})`}>
              <p className="text-xs text-white/40 mb-3">
                Optional — list products or services this business sells.
              </p>
              <ProductsPanel products={form.products} onChange={(v) => set("products", v)} />
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

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 shadow-lg shadow-blue-500/20"
            >
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <><Plus className="h-5 w-5" /> Submit Business for Review</>}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
