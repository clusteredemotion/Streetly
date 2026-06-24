import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetPlatformStats,
  useListCategories,
  useGetFeaturedBusinesses,
} from "@workspace/api-client-react";
import {
  ArrowRight, Building2, Map, Users, TrendingUp,
  CheckCircle, Navigation, Camera, Globe, Star,
  ShieldCheck, MapPin, Zap, ChevronRight
} from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";
import { HomeMapView } from "@/components/HomeMapView";

/* ─── Animated counter (RAF-based, no Framer loop) ─── */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const CATEGORY_GRADIENTS = [
  "from-orange-400 to-pink-500", "from-purple-400 to-blue-500",
  "from-green-400 to-emerald-500", "from-yellow-400 to-orange-500",
  "from-blue-400 to-cyan-500", "from-pink-400 to-rose-500",
  "from-indigo-400 to-purple-500", "from-teal-400 to-green-500",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Drinks": "🍽", "Retail & Shopping": "🛍", "Health & Wellness": "💊",
  "Automotive": "🚗", "Education": "📚", "Hospitality": "🏨",
  "Financial Services": "🏦", "Technology": "💻", "Beauty & Personal Care": "✨",
  "Professional Services": "💼", "Entertainment": "🎵", "Real Estate": "🏠",
};

const MOCK_SCOUTS = [
  { name: "Chukwuemeka A.", area: "Victoria Island", businesses: 142, earnings: "₦21,300" },
  { name: "Fatima M.", area: "Wuse II, Abuja", businesses: 98, earnings: "₦14,700" },
  { name: "Tunde O.", area: "Ikeja, Lagos", businesses: 87, earnings: "₦13,050" },
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { data: stats } = useGetPlatformStats();
  const { data: categories } = useListCategories();
  const { data: featuredBusinesses } = useGetFeaturedBusinesses();

  return (
    <Layout>
      {/* ── SECTION 1: FULLSCREEN MAP HERO ── */}
      <HomeMapView />

      {/* ── SECTION 2: STATS BAR ── */}
      {stats && (
        <section className="py-14 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {[
                { label: "Businesses Listed", value: stats.totalBusinesses, icon: Building2, color: "text-blue-600 bg-blue-50" },
                { label: "Streets Covered", value: stats.totalStreets, icon: MapPin, color: "text-violet-600 bg-violet-50" },
                { label: "Cities", value: stats.totalCities, icon: Globe, color: "text-emerald-600 bg-emerald-50" },
                { label: "Street Scouts", value: stats.totalAgents, icon: Users, color: "text-orange-600 bg-orange-50" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl group hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={item.value} />
                  </span>
                  <span className="text-sm text-muted-foreground mt-1 font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 3: BROWSE CATEGORIES ── */}
      {categories && categories.length > 0 && (
        <section className="py-20 bg-[#f8faff]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Categories</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Browse by Industry</h2>
                <p className="text-muted-foreground mt-2">Explore businesses across every sector in Nigeria</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/businesses")} className="gap-2 hidden sm:flex rounded-full">
                All Businesses <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.93 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/businesses?categoryId=${cat.id}`)}
                  className="group relative p-5 rounded-2xl border bg-white hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}`}>
                    {CATEGORY_ICONS[cat.name] ?? "🏪"}
                  </div>
                  <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cat.businessCount ?? 0} businesses</div>
                  <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 4: FEATURED BUSINESSES ── */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Spotlight</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Featured Businesses</h2>
                <p className="text-muted-foreground mt-2">Premium verified listings on Streetly</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/businesses?featured=true")} className="gap-2 hidden sm:flex rounded-full">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.slice(0, 6).map((biz, i) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                >
                  <BusinessCard business={biz} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 5: PROPERTY INTELLIGENCE (mockup) ── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 text-xs" variant="secondary">Coming Soon</Badge>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Property Intelligence</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Find Vacant Commercial Spaces</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Discover vacant shops, offices, and commercial buildings across Nigeria's key business districts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { type: "Vacant Shop", area: "Adeola Odeku St, VI", size: "45 sqm", price: "₦2.5M/yr", tag: "Available Now", color: "#22c55e" },
              { type: "Office Space", area: "Wuse II, Abuja", size: "120 sqm", price: "₦5.8M/yr", tag: "3 Available", color: "#0ea5e9" },
              { type: "Commercial Building", area: "Ikeja GRA, Lagos", size: "400 sqm", price: "₦18M/yr", tag: "New Listing", color: "#8b5cf6" },
            ].map((prop, i) => (
              <motion.div
                key={prop.area}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="relative p-5 rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                      style={{ background: `${prop.color}18`, color: prop.color }}>
                      {prop.tag}
                    </span>
                    <h3 className="font-bold text-base text-foreground">{prop.type}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{prop.area}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${prop.color}15` }}>
                    <Building2 className="h-5 w-5" style={{ color: prop.color }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{prop.size}</span>
                  <span className="font-bold text-foreground">{prop.price}</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-gray-100">
                  <div className="h-full rounded-full w-2/3" style={{ background: prop.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: STREET SCOUTS ── */}
      <section className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020818 0%, #0a1628 50%, #060e1f 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #0547B6 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="orb-2 absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(50px)" }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge className="mb-4 text-xs border-white/10 text-white/60"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              Street Scouts
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Earn Money Mapping Your City.
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Walk your neighborhood, photograph businesses, and earn for every approved listing.
            </p>
          </motion.div>

          {/* Top scouts leaderboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            {MOCK_SCOUTS.map((scout, i) => (
              <motion.div
                key={scout.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {i === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">🥇</div>
                )}
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-black text-white"
                  style={{ background: ["linear-gradient(135deg,#fbbf24,#f59e0b)", "linear-gradient(135deg,#9ca3af,#6b7280)", "linear-gradient(135deg,#c47d2a,#92400e)"][i] }}>
                  {scout.name[0]}
                </div>
                <p className="font-bold text-white text-sm">{scout.name}</p>
                <p className="text-white/40 text-xs mb-2">{scout.area}</p>
                <p className="text-green-400 font-black text-lg">{scout.earnings}</p>
                <p className="text-white/40 text-xs">{scout.businesses} businesses</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="h-13 px-8 rounded-full font-semibold text-base bg-white text-primary hover:bg-white/90 border-0 shadow-xl"
              onClick={() => navigate("/agents/apply")}
            >
              Become a Street Scout
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 rounded-full font-semibold text-base border-white/15 text-white hover:bg-white/10 bg-transparent"
              onClick={() => navigate("/agents")}
            >
              How it Works
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            {[
              { icon: CheckCircle, text: "₦100–₦150 per approved listing" },
              { icon: CheckCircle, text: "Paid weekly via bank transfer" },
              { icon: CheckCircle, text: "Work your own hours" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-white/45 text-sm">
                <item.icon className="h-4 w-4 text-green-400" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
