import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User as UserIcon, Building2, Bike } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderRole: "customer" | "business" | "rider";
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface Conversation {
  id: number;
  customerId: number;
  businessId: number | null;
  riderId: number | null;
  deliveryId: number | null;
  subject: string | null;
  lastMessageAt: string;
  customerName: string;
  businessName: string | null;
  riderName: string | null;
  lastMessage: { body: string; senderId: number; createdAt: string } | null;
}

interface ChatPanelProps {
  conversationId?: number;
  businessId?: number;
  riderId?: number;
  deliveryId?: number;
  onClose?: () => void;
}

export function ChatPanel({ conversationId: initialConversationId, businessId, riderId, deliveryId, onClose }: ChatPanelProps) {
  const [conversationId, setConversationId] = useState<number | undefined>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (token) {
      fetch(`${BASE}/api/auth/me`, { headers: authHeader() })
        .then(r => r.json())
        .then(d => setCurrentUser({ id: d.id, name: d.name }))
        .catch(() => {});
    }
  }, []);

  const fetchMessages = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/conversations/${id}/messages`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
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
        const data = await res.json();
        setConversationId(data.id);
        fetchMessages(data.id);
      }
    } catch (err) {
      console.error("Failed to start conversation", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId && (businessId || riderId || deliveryId)) {
      initConversation();
    } else if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, businessId, riderId, deliveryId]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 4500);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Starting chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[450px] bg-card overflow-hidden">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="w-8 h-8 flex-shrink-0 border">
                  <AvatarFallback className="text-[10px]">
                    {msg.senderRole === "customer" ? <UserIcon className="h-4 w-4" /> : 
                     msg.senderRole === "business" ? <Building2 className="h-4 w-4" /> : 
                     <Bike className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div className={cn(
                    "text-[10px] mt-1 opacity-70 flex items-center gap-1",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
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
