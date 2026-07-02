import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ShieldCheck, Clock } from "lucide-react";

interface BusinessCardProps {
  business: {
    id: number;
    slug?: string | null;
    name: string;
    categoryName?: string | null;
    streetName?: string | null;
    areaName?: string | null;
    cityName?: string | null;
    address?: string | null;
    phone?: string | null;
    rating?: number | null;
    reviewCount?: number;
    verified?: boolean;
    featured?: boolean;
    plan?: string;
    openingHours?: string | null;
    photos?: Array<{ id: number; url: string; caption?: string | null }>;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const photo = business.photos?.[0];
  const location = [business.streetName, business.areaName, business.cityName].filter(Boolean).join(", ");

  return (
    <Link href={`/${business.slug ?? business.id}`}>
      <div className="group relative rounded-2xl overflow-hidden bg-card hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col border border-border/60 hover:border-primary/20 card-hover">
        {/* Image */}
        <div className="relative h-52 bg-muted overflow-hidden flex-shrink-0">
          {photo ? (
            <img
              src={photo.url}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
              <span className="text-6xl text-primary/20">🏪</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {business.featured && (
              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-xs font-bold shadow-md">
                ⭐ Featured
              </Badge>
            )}
          </div>

          {business.verified && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
          )}

          {/* Rating overlay on image */}
          {business.rating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full glass shadow-md">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-foreground">{business.rating}</span>
              <span className="text-xs text-muted-foreground">({business.reviewCount ?? 0})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
              {business.name}
            </h3>
          </div>

          {business.categoryName && (
            <Badge variant="secondary" className="w-fit text-xs mb-3 rounded-full font-medium">
              {business.categoryName}
            </Badge>
          )}

          <div className="mt-auto space-y-1.5">
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
            {business.openingHours && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
                <span className="line-clamp-1">{business.openingHours}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
