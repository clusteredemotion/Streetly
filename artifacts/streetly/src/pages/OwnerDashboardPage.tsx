import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBusinesses } from "@workspace/api-client-react";
import { Building2, PlusCircle, Star, ShieldCheck, ArrowRight, Edit2, X, Save, Loader2, Trash2, Image as ImageIcon, Plus } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type BusinessPhoto = { id: number; url: string; caption: string | null };

function EditBusinessModal({ biz, onClose, onSaved }: {
  biz: any; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: biz.name ?? "",
    description: biz.description ?? "",
    phone: biz.phone ?? "",
    whatsapp: biz.whatsapp ?? "",
    website: biz.website ?? "",
    instagramUrl: biz.instagramUrl ?? "",
    facebookUrl: biz.facebookUrl ?? "",
    tiktokUrl: biz.tiktokUrl ?? "",
    youtubeUrl: biz.youtubeUrl ?? "",
    openingHours: biz.openingHours ?? "",
    address: biz.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<BusinessPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "photos">("info");

  useEffect(() => {
    if (!biz.id) return;
    fetch(`${BASE}/api/businesses/${biz.id}/photos`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setPhotos(data) : {})
      .catch(() => {});
  }, [biz.id]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/api/businesses/${biz.id}`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const res = await fetch(`${BASE}/api/businesses/${biz.id}/photos`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ url: newPhotoUrl.trim() }),
      });
      const photo = await res.json();
      setPhotos(p => [...p, photo]);
      setNewPhotoUrl("");
    } finally {
      setAddingPhoto(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    await fetch(`${BASE}/api/businesses/${biz.id}/photos/${photoId}`, { method: "DELETE", headers: authHeader() });
    setPhotos(p => p.filter(ph => ph.id !== photoId));
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div key={key}>
      <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Edit — {biz.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {(["info", "photos"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "text-[#4a9eff] border-b-2 border-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}>
              {tab === "info" ? "Business Info" : `Photos (${photos.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {activeTab === "info" ? (
            <div className="space-y-3">
              {field("Business Name", "name")}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }} />
              </div>
              {field("Phone", "phone")}
              {field("WhatsApp", "whatsapp")}
              {field("Website", "website")}
              {field("Instagram (username)", "instagramUrl")}
              {field("Facebook (page name)", "facebookUrl")}
              {field("TikTok (username)", "tiktokUrl")}
              {field("YouTube (channel)", "youtubeUrl")}
              {field("Address", "address")}
              {field("Opening Hours", "openingHours")}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing photos */}
              {photos.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">No photos yet</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-video">
                      <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <button onClick={() => deletePhoto(photo.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-red-600 text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Add photo */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <label className="block text-xs font-medium text-white/50 mb-1">Add Photo by URL</label>
                <div className="flex gap-2">
                  <input
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                    onKeyDown={(e) => e.key === "Enter" && addPhoto()}
                  />
                  <Button size="sm" onClick={addPhoto} disabled={addingPhoto || !newPhotoUrl.trim()}
                    className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white px-3">
                    {addingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
          {activeTab === "info" && (
            <Button size="sm" onClick={save} disabled={saving}
              className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = useListBusinesses({ limit: 20 });
  const businesses = data?.businesses ?? [];
  const [editBiz, setEditBiz] = useState<any | null>(null);
  const [msaId, setMsaId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) return;
    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => d.msaId && setMsaId(d.msaId))
      .catch(() => {});
  }, []);

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    if (status === "suspended") return "bg-gray-100 text-gray-600";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <Layout>
      <AnimatePresence>
        {editBiz && (
          <EditBusinessModal
            biz={editBiz}
            onClose={() => setEditBiz(null)}
            onSaved={() => { refetch(); setEditBiz(null); }}
          />
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-[#0547B6] to-[#1a6de8] text-white py-10">
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Business Dashboard</h1>
            <p className="text-blue-100 mt-1">Manage your business listings on Streetly</p>
            {msaId && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-xs font-mono font-bold tracking-wider">
                {msaId}
              </span>
            )}
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
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="bg-card border rounded-xl p-5 text-center">
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
              <motion.div key={biz.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all">
                {/* Thumbnail */}
                <div className="cursor-pointer flex-shrink-0" onClick={() => navigate(`/${(biz as any).slug ?? biz.id}`)}>
                  {biz.photos?.[0] ? (
                    <img src={biz.photos[0].url} alt={biz.name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/${(biz as any).slug ?? biz.id}`)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{biz.name}</h3>
                    {biz.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                    {biz.plan === "premium" && <Badge className="bg-purple-100 text-purple-700 text-xs">Premium</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{biz.categoryName} · {biz.streetName}</p>
                  {biz.rating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {biz.rating} ({biz.reviewCount} reviews)
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={statusColor(biz.status)}>{biz.status}</Badge>
                  <Button size="sm" variant="outline"
                    onClick={() => setEditBiz(biz)}
                    className="gap-1 text-primary border-primary/30 hover:bg-primary/10">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
