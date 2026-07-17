import { useState, useEffect, useCallback } from "react";
import { apiGetNotifLogs, apiRegisterDeviceToken, clearToken, type NotifLog } from "../lib/api";

interface Props {
  onLogout: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  "New User": "#22c55e",
  "New Business": "#3b82f6",
  "New Rider": "#f59e0b",
  "New Property": "#8b5cf6",
  "New Message": "#ec4899",
  "Withdrawal": "#f97316",
  "KYC": "#06b6d4",
};

function dotColor(title: string): string {
  for (const [key, color] of Object.entries(EVENT_COLORS)) {
    if (title.includes(key)) return color;
  }
  return "#94a3b8";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HomePage({ onLogout }: Props) {
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiGetNotifLogs();
      setLogs(data);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    registerPush();
  }, []);

  async function registerPush() {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return;
      await PushNotifications.register();

      PushNotifications.addListener("registration", async (token) => {
        await apiRegisterDeviceToken(token.value, "android").catch(() => {});
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.warn("[FCM] registration error:", err.error);
      });

      PushNotifications.addListener("pushNotificationReceived", (_notif) => {
        fetchLogs();
      });
    } catch {
      // not in a Capacitor context (web preview)
    }
  }

  function handleLogout() {
    clearToken();
    onLogout();
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0f1e]">
      <header className="flex items-center justify-between px-5 pt-safe-top pt-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Streetly Admin</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Activity Feed</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="text-slate-300 text-sm font-medium">Recent Alerts</h2>
        <button
          onClick={fetchLogs}
          className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 spin-slow" />
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm">No alerts yet</p>
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors animate-fade-in"
          >
            <span
              className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: dotColor(log.title) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-snug truncate">{log.title}</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug line-clamp-2">{log.body}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-slate-600 text-[10px]">{timeAgo(log.sentAt)}</span>
                {log.fcmSent > 0 && (
                  <span className="text-blue-500/60 text-[10px]">📱 {log.fcmSent} device{log.fcmSent !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
