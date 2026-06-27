import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, MapPin, Navigation, Layers, X, Star, ShieldCheck,
  ArrowRight, Mic, ChevronDown, Zap, Clock, Radio, ChevronRight,
  MapPinOff, Activity, RotateCcw, RotateCw, Compass,
} from "lucide-react";
import { NIGERIA_STATES } from "@/data/nigeria-locations";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Business {
  id: number; name: string;
  latitude?: number | null; longitude?: number | null;
  categoryName?: string | null; rating?: number | null;
  reviewCount?: number; verified?: boolean; featured?: boolean;
  streetName?: string | null; areaName?: string | null; cityName?: string | null;
  phone?: string | null; openingHours?: string | null;
  photos?: Array<{ url: string; id?: number }>;
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
const DEFAULT_COLOR = "#2563eb";

const TILE_STYLES: Record<string, { url: string; label: string; emoji: string; attribution: string }> = {
  explore: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Explore", emoji: "🗺", attribution: "© OpenStreetMap © CARTO",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    label: "Light", emoji: "☀️", attribution: "© OpenStreetMap © CARTO",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    label: "Dark", emoji: "🌙", attribution: "© OpenStreetMap © CARTO",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Satellite", emoji: "🛰", attribution: "© Esri, Maxar, Earthstar Geographics",
  },
};

/* Street-label overlay used in satellite mode */
const SATELLITE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

const FILTER_PILLS = [
  { label: "All", value: "" },
  { label: "🍽 Food", value: "Food & Drinks" },
  { label: "💊 Health", value: "Health & Wellness" },
  { label: "🏨 Hotels", value: "Hospitality" },
  { label: "🛍 Shopping", value: "Retail & Shopping" },
  { label: "🏦 Banks", value: "Financial Services" },
  { label: "💻 Tech", value: "Technology" },
  { label: "✨ Beauty", value: "Beauty & Personal Care" },
  { label: "🚗 Auto", value: "Automotive" },
  { label: "📚 Edu", value: "Education" },
];

const LIVE_ACTIVITY = [
  "Mama Nkechi Kitchen just opened",
  "New review on The Lekki Grill",
  "3 users viewing Victoria Island",
  "Glamour Studio — high traffic now",
  "TechVault verified today",
  "Sunrise Pharmacy — 5 check-ins",
];

function makeMarkerHtml(color: string, size = 34, featured = false, name = "") {
  const ringSize = size + 12;
  const label = name
    ? `<div class="biz-name-label" style="
        position:absolute;top:-22px;left:50%;transform:translateX(-50%);
        background:rgba(6,12,30,0.88);color:white;
        font-size:10px;font-weight:600;
        white-space:nowrap;padding:2px 7px;border-radius:20px;
        border:1px solid rgba(255,255,255,0.15);
        backdrop-filter:blur(8px);
        pointer-events:none;opacity:0;transition:opacity 0.2s;
      ">${name}</div>`
    : "";
  return `
    <div style="position:relative;width:${ringSize}px;height:${ringSize}px;display:flex;align-items:center;justify-content:center;">
      ${label}
      <div class="marker-ring" style="position:absolute;width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;background:${color};opacity:0.35;"></div>
      ${featured ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(circle,${color}55,transparent);animation:location-pulse-ring 2s ease-out infinite;"></div>` : ""}
      <div class="marker-blink" style="
        position:relative;z-index:2;
        width:${size}px;height:${size}px;
        background:linear-gradient(135deg,${color},${color}cc);
        border-radius:50% 50% 50% 4px;
        transform:rotate(-45deg);
        border:${featured ? "3px" : "2.5px"} solid rgba(255,255,255,0.9);
        box-shadow:0 4px 20px ${color}88,0 0 0 1px ${color}33;
      "></div>
    </div>
  `;
}

export function HomeMapView() {
  const [, navigate] = useLocation();
  const { data: businesses = [] } = useMapBusinesses();

  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const markersRef = useRef<Array<{ marker: any; biz: Business }>>([]);
  const userMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const activityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotationRef = useRef(0);                     // always-fresh rotation for touch handler
  const touchStartRef = useRef<{ angle: number; baseRotation: number } | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tileStyle, setTileStyle] = useState("explore");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selected, setSelected] = useState<Business | null>(null);
  const [locating, setLocating] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickerState, setPickerState] = useState("");
  const [pickerCity, setPickerCity] = useState("");
  const [rotationDeg, setRotationDeg] = useState(0);

  const selectedState = NIGERIA_STATES.find(s => s.name === pickerState);
  const selectedCityData = selectedState?.cities.find(c => c.name === pickerCity);

  /* ── Live activity ticker ── */
  useEffect(() => {
    activityTimerRef.current = setInterval(() => {
      setActivityIndex(i => (i + 1) % LIVE_ACTIVITY.length);
    }, 3500);
    return () => { if (activityTimerRef.current) clearInterval(activityTimerRef.current); };
  }, []);

  /* ── Keep rotationRef in sync (avoids stale closures in touch handler) ── */
  useEffect(() => { rotationRef.current = rotationDeg; }, [rotationDeg]);

  /**
   * Counter-rotate every marker's visible icon so it stays upright while the
   * map container is rotated.  We target el.firstElementChild (our icon div)
   * so we never disturb Leaflet's own translate3d() positioning on el itself.
   */
  const counterRotateAll = useCallback((deg: number) => {
    // Business markers
    markersRef.current.forEach(({ marker }) => {
      const el = marker.getElement?.() as HTMLElement | undefined;
      const icon = el?.firstElementChild as HTMLElement | undefined;
      if (icon) icon.style.transform = `rotate(${-deg}deg)`;
    });
    // User location marker
    const userEl = userMarkerRef.current?.getElement?.() as HTMLElement | undefined;
    const userIcon = userEl?.firstElementChild as HTMLElement | undefined;
    if (userIcon) userIcon.style.transform = `rotate(${-deg}deg)`;
  }, []);

  /**
   * Compute the minimum CSS scale factor needed so the rotated map container
   * fully covers the viewport with NO edge gaps, for any phone aspect ratio.
   * Formula: |cos θ| + (H/W) × |sin θ|  (derived from corner-coverage proof)
   */
  const mapScale = useCallback((deg: number): number => {
    const r = (deg * Math.PI) / 180;
    const ar = window.innerHeight / window.innerWidth; // >1 on portrait phones
    return Math.abs(Math.cos(r)) + ar * Math.abs(Math.sin(r)) + 0.04;
  }, []);

  /** Apply rotation + exact scale to map container, then counter-rotate markers */
  const applyRotation = useCallback((deg: number, transition = true) => {
    if (!containerRef.current) return;
    containerRef.current.style.transformOrigin = "center center";
    containerRef.current.style.transition = transition ? "transform 0.25s ease" : "none";
    containerRef.current.style.transform = `rotate(${deg}deg) scale(${mapScale(deg)})`;
    counterRotateAll(deg);
  }, [mapScale, counterRotateAll]);

  /* ── Apply rotation when rotationDeg state changes (button clicks / reset) ── */
  useEffect(() => {
    applyRotation(rotationDeg, true);
  }, [rotationDeg, applyRotation]);

  /* ── Two-finger twist-to-rotate — direct DOM only, zero React re-renders ── */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    /* Block iOS Safari's native page-rotation/pinch-zoom gesture so it doesn't
       rotate the entire browser viewport instead of our map container. */
    const blockNativeGesture = (e: Event) => e.preventDefault();

    function getTouchAngle(touches: TouchList): number {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartRef.current = {
          angle: getTouchAngle(e.touches),
          baseRotation: rotationRef.current,
        };
        if (containerRef.current) containerRef.current.style.transition = "none";
      }
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !touchStartRef.current) return;
      const delta = getTouchAngle(e.touches) - touchStartRef.current.angle;
      const newDeg = ((touchStartRef.current.baseRotation + delta) % 360 + 360) % 360;
      rotationRef.current = newDeg;
      if (containerRef.current) {
        containerRef.current.style.transform = `rotate(${newDeg}deg) scale(${mapScale(newDeg)})`;
      }
      markersRef.current.forEach(({ marker }) => {
        const iconEl = (marker.getElement?.() as HTMLElement | undefined)?.firstElementChild as HTMLElement | undefined;
        if (iconEl) iconEl.style.transform = `rotate(${-newDeg}deg)`;
      });
      const userIcon = (userMarkerRef.current?.getElement?.() as HTMLElement | undefined)?.firstElementChild as HTMLElement | undefined;
      if (userIcon) userIcon.style.transform = `rotate(${-newDeg}deg)`;
    };

    const onEnd = () => {
      if (!touchStartRef.current) return;
      touchStartRef.current = null;
      if (containerRef.current) containerRef.current.style.transition = "transform 0.25s ease";
      setRotationDeg(Math.round(rotationRef.current));
    };

    /* gesturestart/gesturechange are iOS-only events — prevent browser from
       treating the two-finger twist as a full-page rotation. Non-passive so
       we can call preventDefault(). */
    el.addEventListener("gesturestart", blockNativeGesture);
    el.addEventListener("gesturechange", blockNativeGesture);
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("gesturestart", blockNativeGesture);
      el.removeEventListener("gesturechange", blockNativeGesture);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [mapScale]);

  /* ── Filter markers ── */
  useEffect(() => {
    markersRef.current.forEach(({ marker, biz }) => {
      const matchesSearch = !search ||
        biz.name.toLowerCase().includes(search.toLowerCase()) ||
        (biz.categoryName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (biz.streetName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (biz.areaName ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = !category || biz.categoryName === category;
      marker.setOpacity(matchesSearch && matchesCat ? 1 : 0);
    });
    if (search.length > 0) {
      setSuggestions(
        businesses.filter(b =>
          b.latitude && b.longitude && (
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            (b.categoryName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (b.streetName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (b.areaName ?? "").toLowerCase().includes(search.toLowerCase())
          )
        ).slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  }, [search, category, businesses]);

  /* ── Switch tile layer + satellite street labels ── */
  useEffect(() => {
    const map = mapRef.current;
    const L = map?._L;
    if (!map || !L || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(TILE_STYLES[tileStyle].url);

    if (tileStyle === "satellite") {
      if (!labelsLayerRef.current) {
        labelsLayerRef.current = L.tileLayer(SATELLITE_LABELS_URL, {
          subdomains: "abcd",
          maxZoom: 20,
          opacity: 0.9,
          attribution: "© OpenStreetMap © CARTO",
        }).addTo(map);
      }
    } else {
      if (labelsLayerRef.current) {
        map.removeLayer(labelsLayerRef.current);
        labelsLayerRef.current = null;
      }
    }
  }, [tileStyle]);

  /* ── Init map ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: any;
    let L: any;

    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [6.5244, 3.3792],
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;
      (mapRef.current as any)._L = L;
      setMapReady(true);

      tileLayerRef.current = L.tileLayer(TILE_STYLES[tileStyle].url, {
        subdomains: "abcd",
        maxZoom: 20,
        attribution: TILE_STYLES[tileStyle].attribution,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      /* Show/hide name labels (business + user location) based on zoom */
      map.on("zoomend", () => {
        const z = map.getZoom();
        const showLabels = z >= 15;
        /* Business markers */
        markersRef.current.forEach(({ marker }) => {
          const el = marker.getElement?.() as HTMLElement | undefined;
          if (!el) return;
          const label = el.querySelector<HTMLElement>(".biz-name-label");
          if (label) label.style.opacity = showLabels ? "1" : "0";
        });
        /* User location marker */
        const userEl = userMarkerRef.current?.getElement?.() as HTMLElement | undefined;
        if (userEl) {
          const label = userEl.querySelector<HTMLElement>(".biz-name-label");
          if (label) label.style.opacity = showLabels ? "1" : "0";
        }
      });

      map.on("click", () => { setSelected(null); setShowStylePicker(false); });
    };

    init();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];
      labelsLayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Add business markers ── */
  useEffect(() => {
    const map = mapRef.current;
    const L = map?._L;
    if (!map || !L || !businesses.length || !mapReady) return;

    markersRef.current.forEach(({ marker }) => map.removeLayer(marker));
    markersRef.current = [];

    const mappable = businesses.filter(b => b.latitude && b.longitude);
    if (!mappable.length) return;

    mappable.forEach((biz) => {
      const color = CATEGORY_COLORS[biz.categoryName ?? ""] ?? DEFAULT_COLOR;
      const size = biz.featured ? 38 : 30;
      const icon = L.divIcon({
        className: "",
        html: makeMarkerHtml(color, size, !!biz.featured, biz.name),
        iconSize: [size + 12, size + 12],
        iconAnchor: [(size + 12) / 2, size + 12],
        popupAnchor: [0, -(size + 12)],
      });

      const marker = L.marker([biz.latitude, biz.longitude], { icon }).addTo(map);
      marker.on("click", (e: any) => {
        e.originalEvent?.stopPropagation();
        setSelected(biz);
        map.panTo([biz.latitude!, biz.longitude!], { animate: true, duration: 0.5 });
      });
      markersRef.current.push({ marker, biz });
    });

    // Apply current rotation counter to any newly-added markers so they start upright
    counterRotateAll(rotationRef.current);

    const bounds = L.latLngBounds(mappable.map(b => [b.latitude!, b.longitude!]));
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: false });
  }, [businesses, mapReady, counterRotateAll]);

  /* ── Navigate map to a Nigeria location ── */
  const flyToNigeriaLocation = useCallback((lat: number, lon: number, zoom = 14) => {
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.5 });
  }, []);

  /* ── Live GPS tracking ── */
  const handleLocateMe = useCallback(() => {
    const map = mapRef.current;
    const L = map?._L;
    if (!map || !L) return;

    if (liveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
      setLiveTracking(false);
      return;
    }

    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const html = `
            <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
              <div class="biz-name-label" style="
                position:absolute;top:-24px;left:50%;transform:translateX(-50%);
                background:rgba(5,71,182,0.88);color:white;
                font-size:10px;font-weight:700;white-space:nowrap;
                padding:2px 8px;border-radius:20px;
                border:1px solid rgba(255,255,255,0.25);
                backdrop-filter:blur(8px);pointer-events:none;
                opacity:0;transition:opacity 0.2s;
              ">📍 Your Current Location</div>
              <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(5,71,182,0.15);animation:live-track-ring 1.6s ease-out infinite;"></div>
              <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(5,71,182,0.12);animation:live-track-ring 1.6s ease-out 0.4s infinite;"></div>
              <div class="user-location-dot" style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;position:relative;z-index:2;box-shadow:0 2px 16px rgba(5,71,182,0.7);"></div>
            </div>`;
          const icon = L.divIcon({ className: "", html, iconSize: [44, 44], iconAnchor: [22, 22] });
          userMarkerRef.current = L.marker([latitude, longitude], { icon, zIndexOffset: 2000 }).addTo(map);
          // Keep the user dot upright if map is already rotated
          const uEl = userMarkerRef.current.getElement?.() as HTMLElement | undefined;
          const uIcon = uEl?.firstElementChild as HTMLElement | undefined;
          if (uIcon) uIcon.style.transform = `rotate(${-rotationRef.current}deg)`;
          map.flyTo([latitude, longitude], 16, { duration: 1.8 });
        }
        setLocating(false);
        setLiveTracking(true);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
    watchIdRef.current = watchId;
  }, [liveTracking]);

  const handleSuggestionClick = (biz: Business) => {
    if (!biz.latitude || !biz.longitude) return;
    mapRef.current?.flyTo([biz.latitude, biz.longitude], 17, { duration: 1 });
    setSelected(biz);
    setSearch(biz.name);
    setSuggestions([]);
    setSearchFocused(false);
  };

  /* ── Rotation handlers ── */
  const rotateCW = () => setRotationDeg(d => (d + 15) % 360);
  const rotateCCW = () => setRotationDeg(d => (d - 15 + 360) % 360);
  const resetRotation = () => setRotationDeg(0);

  const visibleCount = businesses.filter(b => b.latitude && b.longitude).length;

  return (
    <div ref={outerRef} className="relative w-full overflow-hidden" style={{ height: "100dvh", touchAction: "pan-x pan-y" }}>
      {/* Map canvas — rotation applied here via CSS transform in useEffect */}
      <div ref={containerRef} className="absolute inset-0" style={{ transition: "transform 0.3s ease" }} />

      {/* ── Floating Search + Filters ── */}
      <div className="absolute top-20 left-0 right-0 z-[1000] flex flex-col items-center px-3 sm:px-6 gap-2">

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-2xl relative"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl glass-search">
            <Search className="h-5 w-5 text-primary flex-shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              placeholder="Search businesses, streets, areas..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
            />
            {search && (
              <button onClick={() => { setSearch(""); setSuggestions([]); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{pickerCity || pickerState || "Nigeria"}</span>
              </button>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={handleLocateMe}
                title={liveTracking ? "Stop live tracking" : "Find my location"}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${liveTracking ? "bg-blue-500 text-white" : "text-primary hover:bg-primary/10"}`}
              >
                <Navigation className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          {/* Location picker dropdown */}
          <AnimatePresence>
            {showLocationPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: "rgba(8,15,38,0.97)", backdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <div className="p-3 border-b border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-1">Browse by State</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2 max-h-52 overflow-y-auto hide-scrollbar">
                  {NIGERIA_STATES.map(state => (
                    <button
                      key={state.code}
                      onClick={() => {
                        setPickerState(state.name);
                        setPickerCity("");
                        flyToNigeriaLocation(state.lat, state.lon, 11);
                        if (!pickerCity) setShowLocationPicker(false);
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${pickerState === state.name ? "bg-primary text-white" : "text-white/80 hover:bg-white/10"}`}
                    >
                      {state.name}
                    </button>
                  ))}
                </div>
                {selectedState && (
                  <>
                    <div className="p-3 border-t border-white/10">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-1">Cities in {selectedState.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 max-h-40 overflow-y-auto hide-scrollbar">
                      {selectedState.cities.map(city => (
                        <button
                          key={city.name}
                          onClick={() => {
                            setPickerCity(city.name);
                            flyToNigeriaLocation(city.lat, city.lon, 14);
                            setShowLocationPicker(false);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${pickerCity === city.name ? "bg-primary text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {selectedCityData && (
                  <>
                    <div className="p-3 border-t border-white/10">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-1">Areas in {selectedCityData.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 pb-4">
                      {selectedCityData.areas.map(area => (
                        <button
                          key={area}
                          onClick={() => { setSearch(area); setShowLocationPicker(false); }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="p-2 border-t border-white/5 flex justify-between items-center">
                  {(pickerState || pickerCity) && (
                    <button onClick={() => { setPickerState(""); setPickerCity(""); flyToNigeriaLocation(9.082, 8.6753, 6); }}
                      className="text-xs text-white/40 hover:text-white/70 px-3 py-1">Clear</button>
                  )}
                  <button onClick={() => setShowLocationPicker(false)}
                    className="ml-auto text-xs text-primary/80 hover:text-primary px-3 py-1">Done</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Suggestions */}
          <AnimatePresence>
            {searchFocused && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.06)" }}
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
                    <div className="min-w-0 flex-1">
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
        >
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setCategory(category === pill.value ? "" : pill.value)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95"
              style={
                (pill.value === "" && category === "") || category === pill.value
                  ? { background: "rgba(37,99,235,0.9)", backdropFilter: "blur(12px)", color: "white", border: "1px solid rgba(37,99,235,0.4)", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }
                  : { background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", color: "#374151", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
              }
            >
              {pill.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ── Map Rotation Controls ── */}
      <div className="absolute bottom-44 right-4 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={rotateCCW}
          title="Rotate anti-clockwise"
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl glass-panel hover:bg-white/15 transition-colors"
        >
          <RotateCcw className="h-4.5 w-4.5 text-white/80" />
        </button>
        <button
          onClick={resetRotation}
          title="Reset north-up"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl glass-panel hover:bg-white/15 transition-colors ${rotationDeg !== 0 ? "border border-primary/50" : ""}`}
        >
          <Compass className={`h-4.5 w-4.5 ${rotationDeg !== 0 ? "text-primary" : "text-white/60"}`}
            style={{ transform: `rotate(${-rotationDeg}deg)`, transition: "transform 0.3s ease" }} />
        </button>
        <button
          onClick={rotateCW}
          title="Rotate clockwise"
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl glass-panel hover:bg-white/15 transition-colors"
        >
          <RotateCw className="h-4.5 w-4.5 text-white/80" />
        </button>
      </div>

      {/* ── Live Activity Panel ── */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-[1000]">
        <AnimatePresence>
          {showMovement && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              className="mb-2 w-56 rounded-2xl overflow-hidden glass-panel"
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <div className="live-dot w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Live Activity</span>
              </div>
              <div className="p-3 space-y-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activityIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 p-2 rounded-xl bg-white/5"
                  >
                    <Activity className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/80 leading-snug">{LIVE_ACTIVITY[activityIndex]}</p>
                  </motion.div>
                </AnimatePresence>
                {liveTracking && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/15 border border-blue-500/25">
                    <Navigation className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-xs text-blue-300 font-medium">Live tracking active</p>
                  </div>
                )}
                {rotationDeg !== 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Compass className="h-3.5 w-3.5 text-purple-400" />
                    <p className="text-xs text-purple-300 font-medium">Map rotated {rotationDeg}°</p>
                  </div>
                )}
                <div className="pt-1 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Businesses</span>
                    <span className="text-white/90 font-bold">{visibleCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Map style</span>
                    <span className="text-white/90 font-medium">{TILE_STYLES[tileStyle].emoji} {TILE_STYLES[tileStyle].label}</span>
                  </div>
                  {(pickerState || pickerCity) && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">Location</span>
                      <span className="text-white/90 font-medium truncate ml-2">{pickerCity || pickerState}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMovement(!showMovement); }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all glass-panel"
          style={{ border: showMovement ? "1px solid rgba(37,99,235,0.4)" : undefined }}
        >
          <Radio className={`h-5 w-5 ${showMovement ? "text-blue-400" : "text-white/70"}`} />
        </button>
      </div>

      {/* ── Map Style Switcher ── */}
      <div className="absolute bottom-28 right-4 z-[1000]">
        <AnimatePresence>
          {showStylePicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex flex-col gap-1 mb-2 p-2 rounded-2xl shadow-2xl glass-panel"
            >
              {Object.entries(TILE_STYLES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setTileStyle(key); setShowStylePicker(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/10"
                  style={{ color: tileStyle === key ? "#60a5fa" : "rgba(255,255,255,0.8)", fontWeight: tileStyle === key ? 700 : 500, background: tileStyle === key ? "rgba(37,99,235,0.2)" : undefined }}
                >
                  <span>{val.emoji}</span>
                  {val.label}
                  {key === "satellite" && <span className="text-[10px] opacity-60 ml-auto">+Labels</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={(e) => { e.stopPropagation(); setShowStylePicker(!showStylePicker); }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl glass-panel"
        >
          <Layers className="h-5 w-5 text-white/80" />
        </button>
      </div>

      {/* ── Bottom left stats ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 left-4 z-[1000] hidden sm:flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg glass-panel">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 live-dot" />
            <span className="text-xs font-semibold text-white/90">{visibleCount} businesses</span>
          </div>
          <div className="h-3.5 w-px bg-white/15" />
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            Live
          </div>
          {tileStyle === "satellite" && (
            <>
              <div className="h-3.5 w-px bg-white/15" />
              <span className="text-xs text-white/50">Street labels on</span>
            </>
          )}
        </div>
        {liveTracking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-panel border border-blue-500/30"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300">Tracking your movement</span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Scroll down hint ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase">Discover more</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.button>

      {/* ── Business Bottom Sheet ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) setSelected(null); }}
            className="absolute bottom-0 left-0 right-0 z-[2000] rounded-t-3xl shadow-2xl overflow-hidden glass-sheet"
            style={{ maxHeight: "65vh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-8 overflow-y-auto hide-scrollbar">
              <div className="flex items-start gap-3 mb-4">
                {selected.photos?.[0] ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                    <img src={selected.photos[0].url} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center bg-white/5 border border-white/10">
                    <MapPinOff className="h-7 w-7 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white leading-tight">{selected.name}</h3>
                    {selected.verified && <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                  </div>
                  {selected.categoryName && (
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
                      style={{ background: `${CATEGORY_COLORS[selected.categoryName] ?? DEFAULT_COLOR}25`, color: CATEGORY_COLORS[selected.categoryName] ?? DEFAULT_COLOR, border: `1px solid ${CATEGORY_COLORS[selected.categoryName] ?? DEFAULT_COLOR}40` }}>
                      {selected.categoryName}
                    </span>
                  )}
                  {selected.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-white/90">{selected.rating}</span>
                      <span className="text-xs text-white/50">({selected.reviewCount ?? 0})</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-white/10">
                  <X className="h-4 w-4 text-white/50" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{[selected.streetName, selected.areaName, selected.cityName].filter(Boolean).join(", ") || "Lagos, Nigeria"}</span>
              </div>
              {selected.openingHours && (
                <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  {selected.openingHours}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/businesses/${selected.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white btn-glow"
                  style={{ background: "linear-gradient(135deg,#0547B6,#2563eb)" }}
                >
                  View Profile <ArrowRight className="h-4 w-4" />
                </button>
                {selected.latitude && selected.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
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
