import { useState, useEffect, useCallback } from "react";
import {
  apiGetAllRiders, apiApproveRider, apiSuspendRider, apiDeleteRider, type AdminRider,
} from "../../lib/api";

type Tab = "pending" | "all";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    approved: "bg-green-500/15 text-green-300 border-green-500/20",
    suspended: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    rejected: "bg-red-500/15 text-red-300 border-red-500/20",
  };
  const cls = map[status] ?? "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>{status}</span>;
}

export default function RidersSection() {
  const [tab, setTab] = useState<Tab>("pending");
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetAllRiders();
      setRiders(data);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed = riders.filter(r => tab === "pending" ? r.status === "pending" : true);

  async function approve(id: number) {
    setActionId(id);
    try {
      await apiApproveRider(id);
      setRiders(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function suspend(id: number) {
    setActionId(id);
    try {
      await apiSuspendRider(id);
      setRiders(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "suspended" ? "approved" : "suspended" } : r));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function del(id: number) {
    setActionId(id);
    try {
      await apiDeleteRider(id);
      setRiders(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); setConfirmDelete(null); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/5">
        {(["pending", "all"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-white border-b-2 border-blue-500" : "text-slate-500"}`}>
            {t === "pending" ? `Pending (${riders.filter(r => r.status === "pending").length})` : "All"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
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
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
            <p className="text-sm">{tab === "pending" ? "No pending riders" : "No riders yet"}</p>
          </div>
        )}

        {displayed.map(r => {
          const busy = actionId === r.id;
          return (
            <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{r.name || "Unnamed Rider"}</p>
                  {r.email && <p className="text-slate-400 text-xs mt-0.5 truncate">{r.email}</p>}
                  {r.city && <p className="text-slate-500 text-xs">{r.city}</p>}
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="flex gap-2 mt-3">
                {r.status === "pending" && (
                  <button onClick={() => approve(r.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-600/20 text-green-300 border border-green-600/30 active:bg-green-600/30 disabled:opacity-40">
                    {busy ? "…" : "✓ Approve"}
                  </button>
                )}
                {r.status === "approved" && (
                  <button onClick={() => suspend(r.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-orange-600/20 text-orange-300 border border-orange-600/30 active:bg-orange-600/30 disabled:opacity-40">
                    {busy ? "…" : "Suspend"}
                  </button>
                )}
                {r.status === "suspended" && (
                  <button onClick={() => approve(r.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-600/20 text-green-300 border border-green-600/30 active:bg-green-600/30 disabled:opacity-40">
                    {busy ? "…" : "Reinstate"}
                  </button>
                )}
                <button onClick={() => confirmDelete === r.id ? del(r.id) : setConfirmDelete(r.id)} disabled={busy}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/30 active:bg-red-600/30 disabled:opacity-40">
                  {confirmDelete === r.id ? "Confirm delete" : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
