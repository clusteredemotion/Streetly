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
  return res.json() as Promise<T>;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    msaId?: string;
  };
}

export function apiLogin(email: string, password: string): Promise<LoginResult> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

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
  return apiFetch("/push/device-token", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}
