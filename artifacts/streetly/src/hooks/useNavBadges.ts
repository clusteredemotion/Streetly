import { useQuery } from "@tanstack/react-query";
import { useListMySupportTickets } from "@workspace/api-client-react";
import { getApiBase } from "@/lib/utils";

async function fetchUnreadCount(token: string): Promise<number> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/conversations/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export function useNavBadges() {
  const token = typeof window !== "undefined" ? localStorage.getItem("streetly_token") : null;
  const enabled = !!token;

  const { data: unreadCount } = useQuery<number>({
    queryKey: ["nav-conversations-badge"],
    queryFn: () => fetchUnreadCount(token!),
    enabled,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { data: tickets } = useListMySupportTickets({
    query: {
      enabled,
      queryKey: ["nav-support-tickets-badge"],
      refetchInterval: 30_000,
      staleTime: 20_000,
    },
  });

  const messagesBadge = unreadCount ?? 0;

  const ticketsBadge = tickets
    ? tickets.filter((t) => t.status === "open" || t.status === "in_progress").length
    : 0;

  const totalBadge = messagesBadge + ticketsBadge;

  return { messagesBadge, ticketsBadge, totalBadge };
}
