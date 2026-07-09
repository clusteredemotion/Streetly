import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mail, Lock, Server, FileText, Save, Eye, EyeOff,
  CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type Tab = "account" | "smtp" | "templates";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Admin Account", icon: <Lock className="h-3.5 w-3.5" /> },
  { id: "smtp", label: "SMTP / Mail Credentials", icon: <Server className="h-3.5 w-3.5" /> },
  { id: "templates", label: "Mail Templates", icon: <FileText className="h-3.5 w-3.5" /> },
];

const TEMPLATE_EVENTS = [
  { key: "welcome", label: "Welcome / Registration", desc: "Sent when a new user registers." },
  { key: "agent_approved", label: "Agent Application Approved", desc: "Sent when an agent application is approved." },
  { key: "agent_rejected", label: "Agent Application Rejected", desc: "Sent when an agent application is rejected." },
  { key: "biz_approved", label: "Business Listing Approved", desc: "Sent when a business listing goes live." },
  { key: "biz_rejected", label: "Business Listing Rejected", desc: "Sent when a business listing is rejected." },
  { key: "password_reset", label: "Password Reset", desc: "Sent when a user requests a password reset." },
  { key: "claim_approved", label: "Ownership Claim Approved", desc: "Sent when a business ownership claim is approved." },
  { key: "commission_approved", label: "Commission Payout Approved", desc: "Sent when a commission withdrawal is approved." },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/60">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative">
      <input
        type={isPassword && !show ? "password" : "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          caretColor: "#4a9eff",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function SaveBar({ saving, saved, error, onSave }: {
  saving: boolean; saved: boolean; error: string; onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <Button
        onClick={onSave}
        disabled={saving}
        className="rounded-xl px-5 text-sm font-semibold gap-1.5"
        style={{ background: "linear-gradient(135deg,#1a56db 0%,#4a9eff 100%)", color: "#fff" }}
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {saving ? "Saving…" : "Save Changes"}
      </Button>
      <AnimatePresence>
        {saved && !saving && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
          </motion.span>
        )}
        {error && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminEmailSettings() {
  const [tab, setTab] = useState<Tab>("account");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirm, setAccountConfirm] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState("");

  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [smtpError, setSmtpError] = useState("");
  const [smtp, setSmtp] = useState({
    smtp_host: "", smtp_port: "587", smtp_user: "", smtp_password: "",
    smtp_from_name: "", smtp_from_email: "", smtp_encryption: "tls",
  });

  const [tplSaving, setTplSaving] = useState<string | null>(null);
  const [tplSaved, setTplSaved] = useState<string | null>(null);
  const [openTpl, setOpenTpl] = useState<string | null>("welcome");
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string }>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch(`${BASE}/api/admin/settings`, { headers: authHeader() });
      if (!res.ok) return;
      const data: Record<string, string> = await res.json();
      setSettings(data);
      setAccountEmail(data.admin_login_email ?? "");
      setSmtp({
        smtp_host: data.smtp_host ?? "",
        smtp_port: data.smtp_port ?? "587",
        smtp_user: data.smtp_user ?? "",
        smtp_password: data.smtp_password ?? "",
        smtp_from_name: data.smtp_from_name ?? "",
        smtp_from_email: data.smtp_from_email ?? "",
        smtp_encryption: data.smtp_encryption ?? "tls",
      });
      const tpls: Record<string, { subject: string; body: string }> = {};
      for (const { key } of TEMPLATE_EVENTS) {
        tpls[key] = {
          subject: data[`tpl_${key}_subject`] ?? "",
          body: data[`tpl_${key}_body`] ?? "",
        };
      }
      setTemplates(tpls);
      setLoading(false);
    })();
  }, []);

  const saveAccount = async () => {
    setAccountError("");
    if (accountPassword && accountPassword !== accountConfirm) {
      setAccountError("Passwords do not match."); return;
    }
    if (!accountEmail.trim()) { setAccountError("Email cannot be empty."); return; }
    setAccountSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/settings/admin-credentials`, {
        method: "PUT", headers: authHeader(),
        body: JSON.stringify({ email: accountEmail, ...(accountPassword ? { password: accountPassword } : {}) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setAccountSaved(true); setAccountPassword(""); setAccountConfirm("");
      setTimeout(() => setAccountSaved(false), 3000);
    } catch (e: any) { setAccountError(e.message); }
    finally { setAccountSaving(false); }
  };

  const saveSmtp = async () => {
    setSmtpSaving(true); setSmtpError("");
    try {
      const res = await fetch(`${BASE}/api/admin/settings`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify(smtp),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSmtpSaved(true); setTimeout(() => setSmtpSaved(false), 3000);
    } catch { setSmtpError("Failed to save. Try again."); }
    finally { setSmtpSaving(false); }
  };

  const saveTemplate = async (key: string) => {
    setTplSaving(key);
    try {
      await fetch(`${BASE}/api/admin/settings`, {
        method: "PUT", headers: authHeader(),
        body: JSON.stringify({
          [`tpl_${key}_subject`]: templates[key]?.subject ?? "",
          [`tpl_${key}_body`]: templates[key]?.body ?? "",
        }),
      });
      setTplSaved(key); setTimeout(() => setTplSaved(null), 3000);
    } catch {}
    finally { setTplSaving(null); }
  };

  const setTpl = (key: string, field: "subject" | "body", value: string) => {
    setTemplates(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#4a9eff]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Email &amp; Account Settings</h2>
        <p className="text-sm text-white/40">Configure admin login credentials, outgoing mail, and email templates.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all"
            style={{
              background: tab === t.id ? "rgba(74,158,255,0.15)" : "transparent",
              color: tab === t.id ? "#4a9eff" : "rgba(255,255,255,0.35)",
              border: tab === t.id ? "1px solid rgba(74,158,255,0.25)" : "1px solid transparent",
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── ACCOUNT TAB ── */}
        {tab === "account" && (
          <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-[#4a9eff]" />
              <span className="text-sm font-semibold text-white">Admin Login Credentials</span>
            </div>

            <Field label="Admin Login Email" hint="This is the email used to sign into the admin portal.">
              <Input value={accountEmail} onChange={setAccountEmail} placeholder="admin@mystreetly.app" />
            </Field>

            <Field label="New Password" hint="Leave blank to keep the current password.">
              <Input value={accountPassword} onChange={setAccountPassword} type="password" placeholder="Enter new password" />
            </Field>

            <Field label="Confirm New Password">
              <Input value={accountConfirm} onChange={setAccountConfirm} type="password" placeholder="Repeat new password" />
            </Field>

            <SaveBar saving={accountSaving} saved={accountSaved} error={accountError} onSave={saveAccount} />
          </motion.div>
        )}

        {/* ── SMTP TAB ── */}
        {tab === "smtp" && (
          <motion.div key="smtp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-[#4a9eff]" />
              <span className="text-sm font-semibold text-white">Outgoing Mail (SMTP)</span>
            </div>
            <p className="text-xs text-white/30 -mt-3">These credentials are used to send all automated emails from Streetly.</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="From Name" hint="Displayed as the sender name in emails.">
                  <Input value={smtp.smtp_from_name} onChange={v => setSmtp(s => ({ ...s, smtp_from_name: v }))} placeholder="Streetly" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="From Email Address">
                  <Input value={smtp.smtp_from_email} onChange={v => setSmtp(s => ({ ...s, smtp_from_email: v }))} placeholder="noreply@mystreetly.app" />
                </Field>
              </div>
              <Field label="SMTP Host">
                <Input value={smtp.smtp_host} onChange={v => setSmtp(s => ({ ...s, smtp_host: v }))} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="SMTP Port">
                <Input value={smtp.smtp_port} onChange={v => setSmtp(s => ({ ...s, smtp_port: v }))} placeholder="587" />
              </Field>
              <Field label="SMTP Username">
                <Input value={smtp.smtp_user} onChange={v => setSmtp(s => ({ ...s, smtp_user: v }))} placeholder="your@email.com" />
              </Field>
              <Field label="SMTP Password">
                <Input value={smtp.smtp_password} onChange={v => setSmtp(s => ({ ...s, smtp_password: v }))} type="password" placeholder="••••••••" />
              </Field>
              <Field label="Encryption">
                <select
                  value={smtp.smtp_encryption}
                  onChange={e => setSmtp(s => ({ ...s, smtp_encryption: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="tls">TLS (STARTTLS)</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </Field>
            </div>

            <SaveBar saving={smtpSaving} saved={smtpSaved} error={smtpError} onSave={saveSmtp} />
          </motion.div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {tab === "templates" && (
          <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-[#4a9eff]" />
              <span className="text-sm font-semibold text-white">Email Templates</span>
              <span className="ml-auto text-[11px] text-white/25 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Use {"{{name}}"}, {"{{businessName}}"} etc. as placeholders
              </span>
            </div>

            {TEMPLATE_EVENTS.map(({ key, label, desc }) => {
              const isOpen = openTpl === key;
              const tpl = templates[key] ?? { subject: "", body: "" };
              return (
                <div key={key} className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <button
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setOpenTpl(isOpen ? null : key)}
                  >
                    <Mail className="h-4 w-4 text-[#4a9eff] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{desc}</p>
                    </div>
                    {tplSaved === key && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 flex flex-col gap-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                          <div className="pt-4">
                            <Field label="Subject Line">
                              <Input value={tpl.subject} onChange={v => setTpl(key, "subject", v)} placeholder="Email subject…" />
                            </Field>
                          </div>
                          <Field label="Email Body">
                            <textarea
                              value={tpl.body}
                              onChange={e => setTpl(key, "body", e.target.value)}
                              rows={8}
                              placeholder="Email body text…"
                              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-y leading-relaxed font-mono"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                caretColor: "#4a9eff",
                                minHeight: "160px",
                              }}
                              onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
                              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                          </Field>
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => saveTemplate(key)}
                              disabled={tplSaving === key}
                              size="sm"
                              className="rounded-xl px-4 text-xs font-semibold gap-1.5"
                              style={{ background: "linear-gradient(135deg,#1a56db 0%,#4a9eff 100%)", color: "#fff" }}
                            >
                              {tplSaving === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              {tplSaving === key ? "Saving…" : "Save Template"}
                            </Button>
                            {tplSaved === key && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Saved
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
