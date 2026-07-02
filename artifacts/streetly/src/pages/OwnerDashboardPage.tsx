import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBusinesses } from "@workspace/api-client-react";
import { Building2, PlusCircle, Star, ShieldCheck, ArrowRight } from "lucide-react";

// Demo: show all approved businesses as "owned" for demo purposes
export default function OwnerDashboardPage() {
  const [, navigate] = useLocation();
  const { data, isLoading } = useListBusinesses({ limit: 20 });
  const businesses = data?.businesses ?? [];

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-[#0547B6] to-[#1a6de8] text-white py-10">
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Business Dashboard</h1>
            <p className="text-blue-100 mt-1">Manage your business listings on Streetly</p>
          </div>
          <Button className="bg-white text-primary hover:bg-white/90 gap-2" onClick={() => navigate("/businesses")}>
            <PlusCircle className="h-4 w-4" /> Add Business
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Listings", value: data?.total ?? 0 },
            { label: "Approved", value: businesses.filter(b => b.status === "approved").length },
            { label: "Verified", value: businesses.filter(b => b.verified).length },
            { label: "Premium", value: businesses.filter(b => b.plan === "premium").length },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border rounded-xl p-5 text-center"
            >
              <div className="text-3xl font-extrabold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Upgrade CTA */}
        <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-purple-900">Upgrade to Premium</h3>
            <p className="text-sm text-purple-700 mt-1">Get featured placement, unlimited photos, and priority search ranking</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            Upgrade Now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Businesses List */}
        <h2 className="font-bold text-lg text-foreground mb-4">Your Businesses</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 border rounded-xl">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted" />
            <h3 className="font-semibold text-foreground mb-2">No businesses listed yet</h3>
            <Button className="mt-2" onClick={() => navigate("/businesses")}>Add Your First Business</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz, i) => (
              <motion.div
                key={biz.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/${(biz as any).slug ?? biz.id}`)}
              >
                {biz.photos?.[0] ? (
                  <img src={biz.photos[0].url} alt={biz.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{biz.name}</h3>
                    {biz.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                    {biz.plan === "premium" && <Badge className="bg-purple-100 text-purple-700 text-xs">Premium</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {biz.categoryName} · {biz.streetName}
                  </p>
                  {biz.rating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {biz.rating} ({biz.reviewCount} reviews)
                    </div>
                  )}
                </div>
                <Badge className={`${statusColor(biz.status)} flex-shrink-0`}>{biz.status}</Badge>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
