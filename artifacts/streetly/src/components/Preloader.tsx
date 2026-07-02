import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const easeOutBack = [0.34, 1.56, 0.64, 1] as const;

const GREEN = "#16a34a";
const GREEN_DARK = "#15803d";
const YELLOW = "#facc15";

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(160deg, #ffffff 0%, #f3fbf6 45%, #fffdf3 100%)" }}
        >
          {/* animated road line sweeping across the bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: "linear-gradient(90deg, #16a34a, #facc15)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, ease: "linear" }}
          />

          {/* soft pulsing glow behind the logo */}
          <motion.div
            className="absolute rounded-full"
            style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(22,163,74,0.16) 0%, rgba(250,204,21,0.08) 60%, transparent 80%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex flex-col items-center">
            {/* ── Pin + buildings + road assembly (matches Streetly mark) ── */}
            <motion.svg
              width="150"
              height="190"
              viewBox="0 0 200 250"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* shadow under the road tail */}
              <motion.ellipse
                cx="100" cy="236" rx="52" ry="7"
                fill="rgba(0,0,0,0.10)"
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              />

              {/* pin ring — draws itself in like a stroke */}
              <motion.path
                d="M100,12 C144,12 178,46 178,88 C178,124 148,152 118,178 C110,185 104,196 100,210 C96,196 90,185 82,178 C52,152 22,124 22,88 C22,46 56,12 100,12 Z"
                fill="none"
                stroke={GREEN_DARK}
                strokeWidth="19"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.85, ease: "easeInOut" }}
              />

              {/* road flowing out of the pin, exiting the point and curling down */}
              <motion.path
                d="M126,96 C158,114 106,138 138,162 C158,176 116,198 104,232"
                fill="none"
                stroke={GREEN_DARK}
                strokeWidth="19"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.95, duration: 0.6, ease: "easeInOut" }}
              />
              <motion.path
                d="M126,96 C158,114 106,138 138,162 C158,176 116,198 104,232"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray="9 10"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.55, ease: "easeInOut" }}
              />

              {/* back-left tall green building */}
              <motion.g
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.4, ease: easeOutBack }}
              >
                <rect x="60" y="56" width="26" height="64" fill={GREEN} />
                <rect x="67" y="65" width="6" height="6" fill="white" />
                <rect x="79" y="65" width="6" height="6" fill="white" />
                <rect x="67" y="80" width="6" height="6" fill="white" />
                <rect x="79" y="80" width="6" height="6" fill="white" />
              </motion.g>

              {/* center yellow tower */}
              <motion.g
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.4, ease: easeOutBack }}
              >
                <rect x="91" y="42" width="21" height="80" fill={YELLOW} />
                <rect x="97" y="52" width="6" height="6" fill="white" />
                <rect x="97" y="66" width="6" height="6" fill="white" />
                <rect x="97" y="80" width="6" height="6" fill="white" />
              </motion.g>

              {/* right sliver green building, tucked behind the road */}
              <motion.g
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4, ease: easeOutBack }}
              >
                <rect x="116" y="68" width="18" height="52" fill={GREEN} />
                <rect x="121" y="76" width="5" height="5" fill="white" />
                <rect x="121" y="88" width="5" height="5" fill="white" />
              </motion.g>

              {/* hero store with scalloped awning, front and center */}
              <motion.g
                initial={{ y: 26, opacity: 0, scale: 0.85 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.45, ease: easeOutBack }}
                style={{ transformOrigin: "80px 118px" }}
              >
                <rect x="52" y="98" width="56" height="34" fill={GREEN} />
                <path
                  d="M48,90 Q54,100 60,90 Q66,100 72,90 Q78,100 84,90 Q90,100 96,90 Q102,100 108,90 L108,98 L48,98 Z"
                  fill={GREEN_DARK}
                />
                <rect x="46" y="88" width="64" height="5" fill={GREEN_DARK} />
                <rect x="72" y="112" width="14" height="20" fill="white" />
                <rect x="58" y="114" width="10" height="10" fill="white" />
                <rect x="90" y="114" width="10" height="10" fill="white" />
              </motion.g>
            </motion.svg>

            {/* ── Text pieces flow in from opposite sides and meet ── */}
            <div className="flex items-baseline -mt-2">
              <motion.span
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.55, ease: easeOutBack }}
                className="text-4xl sm:text-5xl font-extrabold"
                style={{ color: GREEN_DARK }}
              >
                Street
              </motion.span>
              <motion.span
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.55, ease: easeOutBack }}
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
                    <path
                      d="M12,0 C18.6,0 24,5.4 24,12 C24,20 12,30 12,30 C12,30 0,20 0,12 C0,5.4 5.4,0 12,0 Z"
                      fill={YELLOW}
                    />
                    <circle cx="12" cy="12" r="5" fill="white" />
                  </svg>
                </motion.span>
              </motion.span>
            </div>

            {/* tagline styled like the original mark: caps, tracked, flanked by dashes */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.95, duration: 0.5 }}
              className="mt-2 flex items-center gap-2"
            >
              <span className="w-5 h-px" style={{ background: GREEN_DARK }} />
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-slate-700 text-center whitespace-nowrap">
                Discovering every business, every street
              </p>
              <span className="w-5 h-px" style={{ background: YELLOW }} />
            </motion.div>
          </div>

          {/* animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.3 }}
            className="mt-5 flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i === 1 ? YELLOW : GREEN }}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </motion.div>

          {/* progress bar */}
          <div className="mt-8 w-48 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #16a34a, #facc15)" }}
              transition={{ ease: "linear" }}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-gray-400 tabular-nums">{progress}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
