import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        style={{ width: "400%", height: "400%", top: "-150%", left: "-150%" }}
        animate={{ x: ["0%", "-8%", "-3%", "-10%", "0%"], y: ["0%", "-5%", "-10%", "-4%", "0%"] }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Fine grid — city blocks */}
            <pattern id="pl-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(74,158,255,0.055)" strokeWidth="0.6"/>
            </pattern>
            {/* Wide arterial road grid */}
            <pattern id="pl-roads" width="320" height="320" patternUnits="userSpaceOnUse">
              <rect width="320" height="320" fill="none"/>
              <line x1="0" y1="160" x2="320" y2="160" stroke="rgba(255,255,255,0.045)" strokeWidth="7"/>
              <line x1="160" y1="0" x2="160" y2="320" stroke="rgba(255,255,255,0.045)" strokeWidth="7"/>
            </pattern>
            {/* Street labels glow */}
            <filter id="pl-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Base fill */}
          <rect width="100%" height="100%" fill="#060c1e"/>
          {/* Grid overlay */}
          <rect width="100%" height="100%" fill="url(#pl-grid)"/>
          <rect width="100%" height="100%" fill="url(#pl-roads)"/>

          {/* ── Diagonal expressways ── */}
          {[
            { x1:"0%",  y1:"35%", x2:"100%", y2:"55%", w:14 },
            { x1:"0%",  y1:"60%", x2:"100%", y2:"30%", w:10 },
            { x1:"20%", y1:"0%",  x2:"40%",  y2:"100%",w:8  },
            { x1:"65%", y1:"0%",  x2:"55%",  y2:"100%",w:8  },
          ].map((r,i)=>(
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
              stroke="rgba(255,255,255,0.055)" strokeWidth={r.w}/>
          ))}

          {/* ── City blocks ── */}
          {[
            [5,5,110,70],[135,8,95,60],[250,5,130,75],[400,10,100,65],[545,6,115,70],[700,8,90,65],[850,5,105,70],
            [8,100,100,80],[130,105,120,75],[275,100,100,80],[410,98,115,78],[555,102,100,72],[705,100,110,80],[855,98,100,76],
            [5,210,115,72],[140,205,100,80],[270,210,130,70],[420,208,100,78],[560,205,115,75],[710,208,100,72],[860,210,105,78],
            [8,315,100,80],[135,310,115,75],[265,315,100,72],[405,312,120,80],[555,315,110,78],[705,310,100,80],[855,315,115,72],
            [5,420,110,75],[140,415,100,80],[270,420,125,72],[415,418,100,78],[560,415,115,75],[710,420,100,72],[858,415,108,80],
            [8,525,100,78],[138,520,115,75],[265,525,100,72],[405,522,120,80],[555,520,110,78],[705,525,100,75],[855,520,115,72],
          ].map(([x,y,w,h],i)=>(
            <rect key={i} x={`${x/9.6}%`} y={`${y/9.6}%`} width={`${w/9.6}%`} height={`${h/9.6}%`}
              fill={`rgba(${[18,24,30][i%3]},${[28,36,44][i%3]},${[55,65,80][i%3]},0.75)`} rx="2"/>
          ))}

          {/* ── Water body ── */}
          <ellipse cx="30%" cy="72%" rx="12%" ry="5%" fill="rgba(74,158,255,0.06)"/>
          <ellipse cx="70%" cy="25%" rx="8%"  ry="3%" fill="rgba(74,158,255,0.05)"/>

          {/* ── Park / green patch ── */}
          <rect x="46%" y="42%" width="8%" height="6%" fill="rgba(22,163,74,0.07)" rx="4"/>
          <rect x="15%" y="62%" width="6%" height="5%" fill="rgba(22,163,74,0.06)" rx="4"/>

          {/* ── Glowing intersection nodes ── */}
          {[
            ["33%","37%","#4a9eff"],["53%","52%","#facc15"],["66%","43%","#4a9eff"],
            ["20%","58%","#22c55e"],["80%","35%","#4a9eff"],["42%","68%","#f97316"],
            ["58%","22%","#8b5cf6"],["73%","60%","#4a9eff"],
          ].map(([cx,cy,c],i)=>(
            <circle key={i} cx={cx} cy={cy} r="1.2%" fill={c} fillOpacity="0.55" filter="url(#pl-glow)"/>
          ))}

          {/* ── Subtle route line linking a few nodes ── */}
          <path
            d="M 1267 1421 L 1613 1728 L 2035 1997 L 2534 1650"
            fill="none" stroke="rgba(74,158,255,0.18)" strokeWidth="4" strokeDasharray="12 16"/>
        </svg>
      </motion.div>

      {/* Dark vignette so edges stay dark and logo pops */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(6,12,30,0.88) 100%)" }}/>

      {/* Central glow behind logo */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 420, height: 420, top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(74,158,255,0.09) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Floating pin drops on the map ── */
function MapPins() {
  const pins = [
    { x: "22%", y: "38%", color: "#ef4444", delay: 0.6  },
    { x: "68%", y: "28%", color: "#22c55e", delay: 1.0  },
    { x: "38%", y: "64%", color: BLUE,      delay: 1.4  },
    { x: "74%", y: "56%", color: YELLOW,    delay: 0.9  },
    { x: "52%", y: "20%", color: "#8b5cf6", delay: 1.7  },
    { x: "14%", y: "62%", color: "#f97316", delay: 1.2  },
    { x: "82%", y: "70%", color: "#22c55e", delay: 2.0  },
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

  useEffect(() => {
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
  }, []);

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

          {/* ── Frosted logo card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOutBack }}
            className="relative z-10 flex flex-col items-center"
            style={{
              background: "rgba(6,12,30,0.55)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(74,158,255,0.18)",
              borderRadius: 28,
              padding: "36px 48px 32px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
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
              className="mt-2 flex items-center gap-2"
            >
              <span className="w-5 h-px" style={{ background: "rgba(74,158,255,0.5)" }}/>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-blue-300/70 whitespace-nowrap">
                Discovering every business, every street
              </p>
              <span className="w-5 h-px" style={{ background: `${YELLOW}80` }}/>
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
                <span className="text-[10px] text-white/25 font-medium tracking-widest uppercase">Loading</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: BLUE }}>{progress}%</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
