import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, User, ShieldCheck, Bike, Car, Loader2,
  Eye, EyeOff, Mail, Lock, AlertCircle, Clock, ChevronDown,
  Calendar, MapPin, IdCard, FileCheck2, Upload,
} from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

function GlassInput({ value, onChange, placeholder, type = "text", required }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

function GlassSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all cursor-pointer"
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

function GlassTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all resize-none"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

function DocumentUploadField({ label, objectPath, onUploaded }: {
  label: string; objectPath: string | null; onUploaded: (path: string) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const { uploadFile, isUploading, error } = useUpload({
    onSuccess: (res) => onUploaded(res.objectPath),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    await uploadFile(file);
  };

  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <label
        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm cursor-pointer transition-all hover:bg-white/[0.08]"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: objectPath ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleChange} disabled={isUploading} />
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-[#4a9eff] animate-spin flex-shrink-0" />
        ) : objectPath ? (
          <FileCheck2 className="h-4 w-4 text-green-400 flex-shrink-0" />
        ) : (
          <Upload className="h-4 w-4 text-white/40 flex-shrink-0" />
        )}
        <span className={`truncate ${objectPath ? "text-green-300" : "text-white/50"}`}>
          {isUploading ? "Uploading…" : objectPath ? (fileName ?? "Uploaded") : `Choose file (image or PDF)`}
        </span>
      </label>
      {error && <p className="text-xs text-red-400 mt-1">{error.message}</p>}
    </div>
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

/* ── STEP 1: Account setup ── */
function AccountSetupStep({ onDone }: { onDone: (userName: string) => void }) {
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
        ? { name: name.trim(), email: email.trim().toLowerCase(), password, role: "delivery_rider" }
        : { email: email.trim().toLowerCase(), password };

      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      localStorage.setItem("streetly_token", data.token);
      localStorage.setItem("streetly_user", JSON.stringify(data.user));
      onDone(data.user.name);
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
          <Bike className="h-6 w-6 text-[#4a9eff]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {mode === "register" ? "Create Your Rider Account" : "Log In to Continue"}
        </h2>
        <p className="text-sm text-white/50">
          {mode === "register"
            ? "These credentials will be your login details for the Streetly platform."
            : "Use your existing Streetly credentials."}
        </p>
      </div>

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
    </motion.div>
  );
}

/* ── STEP 2: Rider application form ── */
interface FormState {
  fullName: string;
  phone: string;
  vehicleType: string;
  dateOfBirth: string;
  address: string;
  passportObjectPath: string | null;
  ninSlipObjectPath: string | null;
}
const DEFAULT: FormState = {
  fullName: "", phone: "", vehicleType: "motorcycle",
  dateOfBirth: "", address: "", passportObjectPath: null, ninSlipObjectPath: null,
};

function RiderApplicationForm({ userName }: { userName: string }) {
  const [form, setForm] = useState<FormState>({ ...DEFAULT, fullName: userName });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.phone.trim()) return setError("Phone number is required");
    if (!form.vehicleType) return setError("Vehicle type is required");
    if (!form.dateOfBirth) return setError("Date of birth is required");
    if (!form.address.trim()) return setError("Full address is required");
    if (!form.passportObjectPath) return setError("Please upload your passport");
    if (!form.ninSlipObjectPath) return setError("Please upload your NIN slip");

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/riders/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
        },
        body: JSON.stringify(form),
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
          Your rider application is under review. We'll notify you once an admin approves your profile.
        </p>
        <div className="mt-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300 text-left">
            Approval typically takes 24-48 hours. Once approved, you can go online and start accepting deliveries.
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
        <h2 className="text-xl font-bold text-white">Complete Your Rider Profile</h2>
        <p className="text-sm text-white/50 mt-1">Fill in your details to apply as a Streetly delivery rider.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard icon={User} title="Personal Information">
          <div className="space-y-3">
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <GlassInput value={form.fullName} onChange={set("fullName")} placeholder="Your full legal name" />
            </div>
            <div>
              <FieldLabel required>Phone Number</FieldLabel>
              <GlassInput value={form.phone} onChange={set("phone")} placeholder="080..." />
            </div>
            <div>
              <FieldLabel required>Vehicle Type</FieldLabel>
              <GlassSelect value={form.vehicleType} onChange={set("vehicleType")}>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="on_foot">On Foot</option>
              </GlassSelect>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={IdCard} title="Personal Details">
          <div className="space-y-3">
            <div>
              <FieldLabel required>Date of Birth</FieldLabel>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth")(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 transition-all [color-scheme:dark]"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>
            </div>
            <div>
              <FieldLabel required>Full Address</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
                <div className="pl-6">
                  <GlassTextarea value={form.address} onChange={set("address")} placeholder="Street, city, state" />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ShieldCheck} title="Identity Verification">
          <div className="space-y-3">
            <DocumentUploadField
              label="Upload Passport"
              objectPath={form.passportObjectPath}
              onUploaded={(path) => setForm(f => ({ ...f, passportObjectPath: path }))}
            />
            <DocumentUploadField
              label="Upload NIN Slip"
              objectPath={form.ninSlipObjectPath}
              onUploaded={(path) => setForm(f => ({ ...f, ninSlipObjectPath: path }))}
            />
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
          className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 transition-colors">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Application"}
        </button>
      </form>
    </motion.div>
  );
}

export default function RiderApplyPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(
    localStorage.getItem("streetly_token") ? 2 : 1,
  );
  const [userName, setUserName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("streetly_user") ?? "{}").name ?? ""; }
    catch { return ""; }
  });

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: "#0a1628" }}>
        <div className="max-w-lg mx-auto">
          <button onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full bg-[#4a9eff] transition-all duration-500"
                  style={{ width: step >= s ? "100%" : "0%" }} />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <AccountSetupStep key="step1" onDone={(name) => { setUserName(name); setStep(2); }} />
            ) : (
              <RiderApplicationForm key="step2" userName={userName} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
