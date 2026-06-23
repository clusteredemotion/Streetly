import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useGetPlatformStats,
  useListCategories,
  useGetFeaturedBusinesses,
} from "@workspace/api-client-react";
import {
  Search, MapPin, Star, ShieldCheck, ArrowRight,
  Building2, Map, Camera, Users, TrendingUp, CheckCircle,
  Zap, Navigation, Globe
} from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";

/* ─── Typewriter hook ─── */
function useTypewriter(words: string[], speed = 90, pause = 2200) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const word = words[wordIdx % words.length];
    const tick = () => {
      if (!deleting) {
        setText(word.substring(0, text.length + 1));
        if (text.length + 1 === word.length) {
          timeout.current = setTimeout(() => setDeleting(true), pause);
          return;
        }
      } else {
        setText(word.substring(0, text.length - 1));
        if (text.length - 1 === 0) {
          setDeleting(false);
          setWordIdx((i) => i + 1);
        }
      }
      timeout.current = setTimeout(tick, deleting ? speed / 2 : speed);
    };
    timeout.current = setTimeout(tick, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout.current);
  }, [text, deleting, wordIdx, words, speed, pause]);

  return text;
}

/* ─── Animated counter ─── */
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" });
    }
  }, [inView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const TYPING_WORDS = ["Street by Street", "Market by Market", "Area by Area", "Block by Block"];

const categoryIcons: Record<string, string> = {
  "Food & Drinks": "🍽", "Retail & Shopping": "🛍", "Health & Wellness": "💊",
  "Automotive": "🚗", "Education": "📚", "Hospitality": "🏨",
  "Financial Services": "🏦", "Technology": "💻", "Beauty & Personal Care": "✨",
  "Professional Services": "💼", "Entertainment": "🎵", "Real Estate": "🏠",
};

const CATEGORY_GRADIENTS = [
  "from-orange-400 to-pink-500", "from-purple-400 to-blue-500",
  "from-green-400 to-emerald-500", "from-yellow-400 to-orange-500",
  "from-blue-400 to-cyan-500", "from-pink-400 to-rose-500",
  "from-indigo-400 to-purple-500", "from-teal-400 to-green-500",
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const typed = useTypewriter(TYPING_WORDS);

  const { data: stats } = useGetPlatformStats();
  const { data: categories } = useListCategories();
  const { data: featuredBusinesses } = useGetFeaturedBusinesses();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/businesses?q=${encodeURIComponent(query)}`);
  };

  return (
    <Layout>
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020818 0%, #0a1628 30%, #0d1f3c 60%, #060e1f 100%)" }}>

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute top-[15%] left-[10%] w-[420px] h-[420px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #0547B6 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="orb-2 absolute top-[40%] right-[8%] w-[360px] h-[360px] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="orb-3 absolute bottom-[10%] left-[40%] w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

        <div className="relative z-10 container mx-auto px-4 pt-28 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Badge className="mb-8 px-4 py-1.5 text-sm font-medium border border-white/10 text-white/80 hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                <Zap className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
                Nigeria's #1 Street Business Directory
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[1.05] tracking-tight mb-2"
            >
              Find Every Business,
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight mb-8 h-[1.2em] flex items-center justify-center"
            >
              <span className="gradient-text">{typed || "\u00a0"}</span>
              <span className="inline-block w-[3px] h-[0.85em] ml-1 rounded-full bg-yellow-400 animate-pulse" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Discover local businesses across Nigeria's streets, markets, and neighborhoods.
              From Adeola Odeku to Admiralty Way — every business, found in seconds.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.4)"
                }}>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    type="search"
                    placeholder="Restaurant, pharmacy, auto shop..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 h-12 text-base rounded-xl border-0 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:bg-white/15"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-7 rounded-xl font-semibold text-base bg-white text-primary hover:bg-white/90 border-0 shadow-lg flex-shrink-0"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>

              {/* Quick links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap items-center justify-center gap-2 mt-5"
              >
                <span className="text-white/35 text-xs">Popular:</span>
                {["Restaurants", "Pharmacies", "Hotels", "Banks", "Salons"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/businesses?q=${tag}`)}
                    className="text-xs px-3 py-1.5 rounded-full text-white/60 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs tracking-widest uppercase">Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      {stats && (
        <section className="py-16 bg-white border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {[
                { label: "Businesses Listed", value: stats.totalBusinesses, icon: Building2, color: "text-blue-600 bg-blue-50" },
                { label: "Streets Covered", value: stats.totalStreets, icon: MapPin, color: "text-violet-600 bg-violet-50" },
                { label: "Cities", value: stats.totalCities, icon: Globe, color: "text-emerald-600 bg-emerald-50" },
                { label: "Field Agents", value: stats.totalAgents, icon: Users, color: "text-orange-600 bg-orange-50" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl hover:shadow-md transition-shadow border border-transparent hover:border-border/50"
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

      {/* ── CATEGORIES ── */}
      {categories && categories.length > 0 && (
        <section className="py-20 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Categories</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Browse by Industry</h2>
              <p className="text-muted-foreground mt-2">Find businesses in any sector across Nigeria</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/businesses")} className="gap-2 hidden sm:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/businesses?categoryId=${cat.id}`)}
                className="group relative p-5 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}`} />
                <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]}`}>
                  {categoryIcons[cat.name] ?? "🏪"}
                </div>
                <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{cat.businessCount ?? 0} businesses</div>
              </motion.button>
            ))}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Button variant="outline" onClick={() => navigate("/businesses")} className="gap-2 rounded-full">
              View All Categories <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ── FEATURED BUSINESSES ── */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-20" style={{ background: "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)" }}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Spotlight</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Featured Businesses</h2>
                <p className="text-muted-foreground mt-2">Premium verified listings on Streetly</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/businesses?featured=true")} className="gap-2 hidden sm:flex">
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

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">How it Works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Built for every Nigerian
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Whether you're a customer, business owner, or field agent — Streetly works for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Navigation,
                title: "Search & Navigate",
                desc: "Search by name, category, or street. Get live directions right inside the app — no redirects, no switching apps.",
                color: "from-blue-500 to-cyan-500",
                num: "01",
              },
              {
                icon: Camera,
                title: "Real Storefront Photos",
                desc: "Every listing has real photos taken by verified field agents — no stock images, just the actual storefront.",
                color: "from-violet-500 to-purple-500",
                num: "02",
              },
              {
                icon: TrendingUp,
                title: "Earn as an Agent",
                desc: "Walk your neighborhood, register businesses, and earn ₦100–₦150 for every approved listing. No experience needed.",
                color: "from-orange-500 to-amber-500",
                num: "03",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ y: -6 }}
                className="relative p-8 rounded-3xl border bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <span className="text-5xl font-black text-muted/20 absolute top-6 right-8 leading-none select-none">
                  {item.num}
                </span>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-20 bg-[#f5f7ff]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Everything you need, in one place
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "📍", title: "Live Location Tracking", desc: "Your position updates in real-time as you move through the city." },
              { icon: "🗺", title: "In-App Directions", desc: "Get turn-by-turn routing to any business without leaving Streetly." },
              { icon: "⭐️", title: "Verified Reviews", desc: "Real customer reviews with ratings on every business profile." },
              { icon: "🛡", title: "Ownership Verification", desc: "Business owners can claim and verify their listings." },
              { icon: "📸", title: "Storefront Photos", desc: "Real photos of businesses taken by our field agents on-location." },
              { icon: "🔍", title: "Street-Level Search", desc: "Search by exact street, area, LGA, or city anywhere in Nigeria." },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-border/50 hover:shadow-md transition-all"
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{feat.icon}</div>
                <div>
                  <h4 className="font-bold text-foreground text-sm mb-1">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENT CTA ── */}
      <section className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020818 0%, #0a1628 50%, #0d1f3c 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-1 absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #0547B6 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="orb-2 absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(50px)" }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 px-4 py-1.5 text-sm border-white/10 text-white/70"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              For Field Agents
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Become a Street Agent.<br className="hidden md:block" /> Start Earning Today.
            </h2>
            <p className="text-white/55 text-lg mb-10 max-w-2xl mx-auto">
              Walk your neighborhood, register businesses, and earn commissions for every approved listing. No experience needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="h-13 px-8 rounded-full font-semibold text-base bg-white text-primary hover:bg-white/90 border-0 shadow-xl"
                onClick={() => navigate("/agents/apply")}
              >
                Apply Now — It's Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 rounded-full font-semibold text-base border-white/20 text-white hover:bg-white/10 bg-transparent"
                onClick={() => navigate("/agents")}
              >
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              {[
                { icon: CheckCircle, text: "₦100–₦150 per approved listing" },
                { icon: CheckCircle, text: "Paid weekly via bank transfer" },
                { icon: CheckCircle, text: "Work your own hours" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-white/55 text-sm">
                  <item.icon className="h-4 w-4 text-green-400" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
