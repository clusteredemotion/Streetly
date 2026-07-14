import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { subscribeWebPush, registerFcmDevice } from "@/lib/pushService";

/**
 * Silently subscribes this device/browser to push if permission is ALREADY granted.
 * The actual permission request is handled by PermissionsGate on first open.
 * Safe to call multiple times — only runs once per session.
 */
export function usePushNotifications(): void {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (Capacitor.isNativePlatform()) {
      /* On Android, register only if permission was already granted in a prior session */
      import("@capacitor/push-notifications").then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then(({ receive }) => {
          if (receive === "granted") registerFcmDevice();
        }).catch(() => {});
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      subscribeWebPush();
    }
  }, []);
}
