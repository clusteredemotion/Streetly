import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, User, Building2, Bike, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, getApiBase } from "@/lib/utils";

const BASE = getApiBase();

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

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

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["nav-conversations-badge"] });
  }, [queryClient]);

  useEffect(() => {
    const token = localStorage.getItem("streetly_token");
    if (!token) {
      navigate("/auth/login?redirect=/messages");
      return;
    }

    fetch(`${BASE}/api/auth/me`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setCurrentUser(d))
      .catch(() => {});

    fetchConversations();
  }, [navigate]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BASE}/api/conversations`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const name = c.businessName || c.riderName || c.customerName || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConversation = conversations.find(c => c.id === selectedId);

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#0547B6] to-[#0a1628] py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-white mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Messages</h1>
          </div>
          <p className="text-blue-100/70 text-sm">Chat with businesses, riders, and customers</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Conversation List */}
          <div className={cn(
            "md:col-span-4 lg:col-span-3 flex flex-col gap-4 h-full",
            selectedId && "hidden md:flex"
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 rounded-xl bg-muted/50 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))
                ) : filteredConversations.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-muted/50 flex items-start gap-3",
                        selectedId === c.id ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {c.businessName ? <Building2 className="h-5 w-5 text-primary" /> : 
                         c.riderName ? <Bike className="h-5 w-5 text-primary" /> : 
                         <User className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {c.businessName || c.riderName || c.customerName}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap ml-2">
                            <Clock className="h-3 w-3" />
                            {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate italic">
                          {c.lastMessage?.body || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={cn(
            "md:col-span-8 lg:col-span-9 bg-card border rounded-2xl shadow-sm flex flex-col overflow-hidden h-full",
            !selectedId && "hidden md:flex items-center justify-center bg-muted/20"
          )}>
            {selectedId ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedId(null)} className="md:hidden p-1 hover:bg-muted rounded-lg mr-1">
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                       {selectedConversation?.businessName ? <Building2 className="h-4 w-4 text-primary" /> : 
                        selectedConversation?.riderName ? <Bike className="h-4 w-4 text-primary" /> : 
                        <User className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-none mb-1">
                        {selectedConversation?.businessName || selectedConversation?.riderName || selectedConversation?.customerName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {selectedConversation?.businessName ? "Business" : 
                         selectedConversation?.riderName ? "Rider" : "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
                <ChatPanel conversationId={selectedId} />
              </>
            ) : (
              <div className="text-center p-12 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">Pick a message from the list to start chatting or view history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
