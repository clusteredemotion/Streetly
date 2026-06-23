import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ShieldCheck, Phone, Clock } from "lucide-react";

interface BusinessCardProps {
  business: {
    id: number;
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
    <Link href={`/businesses/${business.id}`}>
      <div className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
          {photo ? (
            <img
              src={photo.url}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-5xl text-primary/30">🏪</span>
            </div>
          )}
          {business.featured && (
            <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 hover:bg-yellow-500 text-xs font-semibold">
              Featured
            </Badge>
          )}
          {business.verified && (
            <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
              {business.name}
            </h3>
            {business.rating && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">{business.rating}</span>
                <span className="text-xs text-muted-foreground">({business.reviewCount ?? 0})</span>
              </div>
            )}
          </div>

          {business.categoryName && (
            <Badge variant="secondary" className="w-fit text-xs mb-3">
              {business.categoryName}
            </Badge>
          )}

          {location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}

          {business.openingHours && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{business.openingHours}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
