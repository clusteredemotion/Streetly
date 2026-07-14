import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/push/vapid-public-key`);
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey as string;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeWebPush(token?: string | null): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) return;

  try {
    const base = import.meta.env.BASE_URL ?? "/";
    const reg = await navigator.serviceWorker.register(base + "sw.js", { scope: base });
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    await fetch(`${BASE}/api/push/web-subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch (err) {
    console.warn("[push] web subscribe failed:", err);
  }
}

async function registerNativePush(token?: string | null): Promise<void> {
  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== "granted") return;

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (fcmToken) => {
      await fetch(`${BASE}/api/push/device-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ token: fcmToken.value, platform: "android" }),
      });
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] native registration error:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[push] foreground notification:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification.data as any)?.url;
      if (url) window.location.href = url;
    });
  } catch (err) {
    console.warn("[push] native push setup failed:", err);
  }
}

export function usePushNotifications(authToken?: string | null): void {
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    if (Capacitor.isNativePlatform()) {
      registerNativePush(authToken);
    } else if ("Notification" in window) {
      if (Notification.permission === "granted") {
        subscribeWebPush(authToken);
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") subscribeWebPush(authToken);
        });
      }
    }
  }, [authToken]);
}
