import { useState, useCallback } from "react";
import { Country, State } from "country-state-city";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getApiBase } from "@/lib/utils";
import {
  Building2, MapPin, Camera, X, CheckCircle, Upload,
  ChevronDown, Loader2, User,
} from "lucide-react";

const BASE = getApiBase();

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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  value, onChange, placeholder, type = "text", className = "",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
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
  value, onChange, children, className = "",
}: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
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

interface PhotoItem {
  url: string;
}

function PhotoPanel({ photos, onChange }: { photos: PhotoItem[]; onChange: (p: PhotoItem[]) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    if (remaining <= 0) return;
    setLoading(true);
    const items = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(items.map(async (f) => ({ url: await compressImage(f) })));
    onChange([...photos, ...compressed]);
    setLoading(false);
  }, [photos, onChange]);

  const removePhoto = (idx: number) => {
    const next = [...photos];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <label
        className={`block border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
          photos.length >= 10 ? "border-white/10 opacity-40 cursor-not-allowed" : "border-white/20 hover:border-[#4a9eff]/60 cursor-pointer"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[#4a9eff] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Compressing photos…
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto mb-2 text-[#4a9eff]" />
            <p className="text-sm text-white/70">{photos.length === 0 ? "Click to upload photos" : `Add more (${photos.length}/10)`}</p>
            <p className="text-xs text-white/40 mt-1">JPG, PNG, WebP — auto-compressed</p>
          </>
        )}
        <input type="file" multiple accept="image/*" className="hidden" disabled={photos.length >= 10}
          onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {photos.map((photo, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-28 object-cover" />
                <button type="button" onClick={() => removePhoto(idx)}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface FormState {
  title: string;
  description: string;
  countryName: string;
  stateName: string;
  cityName: string;
  areaName: string;
  streetName: string;
  address: string;
  sizeSqft: string;
  priceAmount: string;
  priceType: "rent" | "lease" | "sale";
  contactName: string;
  contactPhone: string;
  status: "pending" | "approved";
  photos: PhotoItem[];
}

const DEFAULT_FORM: FormState = {
  title: "", description: "",
  countryName: "Nigeria", stateName: "", cityName: "", areaName: "", streetName: "",
  address: "", sizeSqft: "", priceAmount: "", priceType: "rent",
  contactName: "", contactPhone: "", status: "approved", photos: [],
};

interface AddPropertyFormProps {
  onSuccess?: (prop: Record<string, unknown>) => void;
}

export default function AddPropertyForm({ onSuccess }: AddPropertyFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = useCallback((key: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { data: dbCitiesData = [] } = useQuery<Array<{ id: number; name: string; state: string; country: string }>>({
    queryKey: ["db-cities-propform"],
    queryFn: () => fetch(`${BASE}/api/cities`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const allCountriesList = Country.getAllCountries();
  const locationStates = State.getStatesOfCountry(
    allCountriesList.find(c => c.name === form.countryName)?.isoCode
  );
  const dbCitiesForState = dbCitiesData.filter(
    c => (!form.countryName || c.country === form.countryName) && (!form.stateName || c.state === form.stateName)
  );
  const selectedApiCity = dbCitiesData.find(c => c.name === form.cityName);
  const { data: apiAreas = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["areas-propform", selectedApiCity?.id],
    queryFn: () => fetch(`${BASE}/api/cities/${selectedApiCity!.id}/areas`).then(r => r.json()),
    enabled: !!selectedApiCity,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormState) => {
      const res = await fetch(`${BASE}/api/admin/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          address: data.address,
          stateName: data.stateName,
          cityName: data.cityName,
          areaName: data.areaName,
          streetName: data.streetName,
          sizeSqft: data.sizeSqft,
          priceAmount: data.priceAmount,
          priceType: data.priceType,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          status: data.status,
          photos: data.photos.map(p => p.url),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Failed to create property");
      }
      return res.json();
    },
    onSuccess: (prop) => {
      setSuccess(true);
      setForm(DEFAULT_FORM);
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      onSuccess?.(prop);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Title is required");
    if (!form.address.trim()) return setError("Address is required");
    if (!form.contactName.trim()) return setError("Contact name is required");
    if (!form.contactPhone.trim()) return setError("Contact phone is required");
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-300 rounded-xl p-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm">Property added successfully!</div>
              <div className="text-xs text-green-400 mt-0.5">
                {form.status === "approved" ? "It's now live on Street Explorer." : "Saved as pending for review."}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* 1 — Property details */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={Building2} title="Property Details" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Title</FieldLabel>
            <InputField value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Vacant Shop on Adeola Odeku St" />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Details about the space, condition, amenities…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#4a9eff]/60 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Size (sqft)</FieldLabel>
              <InputField type="number" value={form.sizeSqft} onChange={(v) => set("sizeSqft", v)} placeholder="e.g. 450" />
            </div>
            <div>
              <FieldLabel>Price (₦)</FieldLabel>
              <InputField type="number" value={form.priceAmount} onChange={(v) => set("priceAmount", v)} placeholder="e.g. 2500000" />
            </div>
            <div>
              <FieldLabel>Price Type</FieldLabel>
              <SelectField value={form.priceType} onChange={(v) => set("priceType", v as FormState["priceType"])}>
                <option value="rent">Rent</option>
                <option value="lease">Lease</option>
                <option value="sale">Sale</option>
              </SelectField>
            </div>
          </div>
        </div>
      </div>

      {/* 2 — Location */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={MapPin} title="Location" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Country</FieldLabel>
              <SearchableSelect
                value={form.countryName}
                onChange={(v) => setForm((prev) => ({ ...prev, countryName: v, stateName: "", cityName: "", areaName: "" }))}
                options={allCountriesList.map((c) => ({ value: c.name, label: c.name }))}
                placeholder="Select country"
                searchPlaceholder="Search country…"
                variant="solid"
              />
            </div>
            <div>
              <FieldLabel>State / Region</FieldLabel>
              <SearchableSelect
                value={form.stateName}
                onChange={(v) => setForm((prev) => ({ ...prev, stateName: v, cityName: "", areaName: "" }))}
                options={locationStates.map((s) => ({ value: s.name, label: s.name }))}
                placeholder="Select state"
                searchPlaceholder="Search state…"
                variant="solid"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>City</FieldLabel>
              {dbCitiesForState.length > 0 ? (
                <SelectField value={form.cityName} onChange={(v) => setForm((prev) => ({ ...prev, cityName: v, areaName: "" }))}>
                  <option value="">Select city</option>
                  {dbCitiesForState.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </SelectField>
              ) : (
                <InputField value={form.cityName} onChange={(v) => set("cityName", v)} placeholder="e.g. Lagos" />
              )}
            </div>
            <div>
              <FieldLabel required>Area / Neighbourhood</FieldLabel>
              {apiAreas.length > 0 ? (
                <SelectField value={form.areaName} onChange={(v) => set("areaName", v)}>
                  <option value="">Select area</option>
                  {apiAreas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </SelectField>
              ) : (
                <InputField value={form.areaName} onChange={(v) => set("areaName", v)} placeholder="e.g. Victoria Island" />
              )}
            </div>
            <div>
              <FieldLabel required>Street Name</FieldLabel>
              <InputField value={form.streetName} onChange={(v) => set("streetName", v)} placeholder="e.g. Adeola Odeku St" />
            </div>
          </div>
          <div>
            <FieldLabel required>Full Address</FieldLabel>
            <InputField value={form.address} onChange={(v) => set("address", v)} placeholder="Full street address" />
          </div>
        </div>
      </div>

      {/* 3 — Contact */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={User} title="Contact Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Contact Name</FieldLabel>
            <InputField value={form.contactName} onChange={(v) => set("contactName", v)} placeholder="e.g. Mr. Adewale" />
          </div>
          <div>
            <FieldLabel required>Contact Phone</FieldLabel>
            <InputField value={form.contactPhone} onChange={(v) => set("contactPhone", v)} placeholder="e.g. 08012345678" />
          </div>
        </div>
      </div>

      {/* 4 — Photos */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={Camera} title="Photos" />
        <PhotoPanel photos={form.photos} onChange={(p) => set("photos", p)} />
      </div>

      {/* 5 — Publish status */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <SectionHeader icon={CheckCircle} title="Visibility" />
        <div className="flex gap-3">
          <button type="button" onClick={() => set("status", "approved")}
            className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${form.status === "approved" ? "border-green-500/50 bg-green-500/10 text-green-300" : "border-white/10 bg-white/3 text-white/50 hover:bg-white/5"}`}>
            Publish immediately
          </button>
          <button type="button" onClick={() => set("status", "pending")}
            className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${form.status === "pending" ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/3 text-white/50 hover:bg-white/5"}`}>
            Save as pending
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding Property…</> : "Add Property"}
      </button>
    </form>
  );
}
