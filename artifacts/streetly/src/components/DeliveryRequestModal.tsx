import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Loader2, AlertCircle, CheckCircle, Bike } from "lucide-react";
import { useCreateDeliveryOrder } from "@workspace/api-client-react";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

interface NearbyRider {
  id: number;
  fullName: string | null;
  vehicleType: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  distanceKm: number;
}

function useNearbyRiders(lat: number | null, lon: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["riders", "nearby", lat, lon],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/riders/nearby?lat=${lat}&lon=${lon}&radiusKm=15`);
      if (!res.ok) return [] as NearbyRider[];
      return res.json() as Promise<NearbyRider[]>;
    },
    enabled: enabled && lat != null && lon != null,
    refetchInterval: 8000,
  });
}

function NearbyRidersMap({ lat, lon, riders }: { lat: number; lon: number; riders: NearbyRider[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { center: [lat, lon], zoom: 13, zoomControl: false, attributionControl: false });
      mapRef.current = map;
      (mapRef.current as any)._lRef = L;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20,
      }).addTo(map);
      const bizIcon = L.divIcon({
        className: "", iconSize: [26, 26], iconAnchor: [13, 26],
        html: `<div style="width:26px;height:26px;background:linear-gradient(135deg,#0547B6,#2563eb);border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 3px 10px rgba(5,71,182,0.4);"></div>`,
      });
      L.marker([lat, lon], { icon: bizIcon }).addTo(map);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [lat, lon]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (mapRef.current as any)?._lRef;
    if (!map || !L) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    riders.forEach((r) => {
      if (r.currentLatitude == null || r.currentLongitude == null) return;
      const html = `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
        <div style="width:13px;height:13px;background:#22c55e;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(34,197,94,0.5);"></div>
      </div>`;
      const icon = L.divIcon({ className: "", html, iconSize: [20, 20], iconAnchor: [10, 10] });
      const marker = L.marker([r.currentLatitude, r.currentLongitude], { icon }).addTo(map);
      markersRef.current.push(marker);
    });
  }, [riders]);

  return <div ref={containerRef} className="w-full h-full" />;
}

interface DeliveryRequestModalProps {
  open: boolean;
  onClose: () => void;
  businessId: number;
  businessName: string;
  businessLat?: number | null;
  businessLon?: number | null;
}

export function DeliveryRequestModal({ open, onClose, businessId, businessName, businessLat = null, businessLon = null }: DeliveryRequestModalProps) {
  const [, setLocation] = useLocation();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCreateDeliveryOrder();
  const { data: nearbyRiders } = useNearbyRiders(businessLat, businessLon, open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setError("Name, phone, and delivery address are required");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        businessId,
        data: { customerName, customerPhone, deliveryAddress, notes: notes || undefined },
      });
      onClose();
      const trackingToken = (order as { trackingToken?: string }).trackingToken;
      setLocation(trackingToken ? `/deliveries/${order.id}?token=${encodeURIComponent(trackingToken)}` : `/deliveries/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit delivery request");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "#0e1c33", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-[#4a9eff]" />
                </div>
                <h3 className="text-base font-bold text-white">Request Delivery</h3>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-white/40 mb-3">
              Have your order picked up from <span className="text-white/70 font-medium">{businessName}</span> and delivered to you.
            </p>

            {businessLat != null && businessLon != null && (
              <div className="mb-4">
                <div className="rounded-xl overflow-hidden" style={{ height: 140, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <NearbyRidersMap lat={businessLat} lon={businessLon} riders={nearbyRiders ?? []} />
                </div>
                <p className="text-[11px] text-white/40 mt-1.5 flex items-center gap-1.5">
                  <Bike className="h-3 w-3 text-green-400 flex-shrink-0" />
                  {nearbyRiders?.length
                    ? `${nearbyRiders.length} rider${nearbyRiders.length === 1 ? "" : "s"} online nearby`
                    : "No riders currently online nearby — your order will still be queued"}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Your Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Phone Number</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="080..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Delivery Address</label>
                <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="Street, area, city" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Order Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  placeholder="What are you ordering?" />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-300"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" disabled={createOrder.isPending}
                className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white disabled:opacity-60 transition-colors">
                {createOrder.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Requesting…</>
                  : <><CheckCircle className="h-4 w-4" /> Request Delivery</>}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
