import { useParams, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Package, User, Phone, MapPin, Bike, Clock,
  CheckCircle, Loader2, AlertCircle, Truck,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface DeliveryOrder {
  id: number;
  businessId: number;
  business?: {
    id: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
  } | null;
  riderId: number | null;
  rider?: {
    id: number;
    fullName: string;
    phone: string;
    vehicleType: string;
    currentLatitude: number | null;
    currentLongitude: number | null;
    lastLocationAt: string | null;
  } | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

function useDelivery(id: number, trackingToken: string | null) {
  return useQuery({
    queryKey: ["deliveries", id, trackingToken],
    queryFn: async () => {
      const qs = trackingToken ? `?token=${encodeURIComponent(trackingToken)}` : "";
      const res = await fetch(`${BASE}/api/deliveries/${id}${qs}`, { headers: authHeader() });
      if (!res.ok) throw new Error("Delivery not found");
      return res.json() as Promise<DeliveryOrder>;
    },
    refetchInterval: 5000,
  });
}

const STEPS = [
  { key: "requested", label: "Requested", icon: Package },
  { key: "accepted", label: "Rider Assigned", icon: Bike },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

function TrackingMap({ pickup, rider }: {
  pickup: { lat: number; lon: number } | null;
  rider: { lat: number; lon: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);

  useEffect(() => {
    let L: any;
    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current || mapRef.current) return;

      const center = rider ?? pickup ?? { lat: 6.5244, lon: 3.3792 };
      const map = L.map(containerRef.current, { center: [center.lat, center.lon], zoom: 14, zoomControl: true });
      mapRef.current = map;
      (mapRef.current as any)._lRef = L;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap © CARTO', subdomains: "abcd", maxZoom: 20,
      }).addTo(map);
    };
    init();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = (mapRef.current as any)?._lRef;
    if (!map || !L) return;

    if (pickup) {
      const icon = L.divIcon({
        className: "", iconSize: [32, 32], iconAnchor: [16, 32],
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#0547B6,#2563eb);border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(5,71,182,0.4);"></div>`,
      });
      if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lon]);
      else pickupMarkerRef.current = L.marker([pickup.lat, pickup.lon], { icon }).addTo(map).bindPopup("Pickup location");
    }

    if (rider) {
      const html = `<div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:26px;height:26px;border-radius:50%;background:rgba(34,197,94,0.25);animation:location-pulse-ring 1.8s ease-out infinite;"></div>
        <div style="width:15px;height:15px;background:#22c55e;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(34,197,94,0.5);position:relative;z-index:2;"></div>
      </div>`;
      const icon = L.divIcon({ className: "", html, iconSize: [26, 26], iconAnchor: [13, 13] });
      if (riderMarkerRef.current) riderMarkerRef.current.setLatLng([rider.lat, rider.lon]);
      else riderMarkerRef.current = L.marker([rider.lat, rider.lon], { icon, zIndexOffset: 1000 }).addTo(map).bindPopup("Rider");
    }

    if (pickup && rider) {
      map.fitBounds(L.latLngBounds([[pickup.lat, pickup.lon], [rider.lat, rider.lon]]), { padding: [60, 60] });
    } else if (rider) {
      map.setView([rider.lat, rider.lon], 15);
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lon], 15);
    }
  }, [pickup?.lat, pickup?.lon, rider?.lat, rider?.lon]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function DeliveryTrackingPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);
  const trackingToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("token")
    : null;
  const { data: order, isLoading, error } = useDelivery(id, trackingToken);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a1628" }}>
          <Loader2 className="h-8 w-8 text-[#4a9eff] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-16 px-4 text-center" style={{ background: "#0a1628" }}>
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <h2 className="text-lg font-bold text-white mb-2">Delivery not found</h2>
          <button onClick={() => setLocation("/")} className="text-sm text-[#4a9eff] hover:underline">Back to home</button>
        </div>
      </Layout>
    );
  }

  const pickup = order.business?.latitude != null && order.business?.longitude != null
    ? { lat: order.business.latitude, lon: order.business.longitude }
    : null;
  const rider = order.rider?.currentLatitude != null && order.rider?.currentLongitude != null
    ? { lat: order.rider.currentLatitude, lon: order.rider.currentLongitude }
    : null;
  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: "#0a1628" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <button onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-bold text-white">Delivery #{order.id}</h1>
              <span className="text-xs text-white/40">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-white/50">{order.business?.name ?? `Business #${order.businessId}`}</p>
          </div>

          {isCancelled ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> This delivery was cancelled.
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i <= currentStepIdx;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {i > 0 && (
                        <div className="absolute top-4 right-1/2 w-full h-0.5 -z-10"
                          style={{ background: i <= currentStepIdx ? "#4a9eff" : "rgba(255,255,255,0.1)" }} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                        done ? "bg-[#4a9eff]" : "bg-white/10"
                      }`}>
                        <Icon className={`h-4 w-4 ${done ? "text-white" : "text-white/30"}`} />
                      </div>
                      <span className={`text-[10px] text-center ${done ? "text-white/80" : "text-white/30"}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live map */}
          <div className="rounded-2xl overflow-hidden" style={{ height: 320, border: "1px solid rgba(255,255,255,0.08)" }}>
            {pickup || rider ? (
              <TrackingMap pickup={pickup} rider={rider} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                Waiting for location data…
              </div>
            )}
          </div>
          {order.riderId && !rider && order.status !== "delivered" && (
            <p className="text-xs text-white/30 -mt-3">Rider assigned — waiting for live location update.</p>
          )}

          {/* Order details */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold text-white mb-1">Order Details</h3>
            <div className="flex items-center gap-2 text-sm text-white/70"><User className="h-4 w-4 text-white/30" />{order.customerName}</div>
            <div className="flex items-center gap-2 text-sm text-white/70"><Phone className="h-4 w-4 text-white/30" />{order.customerPhone}</div>
            <div className="flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4 text-white/30" />{order.deliveryAddress}</div>
            {order.notes && <div className="flex items-center gap-2 text-sm text-white/50"><Package className="h-4 w-4 text-white/30" />{order.notes}</div>}
            {order.rider?.fullName && (
              <div className="pt-2 mt-2 border-t border-white/8 flex items-center gap-2 text-sm text-white/70">
                <Bike className="h-4 w-4 text-[#4a9eff]" /> Rider: {order.rider.fullName}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
