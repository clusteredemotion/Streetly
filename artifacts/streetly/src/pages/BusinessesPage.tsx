import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBusinesses, useListCategories, useListCities } from "@workspace/api-client-react";
import { Search, Filter, X } from "lucide-react";
import { BusinessCard } from "@/components/business/BusinessCard";

export default function BusinessesPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? "");
  const [cityId, setCityId] = useState(params.get("cityId") ?? "");
  const [featured, setFeatured] = useState(params.get("featured") ?? "");
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const queryParams = {
    q: q || undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    cityId: cityId ? Number(cityId) : undefined,
    featured: featured === "true" ? true : undefined,
    limit,
    offset,
  };

  const { data, isLoading } = useListBusinesses(queryParams);
  const { data: categories } = useListCategories();
  const { data: cities } = useListCities();

  const total = data?.total ?? 0;
  const businesses = data?.businesses ?? [];

  const clearFilters = () => {
    setQ(""); setCategoryId(""); setCityId(""); setFeatured(""); setOffset(0);
  };

  const hasFilters = q || categoryId || cityId || featured;

  return (
    <Layout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Business Directory</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search businesses..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setOffset(0); }}
                className="pl-9"
              />
            </div>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === "all" ? "" : v); setOffset(0); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityId} onValueChange={(v) => { setCityId(v === "all" ? "" : v); setOffset(0); }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities?.map(city => (
                  <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching..." : `${total.toLocaleString()} businesses found`}
          </p>
          <div className="flex gap-2">
            {featured !== "true" && (
              <Button variant="outline" size="sm" onClick={() => { setFeatured("true"); setOffset(0); }}>
                Featured Only
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🏪</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No businesses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
            <Button variant="ghost" onClick={clearFilters} className="mt-4">Clear all filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz, i) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BusinessCard business={biz} />
                </motion.div>
              ))}
            </div>

            {total > limit && (
              <div className="flex justify-center gap-3 mt-10">
                <Button variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  Previous
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
                </span>
                <Button variant="outline" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
