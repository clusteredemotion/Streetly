import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, ArrowRight, X } from "lucide-react";
import { subscribeWebPush, registerFcmDevice } from "@/lib/pushService";

const STORAGE_KEY = "streetly_perms_v1";

const GREEN  = "#16a34a";
const YELLOW = "#facc15";
const BLUE   = "#4a9eff";

export function PermissionsGate() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 3400);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const requestLocation = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Geolocation.requestPermissions();
      } else if ("geolocation" in navigator) {
        await new Promise<void>((res) =>
          navigator.geolocation.getCurrentPosition(() => res(), () => res(), { timeout: 8000 })
        );
      }
    } catch {
      /* permission denied is fine — just continue */
    }
  };

  const requestNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await PushNotifications.requestPermissions();
        if (status.receive === "granted") await registerFcmDevice();
      } else if ("Notification" in window) {
        const p = await Notification.requestPermission();
        if (p === "granted") await subscribeWebPush();
      }
    } catch {
      /* permission denied is fine — just continue */
    }
  };

  const handleAllow = async () => {
    setBusy(true);
    await requestLocation();
    await requestNotifications();
    setBusy(false);
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(6,12,30,0.88)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.34,1.56,0.64,1] }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#0d1a2e", border: "1px solid rgba(74,158,255,0.15)" }}
          >
            {/* top accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${GREEN}, ${BLUE}, ${YELLOW})` }} />

            {/* skip button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 pt-5">
              {/* heading */}
              <div className="flex items-center gap-2 mb-1">
                <svg width="22" height="28" viewBox="0 0 200 250">
                  <path
                    d="M100,12 C144,12 178,46 178,88 C178,124 148,152 118,178 C110,185 104,196 100,210 C96,196 90,185 82,178 C52,152 22,124 22,88 C22,46 56,12 100,12 Z"
                    fill="none" stroke={GREEN} strokeWidth="14" strokeLinejoin="round"
                  />
                </svg>
                <span className="text-white font-bold text-lg tracking-tight">Streetly</span>
              </div>
              <p className="text-white/40 text-xs mb-5 pl-7">needs a couple of permissions to work best for you</p>

              {/* permission items */}
              <div className="space-y-3 mb-6">
                <PermItem
                  icon={<MapPin className="h-5 w-5" style={{ color: BLUE }} />}
                  title="Location"
                  desc="Show businesses near you and enable live navigation"
                  color={BLUE}
                />
                <PermItem
                  icon={<Bell className="h-5 w-5" style={{ color: YELLOW }} />}
                  title="Notifications"
                  desc="Get alerts for new listings, deals, and updates"
                  color={YELLOW}
                />
              </div>

              {/* CTA */}
              <button
                onClick={handleAllow}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`, color: "white" }}
              >
                {busy ? (
                  <span className="animate-pulse">Requesting permissions…</span>
                ) : (
                  <>Allow permissions <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <button
                onClick={dismiss}
                className="w-full mt-2 py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PermItem({
  icon, title, desc, color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: `${color}10`, border: `1px solid ${color}22` }}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-white text-sm font-semibold">{title}</p>
        <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
