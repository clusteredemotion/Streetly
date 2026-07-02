import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetAdminStats,
  useGetPendingBusinesses,
  useGetPendingAgents,
  useApproveBusiness,
  useApproveAgent,
  getGetPendingBusinessesQueryKey,
  getGetPendingAgentsQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, Users, TrendingUp, AlertCircle, CheckCircle, XCircle,
  ShieldCheck, Plus, Edit2, LogIn, CreditCard, X, Save, ChevronDown,
  Loader2, Eye, EyeOff, User, MapPin, Wallet, ExternalLink,
  FileText, ZoomIn, Camera, List, Key, Trash2, Ban, ImageIcon,
  MessageSquare, Star, BarChart2, ChevronRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AddBusinessForm from "@/components/admin/AddBusinessForm";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminMessages from "@/components/admin/AdminMessages";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

/* ── Shared data hooks ── */
function usePendingClaims() {
  return useQuery({
    queryKey: ["admin", "claims", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/claims/pending`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; businessId: number; businessName: string; userId: number;
        claimerName: string; claimerEmail: string; claimerPhone: string | null;
        proofNote: string | null; status: string; createdAt: string;
      }>>;
    },
  });
}

function useAllAgents() {
  return useQuery({
    queryKey: ["admin", "agents", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/agents/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; userId: number; status: string;
        fullName: string | null; age: number | null; address: string | null;
        bankName: string | null; accountNumber: string | null; accountName: string | null;
        idType: string | null; idNumber: string | null;
        totalEarnings: number; availableBalance: number;
        passportPhotoUrl: string | null; ninSlipUrl: string | null; createdAt: string;
        userName: string | null; userEmail: string | null; userRole: string | null;
      }>>;
    },
  });
}

function useAllUsers() {
  return useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/users/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; name: string; email: string; role: string; createdAt: string;
        registrationIp: string | null; passwordHash: string | null;
      }>>;
    },
  });
}

function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/reset-password`, {
        method: "POST", headers: authHeader(), body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
  });
}

function usePendingWithdrawals() {
  return useQuery({
    queryKey: ["admin", "withdrawals", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/withdrawals`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; agentId: number; amount: number; status: string; createdAt: string;
        agentFullName: string | null; agentBankName: string | null;
        agentAccountNumber: string | null; agentAccountName: string | null;
        agentAvailableBalance: number | null;
      }>>;
    },
  });
}

function useApproveClaim() {
  return useMutation({
    mutationFn: async ({ id, approved, adminNote }: { id: number; approved: boolean; adminNote?: string }) => {
      const res = await fetch(`${BASE}/api/admin/claims/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved, adminNote }),
      });
      return res.json();
    },
  });
}

function useApproveWithdrawal() {
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/withdrawals/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
  });
}

type FeaturedBiz = { id: number; name: string; categoryName: string | null; sortOrder: number | null; verified: boolean };

function useFeaturedOrder() {
  return useQuery({
    queryKey: ["admin", "businesses", "featured-order"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/featured`, { headers: authHeader() });
      return res.json() as Promise<FeaturedBiz[]>;
    },
  });
}

function useSaveFeaturedOrder() {
  return useMutation({
    mutationFn: async (order: Array<{ id: number; sortOrder: number }>) => {
      const res = await fetch(`${BASE}/api/admin/businesses/featured-order`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify({ order }),
      });
      return res.json();
    },
  });
}

type AdminBusiness = {
  id: number; name: string; description: string | null;
  phone: string | null; whatsapp: string | null; website: string | null;
  address: string | null; openingHours: string | null;
  latitude: number | null; longitude: number | null;
  status: string; verified: boolean; featured: boolean;
  categoryId: number | null; streetId: number | null;
  categoryName: string | null; streetName: string | null;
  createdAt: string;
  agentId: number | null;
  agentFullName: string | null;
  agentUserName: string | null;
  agentUserEmail: string | null;
  agentBankName: string | null;
  agentAccountNumber: string | null;
  agentAccountName: string | null;
  agentStatus: string | null;
  agentPassportPhotoUrl: string | null;
  agentIdType: string | null;
  agentIdNumber: string | null;
  agentAddress: string | null;
  agentTotalEarnings: number | null;
};

function useAllBusinesses() {
  return useQuery({
    queryKey: ["admin", "businesses", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/all`, { headers: authHeader() });
      return res.json() as Promise<AdminBusiness[]>;
    },
  });
}

function useAdminUpdateBusiness() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`${BASE}/api/admin/businesses/${id}`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}

function useUpdateAgent() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`${BASE}/api/admin/agents/${id}`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}

function useUpdateUser() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}`, {
        method: "PUT", headers: authHeader(), body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}

function useSuspendUser() {
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/suspend`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ suspend }),
      });
      return res.json();
    },
  });
}

function useDeleteUser() {
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/admin/users/${id}`, { method: "DELETE", headers: authHeader() });
    },
  });
}

function useSuspendAgent() {
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/agents/${id}/suspend`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ suspend }),
      });
      return res.json();
    },
  });
}

function useDeleteAgent() {
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/admin/agents/${id}`, { method: "DELETE", headers: authHeader() });
    },
  });
}

function useSuspendBusiness() {
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/businesses/${id}/suspend`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ suspend }),
      });
      return res.json();
    },
  });
}

function useDeleteBusiness() {
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/admin/businesses/${id}`, { method: "DELETE", headers: authHeader() });
    },
  });
}

function useAllKYC() {
  return useQuery({
    queryKey: ["admin", "kyc"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/kyc`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; userId: number; status: string; fullName: string | null;
        idType: string | null; idNumber: string | null;
        passportPhotoUrl: string | null; ninSlipUrl: string | null;
        createdAt: string; userName: string | null; userEmail: string | null;
      }>>;
    },
  });
}

function useAdminBusinessPhotos(bizId: number | null) {
  return useQuery({
    queryKey: ["admin", "business-photos", bizId],
    enabled: bizId !== null,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/businesses/${bizId}/photos`, { headers: authHeader() });
      return res.json() as Promise<Array<{ id: number; url: string; caption: string | null }>>;
    },
  });
}

function useAddAdminPhoto() {
  return useMutation({
    mutationFn: async ({ bizId, url }: { bizId: number; url: string }) => {
      const res = await fetch(`${BASE}/api/admin/businesses/${bizId}/photos`, {
        method: "POST", headers: authHeader(), body: JSON.stringify({ url }),
      });
      return res.json();
    },
  });
}

function useDeleteAdminPhoto() {
  return useMutation({
    mutationFn: async ({ bizId, photoId }: { bizId: number; photoId: number }) => {
      await fetch(`${BASE}/api/admin/businesses/${bizId}/photos/${photoId}`, {
        method: "DELETE", headers: authHeader(),
      });
    },
  });
}

/* ── Confirm Delete Modal ── */
function ConfirmDeleteModal({ label, onConfirm, onClose, loading }: {
  label: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "#0d1b2e", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Confirm Delete</h3>
            <p className="text-xs text-white/50 mt-0.5">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/70 mb-5">Delete <span className="font-semibold text-white">{label}</span>? All related data will be permanently removed.</p>
        <div className="flex gap-3">
          <Button size="sm" variant="ghost" onClick={onClose} className="flex-1 text-white/50 hover:text-white">Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    suspended: "bg-gray-100 text-gray-700 border-gray-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

/* ── Edit Business Modal ── */
function EditBusinessModal({ biz, onClose, onSaved }: {
  biz: AdminBusiness; onClose: () => void; onSaved: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "photos">("info");
  const [form, setForm] = useState({
    name: biz.name,
    description: biz.description ?? "",
    phone: biz.phone ?? "",
    whatsapp: biz.whatsapp ?? "",
    website: biz.website ?? "",
    instagramUrl: (biz as any).instagramUrl ?? "",
    facebookUrl: (biz as any).facebookUrl ?? "",
    tiktokUrl: (biz as any).tiktokUrl ?? "",
    youtubeUrl: (biz as any).youtubeUrl ?? "",
    openingHours: biz.openingHours ?? "",
    address: biz.address ?? "",
    latitude: biz.latitude?.toString() ?? "",
    longitude: biz.longitude?.toString() ?? "",
    status: biz.status,
    verified: biz.verified,
    featured: biz.featured,
  });
  const update = useAdminUpdateBusiness();
  const { data: photos, refetch: refetchPhotos } = useAdminBusinessPhotos(biz.id);
  const addPhoto = useAddAdminPhoto();
  const deletePhoto = useDeleteAdminPhoto();
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const qc = useQueryClient();

  const save = async () => {
    await update.mutateAsync({ id: biz.id, data: form });
    onSaved();
    onClose();
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    await addPhoto.mutateAsync({ bizId: biz.id, url: newPhotoUrl.trim() });
    setNewPhotoUrl("");
    refetchPhotos();
  };

  const handleDeletePhoto = async (photoId: number) => {
    await deletePhoto.mutateAsync({ bizId: biz.id, photoId });
    refetchPhotos();
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div key={key}>
      <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Edit Business — {biz.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {/* Tab switcher */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {(["info", "photos"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? "text-[#4a9eff] border-b-2 border-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}>
              {tab === "info" ? "Business Info" : `Photos (${photos?.length ?? 0})`}
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
              <div className="grid grid-cols-2 gap-3">
                {field("Latitude", "latitude", "number")}
                {field("Longitude", "longitude", "number")}
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1">Status</label>
                <div className="relative">
                  <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    {["pending", "approved", "rejected", "suspended"].map(s => (
                      <option key={s} value={s} style={{ background: "#0d1b2e" }}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.verified} onChange={(e) => setForm(f => ({ ...f, verified: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#4a9eff]" />
                  <span className="text-sm text-white/70">Verified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#4a9eff]" />
                  <span className="text-sm text-white/70">Featured</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!photos?.length ? (
                <div className="text-center py-8 text-white/30 text-sm">No photos yet</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-video bg-white/5">
                      <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                      <button onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-red-600/90 text-white">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <label className="block text-xs font-medium text-white/50 mb-1">Add Photo by URL</label>
                <div className="flex gap-2">
                  <input value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPhoto()} />
                  <Button size="sm" onClick={handleAddPhoto} disabled={addPhoto.isPending || !newPhotoUrl.trim()}
                    className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white px-3">
                    {addPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
          {activeTab === "info" && (
            <Button size="sm" onClick={save} disabled={update.isPending}
              className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5">
              {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Edit Agent Modal ── */
function EditAgentModal({ agent, onClose, onSaved }: {
  agent: ReturnType<typeof useAllAgents>["data"] extends Array<infer T> ? T : never;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: agent.fullName ?? "",
    age: agent.age?.toString() ?? "",
    address: agent.address ?? "",
    bankName: agent.bankName ?? "",
    accountNumber: agent.accountNumber ?? "",
    accountName: agent.accountName ?? "",
    idType: agent.idType ?? "",
    idNumber: agent.idNumber ?? "",
    status: agent.status,
  });
  const update = useUpdateAgent();

  const save = async () => {
    await update.mutateAsync({ id: agent.id, data: { ...form, age: form.age ? Number(form.age) : undefined } });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Edit Agent #{agent.id}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Age", key: "age", type: "number" },
            { label: "Address", key: "address" },
            { label: "Bank Name", key: "bankName" },
            { label: "Account Number", key: "accountNumber" },
            { label: "Account Name", key: "accountName" },
            { label: "ID Type", key: "idType" },
            { label: "ID Number", key: "idNumber" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
              <input
                type={type ?? "text"}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {["pending", "approved", "rejected", "suspended"].map(s => (
                  <option key={s} value={s} style={{ background: "#0d1b2e" }}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
          <Button size="sm" onClick={save} disabled={update.isPending}
            className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5">
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Agent Profile Modal ── */
function AgentProfileModal({ agent, onClose, onEdit }: {
  agent: AdminBusiness;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const agentName = agent.agentFullName ?? agent.agentUserName ?? `Agent #${agent.agentId}`;
  const [agentListings, setAgentListings] = useState<Array<{ id: number; name: string; status: string; categoryName: string | null; createdAt: string }>>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (!agent.agentId) return;
    fetch(`${BASE}/api/agents/${agent.agentId}/listings`)
      .then(r => r.json())
      .then(data => setAgentListings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, [agent.agentId]);

  const approvedCount = agentListings.filter(l => l.status === "approved").length;
  const pendingCount = agentListings.filter(l => l.status === "pending").length;

  const infoRows = [
    { label: "Email", value: agent.agentUserEmail },
    { label: "Address", value: agent.agentAddress },
    { label: "ID Type", value: agent.agentIdType?.toUpperCase() },
    { label: "ID Number", value: agent.agentIdNumber },
    { label: "Bank", value: agent.agentBankName },
    { label: "Account Number", value: agent.agentAccountNumber },
    { label: "Account Name", value: agent.agentAccountName },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Agent Profile</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {agent.agentPassportPhotoUrl ? (
              <img src={agent.agentPassportPhotoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/15 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)" }}>
                <User className="h-8 w-8 text-[#4a9eff]" />
              </div>
            )}
            <div>
              <div className="text-base font-bold text-white">{agentName}</div>
              <div className="text-xs text-white/40 mt-0.5">{agent.agentUserEmail ?? "—"}</div>
              <div className="flex items-center gap-2 mt-1.5">
                {agent.agentStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    agent.agentStatus === "approved" ? "bg-green-500/15 text-green-400 border-green-500/30" :
                    agent.agentStatus === "pending" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                    "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}>{agent.agentStatus}</span>
                )}
                <span className="text-xs text-[#4a9eff] font-semibold">Agent #{agent.agentId}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Listings", value: agentListings.length, icon: Building2, color: "text-[#4a9eff]", bg: "bg-[#4a9eff]/10" },
              { label: "Approved", value: approvedCount, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Total Earned", value: `₦${(agent.agentTotalEarnings ?? 0).toLocaleString()}`, icon: Wallet, color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-base font-bold text-white">{loadingListings ? "…" : s.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {infoRows.filter(r => r.value).map((row, i, arr) => (
              <div key={row.label}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < arr.length - 1 ? "border-b border-white/5" : ""}`}
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}
              >
                <span className="text-xs text-white/40 w-28 flex-shrink-0">{row.label}</span>
                <span className="text-xs text-white font-medium truncate">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Listings submitted by this agent */}
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
              Businesses Registered ({agentListings.length})
            </h3>
            {loadingListings ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                ))}
              </div>
            ) : agentListings.length === 0 ? (
              <div className="text-center py-6 text-sm text-white/30">No listings registered yet</div>
            ) : (
              <div className="space-y-1.5">
                {agentListings.map(l => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Building2 className="h-3.5 w-3.5 text-[#4a9eff] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{l.name}</div>
                      <div className="text-[10px] text-white/40">{l.categoryName ?? "—"} · {new Date(l.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      l.status === "approved" ? "bg-green-500/15 text-green-400 border-green-500/25" :
                      l.status === "pending" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                      "bg-red-500/15 text-red-400 border-red-500/25"
                    }`}>{l.status}</span>
                    {l.status === "approved" && (
                      <span className="text-[10px] text-green-400 font-bold">+₦100</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingCount > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2 text-xs"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-amber-300">{pendingCount} listing{pendingCount !== 1 ? "s" : ""} from this agent still pending review</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 flex-shrink-0">
          {onEdit && (
            <Button size="sm" onClick={onEdit}
              className="gap-1.5 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white flex-1">
              <Edit2 className="h-3.5 w-3.5" /> Edit Agent Profile
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Agent Review Modal (full profile for pending approval) ── */
function AgentReviewModal({ agent, onClose, onApprove, onReject, approving }: {
  agent: {
    id: number; fullName: string | null; age: number | null; address: string | null;
    bankName: string | null; accountNumber: string | null; accountName: string | null;
    idType: string | null; idNumber: string | null;
    passportPhotoUrl: string | null; ninSlipUrl: string | null;
    userEmail: string | null; userName: string | null; createdAt: string; status: string;
  };
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  const [imgView, setImgView] = useState<string | null>(null);
  const name = agent.fullName ?? agent.userName ?? `Agent #${agent.id}`;

  const infoRows = [
    { label: "Full Name", value: name },
    { label: "Email", value: agent.userEmail },
    { label: "Age", value: agent.age ? `${agent.age} years` : null },
    { label: "Address", value: agent.address },
    { label: "Applied", value: new Date(agent.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
  ].filter(r => r.value);

  const bankRows = [
    { label: "Bank", value: agent.bankName },
    { label: "Account No.", value: agent.accountNumber },
    { label: "Account Name", value: agent.accountName },
  ].filter(r => r.value);

  const idRows = [
    { label: "ID Type", value: agent.idType?.toUpperCase().replace("_", " ") },
    { label: "ID Number", value: agent.idNumber },
  ].filter(r => r.value);

  return (
    <>
      {/* Full image lightbox */}
      <AnimatePresence>
        {imgView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setImgView(null)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <img src={imgView} alt="Document" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          style={{ background: "#0b1929", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Agent Application Review</h2>
                <p className="text-[11px] text-white/40">Agent #{agent.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

            {/* Photos row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Passport */}
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Camera className="h-3 w-3" /> Passport Photo
                </p>
                {agent.passportPhotoUrl ? (
                  <div className="relative group cursor-pointer rounded-xl overflow-hidden"
                    onClick={() => setImgView(agent.passportPhotoUrl!)}>
                    <img src={agent.passportPhotoUrl} alt="Passport"
                      className="w-full h-44 object-cover rounded-xl transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-[10px] text-white/70">
                      Tap to enlarge
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-xl flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.1)" }}>
                    <Camera className="h-7 w-7 text-white/15" />
                    <span className="text-xs text-white/25">Not uploaded</span>
                  </div>
                )}
              </div>

              {/* NIN / ID Slip */}
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> ID / NIN Document
                </p>
                {agent.ninSlipUrl ? (
                  <div className="relative group cursor-pointer rounded-xl overflow-hidden"
                    onClick={() => setImgView(agent.ninSlipUrl!)}>
                    <img src={agent.ninSlipUrl} alt="ID Document"
                      className="w-full h-44 object-cover rounded-xl transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-[10px] text-white/70">
                      Tap to enlarge
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-xl flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.1)" }}>
                    <FileText className="h-7 w-7 text-white/15" />
                    <span className="text-xs text-white/25">Not uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Info */}
            <InfoSection title="Personal Information" icon={User} rows={infoRows} />

            {/* Bank Details */}
            <InfoSection title="Bank Details" icon={CreditCard} rows={bankRows} />

            {/* Identity */}
            <InfoSection title="Identity Verification" icon={ShieldCheck} rows={idRows} />

          </div>

          {/* Footer — approve / reject */}
          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-xs text-white/40 mb-3 text-center">
              Review the documents above before approving this application.
            </p>
            <div className="flex gap-3">
              <button onClick={onReject} disabled={approving}
                className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button onClick={onApprove} disabled={approving}
                className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50">
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve Agent
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function InfoSection({ title, icon: Icon, rows }: {
  title: string; icon: React.ElementType;
  rows: Array<{ label: string; value: string | null | undefined }>;
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        <Icon className="h-3.5 w-3.5 text-[#4a9eff]" />
        <span className="text-xs font-semibold text-white/70">{title}</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.label}
          className={`flex items-start gap-3 px-4 py-2.5 ${i < rows.length - 1 ? "border-b border-white/5" : ""}`}
          style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
          <span className="text-xs text-white/40 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
          <span className="text-xs text-white font-medium break-all">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Edit User Modal ── */
function EditUserModal({ user, onClose, onSaved }: {
  user: { id: number; name: string; email: string; role: string; createdAt: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
  const update = useUpdateUser();

  const save = async () => {
    await update.mutateAsync({ id: user.id, data: form });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Edit User #{user.id}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[{ label: "Name", key: "name" }, { label: "Email", key: "email" }].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
              <input type="text" value={form[key as "name" | "email"]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Role</label>
            <div className="relative">
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {["visitor", "business_owner", "field_agent", "admin"].map(r => (
                  <option key={r} value={r} style={{ background: "#0d1b2e" }}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
          <Button size="sm" onClick={save} disabled={update.isPending}
            className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5">
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Reset Password Modal ── */
function ResetPasswordModal({ user, onClose }: {
  user: { id: number; name: string };
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reset = useResetPassword();

  const handleSave = async () => {
    setErr(null);
    if (newPassword.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (newPassword !== confirm) { setErr("Passwords do not match"); return; }
    try {
      await reset.mutateAsync({ id: user.id, newPassword });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to reset password");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            <h2 className="font-bold text-white text-sm">Reset Password — {user.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {success ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle className="h-4 w-4" /> Password updated successfully!</div>
          ) : (
            <>
              <p className="text-xs text-white/40">Set a new password for this user. They will need to use it on their next login.</p>
              {[{ label: "New Password", val: newPassword, set: setNewPassword }, { label: "Confirm Password", val: confirm, set: setConfirm }].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
                  <input type="password" value={val} onChange={(e) => set(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-400/40"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }} />
                </div>
              ))}
              {err && <p className="text-xs text-red-400">{err}</p>}
            </>
          )}
        </div>
        {!success && (
          <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={reset.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-white gap-1.5">
              {reset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              Set Password
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Impersonate banner ── */
function ImpersonateBanner({ name, token, onClear }: { name: string; token: string; onClear: () => void }) {
  const [copied, setCopied] = useState(false);
  const login = () => {
    localStorage.setItem("streetly_token", token);
    localStorage.setItem("streetly_user", JSON.stringify({ name }));
    window.location.href = "/";
  };
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm"
      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", backdropFilter: "blur(20px)" }}>
      <LogIn className="h-4 w-4 text-green-400" />
      <span className="text-white/80">Token ready for <span className="font-bold text-white">{name}</span></span>
      <Button size="sm" onClick={login} className="bg-green-500 hover:bg-green-600 text-white h-7 px-3 text-xs gap-1">
        <LogIn className="h-3 w-3" /> Login as {name}
      </Button>
      <button onClick={onClear} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
    </motion.div>
  );
}

/* ── Sidebar nav helpers ── */
type Section = string;
function NavGroup({ label }: { label: string }) {
  return (
    <p className="mt-5 mb-1.5 px-2 text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</p>
  );
}
function NavItem({ section, active, label, icon, badge, onSelect }: {
  section: Section; active: Section; label: string; icon: React.ReactNode;
  badge?: number; onSelect: (s: Section) => void;
}) {
  const isActive = active === section;
  return (
    <button onClick={() => onSelect(section)}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5 ${isActive ? "text-white" : "text-white/45 hover:text-white/75 hover:bg-white/5"}`}
      style={isActive ? { background: "rgba(74,158,255,0.18)", color: "#7dbfff" } : {}}>
      <span className={isActive ? "text-[#4a9eff]" : "text-white/30"}>{icon}</span>
      <span className="flex-1 text-left text-[13px]">{label}</span>
      {!!badge && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-orange-500 text-white">{badge}</span>
      )}
    </button>
  );
}
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {sub && <p className="text-sm text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>("analytics");
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingBiz } = useGetPendingBusinesses();
  const { data: pendingAgents } = useGetPendingAgents();
  const { data: pendingClaims } = usePendingClaims();
  const { data: allAgents, refetch: refetchAgents } = useAllAgents();
  const { data: allUsers, refetch: refetchUsers } = useAllUsers();
  const { data: allBusinesses, refetch: refetchAllBusinesses } = useAllBusinesses();
  const { data: featuredOrderData, refetch: refetchFeaturedOrder } = useFeaturedOrder();
  const { data: withdrawals, refetch: refetchWithdrawals } = usePendingWithdrawals();

  const approveBiz = useApproveBusiness();
  const approveAgent = useApproveAgent();
  const approveClaim = useApproveClaim();
  const approveWithdrawal = useApproveWithdrawal();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteUser();
  const suspendAgent = useSuspendAgent();
  const deleteAgent = useDeleteAgent();
  const suspendBusiness = useSuspendBusiness();
  const deleteBusiness = useDeleteBusiness();

  const { data: allKYC } = useAllKYC();

  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [editAgent, setEditAgent] = useState<typeof allAgents extends Array<infer T> ? T | null : null>(null);
  const [editUser, setEditUser] = useState<{ id: number; name: string; email: string; role: string; createdAt: string } | null>(null);
  const [resetPwUser, setResetPwUser] = useState<{ id: number; name: string } | null>(null);
  const [editBusiness, setEditBusiness] = useState<AdminBusiness | null>(null);
  const [viewAgentBiz, setViewAgentBiz] = useState<AdminBusiness | null>(null);
  const [reviewAgent, setReviewAgent] = useState<(typeof allAgents extends Array<infer T> ? T : never) | null>(null);
  const [bizSearch, setBizSearch] = useState("");
  const [featuredList, setFeaturedList] = useState<FeaturedBiz[]>([]);
  const [featuredSaved, setFeaturedSaved] = useState(false);
  const saveFeaturedOrder = useSaveFeaturedOrder();
  const [impersonateData, setImpersonateData] = useState<{ name: string; token: string } | null>(null);
  const [showPassport, setShowPassport] = useState<number | null>(null);
  const [kycImgView, setKycImgView] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (featuredOrderData) setFeaturedList(featuredOrderData);
  }, [featuredOrderData]);

  const moveFeatured = (index: number, dir: -1 | 1) => {
    const next = [...featuredList];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setFeaturedList(next);
    setFeaturedSaved(false);
  };

  const handleSaveFeaturedOrder = async () => {
    const order = featuredList.map((b, i) => ({ id: b.id, sortOrder: i + 1 }));
    await saveFeaturedOrder.mutateAsync(order);
    refetchFeaturedOrder();
    setFeaturedSaved(true);
    setTimeout(() => setFeaturedSaved(false), 2500);
  };

  const handleBizApproval = async (id: number, approved: boolean) => {
    await approveBiz.mutateAsync({ id, data: { approved } });
    qc.invalidateQueries({ queryKey: getGetPendingBusinessesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleAgentApproval = async (id: number, approved: boolean) => {
    await approveAgent.mutateAsync({ id, data: { approved } });
    qc.invalidateQueries({ queryKey: getGetPendingAgentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    refetchAgents();
  };

  const handleClaimApproval = async (id: number, approved: boolean) => {
    await approveClaim.mutateAsync({ id, approved, adminNote: adminNotes[id] });
    qc.invalidateQueries({ queryKey: ["admin", "claims", "pending"] });
  };

  const handleWithdrawalApproval = async (id: number, approved: boolean) => {
    await approveWithdrawal.mutateAsync({ id, approved });
    refetchWithdrawals();
  };

  const handleImpersonate = async (userId: number, name: string) => {
    const res = await fetch(`${BASE}/api/admin/impersonate/${userId}`, { method: "POST", headers: authHeader() });
    const data = await res.json();
    if (data.token) setImpersonateData({ name, token: data.token });
  };

  const totalPending = (stats?.pendingBusinesses ?? 0) + (stats?.pendingAgents ?? 0) + (pendingClaims?.length ?? 0) + (withdrawals?.length ?? 0);

  return (
    <Layout>
      {/* Modals */}
      <AnimatePresence>
        {editAgent && (
          <EditAgentModal
            agent={editAgent as any}
            onClose={() => setEditAgent(null)}
            onSaved={() => { refetchAgents(); qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() }); }}
          />
        )}
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSaved={() => refetchUsers()}
          />
        )}
        {resetPwUser && (
          <ResetPasswordModal
            user={resetPwUser}
            onClose={() => setResetPwUser(null)}
          />
        )}
        {editBusiness && (
          <EditBusinessModal
            biz={editBusiness}
            onClose={() => setEditBusiness(null)}
            onSaved={() => { refetchAllBusinesses(); qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() }); }}
          />
        )}
        {viewAgentBiz && (
          <AgentProfileModal
            agent={viewAgentBiz}
            onClose={() => setViewAgentBiz(null)}
            onEdit={() => {
              const match = allAgents?.find(a => a.id === viewAgentBiz.agentId);
              if (match) { setViewAgentBiz(null); setEditAgent(match as any); }
            }}
          />
        )}
        {reviewAgent && (
          <AgentReviewModal
            agent={reviewAgent}
            onClose={() => setReviewAgent(null)}
            approving={approveAgent.isPending}
            onApprove={() => {
              handleAgentApproval(reviewAgent.id, true);
              setReviewAgent(null);
            }}
            onReject={() => {
              handleAgentApproval(reviewAgent.id, false);
              setReviewAgent(null);
            }}
          />
        )}
      </AnimatePresence>

      {confirmDelete && (
        <ConfirmDeleteModal
          label={confirmDelete.label}
          loading={deleteUser.isPending || deleteAgent.isPending || deleteBusiness.isPending}
          onConfirm={async () => { await confirmDelete.onConfirm(); setConfirmDelete(null); }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {kycImgView && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setKycImgView(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="h-5 w-5" />
          </button>
          <img src={kycImgView} alt="KYC Document" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
        </motion.div>
      )}

      {impersonateData && (
        <ImpersonateBanner
          name={impersonateData.name}
          token={impersonateData.token}
          onClear={() => setImpersonateData(null)}
        />
      )}

      {/* Sidebar + Content layout */}
      <div className="flex" style={{ minHeight: "calc(100vh - 64px)", background: "#070c1a" }}>

        {/* ── Sidebar ── */}
        <aside className="w-56 flex-shrink-0 flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto"
          style={{ background: "#060c1a", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Branding / pending alert */}
          <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,158,255,0.2)" }}>
                <ShieldCheck className="h-4 w-4 text-[#4a9eff]" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white tracking-wide">STREETLY</p>
                <p className="text-[10px] text-white/30 -mt-0.5">Admin Panel</p>
              </div>
            </div>
            {totalPending > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1.5 rounded-lg text-orange-300"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
                <AlertCircle className="h-3 w-3" />
                {totalPending} awaiting review
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2.5">
            <NavItem section="analytics" active={activeSection} label="Analytics" icon={<BarChart2 className="h-4 w-4" />} onSelect={setActiveSection} />

            <NavGroup label="Businesses" />
            <NavItem section="add-business" active={activeSection} label="Add Business" icon={<Plus className="h-4 w-4" />} onSelect={setActiveSection} />
            <NavItem section="businesses" active={activeSection} label="Pending Review" icon={<AlertCircle className="h-4 w-4" />} badge={stats?.pendingBusinesses} onSelect={setActiveSection} />
            <NavItem section="all-businesses" active={activeSection} label="All Businesses" icon={<Building2 className="h-4 w-4" />} onSelect={setActiveSection} />
            <NavItem section="featured-order" active={activeSection} label="Featured Order" icon={<Star className="h-4 w-4" />} onSelect={setActiveSection} />
            <NavItem section="claims" active={activeSection} label="Ownership Claims" icon={<ShieldCheck className="h-4 w-4" />} badge={pendingClaims?.length} onSelect={setActiveSection} />

            <NavGroup label="People" />
            <NavItem section="all-users" active={activeSection} label="All Users" icon={<Users className="h-4 w-4" />} onSelect={setActiveSection} />
            <NavItem section="all-agents" active={activeSection} label="All Agents" icon={<User className="h-4 w-4" />} onSelect={setActiveSection} />
            <NavItem section="pending-agents" active={activeSection} label="Pending Agents" icon={<AlertCircle className="h-4 w-4" />} badge={stats?.pendingAgents} onSelect={setActiveSection} />
            <NavItem section="kyc" active={activeSection} label="KYC Documents" icon={<FileText className="h-4 w-4" />} onSelect={setActiveSection} />

            <NavGroup label="Finance" />
            <NavItem section="commissions" active={activeSection} label="Commissions" icon={<CreditCard className="h-4 w-4" />} badge={withdrawals?.length} onSelect={setActiveSection} />

            <NavGroup label="Communications" />
            <NavItem section="messages" active={activeSection} label="Messages" icon={<MessageSquare className="h-4 w-4" />} onSelect={setActiveSection} />
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-16 z-30 flex items-center gap-3 px-6 py-3.5"
            style={{ background: "rgba(7,12,26,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
            <span className="text-sm font-semibold text-white capitalize">{activeSection.replace(/-/g, " ")}</span>
            {statsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30 ml-auto" />}
            {stats && !statsLoading && (
              <div className="ml-auto flex items-center gap-4">
                {[
                  { v: stats.totalBusinesses, l: "Businesses", c: "text-[#4a9eff]" },
                  { v: stats.totalAgents, l: "Agents", c: "text-green-400" },
                  { v: stats.totalUsers, l: "Users", c: "text-purple-400" },
                  { v: formatCurrency(stats.revenue), l: "Revenue", c: "text-emerald-400" },
                ].map(s => (
                  <div key={s.l} className="hidden lg:flex flex-col items-end">
                    <span className={`text-xs font-bold ${s.c}`}>{s.v}</span>
                    <span className="text-[10px] text-white/25">{s.l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section content */}
          <div className="p-6">

          {/* ── Analytics ── */}
          {activeSection === "analytics" && <AdminAnalytics />}

          {/* ── Messages ── */}
          {activeSection === "messages" && <AdminMessages />}

          {/* ── Add Business ── */}
          {activeSection === "add-business" && (
            <div className="max-w-2xl">
              <SectionHeader title="Add New Business" sub="Register a business directly to the Streetly directory." />
              <AddBusinessForm />
            </div>
          )}

          {/* ── Pending Businesses ── */}
          {activeSection === "businesses" && (
            <>
            <SectionHeader title="Pending Businesses" sub="Review and approve or reject listings submitted by agents." />
            {!pendingBiz?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-green-500" />} title="No pending businesses" sub="All businesses have been reviewed" />
            ) : (
              <div className="space-y-3">
                {pendingBiz.map((biz) => (
                  <AdminCard key={biz.id}>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground">Category ID: {biz.categoryId} · Street ID: {biz.streetId}</p>
                      {biz.phone && <p className="text-xs text-muted-foreground">Phone: {biz.phone}</p>}
                      <p className="text-xs text-muted-foreground">Added: {new Date(biz.createdAt).toLocaleDateString()}</p>
                      {(biz as unknown as AdminBusiness).agentId && (
                        <button
                          onClick={() => setViewAgentBiz(biz as unknown as AdminBusiness)}
                          className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[#4a9eff]/20"
                          style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)", color: "#4a9eff" }}
                        >
                          <User className="h-3 w-3" />
                          {(biz as unknown as AdminBusiness).agentFullName ?? (biz as unknown as AdminBusiness).agentUserName ?? `Agent #${(biz as unknown as AdminBusiness).agentId}`}
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </button>
                      )}
                    </div>
                    <ApproveRejectButtons
                      onApprove={() => handleBizApproval(biz.id, true)}
                      onReject={() => handleBizApproval(biz.id, false)}
                      loading={approveBiz.isPending}
                    />
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── Pending Agents ── */}
          {activeSection === "pending-agents" && (
            <>
            <SectionHeader title="Pending Agents" sub="Review agent applications and approve or reject them." />
            {!pendingAgents?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-green-500" />} title="No pending agents" sub="All applications have been reviewed" />
            ) : (
              <div className="space-y-3">
                {pendingAgents.map((agent) => {
                  const fullAgent = allAgents?.find(a => a.id === agent.id) ?? null;
                  return (
                    <AdminCard key={agent.id}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {agent.passportPhotoUrl ? (
                          <img src={agent.passportPhotoUrl} alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-white/15 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-white/20" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{agent.fullName ?? `Agent #${agent.id}`}</h3>
                          <p className="text-xs text-muted-foreground">{agent.userEmail ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">Applied: {new Date(agent.createdAt).toLocaleDateString()}</p>
                          <button
                            onClick={() => fullAgent && setReviewAgent(fullAgent)}
                            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-amber-500/20"
                            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}
                          >
                            <List className="h-3 w-3" /> View Full Profile & Documents
                          </button>
                        </div>
                      </div>
                      <ApproveRejectButtons
                        onApprove={() => handleAgentApproval(agent.id, true)}
                        onReject={() => handleAgentApproval(agent.id, false)}
                        loading={approveAgent.isPending}
                      />
                    </AdminCard>
                  );
                })}
              </div>
            )}
            </>
          )}

          {/* ── All Agents ── */}
          {activeSection === "all-agents" && (
            <>
            <SectionHeader title="All Agents" sub="Manage all registered field agents on Streetly." />
            {!allAgents?.length ? (
              <EmptyState icon={<Users className="h-10 w-10 text-white/20" />} title="No agents yet" sub="Agents will appear here once they apply" />
            ) : (
              <div className="space-y-2">
                {allAgents.map((agent) => (
                  <AdminCard key={agent.id}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {agent.passportPhotoUrl ? (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <img
                            src={showPassport === agent.id ? agent.passportPhotoUrl : undefined}
                            alt=""
                            className={`w-12 h-12 rounded-xl object-cover ${showPassport === agent.id ? "" : "hidden"}`}
                          />
                          {showPassport !== agent.id && (
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer"
                              onClick={() => setShowPassport(showPassport === agent.id ? null : agent.id)}>
                              <Eye className="h-4 w-4 text-white/40" />
                            </div>
                          )}
                          {showPassport === agent.id && (
                            <button onClick={() => setShowPassport(null)} className="absolute -top-1 -right-1 bg-black rounded-full p-0.5">
                              <EyeOff className="h-3 w-3 text-white/60" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-foreground">{agent.fullName ?? agent.userName ?? `Agent #${agent.id}`}</h3>
                          <StatusBadge status={agent.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.userEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          Bank: {agent.bankName ?? "—"} · Earned: ₦{agent.totalEarnings?.toLocaleString() ?? 0} · Balance: ₦{agent.availableBalance?.toLocaleString() ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Applied: {new Date(agent.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
                      <Button size="sm" variant="outline" onClick={() => setEditAgent(agent as any)}
                        className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImpersonate(agent.userId, agent.fullName ?? agent.userName ?? `Agent #${agent.id}`)}
                        className="gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10">
                        <LogIn className="h-3.5 w-3.5" /> Login As
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={async () => { await suspendAgent.mutateAsync({ id: agent.id, suspend: agent.status !== "suspended" }); refetchAgents(); }}
                        className={`gap-1 ${agent.status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"}`}>
                        <Ban className="h-3.5 w-3.5" /> {agent.status === "suspended" ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDelete({ label: agent.fullName ?? `Agent #${agent.id}`, onConfirm: async () => { await deleteAgent.mutateAsync(agent.id); refetchAgents(); } })}
                        className="gap-1 text-red-400 border-red-400/30 hover:bg-red-400/10">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── All Users ── */}
          {activeSection === "all-users" && (
            <>
            <SectionHeader title="All Users" sub="Manage all registered users. Field agents are listed under All Agents." />
            {!allUsers?.length ? (
              <EmptyState icon={<Users className="h-10 w-10 text-white/20" />} title="No users yet" sub="" />
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-white/30 mb-3">
                  Showing non-agent users. Field agents are managed in the <strong className="text-white/50">All Agents</strong> tab.
                </p>
                {allUsers.filter(u => u.role !== "field_agent").map((user) => (
                  <AdminCard key={user.id}>
                    <div className="w-10 h-10 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#4a9eff]">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{user.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(user.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="opacity-50">IP:</span>
                        <span className="font-mono">{user.registrationIp ?? "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="opacity-50">Password hash:</span>
                        <span className="font-mono truncate max-w-[140px]" title={user.passwordHash ?? ""}>{user.passwordHash ? user.passwordHash.slice(0, 16) + "…" : "—"}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
                      <Button size="sm" variant="outline" onClick={() => setEditUser(user)}
                        className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setResetPwUser(user)}
                        className="gap-1 text-amber-400 border-amber-400/30 hover:bg-amber-400/10">
                        <Key className="h-3.5 w-3.5" /> Reset PW
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImpersonate(user.id, user.name)}
                        className="gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10">
                        <LogIn className="h-3.5 w-3.5" /> Login As
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={async () => { await suspendUser.mutateAsync({ id: user.id, suspend: (user as any).status !== "suspended" }); refetchUsers(); }}
                        className={`gap-1 ${(user as any).status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"}`}>
                        <Ban className="h-3.5 w-3.5" /> {(user as any).status === "suspended" ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDelete({ label: user.name, onConfirm: async () => { await deleteUser.mutateAsync(user.id); refetchUsers(); } })}
                        className="gap-1 text-red-400 border-red-400/30 hover:bg-red-400/10">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── Commissions ── */}
          {activeSection === "commissions" && (
            <>
            <SectionHeader title="Commissions" sub="Review and approve pending agent commission payouts." />
            {!withdrawals?.length ? (
              <EmptyState
                icon={<CreditCard className="h-10 w-10 text-green-500" />}
                title="No pending commission payouts"
                sub="All agent commissions have been processed"
              />
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-white/40 mb-4">
                  {withdrawals.length} pending payout{withdrawals.length !== 1 ? "s" : ""} — approve to confirm payment to agent's bank account
                </div>
                {withdrawals.map((w) => (
                  <AdminCard key={w.id}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{w.agentFullName ?? `Agent #${w.agentId}`}</h3>
                        <span className="text-base font-bold text-emerald-400">₦{w.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {w.agentBankName} · {w.agentAccountNumber} · {w.agentAccountName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Available balance: ₦{(w.agentAvailableBalance ?? 0).toLocaleString()} · Requested: {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ApproveRejectButtons
                      onApprove={() => handleWithdrawalApproval(w.id, true)}
                      onReject={() => handleWithdrawalApproval(w.id, false)}
                      loading={approveWithdrawal.isPending}
                      approveLabel="Pay"
                      rejectLabel="Decline"
                    />
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── Featured Order ── */}
          {activeSection === "featured-order" && (
            <div className="max-w-xl">
              <div className="mb-5">
                <h2 className="text-base font-bold text-foreground">Featured Business Order</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the arrows to rearrange which businesses appear first in the "Featured" section on the homepage. Click Save when done.
                </p>
              </div>

              {!featuredList.length ? (
                <EmptyState
                  icon={<span className="text-4xl">⭐</span>}
                  title="No featured businesses"
                  sub="Mark businesses as Featured in the All Businesses tab first"
                />
              ) : (
                <div className="space-y-2">
                  {featuredList.map((biz, i) => (
                    <motion.div
                      key={biz.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {/* Position badge */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                        style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff" }}>
                        {i + 1}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{biz.name}</p>
                        {biz.categoryName && (
                          <p className="text-xs text-muted-foreground">{biz.categoryName}</p>
                        )}
                      </div>

                      {/* Up / Down buttons */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveFeatured(i, -1)}
                          disabled={i === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-20"
                          style={{ background: i === 0 ? "transparent" : "rgba(255,255,255,0.07)" }}
                          title="Move up"
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-white rotate-180" />
                        </button>
                        <button
                          onClick={() => moveFeatured(i, 1)}
                          disabled={i === featuredList.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-20"
                          style={{ background: i === featuredList.length - 1 ? "transparent" : "rgba(255,255,255,0.07)" }}
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <div className="pt-3">
                    <Button
                      onClick={handleSaveFeaturedOrder}
                      disabled={saveFeaturedOrder.isPending}
                      className={`w-full gap-2 font-semibold transition-all ${featuredSaved ? "bg-green-600 hover:bg-green-600" : "bg-[#4a9eff] hover:bg-[#3a8ef0]"} text-white`}
                    >
                      {saveFeaturedOrder.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                      ) : featuredSaved ? (
                        <><Save className="h-4 w-4" /> Saved!</>
                      ) : (
                        <><Save className="h-4 w-4" /> Save Order</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── All Businesses ── */}
          {activeSection === "all-businesses" && (
            <>
            <SectionHeader title="All Businesses" sub="View, edit, suspend or delete any business on the platform." />
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, category or street…"
                value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
            </div>
            {!allBusinesses?.length ? (
              <EmptyState icon={<Building2 className="h-10 w-10 text-white/20" />} title="No businesses yet" sub="" />
            ) : (() => {
              const q = bizSearch.trim().toLowerCase();
              const filtered = q
                ? allBusinesses.filter(b =>
                    b.name.toLowerCase().includes(q) ||
                    (b.categoryName ?? "").toLowerCase().includes(q) ||
                    (b.streetName ?? "").toLowerCase().includes(q)
                  )
                : allBusinesses;
              return (
                <div className="space-y-2">
                  <p className="text-xs text-white/30 mb-3">{filtered.length} business{filtered.length !== 1 ? "es" : ""}</p>
                  {filtered.map((biz) => (
                    <AdminCard key={biz.id}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-foreground">{biz.name}</h3>
                          <StatusBadge status={biz.status} />
                          {biz.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">✓ Verified</span>
                          )}
                          {biz.featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">⭐ Featured</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[biz.categoryName, biz.streetName].filter(Boolean).join(" · ")}
                        </p>
                        {biz.phone && <p className="text-xs text-muted-foreground">📞 {biz.phone}</p>}
                        <p className="text-xs text-muted-foreground">Added: {new Date(biz.createdAt).toLocaleDateString()}</p>
                        {biz.agentId && (
                          <button
                            onClick={() => setViewAgentBiz(biz)}
                            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-[#4a9eff]/20"
                            style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.2)", color: "#4a9eff" }}
                          >
                            <User className="h-3 w-3" />
                            {biz.agentFullName ?? biz.agentUserName ?? `Agent #${biz.agentId}`}
                            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setEditBusiness(biz)}
                          className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={async () => { await suspendBusiness.mutateAsync({ id: biz.id, suspend: biz.status !== "suspended" }); refetchAllBusinesses(); }}
                          className={`gap-1 ${biz.status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"}`}>
                          <Ban className="h-3.5 w-3.5" /> {biz.status === "suspended" ? "Unsuspend" : "Suspend"}
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => setConfirmDelete({ label: biz.name, onConfirm: async () => { await deleteBusiness.mutateAsync(biz.id); refetchAllBusinesses(); } })}
                          className="gap-1 text-red-400 border-red-400/30 hover:bg-red-400/10">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </AdminCard>
                  ))}
                </div>
              );
            })()}
            </>
          )}

          {/* ── Ownership Claims ── */}
          {activeSection === "claims" && (
            <>
            <SectionHeader title="Ownership Claims" sub="Verify and transfer business ownership to legitimate claimants." />
            {!pendingClaims?.length ? (
              <EmptyState icon={<ShieldCheck className="h-10 w-10 text-green-500" />} title="No pending claims" sub="All ownership claims have been resolved" />
            ) : (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="p-5 bg-card border rounded-xl">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-foreground">{claim.businessName}</h3>
                          <Badge variant="secondary" className="text-xs">Claim #{claim.id}</Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{claim.claimerName}</p>
                        <p className="text-sm text-muted-foreground">{claim.claimerEmail}</p>
                        {claim.claimerPhone && <p className="text-sm text-muted-foreground">{claim.claimerPhone}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {claim.proofNote && (
                      <div className="bg-muted/40 rounded-lg p-3 text-sm text-foreground mb-4">
                        <span className="text-xs text-muted-foreground block mb-1 font-medium">Note:</span>
                        {claim.proofNote}
                      </div>
                    )}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a note to the claimant (optional)..."
                        value={adminNotes[claim.id] ?? ""}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                        rows={2} className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 flex-1"
                          onClick={() => handleClaimApproval(claim.id, true)} disabled={approveClaim.isPending}>
                          <CheckCircle className="h-4 w-4" /> Approve & Transfer
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1 flex-1"
                          onClick={() => handleClaimApproval(claim.id, false)} disabled={approveClaim.isPending}>
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── KYC Documents ── */}
          {activeSection === "kyc" && (
            <>
            <SectionHeader title="KYC Documents" sub="Review agent identity documents for compliance." />
            {!allKYC?.length ? (
              <EmptyState icon={<FileText className="h-10 w-10 text-white/20" />} title="No KYC documents yet" sub="Agent KYC submissions will appear here" />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/30 mb-3">{allKYC.length} agent{allKYC.length !== 1 ? "s" : ""} with KYC documents</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allKYC.map((agent) => (
                    <div key={agent.id} className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="px-4 py-3 border-b border-white/8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{agent.fullName ?? agent.userName ?? `Agent #${agent.id}`}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.status === "approved" ? "bg-green-500/15 text-green-400" : agent.status === "suspended" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{agent.userEmail}</p>
                        {(agent.idType || agent.idNumber) && (
                          <p className="text-xs text-white/50 mt-0.5">{agent.idType}: <span className="font-mono">{agent.idNumber}</span></p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-3">
                        {agent.passportPhotoUrl ? (
                          <button onClick={() => setKycImgView(agent.passportPhotoUrl!)} className="relative group rounded-xl overflow-hidden aspect-square bg-white/5">
                            <img src={agent.passportPhotoUrl} alt="Passport" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/60 text-white">Passport</span>
                          </button>
                        ) : (
                          <div className="aspect-square rounded-xl bg-white/5 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white/20" />
                          </div>
                        )}
                        {agent.ninSlipUrl ? (
                          <button onClick={() => setKycImgView(agent.ninSlipUrl!)} className="relative group rounded-xl overflow-hidden aspect-square bg-white/5">
                            <img src={agent.ninSlipUrl} alt="NIN Slip" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/60 text-white">NIN Slip</span>
                          </button>
                        ) : (
                          <div className="aspect-square rounded-xl bg-white/5 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white/20" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/30 px-4 pb-3">Submitted: {new Date(agent.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}

          </div>{/* /section content */}
        </main>
      </div>{/* /sidebar+content flex */}
    </Layout>
  );
}

/* ── Small reusable pieces ── */
function AdminCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-xl flex-wrap">
      {children}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="text-center py-16 border rounded-xl">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ApproveRejectButtons({ onApprove, onReject, loading, approveLabel = "Approve", rejectLabel = "Reject" }: {
  onApprove: () => void; onReject: () => void; loading: boolean;
  approveLabel?: string; rejectLabel?: string;
}) {
  return (
    <div className="flex gap-2 flex-shrink-0">
      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
        onClick={onApprove} disabled={loading}>
        <CheckCircle className="h-4 w-4" /> {approveLabel}
      </Button>
      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
        onClick={onReject} disabled={loading}>
        <XCircle className="h-4 w-4" /> {rejectLabel}
      </Button>
    </div>
  );
}
