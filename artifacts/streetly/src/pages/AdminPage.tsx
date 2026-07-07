import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { AGENT_COMMISSION_PER_LISTING } from "@/lib/constants";
import {
  Building2, Users, TrendingUp, AlertCircle, CheckCircle, XCircle,
  ShieldCheck, Plus, Edit2, LogIn, CreditCard, X, Save, ChevronDown,
  Loader2, Eye, EyeOff, User, MapPin, Wallet, ExternalLink,
  FileText, ZoomIn, Camera, List, Key, Trash2, Ban, ImageIcon,
  MessageSquare, LifeBuoy, Star, BarChart2, ChevronRight, Download, Settings, Menu,
  Calendar, IdCard, UserPlus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AddBusinessForm from "@/components/admin/AddBusinessForm";
import AddPropertyForm from "@/components/admin/AddPropertyForm";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminSupportTickets from "@/components/admin/AdminSupportTickets";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminExport from "@/components/admin/AdminExport";
import AdminEmailSettings from "@/components/admin/AdminEmailSettings";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import MarketplaceItemsModal from "@/components/marketplace/MarketplaceItemsModal";

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

function useCreateUser() {
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: string }) => {
      const res = await fetch(`${BASE}/api/admin/users`, {
        method: "POST", headers: authHeader(), body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create user");
      return json;
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

interface PendingRider {
  id: number; userId: number; status: string; fullName: string | null;
  phone: string | null; vehicleType: string | null; idType: string | null; idNumber: string | null;
  dateOfBirth: string | null; address: string | null;
  passportObjectPath: string | null; ninSlipObjectPath: string | null;
  createdAt: string; userName: string | null; userEmail: string | null;
}

function usePendingRiders() {
  return useQuery({
    queryKey: ["admin", "riders", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/riders/pending`, { headers: authHeader() });
      return res.json() as Promise<PendingRider[]>;
    },
  });
}

function useAllRiders() {
  return useQuery({
    queryKey: ["admin", "riders", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/riders/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; userId: number; status: string; isOnline: boolean; fullName: string | null;
        phone: string | null; vehicleType: string | null; totalDeliveries: number | null;
        createdAt: string; userName: string | null; userEmail: string | null;
      }>>;
    },
  });
}

function useApproveRiderAdmin() {
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/riders/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
  });
}

function useSuspendRider() {
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/riders/${id}/suspend`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ suspend }),
      });
      return res.json();
    },
  });
}

function useDeleteRider() {
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/admin/riders/${id}`, { method: "DELETE", headers: authHeader() });
    },
  });
}

function useAllDeliveries() {
  return useQuery({
    queryKey: ["admin", "deliveries", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/deliveries/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; businessId: number; businessName: string | null; riderId: number | null;
        riderName: string | null; customerName: string; customerPhone: string; deliveryAddress: string;
        status: string; createdAt: string;
      }>>;
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

function useAdminGallery() {
  return useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/gallery`, { headers: authHeader() });
      return res.json() as Promise<{
        agentPassports: Array<{ url: string; agentId: number; agentName: string; createdAt: string }>;
        agentNIN: Array<{ url: string; agentId: number; agentName: string; createdAt: string }>;
        businessPhotos: Array<{ id: number; url: string; caption: string | null; createdAt: string; businessId: number; businessName: string | null }>;
      }>;
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
                      <span className="text-[10px] text-green-400 font-bold">+₦{AGENT_COMMISSION_PER_LISTING}</span>
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

/* ── Rider Review Modal (full profile with documents before approval) ── */
function RiderReviewModal({ rider, onClose, onApprove, onReject, approving }: {
  rider: {
    id: number; fullName: string | null; phone: string | null; vehicleType: string | null;
    idType: string | null; idNumber: string | null; dateOfBirth: string | null; address: string | null;
    passportObjectPath: string | null; ninSlipObjectPath: string | null;
    userEmail: string | null; userName: string | null; createdAt: string;
  };
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  const [imgView, setImgView] = useState<string | null>(null);
  const name = rider.fullName ?? rider.userName ?? `Rider #${rider.id}`;
  const passportUrl = rider.passportObjectPath ? `${BASE}/api/storage${rider.passportObjectPath}` : null;
  const ninSlipUrl = rider.ninSlipObjectPath ? `${BASE}/api/storage${rider.ninSlipObjectPath}` : null;

  const infoRows = [
    { label: "Full Name", value: name },
    { label: "Email", value: rider.userEmail },
    { label: "Phone", value: rider.phone },
    { label: "Vehicle Type", value: rider.vehicleType },
    { label: "Date of Birth", value: rider.dateOfBirth ? new Date(rider.dateOfBirth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : null },
    { label: "Address", value: rider.address },
    { label: "Applied", value: new Date(rider.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
  ].filter(r => r.value);

  const idRows = [
    { label: "ID Type", value: rider.idType?.toUpperCase().replace("_", " ") },
    { label: "ID Number", value: rider.idNumber },
  ].filter(r => r.value);

  return (
    <>
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <IdCard className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Rider Application Review</h2>
                <p className="text-[11px] text-white/40">Rider #{rider.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Camera className="h-3 w-3" /> Passport
                </p>
                {passportUrl ? (
                  <div className="relative group cursor-pointer rounded-xl overflow-hidden"
                    onClick={() => setImgView(passportUrl)}>
                    <img src={passportUrl} alt="Passport"
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

              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> NIN Slip
                </p>
                {ninSlipUrl ? (
                  <div className="relative group cursor-pointer rounded-xl overflow-hidden"
                    onClick={() => setImgView(ninSlipUrl)}>
                    <img src={ninSlipUrl} alt="NIN Slip"
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

            <InfoSection title="Personal Information" icon={User} rows={infoRows} />
            <InfoSection title="Identity Verification" icon={ShieldCheck} rows={idRows} />
          </div>

          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-xs text-white/40 mb-3 text-center">
              Review the documents above before approving this rider.
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
                Approve Rider
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ── Property Review Modal (full profile with photos before approval) ── */
function PropertyReviewModal({ property, onClose, onApprove, onReject, onDelete, approving, readOnly }: {
  property: AdminProperty;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  approving?: boolean;
  readOnly?: boolean;
}) {
  const [imgView, setImgView] = useState<string | null>(null);
  const locationParts = [property.streetName, property.areaName, property.cityName].filter(Boolean);

  const infoRows = [
    { label: "Address", value: property.address },
    { label: "Location", value: locationParts.length ? locationParts.join(", ") : null },
    { label: "Size", value: property.sizeSqft ? `${property.sizeSqft.toLocaleString()} sqft` : null },
    { label: "Price", value: property.priceAmount ? `₦${property.priceAmount.toLocaleString()} (${property.priceType})` : `Price on request (${property.priceType})` },
    { label: "Submitted", value: new Date(property.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
    { label: "Status", value: property.status },
  ].filter(r => r.value);

  const contactRows = [
    { label: "Contact Name", value: property.contactName },
    { label: "Contact Phone", value: property.contactPhone },
  ].filter(r => r.value);

  return (
    <>
      <AnimatePresence>
        {imgView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setImgView(null)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
            <img src={imgView} alt="Property" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4a9eff]/15 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-[#4a9eff]" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">{property.title}</h2>
                <p className="text-[11px] text-white/40">Property #{property.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
            {/* Photos */}
            <div>
              <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="h-3 w-3" /> Photos ({property.photos?.length ?? 0})
              </p>
              {property.photos?.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {property.photos.map((photo) => (
                    <div key={photo.id} className="relative group cursor-pointer rounded-xl overflow-hidden"
                      onClick={() => setImgView(photo.url)}>
                      <img src={photo.url} alt="Property"
                        className="w-full h-24 object-cover rounded-xl transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.1)" }}>
                  <Camera className="h-7 w-7 text-white/15" />
                  <span className="text-xs text-white/25">No photos uploaded</span>
                </div>
              )}
            </div>

            {property.description && (
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-white/70 leading-relaxed">{property.description}</p>
              </div>
            )}

            <InfoSection title="Property Information" icon={MapPin} rows={infoRows} />
            <InfoSection title="Contact Information" icon={User} rows={contactRows} />
          </div>

          {!readOnly && (onApprove || onReject || onDelete) && (
            <div className="px-5 py-4 border-t border-white/10 flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="flex gap-3">
                {onReject && (
                  <button onClick={onReject} disabled={approving}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                )}
                {onApprove && (
                  <button onClick={onApprove} disabled={approving}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50">
                    {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve Property
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete}
                    className="h-10 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
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
                {["visitor", "business_owner", "field_agent", "admin", "moderator", "scout_manager", "delivery_rider"].map(r => (
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

/* ── Create User Modal ── */
function CreateUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const STAFF_ROLES = [
    { value: "moderator", label: "Moderator" },
    { value: "scout_manager", label: "Scout Manager" },
    { value: "regional_manager", label: "Regional Manager" },
  ] as const;
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "moderator" });
  const [err, setErr] = useState<string | null>(null);
  const createUser = useCreateUser();

  const handleSubmit = async () => {
    setErr(null);
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setErr("All fields are required"); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    try {
      await createUser.mutateAsync(form);
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Failed to create account");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Create Staff Account</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[{ label: "Full Name", key: "name", type: "text" }, { label: "Email Address", key: "email", type: "email" }, { label: "Password", key: "password", type: "password" }].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
              <input type={type} value={form[key as "name" | "email" | "password"]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={key === "password" ? "Min. 6 characters" : ""}
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
                {STAFF_ROLES.map(r => (
                  <option key={r.value} value={r.value} style={{ background: "#0d1b2e" }}>{r.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
          {err && <p className="text-xs text-red-400 rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.1)" }}>{err}</p>}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createUser.isPending}
            className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5">
            {createUser.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Create Account
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

type AdminProperty = {
  id: number; title: string; description: string | null; address: string;
  sizeSqft: number | null; priceAmount: number | null; priceType: string;
  contactName: string; contactPhone: string; status: string; createdAt: string;
  streetName?: string | null; areaName?: string | null; cityName?: string | null;
  photos: Array<{ id: number; url: string }>;
};

function usePendingProperties() {
  return useQuery({
    queryKey: ["admin", "properties", "pending"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/properties/pending`, { headers: authHeader() });
      return res.json() as Promise<AdminProperty[]>;
    },
  });
}

function useAllProperties() {
  return useQuery({
    queryKey: ["admin", "properties", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/properties/all`, { headers: authHeader() });
      return res.json() as Promise<AdminProperty[]>;
    },
  });
}

function useApproveProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/properties/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
  });
}

function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/admin/properties/${id}`, { method: "DELETE", headers: authHeader() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
    },
  });
}

/* ── Impersonate banner ── */
function roleToPortal(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "moderator") return "/moderator";
  if (role === "scout_manager") return "/scout-manager";
  if (role === "regional_manager") return "/regional-manager";
  if (role === "field_agent") return "/agent-dashboard";
  if (role === "business_owner") return "/owner-dashboard";
  if (role === "delivery_rider") return "/rider-dashboard";
  return "/";
}

function ImpersonateBanner({ name, token, role, onClear }: { name: string; token: string; role: string; onClear: () => void }) {
  const login = () => {
    localStorage.setItem("streetly_token", token);
    localStorage.setItem("streetly_user", JSON.stringify({ name }));
    window.location.href = roleToPortal(role);
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

const SECTION_LABELS: Record<string, string> = {
  analytics: "Dashboard", "add-business": "Add Business",
  businesses: "Pending Review", properties: "Pending Properties", "all-properties": "All Properties",
  "add-property": "Add Property", "all-businesses": "All Businesses",
  "featured-order": "Featured Order", claims: "Ownership Claims",
  "all-users": "All Users", "all-agents": "All Agents",
  "staff-accounts": "Staff Accounts",
  "pending-agents": "Pending Agents", kyc: "KYC Documents",
  categories: "Categories", commissions: "Commissions",
  messages: "Messages", "support-tickets": "Support Tickets",
  export: "Export Data", "email-settings": "Email & Account",
  gallery: "Gallery",
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>("analytics");
  const qc = useQueryClient();
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("streetly_token"));

  const handleUnlock = (token: string) => {
    setAdminToken(token);
    qc.invalidateQueries({ queryKey: ["admin-me"] });
  };

  const [, navigate] = useLocation();

  const token = adminToken;
  const { data: adminUser, isLoading: adminUserLoading } = useQuery<{ id: number; name: string; email: string; role: string; msaId?: string }>({
    queryKey: ["admin-me"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/auth/me`, { headers: authHeader() });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!adminUserLoading && adminUser && adminUser.role !== "admin") {
      if (adminUser.role === "moderator") navigate("/moderator");
      else if (adminUser.role === "scout_manager") navigate("/scout-manager");
      else if (adminUser.role === "regional_manager") navigate("/regional-manager");
      else {
        localStorage.removeItem("streetly_token");
        setAdminToken(null);
      }
    }
  }, [adminUser, adminUserLoading]);

  const adminGreeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const adminFirstName = adminUser?.name?.split(" ")[0] ?? "Admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleNavSelect = (section: Section) => { setActiveSection(section); setSidebarOpen(false); };

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingBiz } = useGetPendingBusinesses();
  const { data: pendingProperties } = usePendingProperties();
  const { data: allProperties, refetch: refetchAllProperties } = useAllProperties();
  const { data: pendingAgents } = useGetPendingAgents();
  const { data: pendingClaims } = usePendingClaims();
  const { data: allAgents, refetch: refetchAgents } = useAllAgents();
  const { data: pendingRiders, refetch: refetchPendingRiders } = usePendingRiders();
  const { data: allRiders, refetch: refetchRiders } = useAllRiders();
  const { data: allDeliveries, refetch: refetchDeliveries } = useAllDeliveries();
  const { data: allUsers, refetch: refetchUsers } = useAllUsers();
  const { data: allBusinesses, refetch: refetchAllBusinesses } = useAllBusinesses();
  const { data: featuredOrderData, refetch: refetchFeaturedOrder } = useFeaturedOrder();
  const { data: withdrawals, refetch: refetchWithdrawals } = usePendingWithdrawals();

  const approveBiz = useApproveBusiness();
  const approveProperty = useApproveProperty();
  const deleteProperty = useDeleteProperty();
  const approveAgent = useApproveAgent();
  const approveClaim = useApproveClaim();
  const approveWithdrawal = useApproveWithdrawal();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteUser();
  const suspendAgent = useSuspendAgent();
  const deleteAgent = useDeleteAgent();
  const approveRider = useApproveRiderAdmin();
  const suspendRider = useSuspendRider();
  const deleteRider = useDeleteRider();
  const suspendBusiness = useSuspendBusiness();
  const deleteBusiness = useDeleteBusiness();

  const { data: allKYC } = useAllKYC();

  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [editAgent, setEditAgent] = useState<any>(null);
  const [editUser, setEditUser] = useState<{ id: number; name: string; email: string; role: string; createdAt: string } | null>(null);
  const [resetPwUser, setResetPwUser] = useState<{ id: number; name: string } | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editBusiness, setEditBusiness] = useState<AdminBusiness | null>(null);
  const [itemsBusiness, setItemsBusiness] = useState<AdminBusiness | null>(null);
  const [viewAgentBiz, setViewAgentBiz] = useState<AdminBusiness | null>(null);
  const [reviewAgent, setReviewAgent] = useState<any>(null);
  const [reviewRider, setReviewRider] = useState<PendingRider | null>(null);
  const [reviewProperty, setReviewProperty] = useState<AdminProperty | null>(null);
  const [reviewPropertyReadOnly, setReviewPropertyReadOnly] = useState(false);
  const [bizSearch, setBizSearch] = useState("");
  const [featuredList, setFeaturedList] = useState<FeaturedBiz[]>([]);
  const [featuredSaved, setFeaturedSaved] = useState(false);
  const saveFeaturedOrder = useSaveFeaturedOrder();
  const [impersonateData, setImpersonateData] = useState<{ name: string; token: string; role: string } | null>(null);
  const [showPassport, setShowPassport] = useState<number | null>(null);
  const [kycImgView, setKycImgView] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);
  const [reassignId, setReassignId] = useState<{ userId: number; name: string; currentMsaId: string | null } | null>(null);
  const [newMsaId, setNewMsaId] = useState("");
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSaving, setReassignSaving] = useState(false);

  const [assignMgrAgent, setAssignMgrAgent] = useState<{ id: number; name: string; managerId: number | null } | null>(null);
  const [galleryUnlocked, setGalleryUnlocked] = useState(false);
  const [galleryPin, setGalleryPin] = useState("");
  const [galleryPinError, setGalleryPinError] = useState(false);
  const [galleryFolder, setGalleryFolder] = useState<"passports" | "nin" | "business">("passports");
  const [galleryLightbox, setGalleryLightbox] = useState<string | null>(null);
  const { data: galleryData, isLoading: galleryLoading } = useAdminGallery();
  const [assignMgrSelected, setAssignMgrSelected] = useState<string>("");
  const [assignMgrSaving, setAssignMgrSaving] = useState(false);
  const [assignMgrError, setAssignMgrError] = useState<string | null>(null);

  const handleReassignMsaId = async () => {
    if (!reassignId || !newMsaId.trim()) return;
    setReassignSaving(true);
    setReassignError(null);
    try {
      const res = await fetch(`${BASE}/api/admin/users/${reassignId.userId}/msa-id`, {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify({ msaId: newMsaId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reassign ID");
      setReassignId(null);
      setNewMsaId("");
      refetchUsers();
      refetchAgents();
    } catch (e: any) {
      setReassignError(e.message);
    } finally {
      setReassignSaving(false);
    }
  };

  const handleAssignManager = async () => {
    if (!assignMgrAgent) return;
    setAssignMgrSaving(true);
    setAssignMgrError(null);
    try {
      const res = await fetch(`${BASE}/api/admin/agents/${assignMgrAgent.id}/assign-manager`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ managerId: assignMgrSelected === "" ? null : Number(assignMgrSelected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to assign manager");
      setAssignMgrAgent(null);
      setAssignMgrSelected("");
      refetchAgents();
    } catch (e: any) {
      setAssignMgrError(e.message);
    } finally {
      setAssignMgrSaving(false);
    }
  };

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

  const handleRiderApproval = async (id: number, approved: boolean) => {
    await approveRider.mutateAsync({ id, approved });
    refetchPendingRiders();
    refetchRiders();
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
    if (data.token) setImpersonateData({ name, token: data.token, role: data.user?.role ?? "visitor" });
  };

  const totalPending = (stats?.pendingBusinesses ?? 0) + (stats?.pendingAgents ?? 0) + (pendingClaims?.length ?? 0) + (withdrawals?.length ?? 0);

  const isAdminAuth = !!token && (adminUserLoading || adminUser?.role === "admin");
  if (!isAdminAuth && !adminUserLoading) {
    if (adminUser && adminUser.role !== "admin") {
      return (
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1428 50%, #060c1a 100%)" }}>
          <div className="text-center">
            <p className="text-red-400 font-semibold text-lg mb-1">Access Denied</p>
            <p className="text-white/40 text-sm">Redirecting you to your portal…</p>
          </div>
        </div>
      );
    }
    return <AdminLoginGate onUnlock={handleUnlock} />;
  }

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
        {showCreateUser && (
          <CreateUserModal
            onClose={() => setShowCreateUser(false)}
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
        {itemsBusiness && (
          <MarketplaceItemsModal
            businessId={itemsBusiness.id}
            businessName={itemsBusiness.name}
            onClose={() => setItemsBusiness(null)}
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
        {reviewRider && (
          <RiderReviewModal
            rider={reviewRider}
            onClose={() => setReviewRider(null)}
            approving={approveRider.isPending}
            onApprove={() => {
              handleRiderApproval(reviewRider.id, true);
              setReviewRider(null);
            }}
            onReject={() => {
              handleRiderApproval(reviewRider.id, false);
              setReviewRider(null);
            }}
          />
        )}
        {reviewProperty && (
          <PropertyReviewModal
            property={reviewProperty}
            readOnly={reviewPropertyReadOnly}
            onClose={() => setReviewProperty(null)}
            approving={approveProperty.isPending}
            {...(reviewPropertyReadOnly ? {} : {
              onApprove: async () => {
                await approveProperty.mutateAsync({ id: reviewProperty.id, approved: true });
                setReviewProperty(null);
              },
              onReject: async () => {
                await approveProperty.mutateAsync({ id: reviewProperty.id, approved: false });
                setReviewProperty(null);
              },
            })}
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

      {reassignId && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6 border border-white/10"
            style={{ background: "#0d1f3c" }}>
            <h3 className="text-base font-bold text-white mb-1">Reassign MSA ID</h3>
            <p className="text-sm text-white/50 mb-4">
              Assigning a new ID to <strong className="text-white">{reassignId.name}</strong>.
              {reassignId.currentMsaId && (
                <> Current ID: <span className="font-mono text-[#4a9eff]">{reassignId.currentMsaId}</span></>
              )}
            </p>
            <div className="mb-3">
              <label className="text-xs text-white/40 mb-1 block">New MSA ID</label>
              <input
                value={newMsaId}
                onChange={(e) => setNewMsaId(e.target.value)}
                placeholder="e.g. MSA-USER-0042 or MSA-AGENT-0010"
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#4a9eff]/50 placeholder:text-white/30 font-mono"
              />
              <p className="text-[10px] text-white/30 mt-1">Format: MSA-1, MSA-AGENT-XXXX, or MSA-USER-XXXX</p>
            </div>
            {reassignError && <p className="text-xs text-red-400 mb-3">{reassignError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReassignMsaId} disabled={reassignSaving || !newMsaId.trim()}
                className="flex-1 bg-[#4a9eff] hover:bg-[#3a8eef] text-white gap-1">
                {reassignSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                {reassignSaving ? "Saving…" : "Assign ID"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setReassignId(null); setNewMsaId(""); setReassignError(null); }}
                className="border-white/20 text-white/60 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      {assignMgrAgent && (
        <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6 border border-white/10"
            style={{ background: "#0d1f3c" }}>
            <h3 className="text-base font-bold text-white mb-1">Assign Regional Manager</h3>
            <p className="text-sm text-white/50 mb-4">
              Assigning a manager to <strong className="text-white">{assignMgrAgent.name}</strong>.
            </p>
            <div className="mb-3">
              <label className="text-xs text-white/40 mb-1 block">Regional Manager</label>
              <select
                value={assignMgrSelected}
                onChange={(e) => setAssignMgrSelected(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#4a9eff]/50">
                <option value="">— None (unassign) —</option>
                {(allUsers ?? []).filter((u: any) => u.role === "regional_manager").map((u: any) => (
                  <option key={u.id} value={String(u.id)}>{u.name} ({u.email})</option>
                ))}
              </select>
              {(allUsers ?? []).filter((u: any) => u.role === "regional_manager").length === 0 && (
                <p className="text-[11px] text-amber-400/70 mt-1">No regional managers found. Create one first under Staff Accounts.</p>
              )}
            </div>
            {assignMgrError && <p className="text-xs text-red-400 mb-3">{assignMgrError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAssignManager} disabled={assignMgrSaving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-1">
                {assignMgrSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {assignMgrSaving ? "Saving…" : "Assign"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAssignMgrAgent(null); setAssignMgrSelected(""); setAssignMgrError(null); }}
                className="border-white/20 text-white/60 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
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
      {galleryLightbox && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setGalleryLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" onClick={() => setGalleryLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={galleryLightbox} alt="Gallery" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
        </motion.div>
      )}

      {impersonateData && (
        <ImpersonateBanner
          name={impersonateData.name}
          token={impersonateData.token}
          role={impersonateData.role}
          onClear={() => setImpersonateData(null)}
        />
      )}

      {/* Sidebar + Content layout */}
      <div className="flex" style={{ minHeight: "calc(100vh - 64px)", background: "#070c1a" }}>

        {/* ── Mobile sidebar backdrop ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <aside
          className={`flex flex-col overflow-y-auto fixed inset-y-0 left-0 z-[9999] w-72 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:w-56 md:flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{ background: "#060c1a", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Mobile: header with close button */}
          <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,158,255,0.2)" }}>
                <ShieldCheck className="h-4 w-4 text-[#4a9eff]" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white tracking-wide">STREETLY</p>
                <p className="text-[10px] text-white/30 -mt-0.5">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: branding / pending alert */}
          <div className="hidden md:block px-4 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
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

          {/* Mobile: pending alert */}
          {totalPending > 0 && (
            <div className="md:hidden mx-4 mt-3 flex-shrink-0 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1.5 rounded-lg text-orange-300"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
              <AlertCircle className="h-3 w-3" />
              {totalPending} awaiting review
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2.5">
            <NavItem section="analytics" active={activeSection} label="Dashboard" icon={<BarChart2 className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Businesses" />
            <NavItem section="add-business" active={activeSection} label="Add Business" icon={<Plus className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="businesses" active={activeSection} label="Pending Review" icon={<AlertCircle className="h-4 w-4" />} badge={stats?.pendingBusinesses} onSelect={handleNavSelect} />
            <NavItem section="properties" active={activeSection} label="Pending Properties" icon={<Building2 className="h-4 w-4" />} badge={pendingProperties?.length} onSelect={handleNavSelect} />
            <NavItem section="add-property" active={activeSection} label="Add Property" icon={<Plus className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="all-properties" active={activeSection} label="All Properties" icon={<Building2 className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="all-businesses" active={activeSection} label="All Businesses" icon={<Building2 className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="featured-order" active={activeSection} label="Featured Order" icon={<Star className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="claims" active={activeSection} label="Ownership Claims" icon={<ShieldCheck className="h-4 w-4" />} badge={pendingClaims?.length} onSelect={handleNavSelect} />

            <NavGroup label="People" />
            <NavItem section="all-users" active={activeSection} label="All Users" icon={<Users className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="staff-accounts" active={activeSection} label="Staff Accounts" icon={<ShieldCheck className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="all-agents" active={activeSection} label="All Agents" icon={<User className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="pending-agents" active={activeSection} label="Pending Agents" icon={<AlertCircle className="h-4 w-4" />} badge={stats?.pendingAgents} onSelect={handleNavSelect} />
            <NavItem section="kyc" active={activeSection} label="KYC Documents" icon={<FileText className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Delivery" />
            <NavItem section="pending-riders" active={activeSection} label="Pending Riders" icon={<AlertCircle className="h-4 w-4" />} badge={pendingRiders?.length} onSelect={handleNavSelect} />
            <NavItem section="all-riders" active={activeSection} label="All Riders" icon={<User className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="all-deliveries" active={activeSection} label="Deliveries" icon={<Building2 className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Catalog" />
            <NavItem section="categories" active={activeSection} label="Categories" icon={<List className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Finance" />
            <NavItem section="commissions" active={activeSection} label="Commissions" icon={<CreditCard className="h-4 w-4" />} badge={withdrawals?.length} onSelect={handleNavSelect} />

            <NavGroup label="Communications" />
            <NavItem section="messages" active={activeSection} label="Messages" icon={<MessageSquare className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="support-tickets" active={activeSection} label="Support Tickets" icon={<LifeBuoy className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Data" />
            <NavItem section="export" active={activeSection} label="Export Data" icon={<Download className="h-4 w-4" />} onSelect={handleNavSelect} />
            <NavItem section="gallery" active={activeSection} label="Gallery" icon={<ImageIcon className="h-4 w-4" />} onSelect={handleNavSelect} />

            <NavGroup label="Configuration" />
            <NavItem section="email-settings" active={activeSection} label="Email &amp; Account" icon={<Settings className="h-4 w-4" />} onSelect={handleNavSelect} />
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
            style={{ background: "#060c1a", borderColor: "rgba(255,255,255,0.07)" }}>
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors -ml-1 flex-shrink-0">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-white flex-1 truncate">{SECTION_LABELS[activeSection] ?? activeSection}</span>
            {totalPending > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full text-orange-300 flex-shrink-0"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}>
                <AlertCircle className="h-3 w-3" />{totalPending}
              </span>
            )}
          </div>
          {/* Section content */}
          <div className="p-4 md:p-6">

          {/* ── Analytics ── */}
          {activeSection === "analytics" && (
            <>
              {/* Admin greeting card */}
              <div className="mb-6 rounded-2xl px-6 py-5 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, rgba(74,158,255,0.12) 0%, rgba(74,158,255,0.04) 100%)", border: "1px solid rgba(74,158,255,0.18)" }}>
                <div>
                  <p className="text-white/50 text-sm mb-0.5">{adminGreeting} 👋</p>
                  <h2 className="text-xl font-bold text-white">{adminFirstName}</h2>
                  {adminUser?.msaId && (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", border: "1px solid rgba(74,158,255,0.25)" }}>
                      <Key className="h-3 w-3" />
                      {adminUser.msaId}
                    </span>
                  )}
                </div>
                <ShieldCheck className="h-10 w-10 text-[#4a9eff] opacity-20" />
              </div>
              <AdminAnalytics />
            </>
          )}

          {/* ── Messages ── */}
          {activeSection === "messages" && <AdminMessages />}
          {activeSection === "support-tickets" && <AdminSupportTickets />}
          {activeSection === "export" && <AdminExport />}
          {activeSection === "email-settings" && <AdminEmailSettings />}

          {/* ── Gallery ── */}
          {activeSection === "gallery" && (
            <>
            <SectionHeader title="Gallery" sub="All photos uploaded across the platform — agent passports, NIN slips, and business photos." />
            {!galleryUnlocked ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)" }}>
                  <Key className="h-8 w-8 text-[#4a9eff]/60" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Gallery Locked</h3>
                <p className="text-sm text-white/40 mb-6">Enter the 4-digit PIN to access the gallery</p>
                <div className="flex gap-3 items-center">
                  <input
                    type="password"
                    maxLength={4}
                    value={galleryPin}
                    onChange={(e) => { setGalleryPin(e.target.value.replace(/\D/g, "")); setGalleryPinError(false); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (galleryPin === "1537") { setGalleryUnlocked(true); setGalleryPin(""); }
                        else { setGalleryPinError(true); setGalleryPin(""); }
                      }
                    }}
                    placeholder="••••"
                    className="w-24 text-center text-lg tracking-[0.5em] font-bold rounded-xl px-3 py-2.5 text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${galleryPinError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`, caretColor: "#4a9eff" }}
                    autoFocus
                  />
                  <Button size="sm"
                    onClick={() => {
                      if (galleryPin === "1537") { setGalleryUnlocked(true); setGalleryPin(""); }
                      else { setGalleryPinError(true); setGalleryPin(""); }
                    }}
                    className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white h-10 px-4">
                    Unlock
                  </Button>
                </div>
                {galleryPinError && <p className="text-xs text-red-400 mt-3">Incorrect PIN. Please try again.</p>}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex gap-1.5">
                    {([
                      { key: "passports", label: `Passports`, count: galleryData?.agentPassports.length ?? 0 },
                      { key: "nin", label: `NIN Slips`, count: galleryData?.agentNIN.length ?? 0 },
                      { key: "business", label: `Business`, count: galleryData?.businessPhotos.length ?? 0 },
                    ] as const).map(({ key, label, count }) => (
                      <button key={key} onClick={() => setGalleryFolder(key)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${galleryFolder === key ? "bg-[#4a9eff]/20 text-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}
                        style={galleryFolder !== key ? { background: "rgba(255,255,255,0.05)" } : {}}>
                        {label}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: galleryFolder === key ? "rgba(74,158,255,0.25)" : "rgba(255,255,255,0.1)" }}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setGalleryUnlocked(false)}
                    className="text-white/30 hover:text-white/60 gap-1 text-xs">
                    <Key className="h-3.5 w-3.5" /> Lock
                  </Button>
                </div>

                {galleryLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
                ) : (
                  <>
                    {galleryFolder === "passports" && (
                      <div>
                        <p className="text-xs text-white/30 mb-3 font-medium uppercase tracking-widest">Agent Passport Photos — {galleryData?.agentPassports.length ?? 0} images</p>
                        {!galleryData?.agentPassports.length ? (
                          <div className="text-center py-12 text-white/30 text-sm rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>No passport photos uploaded yet</div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {galleryData.agentPassports.map((img, i) => (
                              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-white/5"
                                onClick={() => setGalleryLightbox(img.url)}>
                                <img src={img.url} alt={img.agentName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                                  <p className="text-[9px] text-white font-medium truncate leading-tight">{img.agentName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {galleryFolder === "nin" && (
                      <div>
                        <p className="text-xs text-white/30 mb-3 font-medium uppercase tracking-widest">Agent NIN Slips — {galleryData?.agentNIN.length ?? 0} images</p>
                        {!galleryData?.agentNIN.length ? (
                          <div className="text-center py-12 text-white/30 text-sm rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>No NIN slips uploaded yet</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {galleryData.agentNIN.map((img, i) => (
                              <div key={i} className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5"
                                onClick={() => setGalleryLightbox(img.url)}>
                                <img src={img.url} alt={img.agentName} className="w-full object-cover aspect-[4/3] transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                                  <p className="text-[10px] text-white font-medium truncate">{img.agentName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {galleryFolder === "business" && (
                      <div>
                        <p className="text-xs text-white/30 mb-3 font-medium uppercase tracking-widest">Business Photos — {galleryData?.businessPhotos.length ?? 0} images</p>
                        {!galleryData?.businessPhotos.length ? (
                          <div className="text-center py-12 text-white/30 text-sm rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>No business photos uploaded yet</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {galleryData.businessPhotos.map((img) => (
                              <div key={img.id} className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5"
                                onClick={() => setGalleryLightbox(img.url)}>
                                <img src={img.url} alt={img.caption ?? img.businessName ?? "Business photo"} className="w-full object-cover aspect-square transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                                  <p className="text-[10px] text-white font-medium truncate">{img.businessName ?? "Business"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            </>
          )}

          {/* ── Categories ── */}
          {activeSection === "categories" && <AdminCategories />}

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

          {/* ── Pending Properties ── */}
          {activeSection === "properties" && (
            <>
            <SectionHeader title="Pending Properties" sub="Review and approve or reject vacant property submissions." />
            {!pendingProperties?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-green-500" />} title="No pending properties" sub="All properties have been reviewed" />
            ) : (
              <div className="space-y-3">
                {pendingProperties.map((prop) => (
                  <AdminCard key={prop.id}>
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {prop.photos?.[0] ? (
                        <img src={prop.photos[0].url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{prop.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{prop.address}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prop.priceType} · {prop.priceAmount ? `₦${prop.priceAmount.toLocaleString()}` : "Price on request"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact: {prop.contactName} ({prop.contactPhone})
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Submitted: {new Date(prop.createdAt).toLocaleDateString()}</p>
                        <button
                          onClick={() => { setReviewProperty(prop); setReviewPropertyReadOnly(false); }}
                          className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-amber-500/20"
                          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" }}
                        >
                          <List className="h-3 w-3" /> View Full Details & Photos
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <ApproveRejectButtons
                        onApprove={() => approveProperty.mutateAsync({ id: prop.id, approved: true })}
                        onReject={() => approveProperty.mutateAsync({ id: prop.id, approved: false })}
                        loading={approveProperty.isPending}
                      />
                      <Button size="sm" variant="ghost" 
                        onClick={() => setConfirmDelete({ label: prop.title, onConfirm: async () => { await deleteProperty.mutateAsync(prop.id); } })}
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5">
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── Add Property ── */}
          {activeSection === "add-property" && (
            <>
            <SectionHeader title="Add Property" sub="Directly list a vacant property on Streetly." />
            <AddPropertyForm onSuccess={() => { refetchAllProperties(); setActiveSection("all-properties"); }} />
            </>
          )}

          {/* ── All Properties ── */}
          {activeSection === "all-properties" && (
            <>
            <SectionHeader title="All Properties" sub="Manage every property listing on Streetly." />
            {!allProperties?.length ? (
              <EmptyState icon={<Building2 className="h-10 w-10 text-white/20" />} title="No properties yet" sub="Properties will appear here once submitted or added" />
            ) : (
              <div className="space-y-3">
                {allProperties.map((prop) => (
                  <AdminCard key={prop.id}>
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {prop.photos?.[0] ? (
                        <img src={prop.photos[0].url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-foreground truncate">{prop.title}</h3>
                          <StatusBadge status={prop.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{prop.address}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prop.priceType} · {prop.priceAmount ? `₦${prop.priceAmount.toLocaleString()}` : "Price on request"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact: {prop.contactName} ({prop.contactPhone})
                        </p>
                        <button
                          onClick={() => { setReviewProperty(prop); setReviewPropertyReadOnly(true); }}
                          className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-[#4a9eff]/20"
                          style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.25)", color: "#4a9eff" }}
                        >
                          <Eye className="h-3 w-3" /> View Details & Photos
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" variant="ghost"
                        onClick={() => setConfirmDelete({ label: prop.title, onConfirm: async () => { await deleteProperty.mutateAsync(prop.id); refetchAllProperties(); } })}
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5">
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
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
                        {agent.msaId && (
                          <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-[#4a9eff]/10 border border-[#4a9eff]/25 text-[#4a9eff] text-[10px] font-mono font-bold tracking-wider">
                            {agent.msaId}
                          </span>
                        )}
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
                      <Button size="sm" variant="outline"
                        onClick={() => { setReassignId({ userId: agent.userId, name: agent.fullName ?? agent.userName ?? `Agent #${agent.id}`, currentMsaId: agent.msaId ?? null }); setNewMsaId(agent.msaId ?? ""); setReassignError(null); }}
                        className="gap-1 text-purple-400 border-purple-400/30 hover:bg-purple-400/10">
                        <Key className="h-3.5 w-3.5" /> MSA ID
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setAssignMgrAgent({ id: agent.id, name: agent.fullName ?? agent.userName ?? `Agent #${agent.id}`, managerId: agent.managerId ?? null }); setAssignMgrSelected(agent.managerId ? String(agent.managerId) : ""); setAssignMgrError(null); }}
                        className="gap-1 text-orange-400 border-orange-400/30 hover:bg-orange-400/10">
                        <ShieldCheck className="h-3.5 w-3.5" /> Manager
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

          {/* ── Pending Riders ── */}
          {activeSection === "pending-riders" && (
            <>
            <SectionHeader title="Pending Riders" sub="Review delivery rider applications and approve or reject them." />
            {!pendingRiders?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-green-500" />} title="No pending riders" sub="All applications have been reviewed" />
            ) : (
              <div className="space-y-3">
                {pendingRiders.map((rider) => (
                  <AdminCard key={rider.id}>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{rider.fullName ?? `Rider #${rider.id}`}</h3>
                      <p className="text-xs text-muted-foreground">{rider.userEmail ?? "—"} · {rider.phone ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Vehicle: {rider.vehicleType ?? "—"} · ID: {rider.idType ?? "—"} {rider.idNumber ?? ""}</p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(rider.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                      <Button size="sm" variant="outline" onClick={() => setReviewRider(rider)} className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> View Profile
                      </Button>
                      <ApproveRejectButtons
                        onApprove={() => handleRiderApproval(rider.id, true)}
                        onReject={() => handleRiderApproval(rider.id, false)}
                        loading={approveRider.isPending}
                      />
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
            </>
          )}

          {/* ── All Riders ── */}
          {activeSection === "all-riders" && (
            <>
            <SectionHeader title="All Riders" sub="Manage all registered delivery riders on Streetly." />
            {!allRiders?.length ? (
              <EmptyState icon={<Users className="h-10 w-10 text-white/20" />} title="No riders yet" sub="Riders will appear here once they apply" />
            ) : (
              <div className="space-y-2">
                {allRiders.map((rider) => (
                  <AdminCard key={rider.id}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-foreground">{rider.fullName ?? rider.userName ?? `Rider #${rider.id}`}</h3>
                        <StatusBadge status={rider.status} />
                        {rider.isOnline && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-green-400"
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{rider.userEmail ?? "—"} · {rider.phone ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Vehicle: {rider.vehicleType ?? "—"} · Deliveries: {rider.totalDeliveries ?? 0}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
                      <Button size="sm" variant="outline"
                        onClick={async () => { await suspendRider.mutateAsync({ id: rider.id, suspend: rider.status !== "suspended" }); refetchRiders(); }}
                        className={`gap-1 ${rider.status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"}`}>
                        <Ban className="h-3.5 w-3.5" /> {rider.status === "suspended" ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => setConfirmDelete({ label: rider.fullName ?? `Rider #${rider.id}`, onConfirm: async () => { await deleteRider.mutateAsync(rider.id); refetchRiders(); } })}
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

          {/* ── All Deliveries ── */}
          {activeSection === "all-deliveries" && (
            <>
            <SectionHeader title="Deliveries" sub="All delivery requests placed across the platform." />
            {!allDeliveries?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-white/20" />} title="No deliveries yet" sub="Delivery requests will appear here" />
            ) : (
              <div className="space-y-2">
                {allDeliveries.map((d) => (
                  <AdminCard key={d.id}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-foreground">#{d.id} · {d.businessName ?? `Business #${d.businessId}`}</h3>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">Customer: {d.customerName} · {d.customerPhone}</p>
                      <p className="text-xs text-muted-foreground">To: {d.deliveryAddress}</p>
                      <p className="text-xs text-muted-foreground">Rider: {d.riderName ?? "Unassigned"} · {new Date(d.createdAt).toLocaleDateString()}</p>
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
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <SectionHeader title="All Users" sub="Manage all registered users. Field agents are listed under All Agents." />
              <Button size="sm" onClick={() => setShowCreateUser(true)}
                className="gap-1.5 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white flex-shrink-0">
                <UserPlus className="h-3.5 w-3.5" /> Create Staff Account
              </Button>
            </div>
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
                      {(user as any).msaId && (
                        <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-[#4a9eff]/10 border border-[#4a9eff]/25 text-[#4a9eff] text-[10px] font-mono font-bold tracking-wider">
                          {(user as any).msaId}
                        </span>
                      )}
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
                      <Button size="sm" variant="outline"
                        onClick={() => { setReassignId({ userId: user.id, name: user.name, currentMsaId: (user as any).msaId ?? null }); setNewMsaId((user as any).msaId ?? ""); setReassignError(null); }}
                        className="gap-1 text-purple-400 border-purple-400/30 hover:bg-purple-400/10">
                        <Key className="h-3.5 w-3.5" /> MSA ID
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

          {/* ── Staff Accounts ── */}
          {activeSection === "staff-accounts" && (() => {
            const staffRoles = ["moderator", "scout_manager", "regional_manager"];
            const staffUsers = (allUsers ?? []).filter((u: any) => staffRoles.includes(u.role));
            return (
              <>
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <SectionHeader title="Staff Accounts" sub="All moderators, scout managers, and regional managers. Edit a user to reassign their role." />
                <Button size="sm" onClick={() => setShowCreateUser(true)}
                  className="gap-1.5 bg-[#4a9eff] hover:bg-[#3a8ef0] text-white flex-shrink-0">
                  <UserPlus className="h-3.5 w-3.5" /> Add Staff
                </Button>
              </div>
              {staffUsers.length === 0 ? (
                <EmptyState icon={<ShieldCheck className="h-10 w-10 text-white/20" />} title="No staff accounts yet" sub="Use 'Add Staff' to create a moderator, scout manager, or regional manager account." />
              ) : (
                <div className="space-y-3">
                  {staffUsers.map((user: any) => (
                    <AdminCard key={user.id}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${user.role === "moderator" ? "bg-purple-500/15" : user.role === "regional_manager" ? "bg-orange-500/15" : "bg-emerald-500/15"}`}>
                        <ShieldCheck className={`h-5 w-5 ${user.role === "moderator" ? "text-purple-400" : user.role === "regional_manager" ? "text-orange-400" : "text-emerald-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === "moderator" ? "bg-purple-500/15 text-purple-400" : user.role === "regional_manager" ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {user.role === "moderator" ? "Moderator" : user.role === "regional_manager" ? "Regional Manager" : "Scout Manager"}
                          </span>
                          {(user as any).status === "suspended" && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">suspended</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Since {new Date(user.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setEditUser(user)}
                          className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                          <Edit2 className="h-3.5 w-3.5" /> Edit / Reassign
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
                          onClick={async () => { await suspendUser.mutateAsync({ id: user.id, suspend: user.status !== "suspended" }); refetchUsers(); }}
                          className={`gap-1 ${user.status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10"}`}>
                          <Ban className="h-3.5 w-3.5" /> {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                        </Button>
                      </div>
                    </AdminCard>
                  ))}
                </div>
              )}
              </>
            );
          })()}

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
                        <Button size="sm" variant="outline" onClick={() => setItemsBusiness(biz)}
                          className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                          <List className="h-3.5 w-3.5" /> Items
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
