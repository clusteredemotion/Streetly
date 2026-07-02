import { useState } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBusinesses, useListCategories, useListCities } from "@workspace/api-client-react";
import { Search, X, SlidersHorizontal, Building2, ChevronDown } from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";

export default function BusinessesPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? "");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [cityId, setCityId] = useState(params.get("cityId") ?? "");
  const [featured, setFeatured] = useState(params.get("featured") ?? "");
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const queryParams = {
    q: q || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    cityId: cityId ? Number(cityId) : undefined,
    featured: featured === "true" ? true : undefined,
    limit,
    offset,
  };

  const { data, isLoading } = useListBusinesses(queryParams);
  const { data: categories } = useListCategories();
  const { data: allCities } = useListCities();

  const countries = [...new Set((allCities ?? []).map(c => c.country).filter(Boolean))].sort();
  const states = [...new Set((allCities ?? []).filter(c => !country || c.country === country).map(c => c.state).filter(Boolean))].sort();
  const cities = (allCities ?? []).filter(c => (!country || c.country === country) && (!state || c.state === state));

  const total = data?.total ?? 0;
  const businesses = data?.businesses ?? [];
  const hasFilters = q || categoryId || country || state || cityId || featured;

  const clearFilters = () => {
    setQ(""); setCategoryId(""); setCountry(""); setState(""); setCityId(""); setFeatured(""); setOffset(0);
  };

  return (
    <Layout>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060c1e 0%, #0a1a3a 60%, #060c1e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #4a9eff, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Business Directory</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              Find Every Business,
            </h1>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6"
              style={{ background: "linear-gradient(90deg, #4a9eff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Street by Street.
            </h1>

            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search businesses, categories, streets…"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOffset(0); }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-white/35 text-sm outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
                />
              </div>

              {/* Category filter */}
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value === "all" ? "" : e.target.value); setOffset(0); }}
                  className="appearance-none pl-4 pr-9 py-3.5 rounded-xl text-sm text-white outline-none cursor-pointer md:min-w-[180px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
                >
                  <option value="all" style={{ background: "#0a1628" }}>All Categories</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id} style={{ background: "#0a1628" }}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>

              {/* Country filter */}
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value === "all" ? "" : e.target.value); setState(""); setCityId(""); setOffset(0); }}
                  className="appearance-none pl-4 pr-9 py-3.5 rounded-xl text-sm text-white outline-none cursor-pointer md:min-w-[140px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
                >
                  <option value="all" style={{ background: "#0a1628" }}>All Countries</option>
                  {countries.map(c => (
                    <option key={c} value={c} style={{ background: "#0a1628" }}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>

              {/* State filter */}
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => { setState(e.target.value === "all" ? "" : e.target.value); setCityId(""); setOffset(0); }}
                  className="appearance-none pl-4 pr-9 py-3.5 rounded-xl text-sm text-white outline-none cursor-pointer md:min-w-[140px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
                >
                  <option value="all" style={{ background: "#0a1628" }}>All States</option>
                  {states.map(s => (
                    <option key={s} value={s} style={{ background: "#0a1628" }}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>

              {/* City filter */}
              <div className="relative">
                <select
                  value={cityId}
                  onChange={(e) => { setCityId(e.target.value === "all" ? "" : e.target.value); setOffset(0); }}
                  className="appearance-none pl-4 pr-9 py-3.5 rounded-xl text-sm text-white outline-none cursor-pointer md:min-w-[140px]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}
                >
                  <option value="all" style={{ background: "#0a1628" }}>All Cities</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id} style={{ background: "#0a1628" }}>{c.name}{!state ? `, ${c.state}` : ""}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ background: "linear-gradient(180deg, #0a1a3a 0%, #060c1e 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-white/50">
              {isLoading ? "Searching…" : (
                <><span className="text-white font-semibold">{total.toLocaleString()}</span> businesses found</>
              )}
            </span>
            <AnimatePresence>
              {hasFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  {q && <Badge className="bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20 text-xs">"{q}"</Badge>}
                  {categoryId && <Badge className="bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20 text-xs">{categories?.find(c => String(c.id) === categoryId)?.name}</Badge>}
                  {country && <Badge className="bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20 text-xs">{country}</Badge>}
                  {state && <Badge className="bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20 text-xs">{state}</Badge>}
                  {cityId && <Badge className="bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/20 text-xs">{cities.find(c => String(c.id) === cityId)?.name}</Badge>}
                  {featured === "true" && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">Featured Only</Badge>}
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            {featured !== "true" && (
              <button
                onClick={() => { setFeatured("true"); setOffset(0); }}
                className="flex items-center gap-1.5 text-xs text-amber-400 border border-amber-500/20 bg-amber-500/10 rounded-full px-3 py-1.5 hover:bg-amber-500/15 transition-colors"
              >
                ⭐ Featured Only
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="min-h-screen" style={{ background: "#060c1e" }}>
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Skeleton className="h-48 w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <Skeleton className="h-3 w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
                    <Skeleton className="h-3 w-2/3" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="text-6xl mb-5 opacity-20">🏪</div>
              <h3 className="text-xl font-bold text-white mb-2">No businesses found</h3>
              <p className="text-white/40 mb-6">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-white/15 text-white hover:bg-white/10 rounded-full"
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((biz, i) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <BusinessCard business={biz} />
                  </motion.div>
                ))}
              </div>

              {total > limit && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-white/40 px-2">
                    Page <span className="text-white font-semibold">{Math.floor(offset / limit) + 1}</span> of {Math.ceil(total / limit)}
                  </span>
                  <button
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
