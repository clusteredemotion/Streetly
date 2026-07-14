import { Capacitor } from "@capacitor/core";

export type GeoResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: "denied" | "unavailable" | "timeout" };

/**
 * Cross-platform getCurrentPosition.
 * - On Capacitor native (Android APK) → uses @capacitor/geolocation with
 *   explicit permission request so the OS prompt appears.
 * - On the web browser → falls back to navigator.geolocation.
 */
export async function getCurrentPosition(): Promise<GeoResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");

      const perm = await Geolocation.requestPermissions();
      if (
        perm.location !== "granted" &&
        perm.coarseLocation !== "granted"
      ) {
        return { ok: false, reason: "denied" };
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        ok: true,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("denied")) return { ok: false, reason: "denied" };
      if (msg.toLowerCase().includes("timeout")) return { ok: false, reason: "timeout" };
      return { ok: false, reason: "unavailable" };
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, reason: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED)
          resolve({ ok: false, reason: "denied" });
        else if (err.code === err.TIMEOUT)
          resolve({ ok: false, reason: "timeout" });
        else resolve({ ok: false, reason: "unavailable" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function geoErrorMessage(reason: "denied" | "unavailable" | "timeout"): string {
  if (reason === "denied")
    return "Location permission denied. Please enable it in your device settings.";
  if (reason === "timeout")
    return "Location timed out. Please try again.";
  return "Could not get your location. Please try again.";
}
