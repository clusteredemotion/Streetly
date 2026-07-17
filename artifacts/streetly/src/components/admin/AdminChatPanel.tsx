import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/utils";
import { playNotificationSound, showBrowserNotification } from "@/lib/notificationSound";
import {
  MessageSquare, ArrowLeft, Send, Loader2, User as UserIcon, Building2,
  ShieldCheck, RefreshCw, UserCheck, Clock, CheckCircle2, AlertCircle, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = getApiBase();
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface Conversation {
  id: number;
  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  isGuest: boolean;
  businessId: number | null;
  businessName: string | null;
  status: string;
  assignedTo: string;
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: { body: string; senderRole: string; createdAt: string } | null;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderRole: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

function StatusBadge({ status, assignedTo }: { status: string; assignedTo: string }) {
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
        <Clock className="h-2.5 w-2.5" /> Connecting
      </span>
    );
  }
  if (assignedTo === "store") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
        <Building2 className="h-2.5 w-2.5" /> With Store
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
      <ShieldCheck className="h-2.5 w-2.5" /> With Admin
    </span>
  );
}

function SenderAvatar({ senderRole }: { senderRole: string }) {
  const cls = "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0";
  if (senderRole === "admin") return <div className={cn(cls, "bg-[#4a9eff]/20 text-[#4a9eff]")}><ShieldCheck className="h-3.5 w-3.5" /></div>;
  if (senderRole === "business") return <div className={cn(cls, "bg-green-500/20 text-green-400")}><Building2 className="h-3.5 w-3.5" /></div>;
  return <div className={cn(cls, "bg-white/10 text-white/50")}><UserIcon className="h-3.5 w-3.5" /></div>;
}

// Bouncing dots typing indicator for admin panel (dark theme)
function TypingBubble({ label }: { label: string | null }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 text-white/50">
        <UserIcon className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {label && (
          <p className="text-[10px] font-semibold mb-1 opacity-50 capitalize">{label}</p>
        )}
        <div className="flex items-center gap-1 h-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: "rgba(255,255,255,0.35)", animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [reassigned, setReassigned] = useState(false);
  const [otherTyping, setOtherTyping] = useState<{ isTyping: boolean; label: string | null }>({ isTyping: false, label: null });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConvIdsRef = useRef<Set<number> | null>(null);
  const prevMsgIdsRef  = useRef<Set<number> | null>(null);

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BASE}/api/conversations`, { headers: authHeader() });
      if (res.ok) {
        const convs: Conversation[] = await res.json();
        setConversations(convs);
        if (prevConvIdsRef.current === null) {
          prevConvIdsRef.current = new Set(convs.map(c => c.id));
        } else {
          const newConvs = convs.filter(c => !prevConvIdsRef.current!.has(c.id));
          if (newConvs.length > 0) {
            playNotificationSound();
            showBrowserNotification("New conversation", `${newConvs[0].customerName ?? "A user"} started a chat`);
          }
          prevConvIdsRef.current = new Set(convs.map(c => c.id));
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchMessages = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations/${id}/messages`, { headers: authHeader() });
      if (res.ok) {
        const msgs: ChatMessage[] = await res.json();
        setMessages(msgs);
        if (prevMsgIdsRef.current === null) {
          prevMsgIdsRef.current = new Set(msgs.map(m => m.id));
        } else {
          const newFromOther = msgs.filter(
            m => !prevMsgIdsRef.current!.has(m.id) && m.senderRole !== "admin"
          );
          if (newFromOther.length > 0) {
            playNotificationSound();
            showBrowserNotification("New message", newFromOther[newFromOther.length - 1].body);
          }
          prevMsgIdsRef.current = new Set(msgs.map(m => m.id));
        }
      }
    } catch {}
  };

  const fetchTypingStatus = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations/${id}/typing-status`, { headers: authHeader() });
      if (res.ok) setOtherTyping(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
    const t = setInterval(fetchConversations, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setOtherTyping({ isTyping: false, label: null });
    setMsgLoading(true);
    fetchMessages(selectedId).finally(() => setMsgLoading(false));
    const msgInterval = setInterval(() => fetchMessages(selectedId), 3500);
    const typingInterval = setInterval(() => fetchTypingStatus(selectedId), 2000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(typingInterval);
    };
  }, [selectedId]);

  // Scroll to bottom when messages or typing indicator changes
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, otherTyping.isTyping]);

  const openConversation = (id: number) => {
    setSelectedId(id);
    setMessages([]);
    setInput("");
    setReassigned(false);
    prevMsgIdsRef.current = null;
  };

  const signalTyping = (id: number) => {
    if (typingThrottleRef.current) return;
    fetch(`${BASE}/api/conversations/${id}/typing`, { method: "POST", headers: authHeader() }).catch(() => {});
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null;
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selectedId) signalTyping(selectedId);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/conversations/${selectedId}/messages`, {
        method: "POST", headers: authHeader(), body: JSON.stringify({ body: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setInput("");
        fetchConversations();
      }
    } catch {}
    finally { setSending(false); }
  };

  const handleReassign = async () => {
    if (!selectedId || reassigning) return;
    setReassigning(true);
    try {
      const res = await fetch(`${BASE}/api/conversations/${selectedId}/reassign`, {
        method: "PATCH", headers: authHeader(),
      });
      if (res.ok) {
        setReassigned(true);
        fetchConversations();
      }
    } catch {}
    finally { setReassigning(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#4a9eff]" />
      </div>
    );
  }

  /* ── Conversation Detail ── */
  if (selectedId !== null) {
    const isReassigned = selectedConv?.assignedTo === "store";
    return (
      <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full" style={{ minHeight: "520px" }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={() => setSelectedId(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white truncate">
                {selectedConv?.customerName ?? "User"} → {selectedConv?.businessName ?? "Business"}
              </p>
              {selectedConv?.isGuest && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 flex-shrink-0">
                  Guest
                </span>
              )}
            </div>
            {selectedConv?.isGuest && selectedConv.guestPhone ? (
              <p className="text-xs text-white/40 truncate flex items-center gap-1">
                <Phone className="h-2.5 w-2.5" /> {selectedConv.guestPhone}
              </p>
            ) : (
              <p className="text-xs text-white/40 truncate">{selectedConv?.customerEmail}</p>
            )}
          </div>
          {selectedConv && <StatusBadge status={selectedConv.status} assignedTo={selectedConv.assignedTo} />}
          <button onClick={fetchConversations} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Hand-off banner */}
        <div className="mb-4 flex-shrink-0">
          {isReassigned || reassigned ? (
            <div className="px-4 py-3 rounded-xl flex items-center gap-2.5"
              style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)" }}>
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-300">Chat has been handed off to the store. The business owner can now reply directly.</span>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.15)" }}>
              <AlertCircle className="h-4 w-4 text-[#4a9eff] flex-shrink-0" />
              <span className="text-xs text-white/50 flex-1">You're handling this as admin. Hand off to the store owner when ready.</span>
              <Button size="sm" onClick={handleReassign} disabled={reassigning}
                className="rounded-xl px-3 text-xs font-semibold gap-1.5 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)", color: "#fff" }}>
                {reassigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                {reassigning ? "Handing off…" : "Hand off to Store"}
              </Button>
            </div>
          )}
        </div>

        {/* Messages — plain scrollable div so scrollTop works */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto rounded-xl mb-4 p-4 min-h-0"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {msgLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => {
                const isAdmin = msg.senderRole === "admin";
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2", isAdmin ? "flex-row-reverse" : "flex-row")}>
                    <SenderAvatar senderRole={msg.senderRole} />
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                      isAdmin
                        ? "rounded-br-md bg-[#4a9eff] text-white"
                        : msg.senderRole === "business"
                          ? "rounded-bl-md bg-green-600/20 text-green-200 border border-green-600/20"
                          : "rounded-bl-md bg-white/8 text-white/80"
                    )}>
                      {!isAdmin && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-60 capitalize">
                          {msg.senderRole === "business" ? "Store Owner" : "Customer"}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words leading-snug">{msg.body}</p>
                      <p className={cn("text-[10px] mt-1 opacity-60", isAdmin ? "text-right" : "text-left")}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator — shown below the last message */}
              {otherTyping.isTyping && <TypingBubble label={otherTyping.label} />}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Reply as admin…"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "#4a9eff" }}
            onFocus={e => (e.target.style.borderColor = "rgba(74,158,255,0.5)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            disabled={sending}
          />
          <button type="submit" disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#1a56db 0%,#4a9eff 100%)" }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
          </button>
        </form>
      </motion.div>
    );
  }

  /* ── Conversation List ── */
  return (
    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">In-App Chats</h2>
          <p className="text-sm text-white/40">All user conversations with businesses. Click any to reply or hand off to the store.</p>
        </div>
        <button onClick={fetchConversations} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/20 gap-3">
          <MessageSquare className="h-12 w-12" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs text-center">Chats started from business pages will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map(conv => (
            <button key={conv.id} onClick={() => openConversation(conv.id)}
              className="w-full text-left rounded-2xl p-4 transition-all hover:bg-white/5 group"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(74,158,255,0.12)" }}>
                  <MessageSquare className="h-4 w-4 text-[#4a9eff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{conv.customerName ?? "User"}</span>
                    {conv.isGuest && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 flex-shrink-0">
                        Guest
                      </span>
                    )}
                    <span className="text-xs text-white/30">→</span>
                    <span className="text-sm text-white/70 truncate">{conv.businessName ?? "Business"}</span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-auto flex-shrink-0 text-[10px] font-bold bg-[#4a9eff] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate mb-1.5">
                    {conv.lastMessage
                      ? `${conv.lastMessage.senderRole === "admin" ? "You: " : ""}${conv.lastMessage.body}`
                      : "No messages yet"}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={conv.status} assignedTo={conv.assignedTo} />
                    <span className="text-[10px] text-white/25">
                      {new Date(conv.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      {" "}
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
