import { useState, useEffect, useCallback } from "react";
import { apiGetAllUsers, apiSuspendUser, apiDeleteUser, type AdminUser } from "../../lib/api";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  visitor: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  rider: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  agent: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "business-owner": "bg-green-500/15 text-green-300 border-green-500/20",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {role}
    </span>
  );
}

export default function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetAllUsers();
      setUsers(data);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function suspend(id: number) {
    setActionId(id);
    try {
      await apiSuspendUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function del(id: number) {
    setActionId(id);
    try {
      await apiDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); setConfirmDelete(null); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/5">
        <input
          type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
            <button onClick={fetch} className="block mt-2 text-blue-400 text-xs mx-auto">Retry</button>
          </div>
        )}
        {!loading && !error && displayed.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-16">{search ? "No users match" : "No users yet"}</p>
        )}

        {displayed.map(u => {
          const busy = actionId === u.id;
          const isSuspended = u.status === "suspended";
          return (
            <div key={u.id} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{u.name || "—"}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RoleBadge role={u.role} />
                  {isSuspended && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">Suspended</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => suspend(u.id)} disabled={busy || u.role === "admin"}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border active:opacity-70 disabled:opacity-30 ${isSuspended ? "bg-green-600/20 text-green-300 border-green-600/30" : "bg-orange-600/20 text-orange-300 border-orange-600/30"}`}>
                  {busy ? "…" : isSuspended ? "Unsuspend" : "Suspend"}
                </button>
                <button onClick={() => confirmDelete === u.id ? del(u.id) : setConfirmDelete(u.id)} disabled={busy || u.role === "admin"}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/30 active:bg-red-600/30 disabled:opacity-30">
                  {confirmDelete === u.id ? "Confirm" : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
