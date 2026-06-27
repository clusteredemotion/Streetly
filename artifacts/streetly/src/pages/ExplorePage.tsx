import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCard } from "@/components/business/BusinessCard";
import {
  useListCities,
  useListAreas,
  useListStreets,
  useGetStreetBusinesses,
} from "@workspace/api-client-react";
import { MapPin, ChevronRight, Building2, Grid, List, ChevronDown } from "lucide-react";

function GlassSelect({
  value, onChange, disabled, placeholder, children,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
  placeholder: string; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none pl-4 pr-9 py-3 rounded-xl text-sm outline-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        <option value="" style={{ background: "#0a1628" }}>{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
    </div>
  );
}

export default function ExplorePage() {
  const [cityId, setCityId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [streetId, setStreetId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: cities } = useListCities();
  const { data: areas } = useListAreas(cityId!, { query: { enabled: !!cityId } });
  const { data: streets } = useListStreets(areaId!, { query: { enabled: !!areaId } });
  const { data: businesses, isLoading: bizLoading } = useGetStreetBusinesses(streetId!, { query: { enabled: !!streetId } });

  const selectedCity = cities?.find(c => c.id === cityId);
  const selectedArea = areas?.find(a => a.id === areaId);
  const selectedStreet = streets?.find(s => s.id === streetId);

  return (
    <Layout>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1a3a 60%, #060c1e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-[0.1]"
            style={{ background: "radial-gradient(circle, #4a9eff, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)", filter: "blur(50px)" }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Street Explorer</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              Navigate Nigeria's Business Landscape
            </h1>
            <p className="text-white/50 text-lg">One street at a time.</p>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="min-h-screen" style={{ background: "#060c1e" }}>
        <div className="container mx-auto px-4 py-8">

          {/* Location Cascade */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
          >
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-[#4a9eff]" />
              </div>
              Select a Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">City</label>
                <GlassSelect
                  value={cityId ? String(cityId) : ""}
                  onChange={(v) => { setCityId(Number(v)); setAreaId(null); setStreetId(null); }}
                  placeholder="Select a city…"
                >
                  {cities?.map(city => (
                    <option key={city.id} value={String(city.id)} style={{ background: "#0a1628" }}>
                      {city.name}, {city.state}
                    </option>
                  ))}
                </GlassSelect>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">Area / District</label>
                <GlassSelect
                  value={areaId ? String(areaId) : ""}
                  onChange={(v) => { setAreaId(Number(v)); setStreetId(null); }}
                  disabled={!cityId}
                  placeholder={cityId ? "Select an area…" : "Select a city first"}
                >
                  {areas?.map(area => (
                    <option key={area.id} value={String(area.id)} style={{ background: "#0a1628" }}>{area.name}</option>
                  ))}
                </GlassSelect>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">Street</label>
                <GlassSelect
                  value={streetId ? String(streetId) : ""}
                  onChange={(v) => setStreetId(Number(v))}
                  disabled={!areaId}
                  placeholder={areaId ? "Select a street…" : "Select an area first"}
                >
                  {streets?.map(street => (
                    <option key={street.id} value={String(street.id)} style={{ background: "#0a1628" }}>{street.name}</option>
                  ))}
                </GlassSelect>
              </div>
            </div>

            {/* Breadcrumb */}
            {cityId && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center gap-2 text-sm"
              >
                <MapPin className="h-3.5 w-3.5 text-[#4a9eff]" />
                <span className="text-[#4a9eff] font-medium">{selectedCity?.name}</span>
                {areaId && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[#4a9eff] font-medium">{selectedArea?.name}</span>
                  </>
                )}
                {streetId && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-white font-semibold">{selectedStreet?.name}</span>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Street Banner */}
          <AnimatePresence>
            {streetId && selectedStreet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(74,158,255,0.12) 0%, rgba(74,158,255,0.04) 100%)",
                  border: "1px solid rgba(74,158,255,0.2)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-[#4a9eff]" />
                    <h2 className="font-bold text-xl text-white">{selectedStreet.name}</h2>
                  </div>
                  <p className="text-white/50 text-sm">
                    {selectedArea?.name} · {selectedCity?.name} · {selectedCity?.state}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="gap-1.5 px-3 py-1.5 bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20">
                    <Building2 className="h-3.5 w-3.5" />
                    {businesses?.length ?? 0} businesses
                  </Badge>
                  <div className="flex rounded-xl overflow-hidden border border-white/10">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-2.5 transition-colors ${view === "grid" ? "bg-[#4a9eff] text-white" : "text-white/40 hover:text-white/70"}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-2.5 transition-colors ${view === "list" ? "bg-[#4a9eff] text-white" : "text-white/40 hover:text-white/70"}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {streetId && (
            bizLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Skeleton className="h-48 w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <Skeleton className="h-3 w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses && businesses.length > 0 ? (
              <AnimatePresence>
                <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                  {businesses.map((biz, i) => (
                    <motion.div
                      key={biz.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <BusinessCard business={biz} />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Building2 className="h-12 w-12 mx-auto mb-4 text-white/10" />
                <h3 className="text-lg font-semibold text-white mb-2">No businesses on this street yet</h3>
                <p className="text-white/40 text-sm mb-6">Be the first agent to register businesses here!</p>
                <Button
                  onClick={() => window.location.href = "/agents/apply"}
                  className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white rounded-full px-6"
                >
                  Become an Agent
                </Button>
              </motion.div>
            )
          )}

          {/* Initial State */}
          {!cityId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.15)" }}>
                <MapPin className="h-10 w-10 text-[#4a9eff]/50" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Start Exploring</h2>
              <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
                Select a city, then an area, then a street to discover all the businesses in that location.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
