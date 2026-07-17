import { useEffect, useRef, useState, useCallback } from "react";
import { Country, State, City as CSCCity } from "country-state-city";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, MapPin, Navigation, Layers, X, Star, ShieldCheck,
  ArrowRight, Mic, ChevronDown, Zap, Clock, Radio, ChevronRight,
  MapPinOff, Activity, RotateCcw, RotateCw, Compass,
  Car, Square, Navigation2, Flag, LocateFixed, Bike,
} from "lucide-react";
import { RiderDirectoryPanel } from "@/components/riders/RiderDirectoryPanel";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

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
  navigation: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    label: "Navigation", emoji: "🧭", attribution: "© Esri, HERE, Garmin, OpenStreetMap contributors",
  },
  explore: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Explore", emoji: "🗺", attribution: "© OpenStreetMap © CARTO",
  },
  positron: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    label: "Positron", emoji: "⬜", attribution: "© OpenStreetMap © CARTO",
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
  topo: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    label: "Topo Map", emoji: "⛰", attribution: "© Esri, HERE, Garmin, OpenStreetMap",
  },
  natgeo: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
    label: "National Geographic", emoji: "🌍", attribution: "© Esri, National Geographic Society",
  },
  ocean: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
    label: "Ocean", emoji: "🌊", attribution: "© Esri, GEBCO, NOAA, National Geographic",
  },
};

/* Street-label overlay used in satellite mode */
const SATELLITE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";

/* ── Drive Mode: pure geo utilities ── */
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const dφ = (lat2 - lat1) * Math.PI / 180, dλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function geoHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180, dλ = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

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

function makeMarkerHtml(color: string, size = 34, featured = false, name = "", blinkDelay = 0) {
  const ringSize = size + 16;
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
      <div style="
        position:absolute;
        width:${size + 6}px;height:${size + 6}px;
        border-radius:50%;
        border:2px solid ${color};
        animation:pin-blink-ring 1.4s ease-in-out ${blinkDelay}s infinite;
        pointer-events:none;
      "></div>
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
  const touchStartRef    = useRef<{ angle: number; dist: number; baseRotation: number; rotationActive: boolean } | null>(null);
  /* Drive mode refs */
  const routeLayersRef   = useRef<any[]>([]);
  const driveWatchRef    = useRef<number | null>(null);
  const drivePrevPosRef  = useRef<[number, number] | null>(null);
  const nearbyTimerRef2  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertedIdsRef    = useRef<Set<number>>(new Set());
  const nominatimTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyRotRef          = useRef<(deg: number, anim?: boolean) => void>(() => {});
  const businessesRef        = useRef<Business[]>([]);
  const leafletRef           = useRef<any>(null);   // stores the imported Leaflet module
  const driveStepsRef        = useRef<any[]>([]);   // OSRM turn-by-turn steps
  const driveStepIdxRef      = useRef(0);
  const stepPreAnnouncedRef  = useRef(false);
  const voiceRef             = useRef<SpeechSynthesisVoice | null>(null);
  const nominatimOriginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driveCurrentPosRef   = useRef<[number, number] | null>(null); // latest GPS pos during driving
  const driveFollowing       = useRef(true);   // true = map auto-follows GPS
  const driveSnapTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [driveOffCenter, setDriveOffCenter] = useState(false); // recenter button visibility

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tileStyle, setTileStyle] = useState("navigation");
  const defaultStyleApplied = useRef(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selected, setSelected] = useState<Business | null>(null);
  const [locating, setLocating] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<Array<{ place_id: number; display_name: string; lat: string; lon: string; type: string; class: string }>>([]);
  const streetSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickerCountry, setPickerCountry] = useState("");
  const [pickerState, setPickerState] = useState("");
  const [pickerCity, setPickerCity] = useState("");
  const [pickerCountrySearch, setPickerCountrySearch] = useState("");
  const [rotationDeg, setRotationDeg] = useState(0);
  const [showRiderDirectory, setShowRiderDirectory] = useState(false);

  /* ── Drive Mode state ── */
  const [showDriveSheet, setShowDriveSheet]           = useState(false);
  const [driveDest, setDriveDest]                     = useState("");
  const [driveDestCoords, setDriveDestCoords]         = useState<[number, number] | null>(null);
  const [driveDestName, setDriveDestName]             = useState("");
  const [driveSuggestions, setDriveSuggestions]       = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [driveOriginText, setDriveOriginText]         = useState("");
  const [driveOriginSuggestions, setDriveOriginSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [routeInfo, setRouteInfo]                     = useState<{ distKm: number; durationMin: number } | null>(null);
  const [drivingActive, setDrivingActive]             = useState(false);
  const [nearbyAlert, setNearbyAlert]                 = useState<Business | null>(null);
  const [driveLoading, setDriveLoading]               = useState(false);
  const [driveOrigin, setDriveOrigin]                 = useState<[number, number] | null>(null);

  const { data: allCitiesData = [] } = useQuery<Array<{ id: number; name: string; state: string; country: string }>>({
    queryKey: ["cities-map"],
    queryFn: () => fetch(`${BASE}/api/cities`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  const allCountriesList = Country.getAllCountries();
  const locationCountries = pickerCountrySearch.trim()
    ? allCountriesList.filter(c => c.name.toLowerCase().includes(pickerCountrySearch.toLowerCase()))
    : allCountriesList;
  const selectedCountryObj = allCountriesList.find(c => c.name === pickerCountry);
  const locationStates = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
  const dbCitiesForState = allCitiesData.filter(c => (!pickerCountry || c.country === pickerCountry) && (!pickerState || c.state === pickerState));
  const selectedStateObj = locationStates.find(s => s.name === pickerState);
  const locationCities: Array<{ id: number; name: string }> = dbCitiesForState.length > 0
    ? dbCitiesForState
    : (selectedCountryObj && selectedStateObj
        ? CSCCity.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode).map(c => ({ id: 0, name: c.name }))
        : []);

  /* ── Fetch admin-configured default map style on first mount ── */
  useEffect(() => {
    if (defaultStyleApplied.current) return;
    defaultStyleApplied.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch(`${BASE}/api/public/settings`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: { default_map_style?: string }) => {
        const key = data?.default_map_style;
        if (key && key in TILE_STYLES) setTileStyle(key);
      })
      .catch(() => { /* fall back to "explore" silently */ })
      .finally(() => clearTimeout(timeout));
  }, []);

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
   * Counter-rotate the satellite labels pane so street-name text stays upright
   * while the map geography rotates underneath.  The pane fills the container,
   * so its transform-origin (50% 50%) equals the container's rotation center.
   */
  const counterRotateLabels = useCallback((deg: number) => {
    const pane = mapRef.current?.getPane?.("labelsPane") as HTMLElement | undefined;
    if (pane) {
      pane.style.transformOrigin = "50% 50%";
      pane.style.transform = `rotate(${-deg}deg)`;
    }
  }, []);

  /**
   * Apply pure CSS rotation (no scale — the physical 3× container provides
   * the edge buffer), counter-rotate markers, and counter-rotate labels pane.
   */
  const applyRotation = useCallback((deg: number, transition = true) => {
    if (!containerRef.current) return;
    containerRef.current.style.transformOrigin = "center center";
    containerRef.current.style.transition = transition ? "transform 0.25s ease" : "none";
    containerRef.current.style.transform = `rotate(${deg}deg)`;
    counterRotateAll(deg);
    counterRotateLabels(deg);
  }, [counterRotateAll, counterRotateLabels]);

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

    function getTouchDist(touches: TouchList): number {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    /** Minimum angle change (°) before rotation is engaged — prevents pinch
     *  from accidentally spinning the map (Google Maps uses ~6°). */
    const ROTATE_DEAD_ZONE = 8;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartRef.current = {
          angle: getTouchAngle(e.touches),
          dist: getTouchDist(e.touches),
          baseRotation: rotationRef.current,
          rotationActive: false,  // engage only after dead-zone crossed
        };
        if (containerRef.current) containerRef.current.style.transition = "none";
      }
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !touchStartRef.current) return;

      const angleDelta = getTouchAngle(e.touches) - touchStartRef.current.angle;

      /* ── Engage rotation only after deliberate twist (dead zone) ── */
      if (!touchStartRef.current.rotationActive) {
        if (Math.abs(angleDelta) < ROTATE_DEAD_ZONE) return; // still in dead zone
        touchStartRef.current.rotationActive = true;
        /* Snap base so rotation doesn't jump on activation */
        touchStartRef.current.angle = getTouchAngle(e.touches);
        return;
      }

      /* ── Apply rotation — Leaflet handles pinch-zoom independently ── */
      const newAngleDelta = getTouchAngle(e.touches) - touchStartRef.current.angle;
      const newDeg = ((touchStartRef.current.baseRotation + newAngleDelta) % 360 + 360) % 360;
      rotationRef.current = newDeg;

      if (containerRef.current) {
        containerRef.current.style.transform = `rotate(${newDeg}deg)`;
      }
      // Keep business markers upright
      markersRef.current.forEach(({ marker }) => {
        const iconEl = (marker.getElement?.() as HTMLElement | undefined)?.firstElementChild as HTMLElement | undefined;
        if (iconEl) iconEl.style.transform = `rotate(${-newDeg}deg)`;
      });
      // Keep user location dot upright
      const userIcon = (userMarkerRef.current?.getElement?.() as HTMLElement | undefined)?.firstElementChild as HTMLElement | undefined;
      if (userIcon) userIcon.style.transform = `rotate(${-newDeg}deg)`;
      // Keep satellite street-name labels upright
      const labelsPane = mapRef.current?.getPane?.("labelsPane") as HTMLElement | undefined;
      if (labelsPane) labelsPane.style.transform = `rotate(${-newDeg}deg)`;
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
  }, []);

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
        ).slice(0, 5)
      );
    } else {
      setSuggestions([]);
      setStreetSuggestions([]);
    }
  }, [search, category, businesses]);

  /* ── Nominatim street/place search — debounced 400ms ── */
  useEffect(() => {
    if (streetSearchTimer.current) clearTimeout(streetSearchTimer.current);
    if (search.trim().length < 3) { setStreetSuggestions([]); return; }
    streetSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5&addressdetails=0`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setStreetSuggestions(data);
      } catch { setStreetSuggestions([]); }
    }, 400);
    return () => { if (streetSearchTimer.current) clearTimeout(streetSearchTimer.current); };
  }, [search]);

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
          pane: "labelsPane",   // counter-rotated pane keeps text upright
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
      leafletRef.current = L;
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [2, 20],
        zoom: 4,
        zoomControl: false,
        attributionControl: true,
        /* ── Google-Maps-like feel ── */
        zoomSnap: 0,              // fully continuous zoom — no snapping/jumping
        zoomDelta: 1,
        wheelPxPerZoomLevel: 80,  // responsive scroll-wheel zoom
        inertia: true,
        inertiaDeceleration: 3000,// Google Maps deceleration curve
        inertiaMaxSpeed: 2000,
        easeLinearity: 0.2,       // snappy then smooth settle
        bounceAtZoomLimits: false, // no rubber-band bounce at min/max zoom
        doubleClickZoom: true,
        tap: true,
        tapTolerance: 15,
      });

      /* Dedicated pane for satellite street labels so we can counter-rotate
         them independently — keeping text upright while the map geography rotates */
      map.createPane("labelsPane");
      map.getPane("labelsPane").style.zIndex = "450";
      map.getPane("labelsPane").style.pointerEvents = "none";
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

    mappable.forEach((biz, idx) => {
      const color = CATEGORY_COLORS[biz.categoryName ?? ""] ?? DEFAULT_COLOR;
      const size = biz.featured ? 22 : 16;
      const blinkDelay = parseFloat(((idx % 10) * 0.2).toFixed(1));
      const icon = L.divIcon({
        className: "",
        html: makeMarkerHtml(color, size, !!biz.featured, biz.name, blinkDelay),
        iconSize: [size + 16, size + 16],
        iconAnchor: [(size + 16) / 2, size + 16],
        popupAnchor: [0, -(size + 16)],
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

    /* The physical map container is 3× the viewport in each dimension so Leaflet
       loads tiles for 3× the area (= free pan buffer when rotated).  fitBounds
       will therefore zoom in ~log2(3)≈1.5 levels too far from the user's
       perspective, so zoom back out to match the original portrait feel. */
    map.setZoom(map.getZoom() - Math.log2(3), { animate: false });
  }, [businesses, mapReady, counterRotateAll]);

  /* ── Navigate map to any location ── */
  const flyToLocation = useCallback((lat: number, lon: number, zoom = 14) => {
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.5 });
  }, []);

  /* ── Geocode via Nominatim and fly there ── */
  const geocodeAndFly = useCallback(async (query: string, zoom: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: any[] = await res.json();
      if (data[0]) flyToLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), zoom);
    } catch {}
  }, [flyToLocation]);

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

  /* ── Drive Mode Logic ── */

  /* Keep stable refs for use inside GPS callbacks (avoid stale closures) */
  useEffect(() => { applyRotRef.current = applyRotation; }, [applyRotation]);
  useEffect(() => { businessesRef.current = businesses; }, [businesses]);

  /* ── Voice navigation: pick the best English female voice available ── */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return false;
      const female = voices.find(v =>
        /samantha|karen|victoria|fiona|moira|tessa|zira|hazel|susan|helen|female/i.test(v.name) &&
        /en/i.test(v.lang)
      ) ?? voices.find(v => /en/i.test(v.lang)) ?? voices[0] ?? null;
      voiceRef.current = female;
      return true;
    };
    if (!pick()) {
      // Polling fallback — Android WebView may never fire onvoiceschanged
      const timer = setInterval(() => { if (pick()) clearInterval(timer); }, 250);
      const giveUp = setTimeout(() => clearInterval(timer), 8000);
      window.speechSynthesis.onvoiceschanged = () => { pick(); };
      return () => { clearInterval(timer); clearTimeout(giveUp); };
    }
    window.speechSynthesis.onvoiceschanged = () => pick();
  }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Android WebView quirk: synthesis queue can get stuck in paused state
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(text);
      u.lang   = "en-US";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate   = 0.92;
      u.pitch  = 1.1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function buildInstruction(step: any): string {
    const type = step?.maneuver?.type ?? "";
    const mod  = step?.maneuver?.modifier ?? "";
    const road = step?.name ? `onto ${step.name}` : "";
    if (type === "depart")        return `Head ${mod} ${road}`.trim();
    if (type === "arrive")        return "You have arrived at your destination.";
    if (type === "turn") {
      if (mod === "right")        return `Turn right ${road}`.trim();
      if (mod === "left")         return `Turn left ${road}`.trim();
      if (mod === "sharp right")  return `Turn sharp right ${road}`.trim();
      if (mod === "sharp left")   return `Turn sharp left ${road}`.trim();
      if (mod === "slight right") return `Keep slight right ${road}`.trim();
      if (mod === "slight left")  return `Keep slight left ${road}`.trim();
      if (mod === "straight")     return `Continue straight ${road}`.trim();
      return `Turn ${mod} ${road}`.trim();
    }
    if (type === "continue")      return `Continue ${mod} ${road}`.trim();
    if (type === "new name")      return `Continue ${road}`.trim();
    if (type === "roundabout")    return `At the roundabout, take the exit ${road}`.trim();
    if (type === "merge")         return `Merge ${mod} ${road}`.trim();
    if (type === "on ramp")       return `Take the ramp ${road}`.trim();
    if (type === "off ramp")      return `Take the exit ${road}`.trim();
    if (type === "fork")          return `Keep ${mod} at the fork ${road}`.trim();
    if (type === "end of road")   return `Turn ${mod} at the end of the road ${road}`.trim();
    return `Continue ${road}`.trim();
  }

  /* Nominatim destination autocomplete — debounced 400ms */
  useEffect(() => {
    if (nominatimTimer.current) clearTimeout(nominatimTimer.current);
    if (!driveDest.trim() || driveDest.length < 3) { setDriveSuggestions([]); return; }
    nominatimTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(driveDest)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: any[] = await res.json();
        setDriveSuggestions(data.map(d => ({
          label: d.display_name as string,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
        })));
      } catch {}
    }, 400);
    return () => { if (nominatimTimer.current) clearTimeout(nominatimTimer.current); };
  }, [driveDest]);

  /* Nominatim origin autocomplete — debounced 400ms */
  useEffect(() => {
    if (nominatimOriginTimer.current) clearTimeout(nominatimOriginTimer.current);
    if (!driveOriginText.trim() || driveOriginText.length < 3 || driveOrigin) {
      setDriveOriginSuggestions([]);
      return;
    }
    nominatimOriginTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(driveOriginText)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: any[] = await res.json();
        setDriveOriginSuggestions(data.map(d => ({
          label: d.display_name as string,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
        })));
      } catch {}
    }, 400);
    return () => { if (nominatimOriginTimer.current) clearTimeout(nominatimOriginTimer.current); };
  }, [driveOriginText, driveOrigin]);

  /* Fetch OSRM route with step-by-step instructions and draw polyline */
  const fetchRoute = useCallback(async (origin: [number, number], dest: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    setDriveLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== "Ok") return;
      const route = data.routes[0];
      setRouteInfo({ distKm: route.distance / 1000, durationMin: Math.ceil(route.duration / 60) });
      /* Store steps for voice turn-by-turn */
      driveStepsRef.current = route.legs?.[0]?.steps ?? [];
      /* Clear any old route layers */
      routeLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch {} });
      routeLayersRef.current = [];
      const geo = route.geometry;
      const Lmod = leafletRef.current;
      if (Lmod) {
        const shadow = Lmod.geoJSON(geo, { style: { color: "white",   weight: 14, opacity: 0.45, lineCap: "round", lineJoin: "round" } }).addTo(map);
        const line   = Lmod.geoJSON(geo, { style: { color: "#2563eb", weight:  7, opacity: 0.95, lineCap: "round", lineJoin: "round" } }).addTo(map);
        routeLayersRef.current = [shadow, line];
        /* Fit map to show the full A→B route */
        try { map.fitBounds(line.getBounds(), { padding: [60, 60], animate: true, duration: 0.9 }); } catch {}
      }
    } catch {} finally { setDriveLoading(false); }
  }, []);

  const clearRoute = useCallback(() => {
    const map = mapRef.current; if (!map) return;
    routeLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch {} });
    routeLayersRef.current = [];
  }, []);

  const stopDriving = useCallback(() => {
    const map = mapRef.current;
    if (driveWatchRef.current !== null) { navigator.geolocation.clearWatch(driveWatchRef.current); driveWatchRef.current = null; }
    /* Remove drive-specific drag listener */
    if (map && (map as any)._driveDragHandler) {
      map.off("dragstart", (map as any)._driveDragHandler);
      delete (map as any)._driveDragHandler;
    }
    if (driveSnapTimerRef.current) { clearTimeout(driveSnapTimerRef.current); driveSnapTimerRef.current = null; }
    clearRoute();
    window.speechSynthesis?.cancel?.();
    drivePrevPosRef.current      = null;
    driveCurrentPosRef.current   = null;
    driveFollowing.current       = true;
    driveStepsRef.current        = [];
    driveStepIdxRef.current      = 0;
    stepPreAnnouncedRef.current  = false;
    alertedIdsRef.current        = new Set();
    if (nearbyTimerRef2.current) clearTimeout(nearbyTimerRef2.current);
    /* Restore the regular user-location dot on the existing marker */
    if (map && userMarkerRef.current && leafletRef.current) {
      const L = leafletRef.current;
      const regularHtml = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(5,71,182,0.15);animation:live-track-ring 1.6s ease-out infinite;"></div>
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(5,71,182,0.12);animation:live-track-ring 1.6s ease-out 0.4s infinite;"></div>
          <div class="user-location-dot" style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;position:relative;z-index:2;box-shadow:0 2px 16px rgba(5,71,182,0.7);"></div>
        </div>`;
      const regularIcon = L.divIcon({ className: "", html: regularHtml, iconSize: [44, 44], iconAnchor: [22, 22] });
      userMarkerRef.current.setIcon(regularIcon);
    }
    setDrivingActive(false);
    setDriveOffCenter(false);
    setRouteInfo(null);
    setNearbyAlert(null);
    setDriveDestCoords(null);
    setDriveDestName("");
    setDriveDest("");
    setDriveOriginText("");
    setDriveOrigin(null);
    setShowDriveSheet(false);
    applyRotRef.current(0, true);
    map?.setZoom?.(14, { animate: true });
  }, [clearRoute]);

  const startDriving = useCallback(() => {
    if (!driveOrigin || !driveDestCoords) return;
    const map  = mapRef.current; if (!map) return;
    const Lmod = leafletRef.current; if (!Lmod) return;

    setDrivingActive(true);
    setShowDriveSheet(false);
    setDriveOffCenter(false);
    driveFollowing.current       = true;
    alertedIdsRef.current        = new Set();
    driveStepIdxRef.current      = 1;
    stepPreAnnouncedRef.current  = false;
    drivePrevPosRef.current      = driveOrigin;
    driveCurrentPosRef.current   = driveOrigin;

    /* ── Swap / create the navigation dot (Google Maps-style pulsing blue arrow) ── */
    const navDotHtml = `
      <div style="position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:60px;height:60px;border-radius:50%;
          background:rgba(37,99,235,0.15);animation:live-track-ring 2s ease-out infinite;"></div>
        <div style="position:absolute;width:42px;height:42px;border-radius:50%;
          background:rgba(37,99,235,0.18);animation:live-track-ring 2s ease-out 0.55s infinite;"></div>
        <div style="position:absolute;top:3px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:8px solid transparent;border-right:8px solid transparent;
          border-bottom:15px solid #2563eb;
          filter:drop-shadow(0 1px 6px rgba(37,99,235,0.9));"></div>
        <div style="width:22px;height:22px;background:#2563eb;border:3.5px solid white;
          border-radius:50%;position:relative;z-index:2;
          box-shadow:0 2px 18px rgba(37,99,235,0.85);"></div>
      </div>`;
    const navIcon = Lmod.divIcon({ className: "", html: navDotHtml, iconSize: [60, 60], iconAnchor: [30, 30] });
    if (userMarkerRef.current) {
      userMarkerRef.current.setIcon(navIcon);
      userMarkerRef.current.setLatLng(driveOrigin);
    } else {
      userMarkerRef.current = Lmod.marker(driveOrigin, { icon: navIcon, zIndexOffset: 3000 }).addTo(map);
    }

    /* ── Re-enable drag so the user can briefly look around ── */
    try { map.dragging.enable(); } catch {}

    /* ── Detect when user pans away: enter "off-center" mode ── */
    const onDragStart = () => {
      driveFollowing.current = false;
      setDriveOffCenter(true);
      if (driveSnapTimerRef.current) clearTimeout(driveSnapTimerRef.current);
      /* Auto-re-engage following after 5 s of no interaction */
      driveSnapTimerRef.current = setTimeout(() => {
        driveFollowing.current = true;
        setDriveOffCenter(false);
        const pos = driveCurrentPosRef.current;
        if (pos) map.setView(pos, Math.max(map.getZoom(), 17), { animate: true, duration: 0.6 });
      }, 5000);
    };
    map.on("dragstart", onDragStart);
    /* Store cleanup on the map object so stopDriving can remove it */
    (map as any)._driveDragHandler = onDragStart;

    /* ── Step 1: show full route overview ── */
    const routeLine = routeLayersRef.current[1];
    if (routeLine) {
      try { map.fitBounds(routeLine.getBounds(), { padding: [60, 60], animate: true, duration: 0.8 }); } catch {}
    }

    /* ── Step 2: fly to origin, begin navigation ── */
    setTimeout(() => {
      map.flyTo(driveOrigin, 18, { duration: 1.2 });
    }, 1600);

    /* ── Announce route + first instruction ── */
    const ri = routeInfo;
    const firstStep = driveStepsRef.current[0];
    const etaText   = ri
      ? `Route calculated. ${ri.distKm.toFixed(1)} kilometers, approximately ${ri.durationMin} minutes. `
      : "Navigation started. ";
    speak(etaText + (firstStep ? buildInstruction(firstStep) : ""));

    /* ── GPS watcher ── */
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const curr: [number, number] = [lat, lon];
        driveCurrentPosRef.current = curr;

        /* Update navigation dot position */
        if (userMarkerRef.current) userMarkerRef.current.setLatLng(curr);

        /* Heading-up rotation — only when moved > 3 m */
        if (drivePrevPosRef.current) {
          const [pLat, pLon] = drivePrevPosRef.current;
          if (haversineM(pLat, pLon, lat, lon) > 3) {
            const heading = geoHeading(pLat, pLon, lat, lon);
            const mapRot  = (360 - heading) % 360;
            applyRotRef.current(mapRot, false);
            rotationRef.current = mapRot;
            setRotationDeg(Math.round(mapRot));
            drivePrevPosRef.current = curr;
          }
        }

        /* Follow GPS — skip if user is looking around */
        if (driveFollowing.current) {
          map.setView(curr, Math.max(map.getZoom(), 17), { animate: true, duration: 0.8, noMoveStart: true });
        }

        /* ── Voice turn-by-turn ── */
        const steps   = driveStepsRef.current;
        const stepIdx = driveStepIdxRef.current;
        if (steps.length > 0 && stepIdx < steps.length) {
          const nextStep   = steps[stepIdx];
          const [sLon, sLat] = nextStep.maneuver.location;
          const distToStep = haversineM(lat, lon, sLat, sLon);
          const instr      = buildInstruction(nextStep);

          if (distToStep < 50) {
            speak(instr);
            driveStepIdxRef.current     = stepIdx + 1;
            stepPreAnnouncedRef.current = false;
            if (nextStep.maneuver.type === "arrive") setTimeout(() => stopDriving(), 3500);
          } else if (distToStep < 220 && !stepPreAnnouncedRef.current) {
            speak(`In ${Math.round(distToStep / 10) * 10} meters, ${instr}`);
            stepPreAnnouncedRef.current = true;
          }
        }

        /* ── Business proximity alert — 150 m ── */
        const nearby = businessesRef.current.find(b => {
          if (!b.latitude || !b.longitude) return false;
          if (alertedIdsRef.current.has(b.id)) return false;
          return haversineM(lat, lon, b.latitude, b.longitude) < 150;
        });
        if (nearby) {
          alertedIdsRef.current.add(nearby.id);
          setNearbyAlert(nearby);
          if (nearbyTimerRef2.current) clearTimeout(nearbyTimerRef2.current);
          nearbyTimerRef2.current = setTimeout(() => setNearbyAlert(null), 4500);
          speak(`Nearby: ${nearby.name}${nearby.categoryName ? `, ${nearby.categoryName}` : ""}.`);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    driveWatchRef.current = watchId;
  }, [driveOrigin, driveDestCoords, routeInfo, stopDriving]);

  const openDriveSheet = useCallback(() => {
    /* Scroll the page root back to top so the map is in view */
    try { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch {}
    setShowDriveSheet(true);
    setDriveOriginText("");
    setDriveOrigin(null);
    setDriveOriginSuggestions([]);
    setDriveDest("");
    setDriveDestCoords(null);
    setDriveSuggestions([]);
    setRouteInfo(null);
  }, []);

  /* Auto-locate origin when user clicks the locate icon */
  const autoLocateOrigin = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriveOrigin([pos.coords.latitude, pos.coords.longitude]);
        setDriveOriginText("Current location");
        setDriveOriginSuggestions([]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
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

  /* ── Rotation handlers ── */
  const rotateCW = () => setRotationDeg(d => (d + 15) % 360);
  const rotateCCW = () => setRotationDeg(d => (d - 15 + 360) % 360);
  const resetRotation = () => setRotationDeg(0);

  const visibleCount = businesses.filter(b => b.latitude && b.longitude).length;

  return (
    <div ref={outerRef} className="relative w-full overflow-hidden map-hero-h" style={{ touchAction: "pan-x pan-y" }}>
      {/* Map canvas — rotation applied here via CSS transform in useEffect */}
      {/* Physical 3× container — Leaflet loads tiles for 3× viewport area,
          giving a full free-pan buffer in every direction when rotated.
          transform-origin defaults to 50% 50% = viewport center (correct). */}
      <div ref={containerRef} className="map-hero-h-3x" style={{
        position: "absolute",
        width: "300vw",
        left: "-100vw",
      }} />

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
                <span className="hidden sm:inline">{pickerCity || pickerState || pickerCountry || "Worldwide"}</span>
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
                <div className="p-3 border-b border-white/10 space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-1">Browse by Location</p>
                  {!pickerCountry && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                      <input
                        type="text"
                        value={pickerCountrySearch}
                        onChange={e => setPickerCountrySearch(e.target.value)}
                        placeholder="Search country…"
                        className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  )}
                </div>
                {/* Countries */}
                {!pickerCountry && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2 max-h-44 overflow-y-auto hide-scrollbar">
                    {locationCountries.length === 0 ? (
                      <p className="col-span-3 text-xs text-white/30 text-center py-3">No results</p>
                    ) : locationCountries.map(ctr => (
                      <button
                        key={ctr.isoCode}
                        onClick={() => { setPickerCountry(ctr.name); setPickerCountrySearch(""); setPickerState(""); setPickerCity(""); geocodeAndFly(ctr.name, 5); }}
                        className="text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors text-white/80 hover:bg-white/10"
                      >
                        {ctr.name}
                      </button>
                    ))}
                  </div>
                )}
                {/* Selected country + states */}
                {pickerCountry && (
                  <>
                    <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                      <button
                        onClick={() => { setPickerCountry(""); setPickerState(""); setPickerCity(""); setPickerCountrySearch(""); flyToLocation(20, 0, 2); }}
                        className="text-xs text-primary/80 hover:text-primary flex items-center gap-1"
                      >
                        ← All countries
                      </button>
                      <span className="text-xs font-bold text-white/80">{pickerCountry}</span>
                    </div>
                    {locationStates.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2 max-h-44 overflow-y-auto hide-scrollbar">
                        {locationStates.map(st => (
                          <button
                            key={st.isoCode}
                            onClick={() => { setPickerState(st.name); setPickerCity(""); geocodeAndFly(`${st.name}, ${pickerCountry}`, 9); }}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${pickerState === st.name ? "bg-primary text-white" : "text-white/80 hover:bg-white/10"}`}
                          >
                            {st.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {/* Cities for selected state */}
                {pickerState && locationCities.length > 0 && (
                  <>
                    <div className="p-3 border-t border-white/10">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-1">Cities in {pickerState}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 max-h-40 overflow-y-auto hide-scrollbar">
                      {locationCities.map(city => (
                        <button
                          key={city.name}
                          onClick={() => { setPickerCity(city.name); geocodeAndFly(`${city.name}, ${pickerState}, ${pickerCountry}`, 12); setShowLocationPicker(false); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${pickerCity === city.name ? "bg-primary text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="p-2 border-t border-white/5 flex justify-between items-center">
                  {(pickerCountry || pickerState || pickerCity) && (
                    <button onClick={() => { setPickerCountry(""); setPickerState(""); setPickerCity(""); setPickerCountrySearch(""); flyToLocation(20, 0, 2); }}
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
            {searchFocused && (streetSuggestions.length > 0 || suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {/* Street / Place results from Nominatim */}
                {streetSuggestions.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Streets &amp; Places</p>
                    </div>
                    {streetSuggestions.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={() => {
                          flyToLocation(parseFloat(place.lat), parseFloat(place.lon), 16);
                          setSearch(place.display_name.split(",")[0]);
                          setStreetSuggestions([]);
                          setSearchFocused(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
                          <Navigation2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{place.display_name.split(",")[0]}</p>
                          <p className="text-xs text-gray-400 truncate">{place.display_name.split(",").slice(1, 3).join(",").trim()}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </>
                )}
                {/* Business results from DB */}
                {suggestions.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Businesses</p>
                    </div>
                    {suggestions.map((biz) => (
                      <button
                        key={biz.id}
                        onClick={() => handleSuggestionClick(biz)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
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
                  </>
                )}
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

      {/* ── Drive Mode Button (left side) ── */}
      <div className="absolute bottom-28 left-4 z-[1000] flex flex-col items-start gap-2">
        <button
          onClick={drivingActive ? stopDriving : openDriveSheet}
          title={drivingActive ? "Stop driving" : "Drive mode"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
            drivingActive
              ? "bg-red-500/90 border border-red-400/60"
              : "glass-panel hover:bg-white/15"
          }`}
        >
          {drivingActive
            ? <Square className="h-4 w-4 text-white fill-white" />
            : <Car className="h-5 w-5 text-white/85" />}
        </button>
      </div>

      {/* ── Recenter Button — shown while driving and map has been panned away ── */}
      <AnimatePresence>
        {drivingActive && driveOffCenter && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={() => {
              const pos = driveCurrentPosRef.current;
              if (!pos) return;
              driveFollowing.current = true;
              setDriveOffCenter(false);
              if (driveSnapTimerRef.current) { clearTimeout(driveSnapTimerRef.current); driveSnapTimerRef.current = null; }
              mapRef.current?.setView(pos, Math.max(mapRef.current?.getZoom() ?? 17, 17), { animate: true, duration: 0.6 });
            }}
            className="absolute bottom-44 left-4 z-[2600] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl"
            style={{ background: "rgba(5,10,30,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(37,99,235,0.5)" }}
          >
            <LocateFixed className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white">Recenter</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── See all riders ── */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowRiderDirectory(true)}
        className="absolute bottom-60 left-4 z-[1000] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl glass-panel"
      >
        <Bike className="h-4 w-4 text-[#4a9eff]" />
        <span className="text-xs font-bold text-white">See all riders</span>
      </motion.button>

      <RiderDirectoryPanel open={showRiderDirectory} onClose={() => setShowRiderDirectory(false)} />

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
        className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1 transition-colors"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))", color: "#1a56db" }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase">Discover more</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.button>

      {/* ── Active Driving Bar (top overlay) ── */}
      <AnimatePresence>
        {drivingActive && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="absolute top-0 left-0 right-0 z-[2500] px-4 pt-10 pb-3"
            style={{ background: "linear-gradient(to bottom, rgba(4,8,26,0.97) 70%, transparent)", backdropFilter: "blur(12px)" }}
          >
            {/* Destination row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/25 flex items-center justify-center flex-shrink-0">
                <Navigation2 className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-blue-400/80 font-semibold uppercase tracking-wider mb-0">Navigating to</p>
                <p className="text-sm font-bold text-white truncate leading-tight">{driveDestName || "Destination"}</p>
              </div>
              <button
                onClick={stopDriving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.88)", border: "1px solid rgba(239,68,68,0.5)" }}
              >
                <Square className="h-3 w-3 fill-white" /> End
              </button>
            </div>

            {/* ETA chips row */}
            {routeInfo && (() => {
              const eta = new Date(Date.now() + routeInfo.durationMin * 60 * 1000);
              const etaStr = eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <div className="flex items-center gap-2">
                  {/* Distance chip */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)" }}>
                    <span className="text-sm font-bold text-white">{routeInfo.distKm.toFixed(1)}</span>
                    <span className="text-[11px] text-white/50 font-medium">km</span>
                  </div>
                  {/* Duration chip */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)" }}>
                    <span className="text-sm font-bold text-white">{routeInfo.durationMin}</span>
                    <span className="text-[11px] text-white/50 font-medium">min</span>
                  </div>
                  {/* ETA arrival chip */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ml-auto" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <span className="text-[11px] text-emerald-400/80 font-medium">ETA</span>
                    <span className="text-sm font-bold text-emerald-300">{etaStr}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nearby Business Alert (drive mode toast) ── */}
      <AnimatePresence>
        {nearbyAlert && (
          <motion.div
            key={nearbyAlert.id}
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="absolute bottom-32 left-4 right-4 z-[3000] rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
            style={{ background: "rgba(5,10,30,0.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(37,99,235,0.35)" }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${CATEGORY_COLORS[nearbyAlert.categoryName ?? ""] ?? DEFAULT_COLOR}25` }}
            >
              <MapPin className="h-5 w-5" style={{ color: CATEGORY_COLORS[nearbyAlert.categoryName ?? ""] ?? DEFAULT_COLOR }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{nearbyAlert.name}</p>
              <p className="text-xs text-white/50 truncate">
                {nearbyAlert.categoryName} · {nearbyAlert.areaName || nearbyAlert.cityName || "Nearby"}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-semibold text-blue-400">Nearby</p>
              <p className="text-xs text-white/30">~150 m</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drive Mode Destination Sheet ── */}
      <AnimatePresence>
        {showDriveSheet && !drivingActive && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute bottom-0 left-0 right-0 z-[3000] rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ background: "rgba(5,10,30,0.97)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "72vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "calc(72vh - 28px)" }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                    <Car className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Drive Mode</h3>
                    <p className="text-xs text-white/40">Real-time business alerts en route</p>
                  </div>
                </div>
                <button onClick={() => setShowDriveSheet(false)} className="p-1.5 rounded-full hover:bg-white/10">
                  <X className="h-4 w-4 text-white/50" />
                </button>
              </div>

              {/* Origin row */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
                <input
                  type="text"
                  value={driveOriginText}
                  onChange={e => {
                    setDriveOriginText(e.target.value);
                    setDriveOrigin(null);
                    setRouteInfo(null);
                  }}
                  placeholder="Starting point…"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
                />
                <button
                  onClick={autoLocateOrigin}
                  title="Use current location"
                  className="flex-shrink-0 p-1.5 rounded-xl hover:bg-blue-500/20 transition-colors"
                >
                  <LocateFixed className={`h-4 w-4 ${driveOrigin ? "text-blue-400" : "text-white/40"}`} />
                </button>
              </div>

              {/* Origin suggestions — inline, no absolute positioning */}
              {driveOriginSuggestions.length > 0 && !driveOrigin && (
                <div
                  className="rounded-2xl overflow-hidden mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {driveOriginSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={async () => {
                        setDriveOriginText(s.label.split(",").slice(0, 2).join(","));
                        setDriveOrigin([s.lat, s.lon]);
                        setDriveOriginSuggestions([]);
                        mapRef.current?.flyTo([s.lat, s.lon], 14, { duration: 1.2 });
                        if (driveDestCoords) await fetchRoute([s.lat, s.lon], driveDestCoords);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0"
                    >
                      <MapPin className="h-4 w-4 text-blue-400/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-white/90 truncate font-medium">{s.label.split(",")[0]}</p>
                        <p className="text-xs text-white/40 truncate">{s.label.split(",").slice(1, 3).join(",")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Destination input */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-1"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Flag className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <input
                  type="text"
                  value={driveDest}
                  onChange={e => {
                    setDriveDest(e.target.value);
                    setDriveDestCoords(null);
                    setRouteInfo(null);
                  }}
                  placeholder="Where to?"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
                />
                {driveDest && (
                  <button onClick={() => { setDriveDest(""); setDriveDestCoords(null); setRouteInfo(null); setDriveSuggestions([]); }}>
                    <X className="h-4 w-4 text-white/30" />
                  </button>
                )}
              </div>

              {/* Destination suggestions — inline, no absolute positioning */}
              {driveSuggestions.length > 0 && !driveDestCoords && (
                <div
                  className="rounded-2xl overflow-hidden mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {driveSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={async () => {
                        const short = s.label.split(",").slice(0, 2).join(",");
                        setDriveDest(short);
                        setDriveDestName(s.label.split(",")[0]);
                        setDriveDestCoords([s.lat, s.lon]);
                        setDriveSuggestions([]);
                        mapRef.current?.flyTo([s.lat, s.lon], 14, { duration: 1.2 });
                        if (driveOrigin) await fetchRoute(driveOrigin, [s.lat, s.lon]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0"
                    >
                      <Flag className="h-4 w-4 text-orange-400/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-white/90 truncate font-medium">{s.label.split(",")[0]}</p>
                        <p className="text-xs text-white/40 truncate">{s.label.split(",").slice(1, 3).join(",")}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Spacer when no suggestions and no route yet */}
              {driveSuggestions.length === 0 && driveOriginSuggestions.length === 0 && !routeInfo && (
                <div className="mb-3" />
              )}

              {/* Route summary card */}
              <AnimatePresence>
                {routeInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl mb-4"
                    style={{ background: "rgba(37,99,235,0.14)", border: "1px solid rgba(37,99,235,0.28)" }}
                  >
                    <Navigation2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{routeInfo.distKm.toFixed(1)} km</p>
                      <p className="text-xs text-white/50">{routeInfo.durationMin} min by car</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-white/35">Fastest route</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Start Driving button */}
              <button
                onClick={startDriving}
                disabled={!driveOrigin || !driveDestCoords || driveLoading}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: (driveOrigin && driveDestCoords && !driveLoading)
                    ? "linear-gradient(135deg,#0547B6,#2563eb)"
                    : "rgba(255,255,255,0.07)",
                  boxShadow: (driveOrigin && driveDestCoords) ? "0 8px 32px rgba(37,99,235,0.45)" : undefined,
                }}
              >
                {driveLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <><Navigation2 className="h-4 w-4" /> Start Driving</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="truncate">{[selected.streetName, selected.areaName, selected.cityName].filter(Boolean).join(", ") || "Location"}</span>
              </div>
              {selected.openingHours && (
                <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  {selected.openingHours}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/${(selected as any).slug ?? selected.id}`)}
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
