import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Maximize2, Tag, Phone, User, X, Plus, ChevronLeft, ChevronRight, Search, Info } from "lucide-react";
import { cn, getApiBase } from "@/lib/utils";

const BASE = getApiBase();

interface PropertyPhoto {
  id: number;
  url: string;
}

interface Property {
  id: number;
  title: string;
  description: string | null;
  address: string;
  streetId: number | null;
  latitude: number | null;
  longitude: number | null;
  sizeSqft: number | null;
  priceAmount: number | null;
  priceType: "rent" | "lease" | "sale";
  contactName: string;
  contactPhone: string;
  submittedByUserId: number;
  status: string;
  createdAt: string;
  streetName: string | null;
  areaName: string | null;
  cityName: string | null;
  photos: PropertyPhoto[];
}

function PropertyDetailModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-[#0d1b2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Photo Gallery */}
        <div className="w-full md:w-1/2 bg-black/40 relative aspect-video md:aspect-auto">
          {property.photos && property.photos.length > 0 ? (
            <>
              <img 
                src={property.photos[activePhotoIdx].url} 
                alt={property.title} 
                className="w-full h-full object-contain"
              />
              {property.photos.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                  {property.photos.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActivePhotoIdx(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        activePhotoIdx === i ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
              <Building2 className="h-16 w-16 mb-2" />
              <span className="text-sm">No photos available</span>
            </div>
          )}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="hidden md:flex justify-end mb-4">
            <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn(
                  "uppercase text-[10px] font-bold tracking-wider",
                  property.priceType === 'sale' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                  property.priceType === 'lease' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                  "bg-blue-500/20 text-blue-400 border-blue-500/30"
                )}>
                  For {property.priceType}
                </Badge>
                {property.sizeSqft && (
                  <Badge variant="outline" className="text-[10px] border-white/10 text-white/60">
                    {property.sizeSqft.toLocaleString()} sqft
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{property.title}</h2>
              <div className="flex items-center gap-1.5 text-white/60 mt-2 text-sm">
                <MapPin className="h-4 w-4" />
                {property.address}
                {(property.areaName || property.cityName) && (
                   <span>• {property.areaName}{property.areaName && property.cityName ? ', ' : ''}{property.cityName}</span>
                )}
              </div>
            </div>

            <div className="text-3xl font-black text-[#4a9eff]">
              {property.priceAmount ? `₦${property.priceAmount.toLocaleString()}` : "Price on Request"}
              {property.priceType === 'rent' && <span className="text-sm font-normal text-white/40 ml-1">/ year</span>}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Description</h3>
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                {property.description || "No description provided for this property."}
              </p>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-[#4a9eff]/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#4a9eff]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-bold">Contact Name</div>
                    <div className="text-sm text-white font-medium">{property.contactName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-bold">Phone Number</div>
                    <a href={`tel:${property.contactPhone}`} className="text-sm text-white font-medium hover:text-[#4a9eff] transition-colors">
                      {property.contactPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button className="w-full bg-[#4a9eff] hover:bg-[#3a8ef0] text-white h-12 rounded-xl text-base font-bold shadow-lg shadow-[#4a9eff]/20">
                Inquire Now
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Filters
  const [priceType, setPriceType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    fetchProperties();
  }, [priceType, maxPrice]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = `${BASE}/api/properties?`;
      if (priceType !== "all") url += `priceType=${priceType}&`;
      if (maxPrice) url += `maxPrice=${maxPrice}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-[#0547B6] text-white py-16 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full -ml-48 -mb-48 blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent mb-4">
              Commercial Real Estate
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Find Your Next <br />Business Location
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl leading-relaxed">
              Browse vacant shops, offices, and commercial spaces across Nigeria's busiest streets.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and CTA */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-10 -mt-16 relative z-20">
          <div className="w-full lg:w-auto bg-[#0d1b2e] p-2 rounded-2xl shadow-xl border border-white/10 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 sm:w-48">
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger className="bg-white/5 border-transparent text-white h-12 rounded-xl focus:ring-[#4a9eff]">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#4a9eff]" />
                    <SelectValue placeholder="Price Type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2e] border-white/10 text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="lease">For Lease</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 sm:w-64 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/40">
                <span className="text-sm font-bold">₦</span>
              </div>
              <Input 
                type="number" 
                placeholder="Max Price" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-white/5 border-transparent text-white h-12 pl-8 rounded-xl focus:ring-[#4a9eff] placeholder:text-white/20"
              />
            </div>
            <Button 
              onClick={fetchProperties}
              className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white h-12 px-6 rounded-xl font-bold"
            >
              <Search className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>

          <Link href="/properties/submit">
            <Button size="lg" className="bg-white text-[#0547B6] hover:bg-white/90 h-14 px-8 rounded-2xl font-black shadow-xl group transition-all">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
              List a Property
            </Button>
          </Link>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-muted rounded-3xl">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No properties found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any properties matching your criteria. Try adjusting your filters.
            </p>
            <Button 
              variant="link" 
              className="mt-4 text-[#4a9eff]" 
              onClick={() => { setPriceType("all"); setMaxPrice(""); }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((prop, i) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedProperty(prop)}
                className="group cursor-pointer bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-[#4a9eff]/30 transition-all duration-300 flex flex-col h-full"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  {prop.photos?.[0] ? (
                    <img 
                      src={prop.photos[0].url} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className={cn(
                      "shadow-lg uppercase text-[9px] font-black tracking-widest px-2.5 py-1 border-transparent",
                      prop.priceType === 'sale' ? "bg-emerald-500 text-white" :
                      prop.priceType === 'lease' ? "bg-purple-600 text-white" :
                      "bg-[#4a9eff] text-white"
                    )}>
                      {prop.priceType}
                    </Badge>
                  </div>
                  {prop.sizeSqft && (
                    <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                      {prop.sizeSqft.toLocaleString()} SQFT
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-[#4a9eff] transition-colors mb-2 line-clamp-1">
                      {prop.title}
                    </h3>
                    <div className="flex items-start gap-1.5 text-muted-foreground text-xs mb-4">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{prop.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-xl font-black text-foreground">
                      {prop.priceAmount ? `₦${prop.priceAmount.toLocaleString()}` : "Price on Request"}
                      {prop.priceType === 'rent' && <span className="text-[10px] font-normal text-muted-foreground ml-1">/yr</span>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailModal 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
