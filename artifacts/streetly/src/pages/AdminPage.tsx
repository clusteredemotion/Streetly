import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2, Eye, EyeOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AddBusinessForm from "@/components/admin/AddBusinessForm";

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
        passportPhotoUrl: string | null; createdAt: string;
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
      }>>;
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

/* ══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AdminPage() {
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: pendingBiz } = useGetPendingBusinesses();
  const { data: pendingAgents } = useGetPendingAgents();
  const { data: pendingClaims } = usePendingClaims();
  const { data: allAgents, refetch: refetchAgents } = useAllAgents();
  const { data: allUsers, refetch: refetchUsers } = useAllUsers();
  const { data: withdrawals, refetch: refetchWithdrawals } = usePendingWithdrawals();

  const approveBiz = useApproveBusiness();
  const approveAgent = useApproveAgent();
  const approveClaim = useApproveClaim();
  const approveWithdrawal = useApproveWithdrawal();

  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [editAgent, setEditAgent] = useState<typeof allAgents extends Array<infer T> ? T | null : null>(null);
  const [editUser, setEditUser] = useState<{ id: number; name: string; email: string; role: string; createdAt: string } | null>(null);
  const [impersonateData, setImpersonateData] = useState<{ name: string; token: string } | null>(null);
  const [showPassport, setShowPassport] = useState<number | null>(null);

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
      </AnimatePresence>

      {impersonateData && (
        <ImpersonateBanner
          name={impersonateData.name}
          token={impersonateData.token}
          onClear={() => setImpersonateData(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#060c1e] to-[#0a1a38] text-white py-10 border-b border-white/5">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Streetly platform management</p>
          {totalPending > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/25 text-orange-300 text-sm px-3 py-1.5 rounded-full">
              <AlertCircle className="h-4 w-4" />
              {totalPending} item{totalPending !== 1 ? "s" : ""} awaiting review
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-blue-400 bg-blue-900/30" },
              { label: "Agents", value: stats.totalAgents, icon: Users, color: "text-green-400 bg-green-900/30" },
              { label: "Users", value: stats.totalUsers, icon: Users, color: "text-purple-400 bg-purple-900/30" },
              { label: "Pending Biz", value: stats.pendingBusinesses, icon: AlertCircle, color: "text-orange-400 bg-orange-900/30" },
              { label: "Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-emerald-400 bg-emerald-900/30" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="add-business">
          <div className="overflow-x-auto pb-1">
            <TabsList className="mb-6 flex-nowrap h-auto gap-1 min-w-max bg-white/5 border border-white/10">
              <TabsTrigger value="add-business" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                <Plus className="h-3.5 w-3.5" /> Add Business
              </TabsTrigger>
              <TabsTrigger value="businesses" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                Pending Businesses
                {(stats?.pendingBusinesses ?? 0) > 0 && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">{stats?.pendingBusinesses}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-agents" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                Pending Agents
                {(stats?.pendingAgents ?? 0) > 0 && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">{stats?.pendingAgents}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all-agents" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                <Users className="h-3.5 w-3.5" /> All Agents
              </TabsTrigger>
              <TabsTrigger value="all-users" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                <Users className="h-3.5 w-3.5" /> All Users
              </TabsTrigger>
              <TabsTrigger value="commissions" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                <CreditCard className="h-3.5 w-3.5" /> Commissions
                {(withdrawals?.length ?? 0) > 0 && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">{withdrawals?.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="claims" className="gap-2 whitespace-nowrap data-[state=active]:bg-[#4a9eff] data-[state=active]:text-white">
                Claims
                {(pendingClaims?.length ?? 0) > 0 && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 h-5 min-w-5 px-1.5 text-xs">{pendingClaims?.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Add Business ── */}
          <TabsContent value="add-business">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Add New Business</h2>
                <p className="text-sm text-muted-foreground mt-1">Register a business directly to the Streetly directory.</p>
              </div>
              <AddBusinessForm />
            </div>
          </TabsContent>

          {/* ── Pending Businesses ── */}
          <TabsContent value="businesses">
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
          </TabsContent>

          {/* ── Pending Agents ── */}
          <TabsContent value="pending-agents">
            {!pendingAgents?.length ? (
              <EmptyState icon={<CheckCircle className="h-10 w-10 text-green-500" />} title="No pending agents" sub="All applications have been reviewed" />
            ) : (
              <div className="space-y-3">
                {pendingAgents.map((agent) => (
                  <AdminCard key={agent.id}>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{agent.fullName ?? `Agent #${agent.id}`}</h3>
                      <p className="text-sm text-muted-foreground">Bank: {agent.bankName} · {agent.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">ID: {agent.idType?.toUpperCase()} — {agent.idNumber}</p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(agent.createdAt).toLocaleDateString()}</p>
                    </div>
                    <ApproveRejectButtons
                      onApprove={() => handleAgentApproval(agent.id, true)}
                      onReject={() => handleAgentApproval(agent.id, false)}
                      loading={approveAgent.isPending}
                    />
                  </AdminCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── All Agents ── */}
          <TabsContent value="all-agents">
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
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── All Users ── */}
          <TabsContent value="all-users">
            {!allUsers?.length ? (
              <EmptyState icon={<Users className="h-10 w-10 text-white/20" />} title="No users yet" sub="" />
            ) : (
              <div className="space-y-2">
                {allUsers.map((user) => (
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
                      <p className="text-xs text-muted-foreground">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setEditUser(user)}
                        className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleImpersonate(user.id, user.name)}
                        className="gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10">
                        <LogIn className="h-3.5 w-3.5" /> Login As
                      </Button>
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Commissions ── */}
          <TabsContent value="commissions">
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
          </TabsContent>

          {/* ── Ownership Claims ── */}
          <TabsContent value="claims">
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
          </TabsContent>
        </Tabs>
      </div>
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
