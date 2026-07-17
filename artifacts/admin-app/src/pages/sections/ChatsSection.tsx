import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiGetConversations, apiGetMessages, apiSendMessage, apiReassignConversation,
  type AdminConversation, type ChatMsg,
} from "../../lib/api";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConvStatusBadge({ status, assignedTo }: { status: string; assignedTo: string }) {
  if (status === "connecting") return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/20">Connecting</span>;
  if (assignedTo === "store") return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/20">With Store</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">With Admin</span>;
}

interface DetailProps {
  conv: AdminConversation;
  onBack: () => void;
  onReassign: (id: number) => void;
}

function ChatDetail({ conv, onBack, onReassign }: DetailProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMsgs = useCallback(async () => {
    try {
      const data = await apiGetMessages(conv.id);
      setMessages(data);
    } catch {}
    finally { setLoading(false); }
  }, [conv.id]);

  useEffect(() => { fetchMsgs(); }, [fetchMsgs]);
  useEffect(() => {
    const t = setInterval(fetchMsgs, 4000);
    return () => clearInterval(t);
  }, [fetchMsgs]);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiSendMessage(conv.id, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput("");
    } catch (err: any) { alert(err?.message ?? "Error"); }
    finally { setSending(false); }
  }

  async function reassign() {
    setReassigning(true);
    try {
      await apiReassignConversation(conv.id);
      onReassign(conv.id);
    } catch (err: any) { alert(err?.message ?? "Error"); }
    finally { setReassigning(false); }
  }

  const isHandedOff = conv.assignedTo === "store";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 active:bg-white/10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-semibold truncate">
              {conv.customerName ?? conv.guestName ?? "User"} → {conv.businessName ?? "Business"}
            </p>
            {conv.isGuest && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">Guest</span>}
          </div>
          {conv.guestPhone && <p className="text-slate-500 text-xs">📞 {conv.guestPhone}</p>}
        </div>
        <ConvStatusBadge status={conv.status} assignedTo={conv.assignedTo} />
      </div>

      {/* Reassign banner */}
      {!isHandedOff ? (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15 flex items-center gap-2">
          <p className="text-xs text-slate-400 flex-1">You're handling this as admin.</p>
          <button onClick={reassign} disabled={reassigning}
            className="text-xs font-semibold text-green-300 bg-green-600/20 border border-green-600/30 px-3 py-1.5 rounded-lg active:bg-green-600/30 disabled:opacity-40 whitespace-nowrap">
            {reassigning ? "…" : "Hand off →"}
          </button>
        </div>
      ) : (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-green-600/10 border border-green-600/20 text-green-300 text-xs">
          ✓ Handed off to store owner
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-600 text-sm py-8">No messages yet</p>
        ) : (
          messages.map(msg => {
            const isAdmin = msg.senderRole === "admin";
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? "bg-blue-500/20" : msg.senderRole === "business" ? "bg-green-500/20" : "bg-white/10"}`}>
                  {isAdmin ? (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                  ) : msg.senderRole === "business" ? (
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18" /></svg>
                  ) : (
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  )}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${isAdmin ? "bg-blue-500 text-white rounded-br-md" : msg.senderRole === "business" ? "bg-green-600/20 text-green-200 border border-green-600/20 rounded-bl-md" : "bg-white/8 text-white/80 rounded-bl-md"}`}>
                  {!isAdmin && <p className="text-[10px] font-semibold opacity-60 mb-0.5 capitalize">{msg.senderRole === "business" ? "Store Owner" : "Customer"}</p>}
                  <p className="whitespace-pre-wrap break-words leading-snug">{msg.body}</p>
                  <p className={`text-[10px] mt-1 opacity-60 ${isAdmin ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 px-4 py-3 border-t border-white/5">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Reply as admin…" disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 placeholder-slate-500"
        />
        <button type="submit" disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 disabled:opacity-40 active:bg-blue-700">
          {sending ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ChatsSection() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminConversation | null>(null);
  const [error, setError] = useState("");

  const fetchConvs = useCallback(async () => {
    try {
      const data = await apiGetConversations();
      setConversations(data);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);
  useEffect(() => {
    const t = setInterval(fetchConvs, 10_000);
    return () => clearInterval(t);
  }, [fetchConvs]);

  function handleReassign(id: number) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, assignedTo: "store", status: "active" } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, assignedTo: "store", status: "active" } : prev);
  }

  if (selected) {
    return <ChatDetail conv={selected} onBack={() => { setSelected(null); fetchConvs(); }} onReassign={handleReassign} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <p className="text-slate-300 text-sm font-medium">All Conversations</p>
        <button onClick={fetchConvs} className="text-blue-400 text-xs">Refresh</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 animate-spin" />
          </div>
        )}
        {!loading && error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}
        {!loading && !error && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
            <p className="text-sm">No conversations yet</p>
          </div>
        )}

        {conversations.map(conv => (
          <button key={conv.id} onClick={() => setSelected(conv)}
            className="w-full text-left rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 active:bg-white/[0.07] transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/12 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{conv.customerName ?? conv.guestName ?? "User"}</span>
                  {conv.isGuest && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">Guest</span>}
                  <span className="text-xs text-white/30">→</span>
                  <span className="text-xs text-white/60 truncate">{conv.businessName ?? "Business"}</span>
                  {conv.unreadCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {conv.lastMessage ? `${conv.lastMessage.senderRole === "admin" ? "You: " : ""}${conv.lastMessage.body}` : "No messages yet"}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <ConvStatusBadge status={conv.status} assignedTo={conv.assignedTo} />
                  <span className="text-[10px] text-slate-600">{timeAgo(conv.lastMessageAt)}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
