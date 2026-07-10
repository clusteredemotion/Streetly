import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isNativeApp } from "@/lib/utils";

const easeOutBack = [0.34, 1.56, 0.64, 1] as const;

const GREEN  = "#16a34a";
const YELLOW = "#facc15";
const BLUE   = "#4a9eff";

/* ── Animated moving map backdrop ── */
function MapBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slow-pan map plane — 4× viewport so movement never reveals edges */}
      <motion.div
        className="absolute"
        style={{ width: "300%", height: "300%", top: "-100%", left: "-100%" }}
        animate={{ x: ["0%", "-3%", "0%"], y: ["0%", "-2%", "0%"] }}
        transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Fine grid — city blocks */}
            <pattern id="pl-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(74,158,255,0.03)" strokeWidth="0.6"/>
            </pattern>
            {/* Wide arterial road grid */}
            <pattern id="pl-roads" width="320" height="320" patternUnits="userSpaceOnUse">
              <rect width="320" height="320" fill="none"/>
              <line x1="0" y1="160" x2="320" y2="160" stroke="rgba(255,255,255,0.025)" strokeWidth="7"/>
              <line x1="160" y1="0" x2="160" y2="320" stroke="rgba(255,255,255,0.025)" strokeWidth="7"/>
            </pattern>
          </defs>

          {/* Base fill */}
          <rect width="100%" height="100%" fill="#060c1e"/>
          {/* Grid overlay */}
          <rect width="100%" height="100%" fill="url(#pl-grid)"/>
          <rect width="100%" height="100%" fill="url(#pl-roads)"/>

          {/* ── City blocks (kept faint, no diagonals/nodes/route lines) ── */}
          {[
            [5,5,110,70],[250,5,130,75],[545,6,115,70],[850,5,105,70],
            [130,105,120,75],[410,98,115,78],[705,100,110,80],
            [140,205,100,80],[420,208,100,78],[860,210,105,78],
            [265,315,100,72],[555,315,110,78],[855,315,115,72],
            [140,415,100,80],[560,415,115,75],[858,415,108,80],
            [265,525,100,72],[705,525,100,75],
          ].map(([x,y,w,h],i)=>(
            <rect key={i} x={`${x/9.6}%`} y={`${y/9.6}%`} width={`${w/9.6}%`} height={`${h/9.6}%`}
              fill={`rgba(${[18,24,30][i%3]},${[28,36,44][i%3]},${[55,65,80][i%3]},0.4)`} rx="2"/>
          ))}

          {/* ── Water body ── */}
          <ellipse cx="30%" cy="72%" rx="12%" ry="5%" fill="rgba(74,158,255,0.04)"/>

          {/* ── Park / green patch ── */}
          <rect x="46%" y="42%" width="8%" height="6%" fill="rgba(22,163,74,0.05)" rx="4"/>
        </svg>
      </motion.div>

      {/* Dark vignette so edges stay dark and logo pops — much stronger now */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(6,12,30,0.55) 0%, rgba(6,12,30,0.97) 62%)" }}/>

      {/* Central glow behind logo */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 420, height: 420, top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(74,158,255,0.1) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Floating pin drops on the map ── */
function MapPins() {
  const pins = [
    { x: "18%", y: "30%", color: "#ef4444", delay: 0.6  },
    { x: "82%", y: "32%", color: YELLOW,    delay: 1.0  },
    { x: "20%", y: "72%", color: BLUE,      delay: 1.4  },
    { x: "80%", y: "74%", color: "#22c55e", delay: 1.7  },
  ];
  return (
    <>
      {pins.map((p, i) => (
        <motion.div key={i}
          className="absolute"
          style={{ left: p.x, top: p.y, transform: "translate(-50%,-100%)" }}
          initial={{ y: -30, opacity: 0, scale: 0.4 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: p.delay, duration: 0.45, ease: easeOutBack }}
        >
          {/* pin body */}
          <div style={{
            width: 18, height: 18,
            borderRadius: "50% 50% 50% 4px",
            transform: "rotate(-45deg)",
            background: p.color,
            border: "2px solid rgba(255,255,255,0.8)",
            boxShadow: `0 4px 14px ${p.color}99`,
          }}/>
          {/* blink ring */}
          <motion.div
            className="absolute"
            style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${p.color}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
            animate={{ opacity: [1, 0, 1], scale: [1, 1.8, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: p.delay + 0.5, ease: "easeInOut" }}
          />
        </motion.div>
      ))}
    </>
  );
}

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  // Only the packaged native app ships its own offline shell — the web
  // build always has a live network connection to the page it's on.
  const [offline, setOffline] = useState(
    () => isNativeApp() && typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    if (!isNativeApp()) return;
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (offline) return;
    const start = Date.now();
    const duration = 3200;
    const raf = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed < duration) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [offline]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#060c1e" }}
        >
          <MapBackground />
          <MapPins />

          {/* ── Logo content, directly on the moving map ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOutBack }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* SVG mark */}
            <motion.svg
              width="120" height="152" viewBox="0 0 200 250"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              <motion.ellipse
                cx="100" cy="236" rx="52" ry="7"
                fill="rgba(74,158,255,0.18)"
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              />
              <motion.path
                d="M100,12 C144,12 178,46 178,88 C178,124 148,152 118,178 C110,185 104,196 100,210 C96,196 90,185 82,178 C52,152 22,124 22,88 C22,46 56,12 100,12 Z"
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="19" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M100,12 C144,12 178,46 178,88 C178,124 148,152 118,178 C110,185 104,196 100,210 C96,196 90,185 82,178 C52,152 22,124 22,88 C22,46 56,12 100,12 Z"
                fill="none" stroke={GREEN} strokeWidth="14" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.8, ease: "easeInOut" }}
              />
              <motion.path
                d="M126,96 C158,114 106,138 138,162 C158,176 116,198 104,232"
                fill="none" stroke={GREEN} strokeWidth="14" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.55, ease: "easeInOut" }}
              />
              <motion.path
                d="M126,96 C158,114 106,138 138,162 C158,176 116,198 104,232"
                fill="none" stroke="white" strokeWidth="3" strokeDasharray="9 10" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5, ease: "easeInOut" }}
              />
              <motion.g initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.4, ease: easeOutBack }}>
                <rect x="60" y="56" width="26" height="64" fill={GREEN}/>
                <rect x="67" y="65" width="6" height="6" fill="white"/>
                <rect x="79" y="65" width="6" height="6" fill="white"/>
                <rect x="67" y="80" width="6" height="6" fill="white"/>
                <rect x="79" y="80" width="6" height="6" fill="white"/>
              </motion.g>
              <motion.g initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.4, ease: easeOutBack }}>
                <rect x="91" y="42" width="21" height="80" fill={YELLOW}/>
                <rect x="97" y="52" width="6" height="6" fill="white"/>
                <rect x="97" y="66" width="6" height="6" fill="white"/>
                <rect x="97" y="80" width="6" height="6" fill="white"/>
              </motion.g>
              <motion.g initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4, ease: easeOutBack }}>
                <rect x="116" y="68" width="18" height="52" fill={GREEN}/>
                <rect x="121" y="76" width="5" height="5" fill="white"/>
                <rect x="121" y="88" width="5" height="5" fill="white"/>
              </motion.g>
              <motion.g initial={{ y: 26, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.45, ease: easeOutBack }}
                style={{ transformOrigin: "80px 118px" }}>
                <rect x="52" y="98" width="56" height="34" fill={GREEN}/>
                <path d="M48,90 Q54,100 60,90 Q66,100 72,90 Q78,100 84,90 Q90,100 96,90 Q102,100 108,90 L108,98 L48,98 Z" fill="#15803d"/>
                <rect x="46" y="88" width="64" height="5" fill="#15803d"/>
                <rect x="72" y="112" width="14" height="20" fill="white"/>
                <rect x="58" y="114" width="10" height="10" fill="white"/>
                <rect x="90" y="114" width="10" height="10" fill="white"/>
              </motion.g>
            </motion.svg>

            {/* Wordmark */}
            <div className="flex items-baseline -mt-1">
              <motion.span
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5, ease: easeOutBack }}
                className="text-4xl sm:text-5xl font-extrabold text-white"
              >
                Street
              </motion.span>
              <motion.span
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5, ease: easeOutBack }}
                className="text-4xl sm:text-5xl font-extrabold relative"
                style={{ color: YELLOW }}
              >
                ly
                <motion.span
                  initial={{ scale: 0, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 1.75, duration: 0.4, ease: easeOutBack }}
                  className="absolute -top-2.5 -right-1.5"
                >
                  <svg width="14" height="18" viewBox="0 0 24 30">
                    <path d="M12,0 C18.6,0 24,5.4 24,12 C24,20 12,30 12,30 C12,30 0,20 0,12 C0,5.4 5.4,0 12,0 Z" fill={YELLOW}/>
                    <circle cx="12" cy="12" r="5" fill="white"/>
                  </svg>
                </motion.span>
              </motion.span>
            </div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.95, duration: 0.5 }}
              className="mt-2 flex items-center gap-2 px-6 max-w-full"
            >
              <span className="w-4 sm:w-5 h-px flex-shrink-0" style={{ background: "rgba(74,158,255,0.5)" }}/>
              <p className="min-w-0 text-[9px] sm:text-[11px] font-bold tracking-[0.08em] sm:tracking-[0.14em] uppercase text-blue-300/70 text-center whitespace-normal leading-tight">
                Discovering every business, every street
              </p>
              <span className="w-4 sm:w-5 h-px flex-shrink-0" style={{ background: `${YELLOW}80` }}/>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 0.4 }}
              className="mt-6 w-44"
            >
              <div className="w-full h-[3px] rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${GREEN}, ${BLUE}, ${YELLOW})` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10px] text-white/25 font-medium tracking-widest uppercase">
                  {offline ? "Waiting for connection" : "Loading"}
                </span>
                {!offline && (
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: BLUE }}>{progress}%</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
