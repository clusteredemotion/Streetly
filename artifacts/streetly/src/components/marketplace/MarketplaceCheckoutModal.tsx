import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bike, Loader2, AlertCircle, CheckCircle, ShoppingCart } from "lucide-react";
import { useGetAvailableRiders, useCreateMarketplaceOrder } from "@workspace/api-client-react";
import { useCart } from "./CartContext";
import { formatCurrency } from "@/lib/utils";

interface MarketplaceCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  businessId: number;
  businessName: string;
  businessLat: number | null;
  businessLon: number | null;
}

export default function MarketplaceCheckoutModal({
  open, onClose, businessId, businessName, businessLat, businessLon,
}: MarketplaceCheckoutModalProps) {
  const [, setLocation] = useLocation();
  const { lines, subtotal, clear } = useCart(businessId);
  const { data: riders, isLoading: ridersLoading } = useGetAvailableRiders(businessId, { query: { enabled: open } });
  const createOrder = useCreateMarketplaceOrder();

  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedRider = riders?.find((r) => r.id === selectedRiderId) ?? null;
  const deliveryFee = selectedRider?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedRiderId) {
      setError("Please select a rider to deliver your order");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setError("Name, phone, and delivery address are required");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        businessId,
        data: {
          items: lines.map((l) => ({ itemId: l.item.id, quantity: l.quantity })),
          riderId: selectedRiderId,
          customerName,
          customerPhone,
          deliveryAddress,
          notes: notes || undefined,
        },
      });
      clear();
      onClose();
      const trackingToken = (order as { trackingToken?: string }).trackingToken;
      setLocation(trackingToken ? `/deliveries/${order.id}?token=${encodeURIComponent(trackingToken)}` : `/deliveries/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#0e1c33", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-[#4a9eff]" />
                </div>
                <h3 className="text-base font-bold text-white">Checkout — {businessName}</h3>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Cart summary */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {lines.map((l) => (
                  <div key={l.item.id} className="flex items-center justify-between text-xs text-white/70">
                    <span>{l.quantity}× {l.item.name}</span>
                    <span>{formatCurrency(l.item.price * l.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Rider selection */}
              <div>
                <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Choose a Rider</label>
                {ridersLoading ? (
                  <div className="text-xs text-white/40 py-3 text-center">Loading available riders...</div>
                ) : !riders || riders.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-amber-300"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> No riders online nearby right now. Please try again shortly.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {riders.map((rider) => (
                      <button
                        key={rider.id}
                        type="button"
                        onClick={() => setSelectedRiderId(rider.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          selectedRiderId === rider.id
                            ? "bg-[#4a9eff]/20 border border-[#4a9eff]/50"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm text-white">
                          <Bike className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                          {rider.fullName ?? `Rider #${rider.id}`}
                          <span className="text-xs text-white/40">· {rider.vehicleType ?? "bike"} · {rider.distanceKm.toFixed(1)}km</span>
                        </span>
                        <span className="text-xs font-semibold text-[#4a9eff] flex-shrink-0">{formatCurrency(rider.deliveryFee)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                  <label className="block text-xs font-medium text-[#a8c0e8] mb-1.5">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                    placeholder="Any special instructions" />
                </div>

                {/* Totals */}
                <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Item subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Rider fee</span><span>{selectedRider ? formatCurrency(deliveryFee) : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
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
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
                    : <><CheckCircle className="h-4 w-4" /> Place Order · {formatCurrency(total)}</>}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
