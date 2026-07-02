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
  ArrowRight, Building2, Users, Globe,
  CheckCircle, MapPin, ChevronRight,
  Star, ShieldCheck, Zap,
} from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";
import { HomeMapView } from "@/components/HomeMapView";

/* ── Animated counter ── */
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
          const dur = 1400;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref}>{display.toLocaleString()}</span>;
}

/* ── Typing Text ── */
function TypingText({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const word = words[idx];
    if (typing) {
      if (text.length < word.length) {
        const t = setTimeout(() => setText(word.slice(0, text.length + 1)), 85);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 45);
        return () => clearTimeout(t);
      } else {
        setIdx((i) => (i + 1) % words.length);
        setTyping(true);
      }
    }
  }, [text, typing, idx, words]);
  return (
    <span className="text-[#4a9eff]">
      {text}
      <span className="animate-pulse opacity-70">|</span>
    </span>
  );
}

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

/* ── Glass card ── */
function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl ${hover ? "hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-300" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { data: stats } = useGetPlatformStats();
  const { data: categories } = useListCategories();
  const { data: featuredBusinesses } = useGetFeaturedBusinesses();

  return (
    <Layout>
      {/* ── 1: FULLSCREEN MAP HERO ── */}
      <HomeMapView />

      {/* ── 2: STATS ── */}
      {stats && (
        <section className="relative py-16 overflow-hidden"
          style={{ background: "linear-gradient(180deg, #060c1e 0%, #08122a 100%)" }}>
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-3">Platform Stats</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Nigeria's Most Complete{" "}
                <TypingText words={["Business Map", "Street Directory", "Discovery Platform"]} />
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Businesses Listed", value: stats.totalBusinesses, icon: Building2, color: "#4a9eff" },
                { label: "Streets Covered", value: stats.totalStreets, icon: MapPin, color: "#a78bfa" },
                { label: "Cities", value: stats.totalCities, icon: Globe, color: "#34d399" },
                { label: "Street Scouts", value: stats.totalAgents, icon: Users, color: "#fb923c" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <GlassCard className="p-6 text-center">
                    <div className="w-11 h-11 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `${item.color}18` }}>
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      <AnimatedNumber value={item.value} />
                    </div>
                    <div className="text-sm text-white/50 mt-1 font-medium">{item.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3: BROWSE CATEGORIES ── */}
      {categories && categories.length > 0 && (
        <section className="py-20" style={{ background: "linear-gradient(180deg, #08122a 0%, #060c1e 100%)" }}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Categories</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Browse by Industry</h2>
                <p className="text-white/50 mt-2">Explore businesses across every sector in Nigeria</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/businesses")}
                className="gap-2 hidden sm:flex rounded-full text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
              >
                All Businesses <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 22 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/businesses?categoryId=${cat.id}`)}
                  className="group relative p-5 rounded-2xl text-left overflow-hidden cursor-pointer transition-all duration-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-[#4a9eff]/30 hover:shadow-[0_0_30px_rgba(74,158,255,0.08)]"
                >
                  <div className="text-2xl mb-3">{CATEGORY_ICONS[cat.name] ?? "🏪"}</div>
                  <div className="font-bold text-sm text-white group-hover:text-[#4a9eff] transition-colors">{cat.name}</div>
                  <div className="text-xs text-white/40 mt-1">{cat.businessCount ?? 0} businesses</div>
                  <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-white/20 group-hover:text-[#4a9eff]/50 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4: FEATURED BUSINESSES ── */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-20" style={{ background: "#060c1e" }}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Spotlight</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Featured Businesses</h2>
                <p className="text-white/50 mt-2">Premium verified listings on Streetly</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/businesses?featured=true")}
                className="gap-2 hidden sm:flex rounded-full text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
              >
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

      {/* ── 5: PROPERTY INTELLIGENCE ── */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #060c1e 0%, #08122a 100%)" }}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 text-xs border-white/10 text-white/60"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              Coming Soon
            </Badge>
            <p className="text-xs font-bold text-[#4a9eff] uppercase tracking-widest mb-2">Property Intelligence</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Find Vacant Commercial Spaces</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">
              Discover vacant shops, offices, and commercial buildings across Nigeria's key business districts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { type: "Vacant Shop", area: "Adeola Odeku St, VI", size: "45 sqm", price: "₦2.5M/yr", tag: "Available Now", color: "#22c55e" },
              { type: "Office Space", area: "Wuse II, Abuja", size: "120 sqm", price: "₦5.8M/yr", tag: "3 Available", color: "#4a9eff" },
              { type: "Commercial Building", area: "Ikeja GRA, Lagos", size: "400 sqm", price: "₦18M/yr", tag: "New Listing", color: "#a78bfa" },
            ].map((prop, i) => (
              <motion.div
                key={prop.area}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
              >
                <GlassCard className="p-5 cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2"
                        style={{ background: `${prop.color}18`, color: prop.color }}>
                        {prop.tag}
                      </span>
                      <h3 className="font-bold text-base text-white">{prop.type}</h3>
                      <p className="text-sm text-white/50 mt-0.5">{prop.area}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: `${prop.color}15` }}>
                      <Building2 className="h-5 w-5" style={{ color: prop.color }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">{prop.size}</span>
                    <span className="font-bold text-white">{prop.price}</span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full w-2/3" style={{ background: prop.color }} />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6: STREET SCOUTS ── */}
      <section className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020818 0%, #0a1628 50%, #060e1f 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #0547B6 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full opacity-12"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(60px)" }} />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            {MOCK_SCOUTS.map((scout, i) => (
              <motion.div
                key={scout.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {i === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">🥇</div>}
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
            <Button size="lg"
              className="h-13 px-8 rounded-full font-semibold text-base bg-white text-[#0547B6] hover:bg-white/90 border-0 shadow-xl"
              onClick={() => navigate("/agents/apply")}>
              Become a Street Scout
            </Button>
            <Button size="lg" variant="outline"
              className="h-13 px-8 rounded-full font-semibold text-base border-white/15 text-white hover:bg-white/10 bg-transparent"
              onClick={() => navigate("/agents")}>
              How it Works <ArrowRight className="h-4 w-4 ml-2" />
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
