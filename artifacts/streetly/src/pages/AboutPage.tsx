import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { useGetPlatformStats } from "@workspace/api-client-react";
import {
  MapPin, Target, Users, Building2, Compass, Heart, ShieldCheck, TrendingUp,
} from "lucide-react";

export default function AboutPage() {
  const { data: stats } = useGetPlatformStats();

  const values = [
    {
      icon: Compass,
      title: "Street-by-Street Discovery",
      desc: "We believe every business — from the biggest storefront to the smallest street vendor — deserves to be found.",
    },
    {
      icon: Users,
      title: "Powered by Communities",
      desc: "Our network of local Street Scouts walks real neighborhoods, verifying businesses in person, one street at a time.",
    },
    {
      icon: ShieldCheck,
      title: "Trust & Verification",
      desc: "Every listing on Streetly is grounded in real, on-the-ground verification — not guesswork or scraped data.",
    },
    {
      icon: Heart,
      title: "Built for Local Economies",
      desc: "We exist to help local businesses get discovered and help communities support the businesses around them.",
    },
  ];

  const statCards = stats
    ? [
        { label: "Businesses Listed", value: stats.totalBusinesses.toLocaleString() },
        { label: "Streets Covered", value: stats.totalStreets.toLocaleString() },
        { label: "Cities", value: stats.totalCities.toLocaleString() },
        { label: "Street Scouts", value: stats.totalAgents.toLocaleString() },
      ]
    : [];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0547B6] via-[#0a5cd8] to-[#1a6de8] text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="mb-6 bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
              About Streetly
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Discovering Every Business,
              <br />
              <span className="text-yellow-300">Every Street</span>
            </h1>
            <p className="text-blue-100 text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
              Streetly is the world's street-by-street business discovery platform — built to map,
              verify, and showcase local businesses anywhere, one neighborhood at a time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {statCards.length > 0 && (
        <section className="py-12 border-b bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {statCards.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-extrabold text-[#0547B6]">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0547B6]/10 flex items-center justify-center mx-auto mb-6">
              <Target className="h-7 w-7 text-[#0547B6]" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Millions of local businesses around the world are invisible online — no listing, no
              reviews, no way for nearby customers to find them. Streetly exists to close that gap.
              We send trained local Street Scouts to physically walk streets, photograph and verify
              real businesses, and bring them onto a single, trustworthy map that anyone can search —
              helping business owners get discovered and helping communities support the businesses
              right around them.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border rounded-2xl p-6 flex gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-[#0547B6]/10 flex items-center justify-center flex-shrink-0">
                  <v.icon className="h-5 w-5 text-[#0547B6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works summary */}
      <section className="py-16 bg-muted/20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0547B6]/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-7 w-7 text-[#0547B6]" />
            </div>
            <h2 className="text-3xl font-bold mb-4">How Streetly Works</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Our Street Scouts map neighborhoods block by block, verifying businesses in person.
              Business owners can also list and manage their own business directly. Every listing is
              searchable by street, category, and city — so anyone, anywhere, can discover what's
              nearby.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 bg-card border rounded-full px-4 py-2">
                <MapPin className="h-4 w-4 text-[#0547B6]" /> Verified on the ground
              </span>
              <span className="inline-flex items-center gap-1.5 bg-card border rounded-full px-4 py-2">
                <TrendingUp className="h-4 w-4 text-[#0547B6]" /> Growing every day
              </span>
              <span className="inline-flex items-center gap-1.5 bg-card border rounded-full px-4 py-2">
                <Users className="h-4 w-4 text-[#0547B6]" /> Built with local communities
              </span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
