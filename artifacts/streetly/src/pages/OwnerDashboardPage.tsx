import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListMyBusinesses } from "@workspace/api-client-react";
import { Building2, PlusCircle, Star, ShieldCheck, ArrowRight, Edit2, X, Save, Loader2, Trash2, Image as ImageIcon, Plus, Package, BarChart3, Eye, MousePointer2, PhoneCall, ShoppingBag, MessageSquare } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MarketplaceItemsModal from "@/components/marketplace/MarketplaceItemsModal";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

function AnalyticsModal({ biz, onClose }: { biz: any; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/businesses/${biz.id}/analytics`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [biz.id]);

  const chartData = useMemo(() => {
    if (!data?.daily) return [];
    // Last 30 days
    const days: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const dayData = data.daily.filter((x: any) => x.day === dayStr);
      days.push({
        day: dayStr,
        views: dayData.find((x: any) => x.eventType === "view")?.count ?? 0,
        clicks: dayData.find((x: any) => x.eventType === "click")?.count ?? 0,
        contacts: dayData.find((x: any) => x.eventType === "contact")?.count ?? 0,
        orders: dayData.find((x: any) => x.eventType === "order")?.count ?? 0,
      });
    }
    return days;
  }, [data]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-card border"
        style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Analytics — {biz.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-muted-foreground">No analytics data found.</div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Views", value: data.totals?.view ?? 0, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Total Clicks", value: data.totals?.click ?? 0, icon: MousePointer2, color: "text-purple-500", bg: "bg-purple-50" },
                  { label: "Total Contacts", value: data.totals?.contact ?? 0, icon: PhoneCall, color: "text-green-500", bg: "bg-green-50" },
                  { label: "Total Orders", value: data.totals?.order ?? 0, icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-xl border bg-card text-center">
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="p-5 border rounded-xl bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-foreground">Traffic & Engagement (Last 30 Days)</h3>
                  <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Views</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Clicks</div>
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} minTickGap={20}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                        labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                      />
                      <Area type="monotone" dataKey="views" name="Views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                      <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border rounded-xl bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Store Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Order Count</span>
                      <span className="font-bold text-foreground">{data.orders?.count ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <span className="text-sm text-green-700">Total Revenue</span>
                      <span className="font-bold text-green-700">₦{(data.orders?.revenue ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Upsell */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-purple-900">Upgrade to Premium</h3>
                    <p className="text-xs text-purple-700 mt-1 mb-4 leading-relaxed">Upgrade to Premium for deeper analytics, including visitor demographics, heatmaps, and conversion tracking.</p>
                    <Button size="sm" className="w-fit bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-full px-5">
                      Upgrade Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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

interface StoreConversation {
  id: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  businessId: number | null;
  businessName: string | null;
  status: string;
  assignedTo: string;
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: { body: string; senderRole: string } | null;
}

export default function OwnerDashboardPage() {
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = useListMyBusinesses();
  const businesses = data ?? [];
  const [editBiz, setEditBiz] = useState<any | null>(null);
  const [itemsBiz, setItemsBiz] = useState<any | null>(null);
  const [analyticsBiz, setAnalyticsBiz] = useState<any | null>(null);
  const [msaId, setMsaId] = useState<string | null>(null);
  const [storeChats, setStoreChats] = useState<StoreConversation[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

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

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) { setChatsLoading(false); return; }
    fetch(`${BASE}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then(r => r.ok ? r.json() : [])
      .then((list: StoreConversation[]) => {
        setStoreChats(list.filter(c => c.assignedTo === "store"));
      })
      .catch(() => {})
      .finally(() => setChatsLoading(false));
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
        {itemsBiz && (
          <MarketplaceItemsModal
            businessId={itemsBiz.id}
            businessName={itemsBiz.name}
            onClose={() => setItemsBiz(null)}
          />
        )}
        {analyticsBiz && (
          <AnalyticsModal
            biz={analyticsBiz}
            onClose={() => setAnalyticsBiz(null)}
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
          <Button className="bg-white text-primary hover:bg-white/90 gap-2" onClick={() => navigate("/business/onboard")}>
            <PlusCircle className="h-4 w-4" /> Add Business
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Listings", value: businesses.length },
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

        {/* Chat Inbox */}
        {(chatsLoading || storeChats.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Customer Chats
                {storeChats.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0) > 0 && (
                  <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {storeChats.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)} new
                  </span>
                )}
              </h2>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate("/messages")}>
                Open full inbox
              </Button>
            </div>
            {chatsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : storeChats.length === 0 ? null : (
              <div className="space-y-2">
                {storeChats.slice(0, 4).map(chat => (
                  <motion.div key={chat.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate("/messages")}
                    className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground truncate">{chat.customerName ?? "Customer"}</span>
                        {chat.businessName && (
                          <span className="text-xs text-muted-foreground truncate">re: {chat.businessName}</span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="ml-auto flex-shrink-0 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage?.body ?? "No messages yet"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </motion.div>
                ))}
                {storeChats.length > 4 && (
                  <button onClick={() => navigate("/messages")}
                    className="w-full py-3 text-sm text-primary hover:underline text-center">
                    View all {storeChats.length} chats →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

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
            <Button className="mt-2" onClick={() => navigate("/business/onboard")}>Add Your First Business</Button>
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
                    onClick={() => navigate("/messages")}
                    className="gap-1 text-primary border-primary/30 hover:bg-primary/10">
                    <MessageSquare className="h-3.5 w-3.5" /> Messages
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => setAnalyticsBiz(biz)}
                    className="gap-1 text-primary border-primary/30 hover:bg-primary/10">
                    <BarChart3 className="h-3.5 w-3.5" /> Analytics
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => setItemsBiz(biz)}
                    className="gap-1 text-primary border-primary/30 hover:bg-primary/10">
                    <Package className="h-3.5 w-3.5" /> Items
                  </Button>
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
