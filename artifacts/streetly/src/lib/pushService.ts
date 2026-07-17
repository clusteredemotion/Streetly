import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/push/vapid-public-key`);
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey as string;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(b64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer as ArrayBuffer;
}

/** Subscribe current browser to Web Push (VAPID). No-op if already subscribed. */
export async function subscribeWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) return;
  try {
    const base = import.meta.env.BASE_URL ?? "/";
    const reg = await navigator.serviceWorker.register(base + "sw.js", { scope: base });
    await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));
    await fetch(`${BASE}/api/push/web-subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch (err) {
    console.warn("[push] web subscribe failed:", err);
  }
}

/** Register this Android device for FCM push. No-op on web. */
export async function registerFcmDevice(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // IMPORTANT: Add ALL listeners BEFORE calling register().
    // Capacitor fires the `registration` event synchronously on some Android
    // versions — if the listener isn't attached first the token is lost and
    // push notifications never reach this device.
    PushNotifications.addListener("registration", async (token) => {
      await fetch(`${BASE}/api/push/device-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.value, platform: "android" }),
      }).catch(() => {});
    });
    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] FCM registration error:", err);
    });
    PushNotifications.addListener("pushNotificationReceived", (n) => {
      console.log("[push] foreground:", n);
    });
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification.data as Record<string, unknown>)?.url as string | undefined;
      if (url) window.location.href = url;
    });

    // Register AFTER all listeners are in place
    await PushNotifications.register();
  } catch (err) {
    console.warn("[push] FCM device register failed:", err);
  }
}
