import { useEffect, useState } from "react";
import { Country, State as CSCState } from "country-state-city";
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
} from "@workspace/api-client-react";
import { MapPin, ChevronRight, Building2, Home, Grid, List, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type ExploreBusiness = {
  id: number; slug?: string | null; name: string; categoryName?: string | null;
  streetName?: string | null; areaName?: string | null; cityName?: string | null;
  address?: string | null; phone?: string | null; rating?: number | null;
  reviewCount?: number; verified?: boolean; featured?: boolean; plan?: string;
  openingHours?: string | null; photos?: Array<{ id: number; url: string; caption?: string | null }>;
};

type ExploreProperty = {
  id: number; title: string; sizeSqft: number | null; priceAmount: number | null;
  priceType: string; areaName?: string | null; cityName?: string | null; streetName?: string | null;
  photos: Array<{ id: number; url: string }>;
};

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
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [streetId, setStreetId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"businesses" | "properties">("businesses");

  const { data: allCities } = useListCities();
  const { data: areas } = useListAreas(cityId!);
  const { data: streets } = useListStreets(areaId!);

  const [businesses, setBusinesses] = useState<ExploreBusiness[]>([]);
  const [properties, setProperties] = useState<ExploreProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const dbCountries = [...new Set((allCities ?? []).map(c => c.country).filter(Boolean))];
  const allCountryObjs = Country.getAllCountries();
  const countries = [...new Set([...allCountryObjs.map(c => c.name), ...dbCountries])].sort();

  const selectedCountryObj = allCountryObjs.find(c => c.name === country);
  const dbStatesForCountry = [...new Set((allCities ?? []).filter(c => !country || c.country === country).map(c => c.state).filter(Boolean))];
  const cscStatesForCountry = selectedCountryObj ? CSCState.getStatesOfCountry(selectedCountryObj.isoCode).map(s => s.name) : [];
  const states = [...new Set([...cscStatesForCountry, ...dbStatesForCountry])].sort();

  const cities = (allCities ?? []).filter(c => (!country || c.country === country) && (!state || c.state === state));

  const selectedCity = cities.find(c => c.id === cityId);
  const selectedArea = areas?.find(a => a.id === areaId);
  const selectedStreet = streets?.find(s => s.id === streetId);

  useEffect(() => {
    if (!country) {
      setBusinesses([]);
      setProperties([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.set("country", country);
    if (state) params.set("state", state);
    if (cityId) params.set("cityId", String(cityId));
    if (areaId) params.set("areaId", String(areaId));
    if (streetId) params.set("streetId", String(streetId));
    params.set("limit", "60");

    Promise.all([
      fetch(`${BASE}/api/businesses?${params.toString()}`).then(r => r.ok ? r.json() : { businesses: [] }),
      fetch(`${BASE}/api/properties?${params.toString()}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([bizRes, propRes]) => {
        setBusinesses(Array.isArray(bizRes?.businesses) ? bizRes.businesses : []);
        setProperties(Array.isArray(propRes) ? propRes : []);
      })
      .catch(() => {
        setBusinesses([]);
        setProperties([]);
      })
      .finally(() => setLoading(false));
  }, [country, state, cityId, areaId, streetId]);

  const hasResults = businesses.length > 0 || properties.length > 0;

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
              Discover Every Business, Worldwide
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
            <p className="text-white/40 text-xs mb-4 -mt-3">
              Pick as much or as little as you like — results update as soon as you choose a country.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">Country</label>
                <GlassSelect
                  value={country}
                  onChange={(v) => { setCountry(v); setState(""); setCityId(null); setAreaId(null); setStreetId(null); }}
                  placeholder="All Countries"
                >
                  {countries.map(c => (
                    <option key={c} value={c} style={{ background: "#0a1628" }}>{c}</option>
                  ))}
                </GlassSelect>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">State / Region</label>
                <GlassSelect
                  value={state}
                  onChange={(v) => { setState(v); setCityId(null); setAreaId(null); setStreetId(null); }}
                  disabled={!country}
                  placeholder={country ? "All states in this country" : "Select a country first"}
                >
                  {states.map(s => (
                    <option key={s} value={s} style={{ background: "#0a1628" }}>{s}</option>
                  ))}
                </GlassSelect>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">City</label>
                <GlassSelect
                  value={cityId ? String(cityId) : ""}
                  onChange={(v) => { setCityId(v ? Number(v) : null); setAreaId(null); setStreetId(null); }}
                  disabled={!country}
                  placeholder={cities.length > 0 ? "All cities in this area" : "No cities listed here yet"}
                >
                  {cities.map(city => (
                    <option key={city.id} value={String(city.id)} style={{ background: "#0a1628" }}>
                      {city.name}{!state ? `, ${city.state}` : ""}
                    </option>
                  ))}
                </GlassSelect>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium uppercase tracking-wider">Area / District</label>
                <GlassSelect
                  value={areaId ? String(areaId) : ""}
                  onChange={(v) => { setAreaId(v ? Number(v) : null); setStreetId(null); }}
                  disabled={!cityId}
                  placeholder={cityId ? "All areas in this city" : "Select a city first"}
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
                  onChange={(v) => setStreetId(v ? Number(v) : null)}
                  disabled={!areaId}
                  placeholder={areaId ? "All streets in this area" : "Select an area first"}
                >
                  {streets?.map(street => (
                    <option key={street.id} value={String(street.id)} style={{ background: "#0a1628" }}>{street.name}</option>
                  ))}
                </GlassSelect>
              </div>
            </div>

            {/* Breadcrumb */}
            {(country || state || cityId) && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-center gap-2 text-sm flex-wrap"
              >
                <MapPin className="h-3.5 w-3.5 text-[#4a9eff]" />
                {country && <span className="text-[#4a9eff] font-medium">{country}</span>}
                {state && (
                  <>
                    {country && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                    <span className="text-[#4a9eff] font-medium">{state}</span>
                  </>
                )}
                {cityId && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[#4a9eff] font-medium">{selectedCity?.name}</span>
                  </>
                )}
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

          {country && (
            <>
              {/* Tabs + View toggle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(74,158,255,0.12) 0%, rgba(74,158,255,0.04) 100%)",
                  border: "1px solid rgba(74,158,255,0.2)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  <button
                    onClick={() => setTab("businesses")}
                    className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${tab === "businesses" ? "bg-[#4a9eff] text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Businesses ({businesses.length})
                  </button>
                  <button
                    onClick={() => setTab("properties")}
                    className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${tab === "properties" ? "bg-[#4a9eff] text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    <Home className="h-3.5 w-3.5" /> Properties ({properties.length})
                  </button>
                </div>
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
              </motion.div>

              {/* Results */}
              {loading ? (
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
              ) : tab === "businesses" ? (
                businesses.length > 0 ? (
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
                    <h3 className="text-lg font-semibold text-white mb-2">No businesses found here yet</h3>
                    <p className="text-white/40 text-sm mb-6">Be the first agent to register businesses in this location!</p>
                    <Button
                      onClick={() => window.location.href = "/agents/apply"}
                      className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white rounded-full px-6"
                    >
                      Become an Agent
                    </Button>
                  </motion.div>
                )
              ) : (
                properties.length > 0 ? (
                  <AnimatePresence>
                    <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                      {properties.map((prop, i) => (
                        <motion.div
                          key={prop.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <div className="rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/20 h-full flex flex-col">
                            <div className="h-44 bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {prop.photos?.[0] ? (
                                <img src={prop.photos[0].url} alt={prop.title} className="w-full h-full object-cover" />
                              ) : (
                                <Home className="h-8 w-8 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <Badge className="w-fit mb-2 bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20">{prop.priceType}</Badge>
                              <h3 className="font-bold text-foreground truncate">{prop.title}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {[prop.streetName, prop.areaName, prop.cityName].filter(Boolean).join(", ")}
                              </p>
                              <div className="flex items-center justify-between text-sm mt-auto pt-3">
                                <span className="text-muted-foreground">{prop.sizeSqft ? `${prop.sizeSqft.toLocaleString()} sqft` : "—"}</span>
                                <span className="font-bold text-foreground">
                                  {prop.priceAmount ? `₦${prop.priceAmount.toLocaleString()}` : "Price on request"}
                                </span>
                              </div>
                            </div>
                          </div>
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
                    <Home className="h-12 w-12 mx-auto mb-4 text-white/10" />
                    <h3 className="text-lg font-semibold text-white mb-2">No vacant properties found here yet</h3>
                    <p className="text-white/40 text-sm mb-6">Check back soon, or list a vacant property yourself.</p>
                    <Button
                      onClick={() => window.location.href = "/properties/submit"}
                      className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white rounded-full px-6"
                    >
                      Submit a Property
                    </Button>
                  </motion.div>
                )
              )}
            </>
          )}

          {/* Initial State */}
          {!country && (
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
                Select a country to see every business and property listed there. Narrow it down further by state, city, area, or street whenever you like.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
