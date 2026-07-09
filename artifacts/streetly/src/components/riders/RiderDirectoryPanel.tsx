import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Phone, MessageCircle, Bike, Car, Footprints, Truck,
  MapPin, ChevronRight, Calendar, Package, ArrowLeft,
} from "lucide-react";
import { useGetAvailableRidersDirectory, getGetAvailableRidersDirectoryQueryKey } from "@workspace/api-client-react";
import type { RiderDirectoryEntry } from "@workspace/api-client-react";

function vehicleIcon(vehicleType?: string | null) {
  switch (vehicleType) {
    case "bicycle": return Bike;
    case "car": return Car;
    case "on_foot": return Footprints;
    case "motorcycle": return Bike;
    default: return Truck;
  }
}

function vehicleLabel(vehicleType?: string | null) {
  switch (vehicleType) {
    case "bicycle": return "Bicycle";
    case "car": return "Car";
    case "on_foot": return "On Foot";
    case "motorcycle": return "Motorcycle";
    default: return "Delivery Rider";
  }
}

function formatDistance(distanceKm?: number | null) {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

function formatJoinDate(createdAt: string) {
  try {
    return new Date(createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

interface RiderDirectoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function RiderDirectoryPanel({ open, onClose }: RiderDirectoryPanelProps) {
  const [profileRider, setProfileRider] = useState<RiderDirectoryEntry | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!open || coords || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, [open, coords]);

  useEffect(() => {
    if (!open) setProfileRider(null);
  }, [open]);

  const _riderParams = coords ? { lat: coords.lat, lon: coords.lon } : undefined;
  const { data: riders, isLoading } = useGetAvailableRidersDirectory(
    _riderParams,
    { query: { queryKey: getGetAvailableRidersDirectoryQueryKey(_riderParams), enabled: open } },
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] rounded-2xl flex flex-col overflow-hidden"
            style={{ background: "#0e1c33", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {profileRider ? (
              <RiderProfileView rider={profileRider} onBack={() => setProfileRider(null)} onClose={onClose} />
            ) : (
              <>
                <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center">
                      <Bike className="h-4.5 w-4.5 text-[#4a9eff]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">Available Riders</h3>
                      <p className="text-xs text-white/40">
                        {isLoading ? "Loading…" : `${riders?.length ?? 0} online right now`}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors" aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="overflow-y-auto px-5 pb-5 flex-1 space-y-2.5">
                  {isLoading && (
                    <div className="py-10 text-center text-sm text-white/40">Finding available riders…</div>
                  )}

                  {!isLoading && (riders?.length ?? 0) === 0 && (
                    <div className="py-10 text-center">
                      <Bike className="h-8 w-8 text-white/20 mx-auto mb-2" />
                      <p className="text-sm text-white/50">No riders are online right now.</p>
                      <p className="text-xs text-white/30 mt-1">Check back again shortly.</p>
                    </div>
                  )}

                  {riders?.map((rider) => {
                    const Icon = vehicleIcon(rider.vehicleType);
                    const distance = formatDistance(rider.distanceKm);
                    return (
                      <div
                        key={rider.id}
                        className="rounded-2xl p-3.5 flex items-center gap-3"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div className="w-11 h-11 rounded-2xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-[#4a9eff]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white truncate">{rider.fullName ?? "Rider"}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" title="Online" />
                          </div>
                          <p className="text-xs text-white/40 truncate">
                            {vehicleLabel(rider.vehicleType)}
                            {distance ? ` · ${distance}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {rider.phone && (
                            <>
                              <a
                                href={`tel:${rider.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                title="Call rider"
                                className="w-8 h-8 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 flex items-center justify-center transition-colors"
                              >
                                <Phone className="h-3.5 w-3.5 text-blue-400" />
                              </a>
                              <a
                                href={`https://wa.me/${rider.phone.replace(/\D/g, "")}`}
                                target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="WhatsApp rider"
                                className="w-8 h-8 rounded-xl bg-green-500/15 hover:bg-green-500/25 flex items-center justify-center transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-green-400" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => setProfileRider(rider)}
                            title="View profile"
                            className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
                          >
                            <ChevronRight className="h-4 w-4 text-white/60" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RiderProfileView({ rider, onBack, onClose }: { rider: RiderDirectoryEntry; onBack: () => void; onClose: () => void }) {
  const Icon = vehicleIcon(rider.vehicleType);
  const distance = formatDistance(rider.distanceKm);
  const joined = formatJoinDate(rider.createdAt);

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-5 pb-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-[#4a9eff]/15 flex items-center justify-center mb-3">
            <Icon className="h-9 w-9 text-[#4a9eff]" />
          </div>
          <h3 className="text-lg font-bold text-white">{rider.fullName ?? "Rider"}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs font-medium text-green-400">Online now</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8">
            <div className="w-9 h-9 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-[#4a9eff]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Vehicle</div>
              <div className="text-sm font-semibold text-white truncate">{vehicleLabel(rider.vehicleType)}</div>
            </div>
          </div>

          {distance && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Distance</div>
                <div className="text-sm font-semibold text-white truncate">{distance}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Deliveries Completed</div>
              <div className="text-sm font-semibold text-white truncate">{rider.totalDeliveries}</div>
            </div>
          </div>

          {joined && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-white/60" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Rider Since</div>
                <div className="text-sm font-semibold text-white truncate">{joined}</div>
              </div>
            </div>
          )}

          {rider.phone && (
            <div className="flex gap-2.5 pt-1.5">
              <a
                href={`tel:${rider.phone}`}
                className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 transition-colors"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              <a
                href={`https://wa.me/${rider.phone.replace(/\D/g, "")}`}
                target="_blank" rel="noreferrer"
                className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-500/15 hover:bg-green-500/25 text-green-300 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
