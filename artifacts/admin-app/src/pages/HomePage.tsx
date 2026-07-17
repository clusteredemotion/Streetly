import { useEffect } from "react";
import { getToken, apiRegisterDeviceToken } from "../lib/api";

interface Props {
  onLogout: () => void;
}

async function registerPush() {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.register();
    PushNotifications.addListener("registration", async (t) => {
      await apiRegisterDeviceToken(t.value, "android").catch(() => {});
    });
    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[FCM] registration error:", err.error);
    });
  } catch {
    // Not running in a Capacitor context — no-op
  }
}

export default function HomePage({ onLogout: _onLogout }: Props) {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Register for push notifications before navigating away
    registerPush();

    // Navigate the entire Capacitor WebView to the full web admin dashboard.
    // The token is injected via URL hash — AdminPage.tsx reads it on mount,
    // saves it to localStorage, and removes the hash so it doesn't repeat.
    const dest = `https://mystreetly.app/admin#streetly_token=${encodeURIComponent(token)}`;
    window.location.replace(dest);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#0a0f1e] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50 mb-2">
        <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>
      <div className="w-7 h-7 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 animate-spin" />
      <p className="text-slate-400 text-sm">Opening admin dashboard…</p>
    </div>
  );
}
