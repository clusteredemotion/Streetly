import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  Building2, Map, Camera, Users, TrendingUp, CheckCircle
} from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const { data: stats } = useGetPlatformStats();
  const { data: categories } = useListCategories();
  const { data: featuredBusinesses } = useGetFeaturedBusinesses();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/businesses?q=${encodeURIComponent(query)}`);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    "Food & Drinks": "🍽",
    "Retail & Shopping": "🛍",
    "Health & Wellness": "💊",
    "Automotive": "🚗",
    "Education": "📚",
    "Hospitality": "🏨",
    "Financial Services": "🏦",
    "Technology": "💻",
    "Beauty & Personal Care": "✨",
    "Professional Services": "💼",
    "Entertainment": "🎵",
    "Real Estate": "🏠",
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0547B6] via-[#0a5cd8] to-[#1a6de8] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              Nigeria's Street Business Directory
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Find Every Business,{" "}
              <span className="text-yellow-300">Street by Street</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover local businesses across Nigeria's streets, markets, and neighborhoods.
              From Adeola Odeku to Admiralty Way — every business is here.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by business name, category, or street..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white text-gray-900 border-0 shadow-xl focus-visible:ring-yellow-300 focus-visible:ring-2"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 bg-[#E61515] hover:bg-red-700 text-white font-semibold shadow-xl border-0"
              >
                Explore Businesses
              </Button>
            </form>
          </motion.div>
        </div>
        <div className="h-10 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-12 bg-background border-b">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              {[
                { label: "Businesses Listed", value: stats.totalBusinesses.toLocaleString(), icon: Building2 },
                { label: "Streets Covered", value: stats.totalStreets.toLocaleString(), icon: MapPin },
                { label: "Cities", value: stats.totalCities.toLocaleString(), icon: Map },
                { label: "Field Agents", value: stats.totalAgents.toLocaleString(), icon: Users },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-3xl font-extrabold text-foreground">{item.value}</span>
                  <span className="text-sm text-muted-foreground mt-1">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Category Grid */}
      {categories && categories.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Browse by Category</h2>
              <p className="text-muted-foreground mt-1">Find businesses in your industry of choice</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/businesses")} className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/businesses?categoryId=${cat.id}`)}
                className="group p-5 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="text-2xl mb-2">{categoryIcons[cat.name] ?? "🏪"}</div>
                <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{cat.businessCount ?? 0} businesses</div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Businesses */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Featured Businesses</h2>
                <p className="text-muted-foreground mt-1">Premium verified listings on Streetly</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/businesses?featured=true")} className="gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.slice(0, 6).map((biz, i) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <BusinessCard business={biz} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">How Streetly Works</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Whether you're a customer, business owner, or field agent — Streetly works for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Search & Discover", desc: "Search by name, category, street, or area to find exactly what you need in your neighborhood.", color: "bg-blue-500/10 text-blue-600" },
            { icon: Camera, title: "Real Storefront Photos", desc: "Every listing has real photos taken by verified field agents — no stock images, just reality.", color: "bg-green-500/10 text-green-600" },
            { icon: TrendingUp, title: "Earn as an Agent", desc: "Join our field agent network, register businesses in your area, and earn ₦100–₦150 per approved listing.", color: "bg-orange-500/10 text-orange-600" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center p-8 rounded-2xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-5`}>
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agent CTA */}
      <section className="py-16 bg-gradient-to-r from-[#0547B6] to-[#1a6de8] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Become a Street Agent. Start Earning Today.</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Walk your neighborhood, register businesses, and earn commissions for every approved listing. No experience needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#E61515] hover:bg-red-700 text-white border-0 px-8"
                onClick={() => navigate("/agents")}
              >
                Learn More
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8"
                onClick={() => navigate("/agents/apply")}
              >
                Apply Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
