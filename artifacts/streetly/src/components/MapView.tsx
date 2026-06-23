import { useEffect, useRef, useState, useCallback } from "react";
import { Navigation, MapPin, X, Loader2, AlertCircle } from "lucide-react";

interface NearbyBusiness {
  id: number;
  name: string;
  lat: number;
  lon: number;
  categoryName?: string | null;
}

interface MapViewProps {
  lat: number;
  lon: number;
  name: string;
  height?: number;
  nearbyBusinesses?: NearbyBusiness[];
  showDirectionsButton?: boolean;
}

type NavState = "idle" | "locating" | "routing" | "navigating" | "error";

export function MapView({ lat, lon, name, height = 320, nearbyBusinesses = [], showDirectionsButton = true }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [navState, setNavState] = useState<NavState>("idle");
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (userMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 16, { animate: true });
    }
    setNavState("idle");
    setRouteInfo(null);
  }, [lat, lon]);

  const drawRoute = useCallback(async (L: any, userLat: number, userLon: number) => {
    if (!mapRef.current) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${lon},${lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) throw new Error("No route found");

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(([lng, la]: [number, number]) => [la, lng]);
    const distanceKm = (route.distance / 1000).toFixed(1);
    const mins = Math.ceil(route.duration / 60);
    setRouteInfo({ distance: `${distanceKm} km`, duration: `${mins} min` });

    if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);

    routeLayerRef.current = L.polyline(coords, {
      color: "#0547B6",
      weight: 5,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
      className: "leaflet-route-line",
    }).addTo(mapRef.current);

    const bounds = L.latLngBounds([[userLat, userLon], [lat, lon]]);
    mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
  }, [lat, lon]);

  const updateUserMarker = useCallback((L: any, userLat: number, userLon: number) => {
    if (!mapRef.current) return;

    const html = `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;width:24px;height:24px;
          border-radius:50%;background:rgba(5,71,182,0.25);
          animation:location-pulse-ring 1.8s ease-out infinite;
        "></div>
        <div class="user-location-dot" style="
          width:14px;height:14px;
          background:#0547B6;border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(5,71,182,0.5);
          position:relative;z-index:2;
        "></div>
      </div>
    `;
    const icon = L.divIcon({ className: "", html, iconSize: [24, 24], iconAnchor: [12, 12] });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLon]);
    } else {
      userMarkerRef.current = L.marker([userLat, userLon], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
    }
  }, []);

  const startNavigation = useCallback(async () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setNavState("error");
      return;
    }

    setNavState("locating");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: uLat, longitude: uLon } = pos.coords;
        setNavState("routing");

        const L = (mapRef as any).current?._lRef;
        if (!L) return;

        try {
          updateUserMarker(L, uLat, uLon);
          await drawRoute(L, uLat, uLon);
          setNavState("navigating");

          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) => {
              updateUserMarker(L, p.coords.latitude, p.coords.longitude);
            },
            null,
            { enableHighAccuracy: true, maximumAge: 3000 }
          );
        } catch {
          setErrorMsg("Could not calculate route. Try again.");
          setNavState("error");
        }
      },
      (err) => {
        setErrorMsg(err.code === 1 ? "Location permission denied." : "Could not get your location.");
        setNavState("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [drawRoute, updateUserMarker]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: any;

    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      (mapRef.current as any) = map;
      (mapRef.current as any)._lRef = L;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const bizIconHtml = `
        <div style="
          width:36px;height:36px;
          background:linear-gradient(135deg,#0547B6,#2563eb);
          border-radius:50% 50% 50% 4px;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 4px 16px rgba(5,71,182,0.45);
        "></div>
      `;
      const bizIcon = L.divIcon({
        className: "",
        html: bizIconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      L.marker([lat, lon], { icon: bizIcon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>`)
        .openPopup();

      nearbyBusinesses.forEach((biz) => {
        if (!biz.lat || !biz.lon || (biz.lat === lat && biz.lon === lon)) return;
        const nearbyHtml = `
          <div style="
            width:26px;height:26px;
            background:linear-gradient(135deg,#7c3aed,#a855f7);
            border-radius:50% 50% 50% 3px;
            transform:rotate(-45deg);
            border:2.5px solid white;
            box-shadow:0 3px 10px rgba(124,58,237,0.4);
          "></div>
        `;
        const nearbyIcon = L.divIcon({
          className: "",
          html: nearbyHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -28],
        });
        L.marker([biz.lat, biz.lon], { icon: nearbyIcon })
          .addTo(map)
          .bindPopup(`<strong>${biz.name}</strong>${biz.categoryName ? `<br/><span style="color:#7c3aed;font-weight:500;font-size:11px">${biz.categoryName}</span>` : ""}`);
      });
    };

    init();

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, name]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50" style={{ height }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {showDirectionsButton && (
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
          {navState === "idle" && (
            <button
              onClick={startNavigation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#0547B6,#2563eb)", boxShadow: "0 4px 16px rgba(5,71,182,0.4)" }}
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </button>
          )}

          {(navState === "locating" || navState === "routing") && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white glass-dark">
              <Loader2 className="h-4 w-4 animate-spin" />
              {navState === "locating" ? "Getting your location…" : "Calculating route…"}
            </div>
          )}

          {navState === "navigating" && routeInfo && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-dark">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-sm font-semibold">Navigating</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-white/80 text-xs">{routeInfo.distance}</span>
                <span className="text-white/80 text-xs">·</span>
                <span className="text-white/80 text-xs">{routeInfo.duration}</span>
              </div>
              <button
                onClick={stopNavigation}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white/80 glass-dark hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Stop Navigation
              </button>
            </div>
          )}

          {navState === "error" && (
            <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl glass-dark max-w-[220px]">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white text-xs">{errorMsg}</p>
                <button onClick={() => setNavState("idle")} className="text-blue-300 text-xs mt-1 underline">
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {nearbyBusinesses.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium text-foreground shadow-sm">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            {nearbyBusinesses.length} nearby
          </div>
        </div>
      )}
    </div>
  );
}
