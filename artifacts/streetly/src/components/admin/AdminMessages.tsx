import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle, Users, User, MessageSquare, ChevronDown, Inbox } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

type UserRecord = { id: number; name: string; email: string; role: string };

function useAllUsersMsg() {
  return useQuery({
    queryKey: ["admin", "users-msg"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/users/all`, { headers: authHeader() });
      return res.json() as Promise<UserRecord[]>;
    },
  });
}

function useSentMessages() {
  return useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/messages`, { headers: authHeader() });
      return res.json() as Promise<Array<{
        id: number; recipientType: string; recipientId: number | null;
        subject: string; body: string; sentAt: string;
        recipientName: string | null; recipientEmail: string | null;
      }>>;
    },
  });
}

function useSendMessage() {
  return useMutation({
    mutationFn: async (payload: { recipientType: string; recipientId?: number; subject: string; body: string }) => {
      const res = await fetch(`${BASE}/api/admin/messages`, {
        method: "POST", headers: authHeader(), body: JSON.stringify(payload),
      });
      return res.json();
    },
  });
}

export default function AdminMessages() {
  const { data: users = [] } = useAllUsersMsg();
  const { data: sent = [], refetch } = useSentMessages();
  const send = useSendMessage();
  const qc = useQueryClient();

  const [recipientType, setRecipientType] = useState<"all" | "user">("all");
  const [recipientId, setRecipientId] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (recipientType === "user" && !recipientId) return;
    await send.mutateAsync({
      recipientType,
      recipientId: recipientType === "user" ? Number(recipientId) : undefined,
      subject: subject.trim(),
      body: body.trim(),
    });
    setDone(true);
    setSubject(""); setBody(""); setRecipientId("");
    refetch();
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Messages</h2>
        <p className="text-sm text-white/40">Send platform announcements or direct messages to users</p>
      </div>

      {/* Compose */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#4a9eff]" /> Compose Message
        </h3>

        {/* Recipient */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2">Recipients</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setRecipientType("all")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${recipientType === "all" ? "bg-[#4a9eff] text-white" : "text-white/40 hover:text-white/70"}`}
              style={recipientType !== "all" ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : {}}>
              <Users className="h-4 w-4" /> All Users
            </button>
            <button onClick={() => setRecipientType("user")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${recipientType === "user" ? "bg-[#4a9eff] text-white" : "text-white/40 hover:text-white/70"}`}
              style={recipientType !== "user" ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : {}}>
              <User className="h-4 w-4" /> Specific Person
            </button>
          </div>

          <AnimatePresence>
            {recipientType === "user" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="relative">
                  <select value={recipientId} onChange={(e) => setRecipientId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <option value="" style={{ background: "#0d1b2e" }}>— Select a user —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id} style={{ background: "#0d1b2e" }}>
                        {u.name} ({u.email}) — {u.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Platform Update, Important Notice…"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5}
            placeholder="Write your message here…"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <div className="flex items-center justify-between">
          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4" /> Message sent successfully!
              </motion.div>
            )}
          </AnimatePresence>
          <div className="ml-auto">
            <Button onClick={handleSend} disabled={send.isPending || !subject.trim() || !body.trim() || (recipientType === "user" && !recipientId)}
              className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-2">
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {recipientType === "all" ? "Send to All Users" : "Send Message"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sent Messages */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Inbox className="h-4 w-4 text-white/40" /> Sent Messages ({sent.length})
        </h3>
        {sent.length === 0 ? (
          <div className="text-center py-12 rounded-2xl text-white/30 text-sm" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
            No messages sent yet
          </div>
        ) : (
          <div className="space-y-3">
            {sent.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{msg.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.recipientType === "all" ? "bg-[#4a9eff]/15 text-[#4a9eff]" : "bg-purple-500/15 text-purple-400"}`}>
                        {msg.recipientType === "all" ? "📢 All Users" : `→ ${msg.recipientName ?? `User #${msg.recipientId}`}`}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2">{msg.body}</p>
                  </div>
                  <p className="text-[10px] text-white/30 flex-shrink-0">{new Date(msg.sentAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
