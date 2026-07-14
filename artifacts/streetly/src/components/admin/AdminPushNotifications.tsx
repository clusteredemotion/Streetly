import { useState } from "react";
import { Bell, Send, History, Users, Globe, Smartphone, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("streetly_token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
}

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "role:visitor", label: "Visitors / Customers" },
  { value: "role:business_owner", label: "Business Owners" },
  { value: "role:field_agent", label: "Field Agents" },
  { value: "role:delivery_rider", label: "Delivery Riders" },
  { value: "role:moderator", label: "Moderators" },
  { value: "role:regional_manager", label: "Regional Managers" },
];

function StatCard({ label, value, icon, sub }: { label: string; value: number; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-medium">{icon}{label}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

interface PushStats {
  webSubscribers: number;
  fcmDevices: number;
  fcmConfigured: boolean;
  vapidConfigured: boolean;
}

interface PushLog {
  id: number;
  title: string;
  body: string;
  audience: string;
  webSent: number;
  fcmSent: number;
  sentAt: string;
}

export default function AdminPushNotifications() {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    targetUrl: "",
    audience: "all",
  });
  const [result, setResult] = useState<{ ok: boolean; webSent?: number; fcmSent?: number; error?: string } | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<PushStats>({
    queryKey: ["push-stats"],
    queryFn: async () => {
      const r = await adminFetch("/api/push/admin/stats");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<PushLog[]>({
    queryKey: ["push-logs"],
    queryFn: async () => {
      const r = await adminFetch("/api/push/admin/logs");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const r = await adminFetch("/api/push/admin/send", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          imageUrl: form.imageUrl || undefined,
          targetUrl: form.targetUrl || undefined,
          audience: form.audience,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Send failed");
      return data as { ok: boolean; webSent: number; fcmSent: number };
    },
    onSuccess: (data) => {
      setResult({ ok: true, webSent: data.webSent, fcmSent: data.fcmSent });
      setForm((f) => ({ ...f, title: "", body: "", imageUrl: "", targetUrl: "" }));
      qc.invalidateQueries({ queryKey: ["push-logs"] });
      qc.invalidateQueries({ queryKey: ["push-stats"] });
    },
    onError: (err: Error) => {
      setResult({ ok: false, error: err.message });
    },
  });

  const ready = stats?.vapidConfigured;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-0.5">Push Notifications</h2>
        <p className="text-sm text-white/40">Send announcements to web browsers and Android devices.</p>
      </div>

      {/* Status cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Web subscribers" value={stats.webSubscribers} icon={<Globe className="h-3.5 w-3.5" />} sub="Browser push" />
          <StatCard label="Android devices" value={stats.fcmDevices} icon={<Smartphone className="h-3.5 w-3.5" />} sub="Native FCM" />
          <div className="rounded-2xl px-5 py-4 col-span-2 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                {stats.vapidConfigured
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                <span className="text-xs text-white/60">Web push (VAPID) {stats.vapidConfigured ? "active" : "— keys not set"}</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.fcmConfigured
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                <span className="text-xs text-white/60">Android FCM {stats.fcmConfigured ? "active" : "— Firebase not connected yet"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup warning */}
      {!ready && !statsLoading && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Setup required</p>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Add <code className="bg-black/30 px-1 py-0.5 rounded font-mono">VAPID_PUBLIC_KEY</code> and{" "}
              <code className="bg-black/30 px-1 py-0.5 rounded font-mono">VAPID_PRIVATE_KEY</code> in the Replit Secrets panel to enable web push.
              Add <code className="bg-black/30 px-1 py-0.5 rounded font-mono">FIREBASE_SERVICE_ACCOUNT</code> (JSON) to also enable Android push.
            </p>
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#4a9eff]" />
          <span className="text-sm font-semibold text-white">Compose notification</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. New feature available!"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={{ background: "#0f1a2e" }}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5 font-medium">Message body *</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write the notification message here…"
            rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Image URL <span className="text-white/30">(optional)</span></label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium">Click URL <span className="text-white/30">(optional)</span></label>
            <input
              value={form.targetUrl}
              onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        {/* Live preview */}
        {(form.title || form.body) && (
          <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,158,255,0.15)" }}>
              <Bell className="h-4 w-4 text-[#4a9eff]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{form.title || "Title"}</p>
              <p className="text-xs text-white/50 line-clamp-2">{form.body || "Message"}</p>
            </div>
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                alt=""
              />
            )}
          </div>
        )}

        {result && (
          <div
            className={`rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${result.ok ? "text-emerald-300" : "text-red-300"}`}
            style={{
              background: result.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${result.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            {result.ok ? (
              <><CheckCircle2 className="h-4 w-4 flex-shrink-0" />Sent — {result.webSent} web, {result.fcmSent} Android devices reached</>
            ) : (
              <><AlertCircle className="h-4 w-4 flex-shrink-0" />{result.error}</>
            )}
          </div>
        )}

        <button
          onClick={() => { setResult(null); sendMutation.mutate(); }}
          disabled={!form.title || !form.body || sendMutation.isPending || !ready}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ background: "linear-gradient(135deg, #4a9eff, #3a7ef0)" }}
        >
          {sendMutation.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
            : <><Send className="h-4 w-4" />Send notification</>}
        </button>
      </div>

      {/* History */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white">Sent notifications</span>
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: ["push-logs"] })} className="text-white/30 hover:text-white/60 transition-colors p-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        ) : !logs?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/30">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No notifications sent yet</p>
          </div>
        ) : (
          <div>
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{log.title}</p>
                  <p className="text-xs text-white/40 truncate">{log.body}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[11px] text-white/30 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {log.audience === "all" ? "Everyone" : log.audience.replace("role:", "")}
                    </span>
                    <span className="text-[11px] text-white/30 flex items-center gap-1">
                      <Globe className="h-3 w-3" />{log.webSent} web
                    </span>
                    <span className="text-[11px] text-white/30 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />{log.fcmSent} Android
                    </span>
                  </div>
                </div>
                <time className="text-[11px] text-white/25 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {new Date(log.sentAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
