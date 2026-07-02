import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@assets/WhatsApp_Image_2026-07-02_at_4.40.54_PM_1783021954458.jpeg";

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
          {/* animated road line moving across the background */}
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
            style={{ width: 260, height: 260, background: "radial-gradient(circle, rgba(22,163,74,0.18) 0%, rgba(250,204,21,0.08) 60%, transparent 80%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* logo bounce + fade in */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative flex flex-col items-center"
          >
            <motion.img
              src={logo}
              alt="Streetly"
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 text-sm sm:text-base font-semibold tracking-wide text-emerald-800/80"
          >
            Discovering every business, every street
          </motion.p>

          {/* animated dots */}
          <div className="mt-5 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i === 1 ? "#facc15" : "#16a34a" }}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </div>

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
