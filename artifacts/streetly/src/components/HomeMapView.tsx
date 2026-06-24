import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, MapPin, Navigation, Layers, X, Star, ShieldCheck,
  ArrowRight, Mic, ChevronDown, Zap, Clock
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Business {
  id: number; name: string;
  latitude?: number | null; longitude?: number | null;
  categoryName?: string | null; rating?: number | null;
  reviewCount?: number; verified?: boolean; featured?: boolean;
  streetName?: string | null; areaName?: string | null; cityName?: string | null;
  phone?: string | null; openingHours?: string | null;
  photos?: Array<{ url: string }>;
}

function useMapBusinesses() {
  return useQuery({
    queryKey: ["businesses", "map-all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/businesses?limit=200`);
      const data = await res.json();
      return (data.businesses ?? data) as Business[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drinks": "#ef4444",
  "Retail & Shopping": "#f59e0b",
  "Health & Wellness": "#22c55e",
  "Automotive": "#3b82f6",
  "Education": "#8b5cf6",
  "Financial Services": "#0ea5e9",
  "Technology": "#6366f1",
  "Beauty & Personal Care": "#ec4899",
  "Professional Services": "#64748b",
  "Hospitality": "#f97316",
  "Entertainment": "#a855f7",
  "Real Estate": "#14b8a6",
};
const DEFAULT_COLOR = "#0547B6";

const TILE_STYLES: Record<string, { url: string; label: string; emoji: string }> = {
  explore: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Explore",
    emoji: "🗺",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    label: "Light",
    emoji: "☀️",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    label: "Dark",
    emoji: "🌙",
  },
};

const FILTER_PILLS = [
  { label: "All", value: "" },
  { label: "🍽 Food", value: "Food & Drinks" },
  { label: "💊 Pharmacy", value: "Health & Wellness" },
  { label: "🏨 Hotels", value: "Hospitality" },
  { label: "🛍 Shopping", value: "Retail & Shopping" },
  { label: "🏦 Banks", value: "Financial Services" },
  { label: "💻 Tech", value: "Technology" },
  { label: "✨ Beauty", value: "Beauty & Personal Care" },
  { label: "🚗 Auto", value: "Automotive" },
];

function makeMarkerHtml(color: string, size = 36, featured = false) {
  return `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      ${featured ? `<div style="position:absolute;inset:-4px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);opacity:0.4;animation:location-pulse-ring 2s ease-out infinite;"></div>` : ""}
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:50% 50% 50% 4px;
        transform:rotate(-45deg);
        border:${featured ? "3px" : "2.5px"} solid white;
        box-shadow:0 4px 16px ${color}66;
        transition:transform 0.15s ease;
      "></div>
    </div>
  `;
}

export function HomeMapView() {
  const [, navigate] = useLocation();
  const { data: businesses = [] } = useMapBusinesses();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Array<{ marker: any; biz: Business }>>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tileStyle, setTileStyle] = useState("explore");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selected, setSelected] = useState<Business | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Filter markers based on search + category
  useEffect(() => {
    markersRef.current.forEach(({ marker, biz }) => {
      const matchesSearch = !search || biz.name.toLowerCase().includes(search.toLowerCase())
        || (biz.categoryName ?? "").toLowerCase().includes(search.toLowerCase())
        || (biz.streetName ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = !category || biz.categoryName === category;
      const visible = matchesSearch && matchesCat;
      if (visible) {
        marker.setOpacity(1);
        marker.getElement()?.style && (marker.getElement().style.transform =
          marker.getElement().style.transform.replace(" scale(0)", ""));
      } else {
        marker.setOpacity(0);
      }
    });
    // Update suggestions
    if (search.length > 0) {
      setSuggestions(
        businesses.filter(b =>
          b.latitude && b.longitude && (
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            (b.categoryName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (b.streetName ?? "").toLowerCase().includes(search.toLowerCase())
          )
        ).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  }, [search, category, businesses]);

  // Switch tile layer style
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_STYLES[tileStyle].url);
  }, [tileStyle]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: any;
    let L: any;

    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [6.5244, 3.3792], // Lagos default
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;
      (mapRef.current as any)._L = L;
      setMapReady(true);

      tileLayerRef.current = L.tileLayer(TILE_STYLES[tileStyle].url, {
        subdomains: "abcd",
        maxZoom: 20,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      map.on("click", () => {
        setSelected(null);
        setShowStylePicker(false);
      });
    };

    init();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];
    };
  }, []);

  // Add business markers when businesses load (and map is ready)
  useEffect(() => {
    const map = mapRef.current;
    const L = map?._L;
    if (!map || !L || !businesses.length || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(({ marker }) => map.removeLayer(marker));
    markersRef.current = [];

    const mappable = businesses.filter(b => b.latitude && b.longitude);
    if (!mappable.length) return;

    mappable.forEach((biz) => {
      const color = CATEGORY_COLORS[biz.categoryName ?? ""] ?? DEFAULT_COLOR;
      const icon = L.divIcon({
        className: "",
        html: makeMarkerHtml(color, biz.featured ? 40 : 32, !!biz.featured),
        iconSize: [biz.featured ? 40 : 32, biz.featured ? 40 : 32],
        iconAnchor: [biz.featured ? 20 : 16, biz.featured ? 40 : 32],
        popupAnchor: [0, -(biz.featured ? 44 : 36)],
      });

      const marker = L.marker([biz.latitude, biz.longitude], { icon }).addTo(map);
      marker.on("click", (e: any) => {
        e.originalEvent?.stopPropagation();
        setSelected(biz);
        map.panTo([biz.latitude!, biz.longitude!], { animate: true, duration: 0.5 });
      });

      markersRef.current.push({ marker, biz });
    });

    // Fit map to show all markers
    const bounds = L.latLngBounds(mappable.map(b => [b.latitude!, b.longitude!]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false });
  }, [businesses, mapReady]);

  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    const L = map?._L;
    if (!map || !L) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 15, { duration: 1.5 });
        const html = `
          <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(5,71,182,0.25);animation:location-pulse-ring 1.8s ease-out infinite;"></div>
            <div class="user-location-dot" style="width:14px;height:14px;background:#0547B6;border:2.5px solid white;border-radius:50%;position:relative;z-index:2;box-shadow:0 2px 8px rgba(5,71,182,0.5);"></div>
          </div>`;
        const icon = L.divIcon({ className: "", html, iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker([latitude, longitude], { icon, zIndexOffset: 1000 }).addTo(map)
          .bindPopup("📍 You are here").openPopup();
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSuggestionClick = (biz: Business) => {
    if (!biz.latitude || !biz.longitude) return;
    mapRef.current?.flyTo([biz.latitude, biz.longitude], 17, { duration: 1 });
    setSelected(biz);
    setSearch(biz.name);
    setSuggestions([]);
    setSearchFocused(false);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "100dvh" }}>
      {/* Map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Floating Search + Filter */}
      <div className="absolute top-20 left-0 right-0 z-[1000] flex flex-col items-center px-3 sm:px-6 gap-2">

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-2xl relative"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
            }}>
            <Search className="h-5 w-5 text-primary flex-shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search businesses, streets, areas, services..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
            />
            {search && (
              <button onClick={() => { setSearch(""); setSuggestions([]); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={handleLocateMe}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              >
                <Navigation className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {searchFocused && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {suggestions.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => handleSuggestionClick(biz)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${CATEGORY_COLORS[biz.categoryName ?? ""] ?? DEFAULT_COLOR}20` }}>
                      <MapPin className="h-4 w-4" style={{ color: CATEGORY_COLORS[biz.categoryName ?? ""] ?? DEFAULT_COLOR }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{biz.name}</p>
                      <p className="text-xs text-gray-500 truncate">{[biz.streetName, biz.areaName, biz.cityName].filter(Boolean).join(", ")}</p>
                    </div>
                    {biz.verified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex gap-2 overflow-x-auto pb-1 w-full max-w-2xl hide-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setCategory(category === pill.value ? "" : pill.value)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95"
              style={
                (pill.value === "" && category === "") || category === pill.value
                  ? {
                    background: "rgba(5,71,182,0.9)",
                    backdropFilter: "blur(12px)",
                    color: "white",
                    border: "1px solid rgba(5,71,182,0.3)",
                    boxShadow: "0 4px 12px rgba(5,71,182,0.3)",
                  }
                  : {
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(12px)",
                    color: "#374151",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }
              }
            >
              {pill.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Map Style Switcher */}
      <div className="absolute bottom-24 right-4 z-[1000]">
        <AnimatePresence>
          {showStylePicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex flex-col gap-1.5 mb-2 p-2 rounded-2xl shadow-2xl"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)" }}
            >
              {Object.entries(TILE_STYLES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setTileStyle(key); setShowStylePicker(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-gray-100"
                  style={{ color: tileStyle === key ? "#0547B6" : "#374151", fontWeight: tileStyle === key ? 700 : 500 }}
                >
                  <span>{val.emoji}</span>
                  {val.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={(e) => { e.stopPropagation(); setShowStylePicker(!showStylePicker); }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)" }}
        >
          <Layers className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Stats chip */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 left-4 z-[1000] hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-800">
            {businesses.filter(b => b.latitude && b.longitude).length} businesses on map
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          Live
        </div>
      </motion.div>

      {/* Scroll down hint */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
      >
        <span className="text-xs font-medium tracking-wide uppercase">Discover more</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.button>

      {/* Business Bottom Sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) setSelected(null); }}
            className="absolute bottom-0 left-0 right-0 z-[2000] rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)", maxHeight: "65vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-6 overflow-y-auto">
              <div className="flex items-start gap-3 mb-4">
                {/* Photo thumbnail */}
                {selected.photos?.[0] && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                    <img src={selected.photos[0].url} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{selected.name}</h3>
                    {selected.verified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                  </div>
                  {selected.categoryName && (
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5"
                      style={{ background: `${CATEGORY_COLORS[selected.categoryName] ?? DEFAULT_COLOR}18`, color: CATEGORY_COLORS[selected.categoryName] ?? DEFAULT_COLOR }}>
                      {selected.categoryName}
                    </span>
                  )}
                  {selected.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-800">{selected.rating}</span>
                      <span className="text-xs text-gray-500">({selected.reviewCount ?? 0} reviews)</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{[selected.streetName, selected.areaName, selected.cityName].filter(Boolean).join(", ")}</span>
              </div>
              {selected.openingHours && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  {selected.openingHours}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/businesses/${selected.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#0547B6,#2563eb)", boxShadow: "0 4px 16px rgba(5,71,182,0.35)" }}
                >
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
                {selected.latitude && selected.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-primary border border-primary/20 bg-primary/5"
                  >
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
