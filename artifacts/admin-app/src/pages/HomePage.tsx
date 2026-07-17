import { useEffect, useRef, useState } from "react";
import { getToken, apiRegisterDeviceToken } from "../lib/api";

interface Props {
  onLogout: () => void;
}

// Map FCM notification data.type → admin section name
function sectionForNotif(data: Record<string, string>): string {
  const t = (data?.type ?? "").toLowerCase();
  if (t.includes("business")) return "businesses";
  if (t.includes("rider")) return "pending-riders";
  if (t.includes("message") || t.includes("chat")) return "chat";
  if (t.includes("user")) return "all-users";
  if (t.includes("kyc")) return "kyc";
  if (t.includes("withdrawal") || t.includes("commission")) return "commissions";
  if (t.includes("claim")) return "claims";
  return "analytics";
}

export default function HomePage({ onLogout: _onLogout }: Props) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const token = getToken() ?? "";

  const adminUrl = `https://mystreetly.app/admin#streetly_token=${encodeURIComponent(token)}`;

  useEffect(() => {
    async function registerPush() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // ── Add ALL listeners BEFORE calling register() ──────────────────
        // Capacitor fires the `registration` event synchronously on some
        // Android versions — if the listener isn't attached first the FCM
        // token is never sent to the server and no notifications arrive.

        PushNotifications.addListener("registration", async (t) => {
          // Link this device's FCM token to the admin user in the DB
          await apiRegisterDeviceToken(t.value, "android").catch((err) => {
            console.warn("[FCM] device-token registration failed:", err);
          });
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.warn("[FCM] registration error:", err.error);
        });

        PushNotifications.addListener("pushNotificationReceived", (_notif) => {
          // Notification arrived while app is foregrounded — nothing to do;
          // the web admin iframe updates itself via its own polling.
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          // User tapped a notification — tell the iframe to navigate to
          // the relevant admin section via postMessage.
          const section = sectionForNotif(action.notification.data ?? {});
          iframeRef.current?.contentWindow?.postMessage(
            { type: "STREETLY_ADMIN_NAVIGATE", section },
            "https://mystreetly.app"
          );
        });

        // ── Now request permissions and register ──────────────────────────
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;
        await PushNotifications.register();

      } catch {
        // Not running inside Capacitor — no-op for web preview
      }
    }

    registerPush();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0f1e", display: "flex", flexDirection: "column" }}>
      {/* Loading overlay — hidden once the iframe fires onLoad */}
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

      {/* Full-screen iframe — stays inside the Capacitor WebView.
          Android WebView never routes iframe src loads to the system browser. */}
      <iframe
        ref={iframeRef}
        src={adminUrl}
        onLoad={() => setLoaded(true)}
        style={{ flex: 1, width: "100%", border: "none", display: "block" }}
        allow="camera; microphone; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
