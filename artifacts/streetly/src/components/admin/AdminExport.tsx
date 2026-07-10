import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Users, UserCheck, Building2, Lock, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();
const EXPORT_PIN = "1537";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

async function downloadCsv(endpoint: string, filename: string) {
  const res = await fetch(`${BASE}/api/admin/export/${endpoint}`, { headers: authHeader() });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const exports = [
  {
    key: "users",
    label: "All Users",
    desc: "Full user list — ID, name, email, role, status, MSA ID, registration IP, join date.",
    icon: Users,
    color: "#a78bfa",
    colorBg: "rgba(167,139,250,0.12)",
    colorBorder: "rgba(167,139,250,0.22)",
    filename: `streetly-users-${Date.now()}.csv`,
  },
  {
    key: "agents",
    label: "All Agents",
    desc: "Agent profiles — name, email, MSA ID, bank details, KYC info, earnings, status.",
    icon: UserCheck,
    color: "#34d399",
    colorBg: "rgba(52,211,153,0.12)",
    colorBorder: "rgba(52,211,153,0.22)",
    filename: `streetly-agents-${Date.now()}.csv`,
  },
  {
    key: "businesses",
    label: "All Businesses",
    desc: "Full business details — name, category, address, contact, social links, status, plan.",
    icon: Building2,
    color: "#4a9eff",
    colorBg: "rgba(74,158,255,0.12)",
    colorBorder: "rgba(74,158,255,0.22)",
    filename: `streetly-businesses-${Date.now()}.csv`,
  },
];

export default function AdminExport() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    setError(false);
    if (val && i < 3) inputRefs[i + 1].current?.focus();
    if (next.every(d => d !== "") && next.join("").length === 4) {
      setTimeout(() => {
        const entered = next.join("");
        if (entered === EXPORT_PIN) {
          setUnlocked(true);
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setPin(["", "", "", ""]); inputRefs[0].current?.focus(); }, 600);
        }
      }, 80);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputRefs[i - 1].current?.focus();
    }
  };

  const handleExport = async (key: string, filename: string) => {
    setDownloading(key);
    setDownloaded(null);
    try {
      await downloadCsv(key, filename);
      setDownloaded(key);
      setTimeout(() => setDownloaded(null), 2500);
    } catch {
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Export Data</h2>
        <p className="text-sm text-white/40">Download platform data as CSV files for offline analysis.</p>
      </div>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-8 flex flex-col items-center gap-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{ background: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.25)" }}>
                <Lock className="h-5 w-5 text-[#4a9eff]" />
              </div>
              <p className="text-white font-semibold text-base">Enter Export PIN</p>
              <p className="text-white/40 text-xs text-center">This section is PIN-protected to prevent accidental data exports.</p>
            </div>

            <motion.div
              className="flex gap-3"
              animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.05)",
                    border: error
                      ? "1.5px solid rgba(248,113,113,0.7)"
                      : digit
                        ? "1.5px solid rgba(74,158,255,0.5)"
                        : "1.5px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    caretColor: "#4a9eff",
                  }}
                />
              ))}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-red-400 text-xs font-medium"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Incorrect PIN. Please try again.
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="exports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Access granted</span>
              <button
                onClick={() => { setUnlocked(false); setPin(["", "", "", ""]); }}
                className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Lock
              </button>
            </div>

            {exports.map(({ key, label, desc, icon: Icon, color, colorBg, colorBorder, filename }) => (
              <div
                key={key}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: colorBg, border: `1px solid ${colorBorder}` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,0,0,0.2)" }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-0.5">{label}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport(key, filename)}
                  disabled={!!downloading}
                  className="flex-shrink-0 rounded-xl text-xs font-semibold px-4 gap-1.5"
                  style={{
                    background: downloaded === key ? "rgba(52,211,153,0.2)" : colorBg,
                    border: `1px solid ${downloaded === key ? "rgba(52,211,153,0.4)" : colorBorder}`,
                    color: downloaded === key ? "#34d399" : color,
                  }}
                >
                  {downloading === key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : downloaded === key ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {downloading === key ? "Exporting…" : downloaded === key ? "Downloaded!" : "Export CSV"}
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
