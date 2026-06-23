import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/components/business/BusinessCard";
import {
  useListCities,
  useListAreas,
  useListStreets,
  useGetStreetBusinesses,
} from "@workspace/api-client-react";
import { MapPin, ChevronRight, Building2, Grid, List } from "lucide-react";

export default function ExplorePage() {
  const [cityId, setCityId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [streetId, setStreetId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: cities } = useListCities();
  const { data: areas } = useListAreas(cityId!, { query: { enabled: !!cityId } });
  const { data: streets } = useListStreets(areaId!, { query: { enabled: !!areaId } });
  const { data: businesses, isLoading: bizLoading } = useGetStreetBusinesses(streetId!, { query: { enabled: !!streetId } });

  const selectedCity = cities?.find(c => c.id === cityId);
  const selectedArea = areas?.find(a => a.id === areaId);
  const selectedStreet = streets?.find(s => s.id === streetId);

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0547B6] to-[#1a6de8] text-white py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Street Explorer</h1>
            <p className="text-blue-100 text-lg">Navigate Nigeria's business landscape, one street at a time</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Location Cascade */}
        <div className="bg-card border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Select a Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-medium">City</label>
              <Select
                value={cityId ? String(cityId) : ""}
                onValueChange={(v) => {
                  setCityId(Number(v));
                  setAreaId(null);
                  setStreetId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a city..." />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map(city => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {city.name}, {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-medium">Area / District</label>
              <Select
                value={areaId ? String(areaId) : ""}
                onValueChange={(v) => { setAreaId(Number(v)); setStreetId(null); }}
                disabled={!cityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={cityId ? "Select an area..." : "Select a city first"} />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map(area => (
                    <SelectItem key={area.id} value={String(area.id)}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Street */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-medium">Street</label>
              <Select
                value={streetId ? String(streetId) : ""}
                onValueChange={(v) => setStreetId(Number(v))}
                disabled={!areaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={areaId ? "Select a street..." : "Select an area first"} />
                </SelectTrigger>
                <SelectContent>
                  {streets?.map(street => (
                    <SelectItem key={street.id} value={String(street.id)}>
                      {street.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Breadcrumb */}
          {cityId && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-primary font-medium">{selectedCity?.name}</span>
              {areaId && <><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="text-primary font-medium">{selectedArea?.name}</span></>}
              {streetId && <><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="text-primary font-medium">{selectedStreet?.name}</span></>}
            </div>
          )}
        </div>

        {/* Street Banner */}
        {streetId && selectedStreet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-xl text-foreground">{selectedStreet.name}</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  {selectedArea?.name} · {selectedCity?.name} · {selectedCity?.state}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {businesses?.length ?? 0} businesses
                </Badge>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-primary text-white" : "bg-card text-muted-foreground"} transition-colors`}>
                    <Grid className="h-4 w-4" />
                  </button>
                  <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-primary text-white" : "bg-card text-muted-foreground"} transition-colors`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {streetId && (
          bizLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses && businesses.length > 0 ? (
            <AnimatePresence>
              <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {businesses.map((biz, i) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <BusinessCard business={biz} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-16 border rounded-xl bg-card">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No businesses on this street yet</h3>
              <p className="text-muted-foreground text-sm">Be the first agent to register businesses here!</p>
              <Button className="mt-4" onClick={() => window.location.href = "/agents/apply"}>Become an Agent</Button>
            </div>
          )
        )}

        {/* Initial State */}
        {!cityId && (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 mx-auto mb-6 text-primary/30" />
            <h2 className="text-2xl font-bold text-foreground mb-3">Start Exploring</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a city, then an area, then a street to discover all the businesses in that location.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
