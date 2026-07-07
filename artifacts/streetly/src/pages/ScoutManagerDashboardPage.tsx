import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Users, CreditCard, Tag, Building2, LogOut, Menu, X, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import AdminCategories from "@/components/admin/AdminCategories";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type Section = "agents" | "commissions" | "categories" | "properties";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "agents", label: "Agent Applications", icon: <Users className="h-4 w-4" /> },
  { id: "commissions", label: "Commissions", icon: <CreditCard className="h-4 w-4" /> },
  { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
  { id: "properties", label: "Properties", icon: <Building2 className="h-4 w-4" /> },
];

/* ── Data hooks ── */
function useAllAgents() {
  return useQuery({
    queryKey: ["scout", "agents", "all"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/agents/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; userId: number; status: string; fullName: string | null;
        bankName: string | null; accountNumber: string | null; accountName: string | null;
        totalEarnings: number; availableBalance: number;
        createdAt: string; userName: string | null; userEmail: string | null;
      }>>;
    },
  });
}

function useApproveAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/agents/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scout", "agents"] }); },
  });
}

function useSuspendAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/agents/${id}/suspend`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ suspend }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scout", "agents"] }); },
  });
}

function useWithdrawals() {
  return useQuery({
    queryKey: ["scout", "withdrawals"],
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

function useApproveWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      const res = await fetch(`${BASE}/api/admin/withdrawals/${id}/approve`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ approved }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scout", "withdrawals"] }); },
  });
}

function useAllProperties() {
  return useQuery({
    queryKey: ["scout", "properties"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/properties/all`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; title: string; address: string; status: string;
        priceAmount: number | null; priceType: string; contactName: string; contactPhone: string;
        createdAt: string;
      }>>;
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scout", "properties"] }); },
  });
}

/* ── Status pill ── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-500/15 text-green-400",
    pending: "bg-amber-500/15 text-amber-400",
    rejected: "bg-red-500/15 text-red-400",
    suspended: "bg-white/10 text-white/40",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  );
}

/* ── Agents Panel ── */
function AgentsSection() {
  const { data: agents = [], isLoading } = useAllAgents();
  const approve = useApproveAgent();
  const suspend = useSuspendAgent();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");

  const filtered = filter === "all" ? agents : agents.filter(a => a.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Agent Applications</h2>
          <p className="text-sm text-white/40">Approve, suspend or review scout/field agents.</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "suspended"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === f ? "bg-[#4a9eff]/20 text-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}
              style={filter !== f ? { background: "rgba(255,255,255,0.05)" } : {}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No {filter === "all" ? "" : filter} agents
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(agent => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl flex-wrap"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-white text-sm">{agent.fullName ?? agent.userName ?? `Agent #${agent.id}`}</p>
                  <StatusPill status={agent.status} />
                </div>
                <p className="text-xs text-white/40">{agent.userEmail}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  Earnings: ₦{agent.totalEarnings.toLocaleString()} · Balance: ₦{agent.availableBalance.toLocaleString()}
                </p>
                <p className="text-xs text-white/25">Applied {new Date(agent.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {agent.status === "pending" && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      onClick={() => approve.mutate({ id: agent.id, approved: true })} disabled={approve.isPending}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1"
                      onClick={() => approve.mutate({ id: agent.id, approved: false })} disabled={approve.isPending}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {(agent.status === "approved" || agent.status === "suspended") && (
                  <Button size="sm" variant="outline"
                    onClick={() => suspend.mutate({ id: agent.id, suspend: agent.status !== "suspended" })}
                    disabled={suspend.isPending}
                    className={agent.status === "suspended" ? "text-green-400 border-green-400/30 hover:bg-green-400/10 gap-1" : "text-amber-400 border-amber-400/30 hover:bg-amber-400/10 gap-1"}>
                    <Ban className="h-3.5 w-3.5" />
                    {agent.status === "suspended" ? "Unsuspend" : "Suspend"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Commissions Panel ── */
function CommissionsSection() {
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const approve = useApproveWithdrawal();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Commissions</h2>
        <p className="text-sm text-white/40">Approve or decline pending agent commission payouts.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No pending commission payouts
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map(w => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl flex-wrap"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white text-sm">{w.agentFullName ?? `Agent #${w.agentId}`}</p>
                  <span className="text-base font-bold text-emerald-400">₦{w.amount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-white/40">{w.agentBankName} · {w.agentAccountNumber} · {w.agentAccountName}</p>
                <p className="text-xs text-white/30">Balance: ₦{(w.agentAvailableBalance ?? 0).toLocaleString()} · {new Date(w.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => approve.mutate({ id: w.id, approved: true })} disabled={approve.isPending}>
                  <CheckCircle className="h-3.5 w-3.5" /> Pay
                </Button>
                <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1"
                  onClick={() => approve.mutate({ id: w.id, approved: false })} disabled={approve.isPending}>
                  <XCircle className="h-3.5 w-3.5" /> Decline
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Properties Panel ── */
function PropertiesSection() {
  const { data: properties = [], isLoading } = useAllProperties();
  const approve = useApproveProperty();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filtered = filter === "all" ? properties : properties.filter(p => p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Properties</h2>
          <p className="text-sm text-white/40">Review and approve vacant property listings.</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === f ? "bg-[#4a9eff]/20 text-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}
              style={filter !== f ? { background: "rgba(255,255,255,0.05)" } : {}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No {filter === "all" ? "" : filter} properties
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prop => (
            <motion.div key={prop.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl flex-wrap"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-white text-sm">{prop.title}</p>
                  <StatusPill status={prop.status} />
                </div>
                <p className="text-xs text-white/40">{prop.address}</p>
                {prop.priceAmount && (
                  <p className="text-xs text-white/30">₦{prop.priceAmount.toLocaleString()} / {prop.priceType}</p>
                )}
                <p className="text-xs text-white/25">Contact: {prop.contactName} · {prop.contactPhone}</p>
              </div>
              {prop.status === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => approve.mutate({ id: prop.id, approved: true })} disabled={approve.isPending}>
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1"
                    onClick={() => approve.mutate({ id: prop.id, approved: false })} disabled={approve.isPending}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function ScoutManagerDashboardPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("agents");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("streetly_token");
    if (!t) { setChecking(false); return; }
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.role === "scout_manager") {
          setToken(t);
        } else if (data?.role === "admin") {
          navigate("/admin");
        } else if (data?.role === "moderator") {
          navigate("/moderator");
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
        allowedRoles={["scout_manager"]}
        portalLabel="Scout Manager Portal"
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex-col transition-transform duration-300 md:relative md:flex md:translate-x-0 ${mobileOpen ? "flex translate-x-0" : "-translate-x-full md:flex"}`}
        style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="font-bold text-white text-sm">STREETLY</p>
            <p className="text-[11px] text-[#4a9eff]/70">Scout Manager Portal</p>
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
            <p className="text-[11px] text-white/30">Scout Operations</p>
          </div>
        </header>
        <div className="p-6">
          {activeSection === "agents" && <AgentsSection />}
          {activeSection === "commissions" && <CommissionsSection />}
          {activeSection === "categories" && <AdminCategories />}
          {activeSection === "properties" && <PropertiesSection />}
        </div>
      </main>
    </div>
  );
}
