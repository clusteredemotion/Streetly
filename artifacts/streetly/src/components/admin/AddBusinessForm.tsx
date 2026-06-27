import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, MapPin, Phone, Globe, Clock, Camera, X,
  CheckCircle, Upload, AlertCircle, Star, ShieldCheck, Eye,
  ChevronDown, Loader2, Navigation, Image as ImageIcon,
} from "lucide-react";
import { NIGERIA_STATES } from "@/data/nigeria-locations";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// ── helpers ────────────────────────────────────────────────────────────────

function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "Accept-Language": "en" } },
    );
    const data = await res.json();
    return data.display_name ?? "";
  } catch {
    return "";
  }
}

// ── GPS Picker Map ─────────────────────────────────────────────────────────

interface GpsPickerProps {
  lat: string;
  lon: string;
  onChange: (lat: string, lon: string, address: string) => void;
}

function GpsPickerMap({ lat, lon, onChange }: GpsPickerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  const placePin = useCallback(async (pLat: number, pLon: number) => {
    const map = mapRef.current;
    if (!map) return;
    const ll: L.LatLngExpression = [pLat, pLon];
    if (markerRef.current) {
      markerRef.current.setLatLng(ll);
    } else {
      markerRef.current = L.marker(ll).addTo(map);
    }
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
      async (pos) => {
        setLocating(false);
        await placePin(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [placePin]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const initLat = lat ? parseFloat(lat) : 9.082;
    const initLon = lon ? parseFloat(lon) : 8.675;
    const zoom = lat ? 14 : 6;

    const map = L.map(divRef.current, { zoomControl: true }).setView([initLat, initLon], zoom);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "© Esri" },
    ).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
      { opacity: 0.8, maxZoom: 19 },
    ).addTo(map);

    if (lat && lon) {
      markerRef.current = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(map);
    }

    map.on("click", async (e) => {
      const { lat: clickLat, lng: clickLon } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLon]);
      } else {
        markerRef.current = L.marker([clickLat, clickLon]).addTo(map);
      }
      setGeocoding(true);
      const address = await reverseGeocode(clickLat, clickLon);
      setGeocoding(false);
      onChange(clickLat.toFixed(6), clickLon.toFixed(6), address);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return;
    const ll: L.LatLngExpression = [parseFloat(lat), parseFloat(lon)];
    if (markerRef.current) {
      markerRef.current.setLatLng(ll);
    } else {
      markerRef.current = L.marker(ll).addTo(mapRef.current);
    }
    mapRef.current.setView(ll, 15);
  }, [lat, lon]);

  return (
    <div className="relative">
      <div ref={divRef} style={{ height: 300, borderRadius: 12, overflow: "hidden" }} />

      {/* Get Address button */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={locating || geocoding}
        className="absolute top-2 right-2 z-[500] flex items-center gap-1.5 bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-colors"
      >
        {locating ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Locating…</>
        ) : (
          <><Navigation className="h-3 w-3" /> Get Address</>
        )}
      </button>

      {geocoding && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0a1628]/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-[500]">
          <Loader2 className="h-3 w-3 animate-spin" />
          Looking up address…
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-[#0a1628]/80 backdrop-blur text-[#a8c0e8] text-[11px] px-2 py-1 rounded z-[500]">
        Tap map to pin · or press Get Address
      </div>
    </div>
  );
}

// ── Photo Upload Panel ─────────────────────────────────────────────────────

interface PhotoItem {
  url: string;
  caption: string;
}

interface PhotoPanelProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

function PhotoPanel({ photos, onChange }: PhotoPanelProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = 10 - photos.length;
      if (remaining <= 0) return;
      setLoading(true);
      const items = Array.from(files).slice(0, remaining);
      const compressed = await Promise.all(
        items.map(async (f) => ({ url: await compressImage(f), caption: "" })),
      );
      onChange([...photos, ...compressed]);
      setLoading(false);
    },
    [photos, onChange],
  );

  const removePhoto = (idx: number) => {
    const next = [...photos];
    next.splice(idx, 1);
    onChange(next);
  };

  const updateCaption = (idx: number, caption: string) => {
    const next = [...photos];
    next[idx] = { ...next[idx], caption };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div
        onClick={() => photos.length < 10 && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
          photos.length >= 10
            ? "border-white/10 opacity-40 cursor-not-allowed"
            : "border-white/20 hover:border-[#4a9eff]/60 cursor-pointer"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[#4a9eff] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Compressing photos…
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto mb-2 text-[#4a9eff]" />
            <p className="text-sm text-white/70">
              {photos.length === 0 ? "Click to upload photos" : `Add more (${photos.length}/10)`}
            </p>
            <p className="text-xs text-white/40 mt-1">JPG, PNG, WebP — auto-compressed</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {photos.map((photo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10"
              >
                <img
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={photo.caption}
                    onChange={(e) => updateCaption(idx, e.target.value)}
                    className="w-full text-[11px] bg-transparent border-b border-white/10 text-white/70 placeholder:text-white/30 outline-none pb-0.5"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Form field helpers ─────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#4a9eff]/60 focus:bg-white/8 transition-colors ${className}`}
    />
  );
}

function SelectField({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4a9eff]/60 transition-colors pr-8"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
  activeColor = "bg-[#4a9eff]",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ElementType;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        checked
          ? "border-[#4a9eff]/50 bg-[#4a9eff]/10"
          : "border-white/10 bg-white/3 hover:bg-white/5"
      }`}
    >
      <div
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
          checked ? activeColor : "bg-white/15"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${checked ? "text-[#4a9eff]" : "text-white/40"}`} />}
      <div className="text-left">
        <div className={`text-sm font-medium ${checked ? "text-white" : "text-white/60"}`}>{label}</div>
        {description && <div className="text-xs text-white/40">{description}</div>}
      </div>
    </button>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-[#4a9eff]" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  registrationNumber: string;
  stateName: string;
  cityName: string;
  areaName: string;
  streetName: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  verified: boolean;
  featured: boolean;
  publish: boolean;
  photos: PhotoItem[];
}

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  categoryId: "",
  registrationNumber: "",
  stateName: "",
  cityName: "",
  areaName: "",
  streetName: "",
  address: "",
  phone: "",
  whatsapp: "",
  website: "",
  openingHours: "",
  latitude: "",
  longitude: "",
  verified: true,
  featured: false,
  publish: true,
  photos: [],
};

interface AddBusinessFormProps {
  onSuccess?: (biz: Record<string, unknown>) => void;
}

export default function AddBusinessForm({ onSuccess }: AddBusinessFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = useCallback((key: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch categories from API
  const { data: categories = [] } = useQuery<Array<{ id: number; name: string; icon?: string }>>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}` },
      });
      return res.json();
    },
  });

  // Derived location data
  const selectedState = NIGERIA_STATES.find((s) => s.name === form.stateName);
  const selectedCity = selectedState?.cities.find((c) => c.name === form.cityName);

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const res = await fetch(`${BASE}/api/admin/businesses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          categoryId: Number(data.categoryId),
          registrationNumber: data.registrationNumber,
          stateName: data.stateName,
          cityName: data.cityName,
          areaName: data.areaName,
          streetName: data.streetName,
          address: data.address,
          phone: data.phone,
          whatsapp: data.whatsapp,
          website: data.website,
          openingHours: data.openingHours,
          latitude: data.latitude,
          longitude: data.longitude,
          verified: data.verified,
          featured: data.featured,
          publish: data.publish,
          photos: data.photos,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Failed to create business");
      }
      return res.json();
    },
    onSuccess: (biz) => {
      setSuccess(true);
      setForm(DEFAULT_FORM);
      setError(null);
      qc.invalidateQueries({ queryKey: ["businesses"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      onSuccess?.(biz);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Business name is required");
    if (!form.categoryId) return setError("Please select a category");
    if (!form.cityName.trim()) return setError("City name is required");
    if (!form.areaName.trim()) return setError("Area name is required");
    if (!form.streetName.trim()) return setError("Street name is required");
    mutation.mutate(form);
  };

  const handleGpsChange = (lat: string, lon: string, address: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      address: address || prev.address,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-300 rounded-xl p-4"
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm">Business created successfully!</div>
              <div className="text-xs text-green-400 mt-0.5">
                {form.publish ? "It's now live on the map." : "Saved as pending for review."}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1 ── Basic Info */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={Building2} title="Business Information" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Business Name</FieldLabel>
            <InputField value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Mama Titi's Kitchen" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Category</FieldLabel>
              <SelectField value={form.categoryId} onChange={(v) => set("categoryId", v)}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}{c.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Registration No.</FieldLabel>
              <InputField
                value={form.registrationNumber}
                onChange={(v) => set("registrationNumber", v)}
                placeholder="RC123456 (optional)"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the business, products or services…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#4a9eff]/60 transition-colors resize-none"
            />
          </div>

          <div>
            <FieldLabel>Opening Hours</FieldLabel>
            <InputField
              value={form.openingHours}
              onChange={(v) => set("openingHours", v)}
              placeholder="e.g. Mon–Sat: 8am – 8pm, Sunday: Closed"
            />
          </div>
        </div>
      </div>

      {/* 2 ── Location */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={MapPin} title="Location" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>State</FieldLabel>
              <SelectField
                value={form.stateName}
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, stateName: v, cityName: "", areaName: "" }));
                }}
              >
                <option value="">Select state</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel required>City</FieldLabel>
              {selectedState ? (
                <SelectField
                  value={form.cityName}
                  onChange={(v) => setForm((prev) => ({ ...prev, cityName: v, areaName: "" }))}
                >
                  <option value="">Select city</option>
                  {selectedState.cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__other__">Other (type below)</option>
                </SelectField>
              ) : (
                <InputField
                  value={form.cityName}
                  onChange={(v) => set("cityName", v)}
                  placeholder="e.g. Lagos"
                />
              )}
            </div>
          </div>

          {/* If "Other" selected for city */}
          {form.cityName === "__other__" && (
            <div>
              <FieldLabel required>Custom City Name</FieldLabel>
              <InputField
                value=""
                onChange={(v) => set("cityName", v)}
                placeholder="Enter city name"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Area / Neighbourhood</FieldLabel>
              {selectedCity?.areas ? (
                <SelectField
                  value={form.areaName}
                  onChange={(v) => set("areaName", v)}
                >
                  <option value="">Select area</option>
                  {selectedCity.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value="__other__">Other (type below)</option>
                </SelectField>
              ) : (
                <InputField
                  value={form.areaName === "__other__" ? "" : form.areaName}
                  onChange={(v) => set("areaName", v)}
                  placeholder="e.g. Victoria Island"
                />
              )}
            </div>
            <div>
              <FieldLabel required>Street Name</FieldLabel>
              <InputField
                value={form.streetName}
                onChange={(v) => set("streetName", v)}
                placeholder="e.g. Bode Thomas Street"
              />
            </div>
          </div>

          {/* Custom area field if "other" was chosen */}
          {form.areaName === "__other__" && (
            <div>
              <FieldLabel required>Custom Area Name</FieldLabel>
              <InputField
                value=""
                onChange={(v) => set("areaName", v)}
                placeholder="Enter area name"
              />
            </div>
          )}

        </div>
      </div>

      {/* 3 ── GPS + Office Address */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={Navigation} title="GPS Location & Office Address" />
        <p className="text-xs text-white/50 mb-4">
          Press <span className="text-[#4a9eff] font-medium">Get Address</span> to use your current GPS location, or tap anywhere on the map to pin the exact business spot. Then enter the formal office address below.
        </p>

        <GpsPickerMap lat={form.latitude} lon={form.longitude} onChange={handleGpsChange} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <FieldLabel>Latitude</FieldLabel>
            <InputField
              type="number"
              value={form.latitude}
              onChange={(v) => set("latitude", v)}
              placeholder="e.g. 6.5244"
            />
          </div>
          <div>
            <FieldLabel>Longitude</FieldLabel>
            <InputField
              type="number"
              value={form.longitude}
              onChange={(v) => set("longitude", v)}
              placeholder="e.g. 3.3792"
            />
          </div>
        </div>

        {form.latitude && form.longitude && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#4a9eff]">
            <MapPin className="h-3.5 w-3.5" />
            Pinned at {parseFloat(form.latitude).toFixed(4)}°N, {parseFloat(form.longitude).toFixed(4)}°E
          </div>
        )}

        <div className="mt-4">
          <FieldLabel>Office Address</FieldLabel>
          <InputField
            value={form.address}
            onChange={(v) => set("address", v)}
            placeholder="e.g. Shop 5, 23 Bode Thomas Street, Surulere, Lagos"
          />
          <p className="text-[11px] text-white/35 mt-1.5">
            The formal address displayed on the business listing. Auto-filled from the map pin — edit to add shop/floor details.
          </p>
        </div>
      </div>

      {/* 4 ── Contact */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={Phone} title="Contact Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <InputField
              value={form.phone}
              onChange={(v) => set("phone", v)}
              placeholder="+234 801 234 5678"
            />
          </div>
          <div>
            <FieldLabel>WhatsApp</FieldLabel>
            <InputField
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              placeholder="+234 801 234 5678"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Website</FieldLabel>
            <InputField
              value={form.website}
              onChange={(v) => set("website", v)}
              placeholder="https://example.com (optional)"
            />
          </div>
        </div>
      </div>

      {/* 5 ── Photos */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Camera} title="Business Photos" />
          <Badge className="bg-white/10 text-white/60 hover:bg-white/10 text-xs">
            {form.photos.length}/10 photos
          </Badge>
        </div>
        <PhotoPanel
          photos={form.photos}
          onChange={(photos) => set("photos", photos)}
        />
      </div>

      {/* 6 ── Options */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={ShieldCheck} title="Listing Options" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Toggle
            checked={form.verified}
            onChange={(v) => set("verified", v)}
            label="Mark Verified"
            description="Shows verified badge"
            icon={ShieldCheck}
          />
          <Toggle
            checked={form.featured}
            onChange={(v) => set("featured", v)}
            label="Featured"
            description="Appears in featured section"
            icon={Star}
            activeColor="bg-amber-500"
          />
          <Toggle
            checked={form.publish}
            onChange={(v) => set("publish", v)}
            label="Publish Now"
            description="Live on map immediately"
            icon={Eye}
            activeColor="bg-green-500"
          />
        </div>
        {!form.publish && (
          <p className="text-xs text-white/40 mt-3 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            Business will be saved as <span className="text-amber-400 font-medium">pending</span> and won't appear on the map until approved.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full h-11 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white font-semibold rounded-xl text-sm gap-2"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating business…
          </>
        ) : (
          <>
            <Building2 className="h-4 w-4" />
            {form.publish ? "Create & Publish Business" : "Create Business (Pending)"}
          </>
        )}
      </Button>
    </form>
  );
}
