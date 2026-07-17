import { useState, useEffect, useCallback } from "react";
import {
  apiGetAllBusinesses, apiUpdateBusiness, apiSuspendBusiness, apiDeleteBusiness,
  type AdminBusiness,
} from "../../lib/api";

type Tab = "pending" | "all";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    approved: "bg-green-500/15 text-green-300 border-green-500/20",
    rejected: "bg-red-500/15 text-red-300 border-red-500/20",
    suspended: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  };
  const cls = map[status] ?? "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function BusinessesSection() {
  const [tab, setTab] = useState<Tab>("pending");
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetAllBusinesses();
      setBusinesses(data);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed = businesses.filter(b =>
    tab === "pending" ? b.status === "pending" : true
  );

  async function approve(id: number) {
    setActionId(id);
    try {
      await apiUpdateBusiness(id, { status: "approved" });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: "approved" } : b));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function reject(id: number) {
    setActionId(id);
    try {
      await apiUpdateBusiness(id, { status: "rejected" });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: "rejected" } : b));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function suspend(id: number) {
    setActionId(id);
    try {
      await apiSuspendBusiness(id);
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: "suspended" } : b));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); }
  }

  async function del(id: number) {
    setActionId(id);
    try {
      await apiDeleteBusiness(id);
      setBusinesses(prev => prev.filter(b => b.id !== id));
    } catch (e: any) { alert(e?.message ?? "Error"); }
    finally { setActionId(null); setConfirmDelete(null); }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(["pending", "all"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "text-white border-b-2 border-blue-500" : "text-slate-500"}`}>
            {t === "pending" ? `Pending (${businesses.filter(b => b.status === "pending").length})` : "All"}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            <p className="text-sm">{tab === "pending" ? "No pending businesses" : "No businesses yet"}</p>
          </div>
        )}

        {displayed.map(biz => {
          const busy = actionId === biz.id;
          return (
            <div key={biz.id} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-snug truncate">{biz.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{[biz.category, biz.city].filter(Boolean).join(" · ") || "—"}</p>
                  {biz.ownerName && <p className="text-slate-500 text-xs mt-0.5">Owner: {biz.ownerName}</p>}
                </div>
                <StatusBadge status={biz.status} />
              </div>

              {biz.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-600/20 text-green-300 border border-green-600/30 active:bg-green-600/30 disabled:opacity-40">
                    {busy ? "…" : "✓ Approve"}
                  </button>
                  <button onClick={() => reject(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/30 active:bg-red-600/30 disabled:opacity-40">
                    {busy ? "…" : "✗ Reject"}
                  </button>
                </div>
              )}

              {biz.status === "approved" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => suspend(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-orange-600/20 text-orange-300 border border-orange-600/30 active:bg-orange-600/30 disabled:opacity-40">
                    {busy ? "…" : "⚠ Suspend"}
                  </button>
                  <button onClick={() => confirmDelete === biz.id ? del(biz.id) : setConfirmDelete(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/30 active:bg-red-600/30 disabled:opacity-40">
                    {confirmDelete === biz.id ? "Tap again to confirm" : "Delete"}
                  </button>
                </div>
              )}

              {(biz.status === "suspended" || biz.status === "rejected") && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-600/20 text-green-300 border border-green-600/30 active:bg-green-600/30 disabled:opacity-40">
                    {busy ? "…" : "Reinstate"}
                  </button>
                  <button onClick={() => confirmDelete === biz.id ? del(biz.id) : setConfirmDelete(biz.id)} disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-600/20 text-red-300 border border-red-600/30 active:bg-red-600/30 disabled:opacity-40">
                    {confirmDelete === biz.id ? "Confirm delete" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
