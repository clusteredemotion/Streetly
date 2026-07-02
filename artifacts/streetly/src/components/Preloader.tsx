import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Store, Building2 } from "lucide-react";

const easeOutBack = [0.34, 1.56, 0.64, 1] as const;

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
            style={{ width: 280, height: 280, background: "radial-gradient(circle, rgba(22,163,74,0.16) 0%, rgba(250,204,21,0.08) 60%, transparent 80%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex flex-col items-center">
            {/* ── Pin assembly: outline drops in, buildings fly up into it ── */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-3">
              <motion.div
                initial={{ y: -140, opacity: 0, rotate: -20 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: easeOutBack }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <MapPin className="w-28 h-28" style={{ color: "#15803d" }} strokeWidth={1.4} />
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.5 }}
                animate={{ y: -10, opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: easeOutBack }}
                className="absolute flex items-end gap-0.5"
              >
                <Building2 className="w-4 h-4" style={{ color: "#facc15" }} strokeWidth={2.2} />
                <Store className="w-6 h-6" style={{ color: "#15803d" }} strokeWidth={2.2} />
              </motion.div>
            </div>

            {/* ── Text pieces flow in from opposite sides and meet ── */}
            <div className="flex items-baseline">
              <motion.span
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.55, ease: easeOutBack }}
                className="text-4xl sm:text-5xl font-extrabold"
                style={{ color: "#15803d" }}
              >
                Street
              </motion.span>
              <motion.span
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.55, ease: easeOutBack }}
                className="text-4xl sm:text-5xl font-extrabold relative"
                style={{ color: "#facc15" }}
              >
                ly
                <motion.span
                  initial={{ scale: 0, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.4, ease: easeOutBack }}
                  className="absolute -top-2.5 -right-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: "#facc15" }} fill="#facc15" />
                </motion.span>
              </motion.span>
            </div>

            {/* underline forming as pieces settle */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.35, duration: 0.5 }}
              className="h-px w-40 my-2"
              style={{ background: "linear-gradient(90deg, transparent, #15803d, #facc15, transparent)" }}
            />

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="text-sm sm:text-base font-semibold tracking-wide text-emerald-800/80 text-center"
            >
              Discovering every business, every street
            </motion.p>
          </div>

          {/* animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.65, duration: 0.3 }}
            className="mt-5 flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i === 1 ? "#facc15" : "#16a34a" }}
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
