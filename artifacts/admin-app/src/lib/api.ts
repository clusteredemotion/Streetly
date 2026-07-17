export const API_BASE = "https://mystreetly.app/api";

const TOKEN_KEY = "admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResult {
  token: string;
  user: { id: number; name: string; email: string; role: string; msaId?: string };
}
export function apiLogin(email: string, password: string): Promise<LoginResult> {
  return apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

// ── Push notifications / activity feed ────────────────────────────────────

export interface NotifLog {
  id: number;
  title: string;
  body: string;
  audience: string;
  webSent: number;
  fcmSent: number;
  sentAt: string;
  targetUrl?: string | null;
}
export function apiGetNotifLogs(): Promise<NotifLog[]> {
  return apiFetch("/push/admin/logs");
}
export function apiRegisterDeviceToken(token: string, platform: string): Promise<void> {
  return apiFetch("/push/device-token", { method: "POST", body: JSON.stringify({ token, platform }) });
}

// ── Businesses ────────────────────────────────────────────────────────────

export interface AdminBusiness {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  status: string;
  ownerId: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  phone?: string | null;
  createdAt: string;
}
export function apiGetAllBusinesses(): Promise<AdminBusiness[]> {
  return apiFetch("/admin/businesses/all");
}
export function apiUpdateBusiness(id: number, data: Partial<{ status: string; name: string }>): Promise<AdminBusiness> {
  return apiFetch(`/admin/businesses/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
export function apiSuspendBusiness(id: number): Promise<AdminBusiness> {
  return apiFetch(`/admin/businesses/${id}/suspend`, { method: "PATCH" });
}
export function apiDeleteBusiness(id: number): Promise<void> {
  return apiFetch(`/admin/businesses/${id}`, { method: "DELETE" });
}

// ── Users ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string | null;
  createdAt: string;
}
export function apiGetAllUsers(): Promise<AdminUser[]> {
  return apiFetch("/admin/users/all");
}
export function apiSuspendUser(id: number): Promise<AdminUser> {
  return apiFetch(`/admin/users/${id}/suspend`, { method: "PATCH" });
}
export function apiDeleteUser(id: number): Promise<void> {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

// ── Riders ────────────────────────────────────────────────────────────────

export interface AdminRider {
  id: number;
  userId: number;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  city: string | null;
  createdAt: string;
}
export function apiGetAllRiders(): Promise<AdminRider[]> {
  return apiFetch("/admin/riders/all");
}
export function apiGetPendingRiders(): Promise<AdminRider[]> {
  return apiFetch("/admin/riders/pending");
}
export function apiApproveRider(id: number): Promise<AdminRider> {
  return apiFetch(`/admin/riders/${id}/approve`, { method: "PATCH" });
}
export function apiSuspendRider(id: number): Promise<AdminRider> {
  return apiFetch(`/admin/riders/${id}/suspend`, { method: "PATCH" });
}
export function apiDeleteRider(id: number): Promise<void> {
  return apiFetch(`/admin/riders/${id}`, { method: "DELETE" });
}

// ── Chats / Conversations ─────────────────────────────────────────────────

export interface AdminConversation {
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
export function apiGetConversations(): Promise<AdminConversation[]> {
  return apiFetch("/conversations");
}

export interface ChatMsg {
  id: number;
  conversationId: number;
  senderId: number | null;
  senderRole: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}
export function apiGetMessages(convId: number): Promise<ChatMsg[]> {
  return apiFetch(`/conversations/${convId}/messages`);
}
export function apiSendMessage(convId: number, body: string): Promise<ChatMsg> {
  return apiFetch(`/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
}
export function apiReassignConversation(convId: number): Promise<AdminConversation> {
  return apiFetch(`/conversations/${convId}/reassign`, { method: "PATCH" });
}

// ── Stats ─────────────────────────────────────────────────────────────────

export interface AdminStats {
  users?: number;
  businesses?: number;
  riders?: number;
  totalUsers?: number;
  totalBusinesses?: number;
  totalRiders?: number;
}
export function apiGetStats(): Promise<AdminStats> {
  return apiFetch("/stats");
}
