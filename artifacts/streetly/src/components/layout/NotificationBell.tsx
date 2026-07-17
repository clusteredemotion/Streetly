import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Loader2, Inbox } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "@/lib/utils";
import { useLocation } from "wouter";

const BASE = getApiBase();

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("streetly_token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
}

interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const token = localStorage.getItem("streetly_token");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["user-notifications"],
    queryFn: async () => {
      const r = await apiFetch("/api/notifications");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: open ? 10_000 : 60_000,
    enabled: !!token,
    staleTime: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  const dismiss = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleNotifClick(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  }

  if (!token) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-white/10 text-white/70 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-[3px] rounded-full bg-red-500 text-[9px] font-bold leading-none flex items-center justify-center text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-2xl overflow-hidden shadow-2xl z-[9999]"
          style={{ background: "#0d1829", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-[#4a9eff]" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                >
                  {markAllRead.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <CheckCheck className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-white/20" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <Inbox className="h-8 w-8 mb-2" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    n.isRead ? "hover:bg-white/4" : "hover:bg-[#4a9eff]/8"
                  }`}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: n.isRead ? undefined : "rgba(74,158,255,0.04)",
                  }}
                  onClick={() => handleNotifClick(n)}
                >
                  {/* Dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {n.isRead
                      ? <div className="w-2 h-2 rounded-full bg-white/10" />
                      : <div className="w-2 h-2 rounded-full bg-[#4a9eff]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium leading-snug ${n.isRead ? "text-white/60" : "text-white"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-white/25 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss.mutate(n.id); }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-white/20">{notifications.length} total notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
