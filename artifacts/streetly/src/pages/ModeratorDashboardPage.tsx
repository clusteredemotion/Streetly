import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Building2, ImageIcon, Star, LifeBuoy, LogOut, Menu, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import AdminSupportTickets from "@/components/admin/AdminSupportTickets";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type Section = "pending" | "photos" | "featured" | "tickets";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "pending", label: "Pending Businesses", icon: <Building2 className="h-4 w-4" /> },
  { id: "photos", label: "Business Photos", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "featured", label: "Featured Order", icon: <Star className="h-4 w-4" /> },
  { id: "tickets", label: "Support Tickets", icon: <LifeBuoy className="h-4 w-4" /> },
];

function usePendingBusinesses() {
  return useQuery({
    queryKey: ["mod", "businesses", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/pending`, { headers: authHeader() });
      return res.json() as Promise<Array<{ id: number; name: string; phone: string | null; address: string | null; status: string; createdAt: string }>>;
    },
  });
}

function useAllBusinesses() {
  return useQuery({
    queryKey: ["mod", "businesses", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{ id: number; name: string; categoryName: string | null; status: string }>>;
    },
  });
}

function useApproveBiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/businesses/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mod", "businesses"] }); },
  });
}

function usePhotos(bizId: number | null) {
  return useQuery({
    queryKey: ["mod", "photos", bizId],
    enabled: bizId !== null,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/${bizId}/photos`, { headers: authHeader() });
      return res.json() as Promise<Array<{ id: number; url: string; caption: string | null }>>;
    },
  });
}

function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bizId, photoId }: { bizId: number; photoId: number }) => {
      await fetch(`${BASE}/api/admin/businesses/${bizId}/photos/${photoId}`, { method: "DELETE", headers: authHeader() });
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["mod", "photos", v.bizId] }); },
  });
}

type FeaturedBiz = { id: number; name: string; categoryName: string | null; sortOrder: number | null };

function useFeatured() {
  return useQuery({
    queryKey: ["mod", "featured"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/featured`, { headers: authHeader() });
      return res.json() as Promise<FeaturedBiz[]>;
    },
  });
}

function useSaveFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: Array<{ id: number; sortOrder: number }>) => {
      const res = await fetch(`${BASE}/api/admin/businesses/featured-order`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify({ order }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mod", "featured"] }); },
  });
}

/* ── Pending Businesses Panel ── */
function PendingSection() {
  const { data: businesses = [], isLoading } = usePendingBusinesses();
  const approve = useApproveBiz();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Pending Businesses</h2>
        <p className="text-sm text-white/40">Approve or reject businesses waiting for review.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No pending businesses
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((biz) => (
            <motion.div key={biz.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl flex-wrap"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{biz.name}</p>
                {biz.address && <p className="text-xs text-white/40 mt-0.5">{biz.address}</p>}
                <p className="text-xs text-white/30">Submitted {new Date(biz.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => approve.mutate({ id: biz.id, approved: true })} disabled={approve.isPending}>
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1"
                  onClick={() => approve.mutate({ id: biz.id, approved: false })} disabled={approve.isPending}>
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Business Photos Panel ── */
function PhotosSection() {
  const { data: businesses = [] } = useAllBusinesses();
  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const { data: photos = [], isLoading: loadingPhotos } = usePhotos(selectedBizId);
  const deletePhoto = useDeletePhoto();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Business Photos</h2>
        <p className="text-sm text-white/40">Review and remove photos for any business.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Select business</label>
        <select value={selectedBizId ?? ""} onChange={e => setSelectedBizId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-sm appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <option value="" style={{ background: "#0d1b2e" }}>— Choose a business —</option>
          {(businesses as any[]).map((b: any) => (
            <option key={b.id} value={b.id} style={{ background: "#0d1b2e" }}>{b.name}</option>
          ))}
        </select>
      </div>
      {selectedBizId !== null && (
        loadingPhotos ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
        ) : photos.length === 0 ? (
          <div className="text-center py-10 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
            No photos for this business
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-white/5">
                <img src={photo.url} alt={photo.caption ?? "photo"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <Button size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => deletePhoto.mutate({ bizId: selectedBizId, photoId: photo.id })}
                    disabled={deletePhoto.isPending}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {photo.caption && (
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white truncate">{photo.caption}</span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ── Featured Order Panel ── */
function FeaturedSection() {
  const { data: rawList = [], isLoading } = useFeatured();
  const [list, setList] = useState<FeaturedBiz[]>([]);
  const [saved, setSaved] = useState(false);
  const saveFeatured = useSaveFeatured();

  if (!isLoading && rawList.length > 0 && list.length === 0) setList([...rawList]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...list];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setList(next);
    setSaved(false);
  };

  const handleSave = async () => {
    await saveFeatured.mutateAsync(list.map((b, i) => ({ id: b.id, sortOrder: i + 1 })));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Featured Business Order</h2>
        <p className="text-sm text-white/40">Reorder which businesses appear first in the Featured section.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No featured businesses yet
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((biz, i) => (
            <motion.div key={biz.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{biz.name}</p>
                {biz.categoryName && <p className="text-xs text-white/40">{biz.categoryName}</p>}
              </div>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-20"
                  style={{ background: i === 0 ? "transparent" : "rgba(255,255,255,0.07)" }}>
                  <span className="text-white/70 text-xs">↑</span>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-20"
                  style={{ background: i === list.length - 1 ? "transparent" : "rgba(255,255,255,0.07)" }}>
                  <span className="text-white/70 text-xs">↓</span>
                </button>
              </div>
            </motion.div>
          ))}
          <div className="pt-2">
            <Button onClick={handleSave} disabled={saveFeatured.isPending}
              className={`w-full gap-2 font-semibold ${saved ? "bg-green-600" : "bg-[#4a9eff] hover:bg-[#3a8ef0]"} text-white`}>
              {saveFeatured.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saved ? "Saved!" : "Save Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function ModeratorDashboardPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("pending");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("streetly_token");
    if (!t) { setChecking(false); return; }
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.role === "moderator") {
          setToken(t);
        } else if (data?.role === "admin") {
          navigate("/admin");
        } else if (data?.role === "scout_manager") {
          navigate("/scout-manager");
        } else {
          localStorage.removeItem("streetly_token");
        }
      })
      .catch(() => { localStorage.removeItem("streetly_token"); })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1428 50%, #060c1a 100%)" }}>
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!token) {
    return (
      <AdminLoginGate
        allowedRoles={["moderator"]}
        portalLabel="Moderator Portal"
        onUnlock={(t) => { setToken(t); }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem("streetly_token");
    setToken(null);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1428 50%, #060c1a 100%)" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex-col md:static md:translate-x-0 ${mobileOpen ? "flex" : "hidden md:flex"}`}
        style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="font-bold text-white text-sm">STREETLY</p>
            <p className="text-[11px] text-[#4a9eff]/70">Moderator Portal</p>
          </div>
          <button className="md:hidden text-white/40 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setActiveSection(id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === id ? "text-white bg-[#4a9eff]/15" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {icon} {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/8">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full gap-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 justify-start">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/8 sticky top-0 z-20"
          style={{ background: "rgba(6,12,26,0.8)", backdropFilter: "blur(12px)" }}>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-white text-sm">{NAV.find(n => n.id === activeSection)?.label}</h1>
            <p className="text-[11px] text-white/30">Content Moderation</p>
          </div>
        </header>
        <div className="p-6">
          {activeSection === "pending" && <PendingSection />}
          {activeSection === "photos" && <PhotosSection />}
          {activeSection === "featured" && <FeaturedSection />}
          {activeSection === "tickets" && <AdminSupportTickets />}
        </div>
      </main>
    </div>
  );
}
