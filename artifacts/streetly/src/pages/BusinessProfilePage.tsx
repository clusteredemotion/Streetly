import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useListReviews, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Star, ShieldCheck, Phone, MessageCircle, Globe,
  Clock, ArrowLeft, ExternalLink, CheckCircle, Navigation,
  X, Maximize2, Route, ChevronRight, Share2, Copy, Check
} from "lucide-react";

/* ── Social brand SVGs (lucide doesn't include brand icons) ── */
const IgIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const FbIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const TkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
);
const YtIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
import { ClaimBusinessModal } from "@/components/ClaimBusinessModal";
import { DeliveryRequestModal } from "@/components/DeliveryRequestModal";
import MarketplaceSection from "@/components/marketplace/MarketplaceSection";
import { Truck } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

/* ─── Fullscreen Directions Map Overlay ─── */
function DirectionsMap({ lat, lon, name, onClose }: { lat: number; lon: number; name: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let map: any;
    let L: any;
    let routeLayer: any;

    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current || mapRef.current) return;

      map = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 16,
        zoomControl: false,
      });
      mapRef.current = map;

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 20,
        attribution: "© Esri",
      }).addTo(map);

      // Business marker
      const bizIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.3);animation:location-pulse-ring 1.8s ease-out infinite;"></div>
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#0547B6,#2563eb);border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 20px rgba(37,99,235,0.6);"></div>
        </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });
      L.marker([lat, lon], { icon: bizIcon }).addTo(map)
        .bindPopup(`<b>${name}</b>`).openPopup();

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Try to get user location and draw route
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: uLat, longitude: uLon } = pos.coords;

            const userIcon = L.divIcon({
              className: "",
              html: `<div style="width:16px;height:16px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(34,197,94,0.6);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            L.marker([uLat, uLon], { icon: userIcon }).addTo(map)
              .bindPopup("📍 You are here");

            try {
              const res = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${uLon},${uLat};${lon},${lat}?overview=full&geometries=geojson`
              );
              const data = await res.json();
              if (data.routes?.[0]) {
                const route = data.routes[0];
                routeLayer = L.geoJSON(route.geometry, {
                  style: { color: "#3b82f6", weight: 6, opacity: 0.85, lineCap: "round" },
                }).addTo(map);
                const bounds = routeLayer.getBounds().pad(0.15);
                map.fitBounds(bounds);
              }
            } catch (_) {
              map.fitBounds(L.latLngBounds([[uLat, uLon], [lat, lon]]).pad(0.2));
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    };

    init();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lon, name]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "#060C1E" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 glass-nav z-10 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{name}</p>
          <p className="text-xs text-white/50 flex items-center gap-1">
            <Route className="h-3 w-3" />
            Directions & Route
          </p>
        </div>
        <a
          href={`https://maps.google.com/?q=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Google Maps
        </a>
      </div>
      {/* Map */}
      <div ref={containerRef} className="flex-1" />
    </motion.div>
  );
}

export default function BusinessProfilePage() {
  const { slug } = useParams() as { slug: string };
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bizId: number = business?.id ?? 0;

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    fetch(`${BASE}/api/businesses/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setBusiness(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [slug]);

  const { data: reviews } = useListReviews(bizId, { query: { enabled: !!bizId } });
  const createReview = useCreateReview();

  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightboxIdx(i => (i + 1) % (business?.photos?.length ?? 1));
      if (e.key === "ArrowLeft") setLightboxIdx(i => (i - 1 + (business?.photos?.length ?? 1)) % (business?.photos?.length ?? 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, business?.photos?.length]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business?.name ?? "Streetly Business", url });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReview.mutateAsync({ businessId: bizId, data: { reviewerName, rating, comment } });
    qc.invalidateQueries({ queryKey: getListReviewsQueryKey(bizId) });
    setReviewerName(""); setComment(""); setRating(5);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="shimmer h-72 w-full rounded-3xl mb-6" />
          <div className="shimmer h-8 w-64 mb-3 rounded-xl" />
          <div className="shimmer h-4 w-48 mb-6 rounded-lg" />
          <div className="shimmer h-40 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!business) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <MapPin className="h-14 w-14 mx-auto mb-4 text-primary/30" />
          <h2 className="text-2xl font-bold mb-4 text-white">Business not found</h2>
          <Button onClick={() => navigate("/businesses")}>Back to Directory</Button>
        </div>
      </Layout>
    );
  }

  const locationStr = [business.address, business.streetName, business.areaName, business.cityName].filter(Boolean).join(", ");
  const photos = business.photos ?? [];

  return (
    <Layout>
      <AnimatePresence>
        {directionsOpen && business.latitude && business.longitude && (
          <DirectionsMap
            lat={business.latitude}
            lon={business.longitude}
            name={business.name}
            onClose={() => setDirectionsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ background: "#060C1E" }}>
        <div className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Back button + Share */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/businesses")}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Directory
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                copied
                  ? "bg-green-500/15 border border-green-500/30 text-green-400"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </button>
          </motion.div>

          {/* Photo Gallery — up to 4 boxes, 4th shows +N if more */}
          {photos.length > 0 && (() => {
            const visible = photos.slice(0, 4);
            const overflow = photos.length - 4;
            const count = visible.length;
            const gridClass =
              count === 1 ? "grid-cols-1 grid-rows-1" :
              count === 2 ? "grid-cols-2 grid-rows-1" :
              count === 3 ? "grid-cols-3 grid-rows-1" :
                            "grid-cols-2 grid-rows-2";
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={`grid ${gridClass} gap-2 mb-8 rounded-3xl overflow-hidden border border-white/5`}
                style={{ height: count <= 2 ? "14rem" : "18rem" }}
              >
                {visible.map((p, i) => {
                  const isLast = i === 3;
                  return (
                    <button
                      key={p.id ?? i}
                      className="relative overflow-hidden group"
                      onClick={() => openLightbox(i)}
                    >
                      <img
                        src={p.url}
                        alt={`photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      {isLast && overflow > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(6,12,30,0.68)", backdropFilter: "blur(2px)" }}>
                          <span className="text-3xl font-black text-white tracking-tight">+{overflow}</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                            <Maximize2 className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            );
          })()}

          {/* Lightbox */}
          <AnimatePresence>
            {lightboxOpen && photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
                onClick={closeLightbox}
              >
                {/* Close */}
                <button
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 text-white/70 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.10)" }}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50 font-semibold tabular-nums bg-black/30 px-3 py-1 rounded-full">
                  {lightboxIdx + 1} / {photos.length}
                </div>

                {/* Prev */}
                {photos.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + photos.length) % photos.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                )}

                {/* Image */}
                <motion.img
                  key={lightboxIdx}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  src={photos[lightboxIdx].url}
                  alt={`photo ${lightboxIdx + 1}`}
                  className="max-h-[85vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Next */}
                {photos.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % photos.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}

                {/* Thumbnail strip */}
                {photos.length > 1 && (
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-[90vw]">
                    {photos.map((p, i) => (
                      <button
                        key={p.id ?? i}
                        onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === lightboxIdx ? "border-white scale-110" : "border-white/20 opacity-60 hover:opacity-90"}`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-5"
            >
              {/* Title card */}
              <div className="p-6 rounded-3xl glass-card">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {business.featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">⭐ Featured</span>
                  )}
                  {business.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  {business.categoryName && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">{business.categoryName}</span>
                  )}
                  {business.plan === "premium" && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">Premium</span>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-white tracking-tight">{business.name}</h1>

                {business.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(business.rating!) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-white/60">{business.rating} · {business.reviewCount} reviews</span>
                  </div>
                )}

                {locationStr && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-white/50">
                    <MapPin className="h-4 w-4 text-primary/70 flex-shrink-0" />
                    <span>{locationStr}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {business.description && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="p-6 rounded-3xl glass-card">
                  <h3 className="font-bold text-white/90 mb-3 text-sm uppercase tracking-wider">About</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{business.description}</p>
                </motion.div>
              )}

              {/* Marketplace items */}
              <MarketplaceSection
                businessId={bizId}
                businessName={business.name}
                businessSlug={slug}
                businessLat={business.latitude ?? null}
                businessLon={business.longitude ?? null}
                limit={10}
              />

              {/* Map + Directions */}
              {business.latitude && business.longitude ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="rounded-3xl overflow-hidden glass-card">
                  <div className="h-56 relative">
                    <BusinessMiniMap lat={business.latitude} lon={business.longitude} name={business.name} />
                    <button
                      onClick={() => setDirectionsOpen(true)}
                      className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white btn-glow z-10"
                      style={{ background: "linear-gradient(135deg,#0547B6,#2563eb)" }}
                    >
                      <Navigation className="h-4 w-4" />
                      Directions
                    </button>
                    <button
                      onClick={() => setDirectionsOpen(true)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 hover:bg-black/50 transition-colors z-10"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary/60" />
                      {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${business.latitude},${business.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      Open in Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-3xl glass-card h-32 flex items-center justify-center">
                  <div className="text-center text-white/30">
                    <MapPin className="h-8 w-8 mx-auto mb-1.5" />
                    <p className="text-sm">No GPS coordinates yet</p>
                  </div>
                </div>
              )}

              {/* Reviews */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="space-y-4">
                <h3 className="font-bold text-lg text-white">Customer Reviews</h3>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="p-4 rounded-2xl glass-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-white">{review.reviewerName}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/15"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-white/55">{review.comment}</p>}
                        <p className="text-xs text-white/30 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl glass-card text-sm text-white/40 text-center">
                    No reviews yet. Be the first to review!
                  </div>
                )}

                {/* Leave Review */}
                <div className="p-5 rounded-2xl glass-card">
                  <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Leave a Review</h4>
                  <form onSubmit={handleReview} className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                    <div>
                      <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Rating</label>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button key={i} type="button"
                            onClick={() => setRating(i + 1)}
                            onMouseEnter={() => setHoveredRating(i + 1)}
                            onMouseLeave={() => setHoveredRating(0)}
                          >
                            <Star className={`h-7 w-7 transition-colors ${i < (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Share your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                    <Button type="submit" disabled={createReview.isPending} className="w-full btn-glow">
                      {createReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </motion.div>

            {/* Sidebar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="space-y-4">
              <div className="p-5 rounded-3xl glass-card sticky top-24">
                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contact</h3>
                <div className="space-y-2.5">
                  {business.phone && (
                    <a href={`tel:${business.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Phone</div>
                        <div className="text-sm font-semibold text-white truncate">{business.phone}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {business.whatsapp && (
                    <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-green-500/8 hover:bg-green-500/15 border border-green-500/15 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">WhatsApp</div>
                        <div className="text-sm font-semibold text-white truncate">{business.whatsapp}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {business.website && (
                    <a href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                        <Globe className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Website</div>
                        <div className="text-sm font-semibold text-white/80 flex items-center gap-1">Visit <ExternalLink className="h-3 w-3" /></div>
                      </div>
                    </a>
                  )}

                  {/* ── Social Media (always shown) ── */}
                  <div className="mt-2">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2 px-1">Social Media</div>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Instagram */}
                      {(business as any).instagramUrl ? (
                        <a href={`https://instagram.com/${(business as any).instagramUrl}`}
                          target="_blank" rel="noreferrer"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:scale-105 active:scale-95"
                          style={{ background: "linear-gradient(135deg,rgba(131,58,180,0.18),rgba(253,29,29,0.12),rgba(252,176,69,0.12))", border: "1px solid rgba(131,58,180,0.25)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" }}>
                            <IgIcon />
                          </div>
                          <span className="text-[10px] text-white/60 font-medium">Instagram</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl opacity-25 cursor-not-allowed"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)" }}>
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40"><IgIcon /></div>
                          <span className="text-[10px] text-white/40 font-medium">Instagram</span>
                        </div>
                      )}
                      {/* Facebook */}
                      {(business as any).facebookUrl ? (
                        <a href={`https://facebook.com/${(business as any).facebookUrl}`}
                          target="_blank" rel="noreferrer"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:scale-105 active:scale-95"
                          style={{ background: "rgba(24,119,242,0.12)", border: "1px solid rgba(24,119,242,0.25)" }}>
                          <div className="w-8 h-8 rounded-xl bg-[#1877f2] flex items-center justify-center text-white"><FbIcon /></div>
                          <span className="text-[10px] text-white/60 font-medium">Facebook</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl opacity-25 cursor-not-allowed"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)" }}>
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40"><FbIcon /></div>
                          <span className="text-[10px] text-white/40 font-medium">Facebook</span>
                        </div>
                      )}
                      {/* TikTok */}
                      {(business as any).tiktokUrl ? (
                        <a href={`https://tiktok.com/@${(business as any).tiktokUrl}`}
                          target="_blank" rel="noreferrer"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:scale-105 active:scale-95"
                          style={{ background: "rgba(255,0,80,0.10)", border: "1px solid rgba(255,0,80,0.2)" }}>
                          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white"><TkIcon /></div>
                          <span className="text-[10px] text-white/60 font-medium">TikTok</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl opacity-25 cursor-not-allowed"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)" }}>
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40"><TkIcon /></div>
                          <span className="text-[10px] text-white/40 font-medium">TikTok</span>
                        </div>
                      )}
                      {/* YouTube */}
                      {(business as any).youtubeUrl ? (
                        <a href={`https://youtube.com/@${(business as any).youtubeUrl}`}
                          target="_blank" rel="noreferrer"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors hover:scale-105 active:scale-95"
                          style={{ background: "rgba(255,0,0,0.10)", border: "1px solid rgba(255,0,0,0.25)" }}>
                          <div className="w-8 h-8 rounded-xl bg-[#ff0000] flex items-center justify-center text-white"><YtIcon /></div>
                          <span className="text-[10px] text-white/60 font-medium">YouTube</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl opacity-25 cursor-not-allowed"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.10)" }}>
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40"><YtIcon /></div>
                          <span className="text-[10px] text-white/40 font-medium">YouTube</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {business.openingHours && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Hours</div>
                        <div className="text-sm font-semibold text-white">{business.openingHours}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Directions CTA */}
                {business.latitude && business.longitude && (
                  <button
                    onClick={() => setDirectionsOpen(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white btn-glow transition-all"
                    style={{ background: "linear-gradient(135deg,#0547B6,#2563eb)" }}
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </button>
                )}

                {/* Request Delivery CTA */}
                <button
                  onClick={() => setDeliveryOpen(true)}
                  className="w-full mt-2.5 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: "rgba(74,158,255,0.12)", border: "1px solid rgba(74,158,255,0.3)", color: "#4a9eff" }}
                >
                  <Truck className="h-4 w-4" />
                  Request Delivery
                </button>

                <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                  <p className="text-xs text-white/30">
                    Listed {new Date(business.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                  </p>
                  {!business.ownerId && (
                    <button
                      onClick={() => setClaimOpen(true)}
                      className="w-full flex items-center gap-2 p-3.5 rounded-2xl border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors text-sm text-primary/80"
                    >
                      <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold">Is this your business?</div>
                        <div className="text-xs text-white/30">Claim ownership →</div>
                      </div>
                    </button>
                  )}
                  {business.ownerId && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-xl px-3 py-2.5 border border-green-500/20">
                      <CheckCircle className="h-4 w-4" />
                      Verified owner account
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <ClaimBusinessModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        businessId={bizId}
        businessName={business.name}
      />
      <DeliveryRequestModal
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        businessId={bizId}
        businessName={business.name}
        businessLat={business.latitude ?? null}
        businessLon={business.longitude ?? null}
      />
    </Layout>
  );
}

/* ─── Mini map inside business profile ─── */
function BusinessMiniMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    const init = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#0547B6,#2563eb);border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 16px rgba(37,99,235,0.6);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      L.marker([lat, lon], { icon }).addTo(map);
    };
    init();
    return () => { if (map) { map.remove(); } };
  }, [lat, lon]);

  return <div ref={containerRef} className="w-full h-full" />;
}
