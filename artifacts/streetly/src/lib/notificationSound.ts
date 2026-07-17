let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) { try { _ctx = new AC(); } catch { return null; } }
  const ctx = _ctx;
  if (!ctx) return null;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function playNotificationSound(): void {
  try {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;

    const makeBeep = (freq: number, start: number, dur: number, vol: number) => {
      const osc = c.createOscillator();
      const g   = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    };

    makeBeep(880,  now,        0.18, 0.22);
    makeBeep(1100, now + 0.14, 0.26, 0.18);
  } catch {}
}

export function showBrowserNotification(title: string, body: string): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      tag: "streetly-chat",
    } as NotificationOptions);
    setTimeout(() => n.close(), 6000);
  } catch {}
}
