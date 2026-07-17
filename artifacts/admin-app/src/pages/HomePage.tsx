import { useEffect, useState } from "react";
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
    // Not in Capacitor context — no-op in web preview
  }
}

export default function HomePage({ onLogout: _onLogout }: Props) {
  const [loaded, setLoaded] = useState(false);
  const token = getToken() ?? "";

  // Token is passed in the URL hash so AdminPage.tsx can pick it up,
  // save to localStorage, and clear the hash — all within the iframe.
  const adminUrl = `https://mystreetly.app/admin#streetly_token=${encodeURIComponent(token)}`;

  useEffect(() => {
    registerPush();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0f1e", display: "flex", flexDirection: "column" }}>
      {/* Loading overlay — hides until the iframe has painted */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#0a0f1e", gap: "16px",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(59,130,246,0.35)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 36, height: 36, color: "white" }}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "3px solid rgba(59,130,246,0.2)",
            borderTopColor: "#60a5fa",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Loading admin dashboard…</p>
        </div>
      )}

      {/* Full-screen iframe — stays inside the Capacitor WebView (no system browser) */}
      <iframe
        src={adminUrl}
        onLoad={() => setLoaded(true)}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
        allow="camera; microphone; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
