import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import {
  useSetRiderOnlineStatus, useUpdateRiderLocation, useAcceptDeliveryOrder, useUpdateDeliveryStatus,
} from "@workspace/api-client-react";
import {
  Bike, Power, MapPin, Package, Clock, CheckCircle, Navigation,
  Loader2, AlertCircle, User, Phone, ArrowRight, RefreshCw, TrendingUp,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface RiderProfile {
  id: number;
  userId: number;
  status: string;
  isOnline: boolean;
  fullName: string | null;
  vehicleType: string | null;
  currentLat: number | null;
  currentLon: number | null;
  totalDeliveries: number | null;
}

interface DeliveryOrder {
  id: number;
  businessId: number;
  businessName?: string | null;
  riderId: number | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string | null;
  status: string;
  pickupLat?: number | null;
  pickupLon?: number | null;
  createdAt: string;
}

function useRiderByUser() {
  return useQuery({
    queryKey: ["riders", "by-user"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/riders/by-user`, { headers: authHeader() });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load rider profile");
      return res.json() as Promise<RiderProfile>;
    },
  });
}

function useRiderOrders(riderId: number | null) {
  return useQuery({
    queryKey: ["riders", riderId, "orders"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/riders/${riderId}/orders`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json() as Promise<{ active: DeliveryOrder[]; available: DeliveryOrder[]; completedCount: number }>;
    },
    enabled: !!riderId,
    refetchInterval: 8000,
  });
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accepted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    picked_up: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    delivered: "bg-green-500/15 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg[status] ?? cfg.pending}`}>
      {status.replace("_", " ")}
    </span>
  );
}

const NEXT_STATUS: Record<string, string | null> = {
  accepted: "picked_up",
  picked_up: "delivered",
  delivered: null,
};
const NEXT_LABEL: Record<string, string> = {
  accepted: "Mark Picked Up",
  picked_up: "Mark Delivered",
};

export default function RiderDashboardPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const watchIdRef = useRef<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const { data: rider, isLoading, refetch: refetchRider } = useRiderByUser();
  const riderId = rider?.id ?? null;
  const { data: orders, refetch: refetchOrders } = useRiderOrders(riderId);

  const setOnlineStatus = useSetRiderOnlineStatus();
  const updateLocation = useUpdateRiderLocation();
  const acceptOrder = useAcceptDeliveryOrder();
  const updateStatus = useUpdateDeliveryStatus();

  const pushLocation = useCallback((lat: number, lon: number) => {
    if (!riderId) return;
    updateLocation.mutate({ riderId, data: { latitude: lat, longitude: lon } });
  }, [riderId, updateLocation]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { setLocError(null); pushLocation(pos.coords.latitude, pos.coords.longitude); },
      (err) => setLocError(err.code === 1 ? "Location permission denied." : "Could not get your location."),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, [pushLocation]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (rider?.isOnline) startWatching();
    return () => stopWatching();
  }, [rider?.isOnline, startWatching, stopWatching]);

  const handleToggleOnline = async () => {
    if (!riderId) return;
    setToggling(true);
    try {
      const goingOnline = !rider?.isOnline;
      if (goingOnline && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { pushLocation(pos.coords.latitude, pos.coords.longitude); resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 8000 },
          );
        });
      }
      await setOnlineStatus.mutateAsync({ riderId, data: { isOnline: goingOnline } });
      if (!goingOnline) stopWatching();
      refetchRider();
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (orderId: number) => {
    if (!riderId) return;
    await acceptOrder.mutateAsync({ id: orderId });
    refetchOrders();
  };

  const handleAdvance = async (order: DeliveryOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await updateStatus.mutateAsync({ id: order.id, data: { status: next as any } });
    refetchOrders();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a1628" }}>
          <Loader2 className="h-8 w-8 text-[#4a9eff] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!rider) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-16 px-4 text-center" style={{ background: "#0a1628" }}>
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <h2 className="text-lg font-bold text-white mb-2">No rider profile found</h2>
          <p className="text-white/50 text-sm mb-5">Apply as a delivery rider to access this dashboard.</p>
          <button onClick={() => setLocation("/riders/apply")}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#4a9eff] hover:bg-[#3a8ef0] text-white transition-colors">
            Apply as Rider
          </button>
        </div>
      </Layout>
    );
  }

  if (rider.status !== "approved") {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-16 px-4 text-center" style={{ background: "#0a1628" }}>
          <Clock className="h-12 w-12 mx-auto mb-4 text-amber-400/60" />
          <h2 className="text-lg font-bold text-white mb-2">Application {rider.status}</h2>
          <p className="text-white/50 text-sm">
            {rider.status === "pending"
              ? "Your rider application is still under review. Check back soon."
              : "Your rider application was not approved."}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: "#0a1628" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header / online toggle */}
          <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#4a9eff]/15 flex items-center justify-center">
                <Bike className="h-6 w-6 text-[#4a9eff]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{rider.fullName ?? "Rider"}</h1>
                <p className="text-xs text-white/40">{rider.vehicleType ?? "—"} · {rider.totalDeliveries ?? 0} completed deliveries</p>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={toggling}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 ${
                rider.isOnline ? "text-green-300" : "text-white/50"
              }`}
              style={{
                background: rider.isOnline ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                border: rider.isOnline ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {rider.isOnline ? "Online" : "Go Online"}
            </button>
          </div>

          {locError && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{locError}
            </div>
          )}

          {!rider.isOnline && (
            <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Power className="h-8 w-8 mx-auto mb-3 text-white/20" />
              <p className="text-sm text-white/40">You're offline. Go online to see nearby delivery requests.</p>
            </div>
          )}

          {rider.isOnline && (
            <>
              {/* Active deliveries */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#4a9eff]" /> My Active Deliveries
                  </h2>
                  <button onClick={() => refetchOrders()} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>
                {!orders?.active?.length ? (
                  <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-sm text-white/40">No active deliveries right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.active.map((o) => (
                      <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">{o.businessName ?? `Business #${o.businessId}`}</span>
                              <StatusPill status={o.status} />
                            </div>
                            <p className="text-xs text-white/50 flex items-center gap-1"><User className="h-3 w-3" />{o.customerName}</p>
                            <p className="text-xs text-white/50 flex items-center gap-1"><Phone className="h-3 w-3" />{o.customerPhone}</p>
                            <p className="text-xs text-white/40 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{o.deliveryAddress}</p>
                            {o.notes && <p className="text-xs text-white/30 mt-1">Note: {o.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setLocation(`/deliveries/${o.id}`)}
                            className="flex-1 h-9 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <Navigation className="h-3.5 w-3.5" /> View Route
                          </button>
                          {NEXT_STATUS[o.status] && (
                            <button
                              onClick={() => handleAdvance(o)}
                              disabled={updateStatus.isPending}
                              className="flex-1 h-9 rounded-xl text-xs font-semibold text-white bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5" /> {NEXT_LABEL[o.status]}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available deliveries */}
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-amber-400" /> Available Nearby
                </h2>
                {!orders?.available?.length ? (
                  <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-sm text-white/40">No pending delivery requests nearby.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.available.map((o) => (
                      <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4 flex items-center justify-between gap-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white">{o.businessName ?? `Business #${o.businessId}`}</span>
                          <p className="text-xs text-white/40 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{o.deliveryAddress}</p>
                        </div>
                        <button
                          onClick={() => handleAccept(o.id)}
                          disabled={acceptOrder.isPending}
                          className="px-4 h-9 rounded-xl text-xs font-semibold text-white bg-[#4a9eff] hover:bg-[#3a8ef0] disabled:opacity-60 transition-colors flex items-center gap-1.5 flex-shrink-0">
                          Accept <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
