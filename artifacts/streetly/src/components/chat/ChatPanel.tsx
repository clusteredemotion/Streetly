import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User as UserIcon, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getApiBase } from "@/lib/utils";
import { playNotificationSound, showBrowserNotification } from "@/lib/notificationSound";

const BASE = getApiBase();

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderRole: "customer" | "business" | "admin" | "rider";
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface ConversationMeta {
  id: number;
  status: string;
  assignedTo: string;
  businessName: string | null;
}

interface ChatPanelProps {
  conversationId?: number;
  businessId?: number;
  riderId?: number;
  deliveryId?: number;
  onClose?: () => void;
}

// Bouncing dots typing indicator
function TypingBubble({ label, isAdmin }: { label: string | null; isAdmin?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
        isAdmin ? "bg-blue-500/10 border-blue-500/20" : "bg-muted border-border"
      )}>
        {isAdmin
          ? <ShieldCheck className="h-4 w-4 text-blue-400" />
          : <Building2 className="h-4 w-4 text-green-400" />}
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 flex flex-col gap-0.5">
        {label && (
          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{label}</p>
        )}
        <div className="flex items-center gap-1 h-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatPanel({ conversationId: initialConversationId, businessId, riderId, deliveryId, onClose }: ChatPanelProps) {
  const [conversationId, setConversationId] = useState<number | undefined>(initialConversationId);
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const [otherTyping, setOtherTyping] = useState<{ isTyping: boolean; label: string | null }>({ isTyping: false, label: null });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgIdsRef = useRef<Set<number> | null>(null);
  const myUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (token) {
      fetch(`${BASE}/api/auth/me`, { headers: authHeader() })
        .then(r => r.json())
        .then(d => {
          setCurrentUser({ id: d.id, name: d.name });
          myUserIdRef.current = d.id;
        })
        .catch(() => {});
    }
  }, []);

  const fetchMessages = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations/${id}/messages`, { headers: authHeader() });
      if (res.ok) {
        const msgs: Message[] = await res.json();
        setMessages(msgs);
        const myId = myUserIdRef.current;
        if (prevMsgIdsRef.current === null) {
          prevMsgIdsRef.current = new Set(msgs.map(m => m.id));
        } else {
          const newFromOther = msgs.filter(
            m => !prevMsgIdsRef.current!.has(m.id) && m.senderId !== myId
          );
          if (newFromOther.length > 0) {
            playNotificationSound();
            showBrowserNotification(
              "New message",
              newFromOther[newFromOther.length - 1].body
            );
          }
          prevMsgIdsRef.current = new Set(msgs.map(m => m.id));
        }
      }
    } catch {}
  };

  const fetchConversationMeta = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations`, { headers: authHeader() });
      if (res.ok) {
        const list: ConversationMeta[] = await res.json();
        const found = list.find(c => c.id === id);
        if (found) setMeta(found);
      }
    } catch {}
  };

  const fetchTypingStatus = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations/${id}/typing-status`, { headers: authHeader() });
      if (res.ok) setOtherTyping(await res.json());
    } catch {}
  };

  const initConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/conversations`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ businessId, riderId, deliveryId }),
      });
      if (res.ok) {
        const data: ConversationMeta = await res.json();
        setConversationId(data.id);
        setMeta(data);
        fetchMessages(data.id);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!conversationId && (businessId || riderId || deliveryId)) {
      initConversation();
    } else if (conversationId) {
      fetchMessages(conversationId);
      fetchConversationMeta(conversationId);
    }
  }, [conversationId, businessId, riderId, deliveryId]);

  useEffect(() => {
    if (!conversationId) return;
    const msgInterval = setInterval(() => {
      fetchMessages(conversationId);
      fetchConversationMeta(conversationId);
    }, 4000);
    // Poll typing status more frequently so the indicator feels responsive
    const typingInterval = setInterval(() => fetchTypingStatus(conversationId), 2000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(typingInterval);
    };
  }, [conversationId]);

  // Scroll to bottom whenever messages or typing indicator changes
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, otherTyping.isTyping]);

  const signalTyping = (id: number) => {
    if (typingThrottleRef.current) return; // already sent recently
    fetch(`${BASE}/api/conversations/${id}/typing`, { method: "POST", headers: authHeader() }).catch(() => {});
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null;
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (conversationId) signalTyping(conversationId);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ body: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
      }
    } catch {}
    finally { setSending(false); }
  };

  const isConnecting = meta?.status === "connecting";
  const isWithStore = meta?.assignedTo === "store";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Starting chat…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Status bar */}
      {meta && (
        <div className={cn(
          "px-4 py-2 flex items-center gap-2 text-xs font-medium border-b flex-shrink-0",
          isConnecting
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : isWithStore
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        )}>
          {isConnecting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Connecting you to {meta.businessName ?? "the store"}…
            </>
          ) : isWithStore ? (
            <>
              <Building2 className="h-3 w-3" />
              You're chatting with {meta.businessName ?? "the store owner"}
            </>
          ) : (
            <>
              <ShieldCheck className="h-3 w-3" />
              Streetly support is assisting you
            </>
          )}
        </div>
      )}

      {/* Messages — plain scrollable div so scrollTop works correctly */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-4">
          {messages.length === 0 && !isConnecting && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Send a message to start the conversation.
            </p>
          )}
          {isConnecting && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
              <p className="text-sm font-medium">Connecting you to {meta?.businessName ?? "the store"}…</p>
              <p className="text-xs text-muted-foreground/60">You can send a message while you wait</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id}
                className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                  msg.senderRole === "admin" ? "bg-blue-500/10 border-blue-500/20" : "bg-muted border-border"
                )}>
                  {msg.senderRole === "admin"
                    ? <ShieldCheck className="h-4 w-4 text-blue-400" />
                    : msg.senderRole === "business"
                      ? <Building2 className="h-4 w-4 text-green-400" />
                      : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                )}>
                  {!isMe && msg.senderRole === "admin" && (
                    <p className="text-[10px] font-semibold text-blue-400 mb-0.5">Streetly Support</p>
                  )}
                  {!isMe && msg.senderRole === "business" && (
                    <p className="text-[10px] font-semibold text-green-400 mb-0.5">{meta?.businessName ?? "Store"}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "text-left")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator — shown below the last message */}
          {otherTyping.isTyping && (
            <TypingBubble
              label={otherTyping.label}
              isAdmin={true}
            />
          )}
        </div>
      </div>

      {/* Input — flex-shrink-0 keeps it pinned at the bottom */}
      <div className="p-4 border-t bg-background flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder={isConnecting ? "Send a message while connecting…" : "Type a message…"}
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending || !conversationId}
            className="rounded-full flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
