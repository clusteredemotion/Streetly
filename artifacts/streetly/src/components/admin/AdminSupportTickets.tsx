import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useListAllSupportTickets,
  useGetSupportTicket,
  useReplySupportTicket,
  useUpdateSupportTicketStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, LifeBuoy, ChevronDown, X, User } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-[#4a9eff]/15 text-[#4a9eff]",
  resolved: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-white/10 text-white/40",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function AdminSupportTickets() {
  const qc = useQueryClient();
  const { data: tickets = [], isLoading } = useListAllSupportTickets();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Support Tickets</h2>
          <p className="text-sm text-white/40">View and respond to user support requests</p>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <option value="all" style={{ background: "#0d1b2e" }}>All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k} style={{ background: "#0d1b2e" }}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          No support tickets {statusFilter !== "all" ? `with status "${STATUS_LABELS[statusFilter]}"` : "yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-left rounded-2xl p-4 transition-colors hover:bg-white/[0.06]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{t.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-1 mb-1">{t.message}</p>
                  <p className="text-[11px] text-white/30 flex items-center gap-1">
                    <User className="h-3 w-3" /> {t.userName ?? `User #${t.userId}`} ({t.userEmail ?? "unknown"})
                  </p>
                </div>
                <p className="text-[10px] text-white/30 flex-shrink-0">
                  {new Date(t.updatedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId !== null && (
          <TicketDetailModal
            ticketId={selectedId}
            onClose={() => setSelectedId(null)}
            onChanged={() => qc.invalidateQueries({ queryKey: ["/admin/support-tickets"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketDetailModal({ ticketId, onClose, onChanged }: { ticketId: number; onClose: () => void; onChanged: () => void }) {
  const { data, isLoading, refetch } = useGetSupportTicket(ticketId);
  const reply = useReplySupportTicket();
  const updateStatus = useUpdateSupportTicketStatus();
  const [message, setMessage] = useState("");

  const handleReply = async () => {
    if (!message.trim()) return;
    await reply.mutateAsync({ id: ticketId, data: { message: message.trim() } });
    setMessage("");
    refetch();
    onChanged();
  };

  const handleStatus = async (status: string) => {
    await updateStatus.mutateAsync({ id: ticketId, data: { status: status as any } });
    refetch();
    onChanged();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {isLoading || !data ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-[#4a9eff]" /> {data.ticket.subject}
                </h3>
                <p className="text-xs text-white/40 mt-1">Ticket #{data.ticket.id}</p>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-1.5 mb-4">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => handleStatus(k)}
                  disabled={updateStatus.isPending}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                    data.ticket.status === k ? STATUS_STYLES[k] : "text-white/30 hover:text-white/60"
                  }`}
                  style={data.ticket.status !== k ? { background: "rgba(255,255,255,0.05)" } : {}}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs text-white/40 mb-1">Original message</p>
                <p className="text-sm text-white/85 whitespace-pre-wrap">{data.ticket.message}</p>
              </div>
              {data.replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl p-3"
                  style={{
                    background: r.senderRole === "admin" ? "rgba(74,158,255,0.10)" : "rgba(255,255,255,0.04)",
                    marginLeft: r.senderRole === "admin" ? "1.5rem" : 0,
                  }}
                >
                  <p className="text-xs text-white/40 mb-1">
                    {r.senderRole === "admin" ? "Support Team" : r.senderName ?? "User"} · {new Date(r.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-sm text-white/85 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Write a reply…"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
              />
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={reply.isPending || !message.trim()} className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-2">
                  {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Reply
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
