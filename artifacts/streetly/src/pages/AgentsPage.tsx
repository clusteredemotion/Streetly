import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetAgentLeaderboard, useGetPlatformStats } from "@workspace/api-client-react";
import { formatCurrency, formatCurrencyWithConversion, getLocalConversionText } from "@/lib/utils";
import { useVisitorGeo } from "@/hooks/useVisitorGeo";
import { AGENT_COMMISSION_PER_LISTING, AGENT_HIGH_QUALITY_BONUS, AGENT_CLAIM_BONUS } from "@/lib/constants";
import {
  TrendingUp, MapPin, Camera, CheckCircle, Award, Users,
  Banknote, ArrowRight, Star, Shield
} from "lucide-react";

export default function AgentsPage() {
  const [, navigate] = useLocation();
  const { data: leaderboard } = useGetAgentLeaderboard();
  const { data: stats } = useGetPlatformStats();
  const { geo } = useVisitorGeo();

  const steps = [
    { icon: Users, title: "Create an Account", desc: "Register as a Field Agent on Streetly", num: "01" },
    { icon: Shield, title: "Complete KYC", desc: "Submit your bank details and ID for verification", num: "02" },
    { icon: CheckCircle, title: "Get Approved", desc: "Our team reviews your application within 24–48 hours", num: "03" },
    { icon: MapPin, title: "Register Businesses", desc: "Walk your neighborhood and add businesses to the platform", num: "04" },
    { icon: Banknote, title: "Earn Commissions", desc: "Get paid for every approved listing directly to your bank", num: "05" },
  ];

  const commissions = [
    { label: "Standard Approved Listing", amount: AGENT_COMMISSION_PER_LISTING, color: "bg-blue-50 border-blue-200 text-blue-800" },
    { label: "High-Quality Verified Listing", amount: AGENT_HIGH_QUALITY_BONUS, color: "bg-green-50 border-green-200 text-green-800" },
    { label: "Business Owner Claim Bonus", amount: AGENT_CLAIM_BONUS, color: "bg-orange-50 border-orange-200 text-orange-800" },
  ];

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
              Earn From Your Neighborhood
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Become a{" "}
              <span className="text-yellow-300">Streetly Agent</span>.
              <br />Start Earning Today.
            </h1>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Walk your neighborhood. Take photos. Register local businesses on Streetly.
              Earn {formatCurrencyWithConversion(AGENT_COMMISSION_PER_LISTING, geo)}–{formatCurrencyWithConversion(AGENT_HIGH_QUALITY_BONUS, geo)} for every approved listing — directly to your bank account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#E61515] hover:bg-red-700 border-0 text-white px-10 text-base h-13"
                onClick={() => navigate("/agents/apply")}
              >
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-10">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-12 border-b bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Active Agents", value: stats.totalAgents.toLocaleString() },
                { label: "Businesses Listed", value: stats.totalBusinesses.toLocaleString() },
                { label: "Streets Covered", value: stats.totalStreets.toLocaleString() },
                { label: "Total Paid Out", value: formatCurrency(stats.totalEarningsPaid) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-2xl md:text-3xl font-extrabold text-foreground">{item.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground mt-2">Five simple steps to start earning</p>
        </div>
        <div className="relative max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-5 mb-8 last:mb-0"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {step.num}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
                <p className="text-muted-foreground mt-1">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-6 mt-12 w-px h-8 bg-border" style={{ top: `${i * 80 + 48}px` }} />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Commission Rates */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Commission Structure</h2>
          <p className="text-muted-foreground mt-2">Transparent earnings for every listing you add</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {commissions.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-6 text-center ${c.color}`}
            >
              <div className="text-3xl font-extrabold mb-2">{formatCurrency(c.amount)}</div>
              {getLocalConversionText(c.amount, geo) && (
                <div className="text-xs font-medium opacity-70 mb-1">{getLocalConversionText(c.amount, geo)}</div>
              )}
              <div className="text-sm font-medium">{c.label}</div>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6 max-w-lg mx-auto">
          High-quality listings include minimum 3 photos, GPS coordinates, accurate contact info, and complete business details.
        </p>
      </section>

      <Separator />

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Top Agents This Month</h2>
              <p className="text-muted-foreground mt-2">Our best performers leading the way</p>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.agentId}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? "bg-yellow-400 text-yellow-900" :
                    i === 1 ? "bg-gray-300 text-gray-700" :
                    i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{entry.userName}</div>
                    <div className="text-xs text-muted-foreground">{entry.approvedListings} approved listings</div>
                  </div>
                  <div className="font-bold text-primary text-sm flex-shrink-0">{formatCurrency(entry.totalEarnings)}</div>
                  {i === 0 && <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to Start Earning?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join hundreds of street agents worldwide who are earning real income by mapping local businesses.
        </p>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-10"
          onClick={() => navigate("/agents/apply")}
        >
          Apply as a Street Agent <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </Layout>
  );
}
