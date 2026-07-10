import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, Store } from "lucide-react";
import MarketplaceSection from "@/components/marketplace/MarketplaceSection";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

export default function BusinessStorePage() {
  const { slug } = useParams() as { slug: string };
  const [, navigate] = useLocation();

  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bizId: number = business?.id ?? 0;

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    fetch(`${BASE}/api/businesses/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setBusiness(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="shimmer h-8 w-64 mb-6 rounded-xl" />
          <div className="shimmer h-40 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!business) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Store className="h-14 w-14 mx-auto mb-4 text-primary/30" />
          <h2 className="text-2xl font-bold mb-4 text-white">Business not found</h2>
          <button
            onClick={() => navigate("/businesses")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: "#060C1E" }}>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="mb-6">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to {business.name}
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-[#4a9eff]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{business.name}</h1>
              <p className="text-sm text-white/40">Full Store</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <MarketplaceSection
              businessId={bizId}
              businessName={business.name}
              businessSlug={slug}
              businessLat={business.latitude ?? null}
              businessLon={business.longitude ?? null}
            />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
