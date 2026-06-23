import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useGetBusiness, useListReviews, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Star, ShieldCheck, Phone, MessageCircle, Globe,
  Clock, ArrowLeft, ExternalLink, CheckCircle
} from "lucide-react";
import { MapView } from "@/components/MapView";

export default function BusinessProfilePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const bizId = Number(id);

  const { data: business, isLoading } = useGetBusiness(bizId, { query: { enabled: !!bizId } });
  const { data: reviews } = useListReviews(bizId, { query: { enabled: !!bizId } });
  const createReview = useCreateReview();

  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReview.mutateAsync({ businessId: bizId, data: { reviewerName, rating, comment } });
    qc.invalidateQueries({ queryKey: getListReviewsQueryKey(bizId) });
    setReviewerName(""); setComment(""); setRating(5);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-72 w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Layout>
    );
  }

  if (!business) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Business not found</h2>
          <Button onClick={() => navigate("/businesses")}>Back to Directory</Button>
        </div>
      </Layout>
    );
  }

  const location = [business.address, business.streetName, business.areaName, business.cityName].filter(Boolean).join(", ");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/businesses")} className="mb-6 gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Button>

        {/* Photo Gallery */}
        {business.photos && business.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8 rounded-xl overflow-hidden h-72">
            <img src={business.photos[0].url} alt={business.name} className="col-span-2 row-span-2 w-full h-full object-cover" />
            {business.photos.slice(1, 3).map((p, i) => (
              <img key={p.id} src={p.url} alt={`photo ${i + 2}`} className="w-full h-full object-cover" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {business.featured && (
                  <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">Featured</Badge>
                )}
                {business.verified && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
                {business.categoryName && (
                  <Badge variant="secondary">{business.categoryName}</Badge>
                )}
                {business.plan === "premium" && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Premium</Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">{business.name}</h1>
              {business.rating && (
                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(business.rating!) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                  ))}
                  <span className="text-sm text-muted-foreground">
                    {business.rating} ({business.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {business.description && (
              <div>
                <h3 className="font-semibold mb-2 text-foreground">About</h3>
                <p className="text-muted-foreground leading-relaxed">{business.description}</p>
              </div>
            )}

            {location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{location}</span>
              </div>
            )}

            {/* Map */}
            {business.latitude && business.longitude ? (
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <MapView lat={business.latitude} lon={business.longitude} name={business.name} height={260} />
                <div className="bg-muted/40 px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${business.latitude}&mlon=${business.longitude}#map=17/${business.latitude}/${business.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View larger map <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 h-32 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-7 w-7 mx-auto mb-1.5 text-primary/40" />
                  <p className="text-sm">No GPS coordinates yet</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Reviews */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">Customer Reviews</h3>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl border bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-foreground">{review.reviewerName}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
              )}

              {/* Leave a Review */}
              <div className="mt-6 p-5 rounded-xl border bg-card">
                <h4 className="font-semibold mb-4 text-foreground">Leave a Review</h4>
                <form onSubmit={handleReview} className="space-y-3">
                  <Input
                    placeholder="Your name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Rating</label>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i + 1)}
                          onMouseEnter={() => setHoveredRating(i + 1)}
                          onMouseLeave={() => setHoveredRating(0)}
                        >
                          <Star className={`h-6 w-6 ${i < (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" disabled={createReview.isPending} className="w-full">
                    {createReview.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar: Contact */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl border bg-card sticky top-20">
              <h3 className="font-bold mb-4 text-foreground">Contact Business</h3>
              <div className="space-y-3">
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="text-sm font-medium text-foreground">{business.phone}</div>
                    </div>
                  </a>
                )}
                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">WhatsApp</div>
                      <div className="text-sm font-medium text-foreground">{business.whatsapp}</div>
                    </div>
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Website</div>
                      <div className="text-sm font-medium text-foreground flex items-center gap-1">
                        Visit Website <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  </a>
                )}
                {business.openingHours && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Hours</div>
                      <div className="text-sm font-medium text-foreground">{business.openingHours}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Listed {new Date(business.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
