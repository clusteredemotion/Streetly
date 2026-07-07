import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Loader2, Users, LogOut, Menu, X, ChevronLeft, Building2,
  CreditCard, User, IdCard, MapPin, Wallet, BadgeCheck, Phone, Mail,
  Camera, Image as ImageIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AdminLoginGate from "@/components/admin/AdminLoginGate";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type Section = "agents" | "agent-detail";

type AgentRow = {
  id: number; userId: number; status: string; fullName: string | null;
  age: number | null; address: string | null;
  bankName: string | null; accountNumber: string | null; accountName: string | null;
  idType: string | null; idNumber: string | null;
  totalEarnings: number; availableBalance: number;
  passportPhotoUrl: string | null; ninSlipUrl: string | null;
  createdAt: string; managerId: number | null;
  userName: string | null; userEmail: string | null; msaId: string | null;
};

type Business = {
  id: number; name: string; address: string | null; status: string;
  verified: boolean; createdAt: string;
  photos: Array<{ id: number; url: string; caption: string | null }>;
};

type Commission = { id: number; agentId: number; amount: number; status: string; createdAt: string };

function useMyAgents() {
  return useQuery({
    queryKey: ["rm", "agents"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/regional-manager/agents`, { headers: authHeader() });
      return res.json() as Promise<AgentRow[]>;
    },
  });
}

function useAgentBusinesses(agentId: number | null) {
  return useQuery({
    queryKey: ["rm", "agent-businesses", agentId],
    enabled: agentId !== null,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/regional-manager/agents/${agentId}/businesses`, { headers: authHeader() });
      return res.json() as Promise<Business[]>;
    },
  });
}

function useAgentCommissions(agentId: number | null) {
  return useQuery({
    queryKey: ["rm", "agent-commissions", agentId],
    enabled: agentId !== null,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/regional-manager/agents/${agentId}/commissions`, { headers: authHeader() });
      return res.json() as Promise<Commission[]>;
    },
  });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-500/15 text-green-400",
    pending: "bg-amber-500/15 text-amber-400",
    rejected: "bg-red-500/15 text-red-400",
    suspended: "bg-white/10 text-white/40",
    completed: "bg-green-500/15 text-green-400",
    failed: "bg-red-500/15 text-red-400",
    processing: "bg-blue-500/15 text-blue-400",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-white/80 flex-1 break-words">{value}</span>
    </div>
  );
}

function AgentDetailView({ agent, onBack }: { agent: AgentRow; onBack: () => void }) {
  const { data: businesses = [], isLoading: loadingBiz } = useAgentBusinesses(agent.id);
  const { data: commissions = [], isLoading: loadingComm } = useAgentCommissions(agent.id);
  const [tab, setTab] = useState<"profile" | "businesses" | "commissions">("profile");

  const displayName = agent.fullName ?? agent.userName ?? `Agent #${agent.id}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to agents
        </button>
      </div>

      <div className="flex items-center gap-4 p-5 rounded-2xl flex-wrap"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {agent.passportPhotoUrl ? (
          <img src={agent.passportPhotoUrl} alt={displayName}
            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-white/10" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-[#4a9eff]/70" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-bold text-white text-base">{displayName}</h2>
            <StatusPill status={agent.status} />
          </div>
          {agent.msaId && (
            <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-[#4a9eff]/10 border border-[#4a9eff]/25 text-[#4a9eff] text-[10px] font-mono font-bold tracking-wider">
              {agent.msaId}
            </span>
          )}
          <p className="text-xs text-white/50">{agent.userEmail}</p>
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-400">₦{agent.totalEarnings.toLocaleString()}</p>
              <p className="text-[10px] text-white/30">Total Earned</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#4a9eff]">₦{agent.availableBalance.toLocaleString()}</p>
              <p className="text-[10px] text-white/30">Balance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {(["profile", "businesses", "commissions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${tab === t ? "bg-[#4a9eff]/20 text-[#4a9eff]" : "text-white/40 hover:text-white/70"}`}
            style={tab !== t ? { background: "rgba(255,255,255,0.05)" } : {}}>
            {t}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="font-semibold text-white text-sm mb-3">Full Profile</h3>
          <InfoRow label="Full name" value={agent.fullName} />
          <InfoRow label="Age" value={agent.age} />
          <InfoRow label="Address" value={agent.address} />
          <InfoRow label="ID type" value={agent.idType} />
          <InfoRow label="ID number" value={agent.idNumber} />
          <InfoRow label="Bank" value={agent.bankName} />
          <InfoRow label="Account no." value={agent.accountNumber} />
          <InfoRow label="Account name" value={agent.accountName} />
          <InfoRow label="Joined" value={new Date(agent.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })} />
          {agent.passportPhotoUrl && (
            <div className="mt-4">
              <p className="text-xs text-white/40 mb-2">Passport photo</p>
              <img src={agent.passportPhotoUrl} alt="passport" className="w-32 h-32 rounded-xl object-cover border border-white/10" />
            </div>
          )}
          {agent.ninSlipUrl && (
            <div className="mt-4">
              <p className="text-xs text-white/40 mb-2">NIN slip</p>
              <img src={agent.ninSlipUrl} alt="NIN slip" className="w-full max-w-xs rounded-xl object-cover border border-white/10" />
            </div>
          )}
        </div>
      )}

      {tab === "businesses" && (
        <div>
          {loadingBiz ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              No businesses registered by this agent yet
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map(biz => (
                <div key={biz.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-white text-sm">{biz.name}</p>
                        <StatusPill status={biz.status} />
                        {biz.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-bold">verified</span>}
                      </div>
                      {biz.address && <p className="text-xs text-white/40">{biz.address}</p>}
                      <p className="text-xs text-white/25">Registered {new Date(biz.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                    </div>
                    <span className="text-xs text-white/30">{biz.photos.length} photo{biz.photos.length !== 1 ? "s" : ""}</span>
                  </div>
                  {biz.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 px-3 pb-3">
                      {biz.photos.map(p => (
                        <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                          <img src={p.url} alt={p.caption ?? biz.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "commissions" && (
        <div>
          {loadingComm ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              No commission records for this agent
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <span className="font-bold text-emerald-400">₦{c.amount.toLocaleString()}</span>
                    <span className="text-xs text-white/30 ml-2">{new Date(c.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RegionalManagerDashboardPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("streetly_token");
    if (!t) { setChecking(false); return; }
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.role === "regional_manager") {
          setToken(t);
        } else if (data?.role === "admin") {
          navigate("/admin");
        } else if (data?.role === "moderator") {
          navigate("/moderator");
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

  const { data: agents = [], isLoading } = useMyAgents();

  if (!token) {
    return (
      <AdminLoginGate
        allowedRoles={["regional_manager"]}
        portalLabel="Regional Manager Portal"
        onUnlock={(t) => { setToken(t); }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem("streetly_token");
    setToken(null);
  };
  const activeLabel = selectedAgent ? (selectedAgent.fullName ?? selectedAgent.userName ?? `Agent #${selectedAgent.id}`) : "My Agents";

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1428 50%, #060c1a 100%)" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex-col md:static md:translate-x-0 ${mobileOpen ? "flex" : "hidden md:flex"}`}
        style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="font-bold text-white text-sm">STREETLY</p>
            <p className="text-[11px] text-[#4a9eff]/70">Regional Manager</p>
          </div>
          <button className="md:hidden text-white/40 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button onClick={() => { setSelectedAgent(null); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedAgent ? "text-white bg-[#4a9eff]/15" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
            <Users className="h-4 w-4" />
            <span className="flex-1 text-left">My Agents</span>
            {(agents as AgentRow[]).length > 0 && (
              <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "rgba(74,158,255,0.2)", color: "#4a9eff" }}>
                {(agents as AgentRow[]).length}
              </span>
            )}
          </button>
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
            <h1 className="font-bold text-white text-sm truncate max-w-[200px]">{activeLabel}</h1>
            <p className="text-[11px] text-white/30">Regional Management</p>
          </div>
        </header>
        <div className="p-6">
          {selectedAgent ? (
            <AgentDetailView agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">My Agents</h2>
                <p className="text-sm text-white/40">All field agents assigned to your region. Tap an agent to view their full profile, commissions, and registered businesses.</p>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
              ) : (agents as AgentRow[]).length === 0 ? (
                <div className="text-center py-16 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                  <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  No agents assigned to your region yet.<br />Contact your admin to assign agents.
                </div>
              ) : (
                <div className="space-y-3">
                  {(agents as AgentRow[]).map(agent => (
                    <button key={agent.id} onClick={() => { setSelectedAgent(agent); setMobileOpen(false); }}
                      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-all hover:ring-1"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {agent.passportPhotoUrl ? (
                        <img src={agent.passportPhotoUrl} alt={agent.fullName ?? "agent"}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-[#4a9eff]/70" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-white text-sm">{agent.fullName ?? agent.userName ?? `Agent #${agent.id}`}</p>
                          <StatusPill status={agent.status} />
                        </div>
                        {agent.msaId && <span className="inline-block mb-0.5 text-[10px] text-[#4a9eff]/70 font-mono">{agent.msaId}</span>}
                        <p className="text-xs text-white/40">{agent.userEmail}</p>
                        <p className="text-xs text-white/30">Earned: ₦{agent.totalEarnings.toLocaleString()} · Balance: ₦{agent.availableBalance.toLocaleString()}</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-white/20 rotate-180 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
