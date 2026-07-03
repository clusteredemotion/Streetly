import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Loader2, Send, X, Plus, ChevronRight } from "lucide-react";
import {
  useListMySupportTickets,
  useCreateSupportTicket,
  useGetSupportTicket,
  useReplySupportTicket,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-600 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-muted-foreground/20",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function SupportTicketsPage() {
  const { toast } = useToast();
  const { data: tickets = [], isLoading } = useListMySupportTickets();
  const createTicket = useCreateSupportTicket();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate(
      { data: form },
      {
        onSuccess: () => {
          toast({ title: "Ticket submitted", description: "Our support team will respond shortly." });
          setForm({ subject: "", message: "" });
          setShowForm(false);
        },
        onError: () => {
          toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Layout>
      <section className="bg-gradient-to-br from-[#0547B6] via-[#0a5cd8] to-[#1a6de8] text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
              <LifeBuoy className="h-3.5 w-3.5 mr-1.5" /> Support Tickets
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Need <span className="text-yellow-300">Help?</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Open a ticket and our support team will get back to you directly.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Your Tickets</h2>
            <Button onClick={() => setShowForm((v) => !v)} className="bg-[#0547B6] hover:bg-[#0547B6]/90 gap-2">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancel" : "New Ticket"}
            </Button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="bg-card border rounded-2xl p-6 mb-6 space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="What do you need help with?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0547B6] hover:bg-[#0547B6]/90" disabled={createTicket.isPending}>
                  {createTicket.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Ticket"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl text-muted-foreground">
              <LifeBuoy className="h-8 w-8 mx-auto mb-3 opacity-40" />
              You haven't opened any support tickets yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className="w-full text-left bg-card border rounded-2xl p-5 hover:border-[#0547B6]/40 hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{t.subject}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{t.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Updated {new Date(t.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedId !== null && (
          <TicketDetailModal ticketId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}

function TicketDetailModal({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const { data, isLoading, refetch } = useGetSupportTicket(ticketId);
  const reply = useReplySupportTicket();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const handleReply = async () => {
    if (!message.trim()) return;
    await reply.mutateAsync({ id: ticketId, data: { message: message.trim() } });
    setMessage("");
    refetch();
    qc.invalidateQueries();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border rounded-2xl p-6"
      >
        {isLoading || !data ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-[#0547B6]" /> {data.ticket.subject}
                </h3>
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[data.ticket.status]}`}>
                  {STATUS_LABELS[data.ticket.status]}
                </span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="rounded-xl p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Your message</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{data.ticket.message}</p>
              </div>
              {data.replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl p-3"
                  style={{
                    background: r.senderRole === "admin" ? "rgba(5,71,182,0.08)" : "rgba(0,0,0,0.03)",
                    marginLeft: r.senderRole === "admin" ? 0 : "1.5rem",
                  }}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {r.senderRole === "admin" ? "Support Team" : "You"} · {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {data.ticket.status !== "closed" && (
              <div className="space-y-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Write a reply…"
                />
                <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={reply.isPending || !message.trim()} className="bg-[#0547B6] hover:bg-[#0547B6]/90 gap-2">
                    {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
