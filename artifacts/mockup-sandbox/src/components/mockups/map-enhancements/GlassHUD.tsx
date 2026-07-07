import { useState, useEffect } from "react";
import { Search, Layers, Navigation, MapPin, Star, Zap, RotateCcw, ChevronDown, Mic, ShieldCheck } from "lucide-react";

const PINS_LIGHT = [
  { x: 42, y: 38, color: "#ef4444", name: "Mama Nkechi", cat: "Food", rating: 4.8, featured: true },
  { x: 60, y: 52, color: "#22c55e", name: "Sunrise Pharmacy", cat: "Health", rating: 4.3, featured: false },
  { x: 28, y: 60, color: "#8b5cf6", name: "LearnHub", cat: "Education", rating: 4.7, featured: false },
  { x: 70, y: 35, color: "#f59e0b", name: "Glamour Studio", cat: "Beauty", rating: 4.9, featured: true },
  { x: 50, y: 68, color: "#3b82f6", name: "AutoFix Lagos", cat: "Automotive", rating: 4.1, featured: false },
  { x: 80, y: 58, color: "#ec4899", name: "Lekki Spa", cat: "Wellness", rating: 4.6, featured: false },
];

const STYLES = ["Light", "Dark", "Satellite", "Explore"];
const LIVE = ["3 users nearby · Victoria Island", "New: The Lekki Grill just opened", "Glamour Studio — trending now", "5 check-ins at Sunrise Pharmacy"];

export function GlassHUD() {
  const [mapStyle, setMapStyle] = useState(0);
  const [dropped, setDropped] = useState<number[]>([]);
  const [liveIdx, setLiveIdx] = useState(0);
  const [showStylePicker, setShowStylePicker] = useState(false);

  const isDark = mapStyle === 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      PINS_LIGHT.forEach((_, i) => {
        setTimeout(() => setDropped(prev => [...prev, i]), i * 110);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLiveIdx(i => (i + 1) % LIVE.length), 3000);
    return () => clearInterval(t);
  }, []);

  const bgColors = [
    "linear-gradient(160deg, #e8edf5 0%, #d0dae8 40%, #c8d4e4 100%)",
    "linear-gradient(160deg, #0d1117 0%, #0d1b2a 40%, #0a1628 100%)",
    "linear-gradient(160deg, #2d4a1e 0%, #3a5a28 40%, #2d4520 100%)",
    "linear-gradient(160deg, #1a2744 0%, #1e3056 40%, #172040 100%)",
  ];

  const roadColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,50,0.08)";
  const blockColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,50,0.06)";

  return (
    <div style={{ width: "100%", height: "100vh", background: bgColors[mapStyle], fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* ── MAP BG ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          {/* Grid */}
          <defs>
            <pattern id="g2" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0L0 0 0 50" fill="none" stroke={roadColor} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g2)" />
          {/* Roads */}
          <line x1="0" y1="280" x2="1280" y2="280" stroke={roadColor} strokeWidth="10"/>
          <line x1="0" y1="480" x2="1280" y2="480" stroke={roadColor} strokeWidth="10"/>
          <line x1="320" y1="0" x2="320" y2="800" stroke={roadColor} strokeWidth="10"/>
          <line x1="700" y1="0" x2="700" y2="800" stroke={roadColor} strokeWidth="10"/>
          <line x1="1000" y1="0" x2="1000" y2="800" stroke={roadColor} strokeWidth="6"/>
          <line x1="0" y1="160" x2="1280" y2="160" stroke={roadColor} strokeWidth="6"/>
          <line x1="0" y1="380" x2="1280" y2="380" stroke={roadColor} strokeWidth="4"/>
          {/* Diagonal */}
          <line x1="0" y1="600" x2="1280" y2="100" stroke={roadColor} strokeWidth="8"/>
          {/* Blocks */}
          {[[50,20,120,100],[220,20,80,120],[360,20,300,100],[710,20,240,120],[1010,20,220,100],
            [50,190,220,60],[320,190,50,60],[410,190,240,60],[710,190,240,60],[1010,190,220,60],
            [50,310,220,130],[320,310,50,130],[410,310,240,130],[710,310,240,130],[1010,310,220,130],
            [50,510,220,80],[320,510,50,80],[410,510,240,80],[710,510,240,80],[1010,510,220,80],
            [50,640,220,120],[320,640,50,120],[410,640,240,120],[710,640,240,120],[1010,640,220,120]
          ].map(([x,y,w,h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={blockColor} rx="3"/>
          ))}
          {/* Water */}
          <ellipse cx="640" cy="750" rx="400" ry="70" fill={isDark ? "rgba(30,80,160,0.2)" : "rgba(80,140,200,0.15)"}/>
        </svg>
      </div>

      {/* ── ANIMATED DROPPING PINS ── */}
      {PINS_LIGHT.map((p, i) => {
        const isDropped = dropped.includes(i);
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            transform: `translate(-50%, -100%) ${isDropped ? "translateY(0)" : "translateY(-60px)"}`,
            opacity: isDropped ? 1 : 0,
            transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
            zIndex: 20,
            cursor: "pointer",
          }}>
            {/* Glow ring for featured */}
            {p.featured && (
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%,-50%)",
                width: 60, height: 60, borderRadius: "50%",
                background: `radial-gradient(circle, ${p.color}44, transparent)`,
                animation: "glow 2s ease-out infinite",
              }}/>
            )}
            {/* Pin */}
            <div style={{
              width: p.featured ? 40 : 32, height: p.featured ? 40 : 32,
              borderRadius: "50% 50% 50% 4px",
              transform: "rotate(-45deg)",
              background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
              border: `${p.featured ? 3 : 2.5}px solid white`,
              boxShadow: `0 6px 24px ${p.color}88`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Shadow on landing */}
              <div style={{
                position: "absolute", bottom: -14, left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 20, height: 6, borderRadius: "50%",
                background: `rgba(0,0,0,0.2)`, filter: "blur(3px)",
              }}/>
            </div>
            {/* Name label above pin */}
            <div style={{
              position: "absolute", bottom: "calc(100% + 4px)", left: "50%",
              transform: "translateX(-50%)",
              background: isDark ? "rgba(6,12,30,0.9)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 8, padding: "3px 8px",
              fontSize: 10, fontWeight: 700,
              color: isDark ? "white" : "#1e293b",
              whiteSpace: "nowrap", pointerEvents: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}>
              {p.name}
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                <Star size={8} color="#f59e0b" fill="#f59e0b"/>
                <span style={{ color: "#f59e0b", fontSize: 9 }}>{p.rating}</span>
                <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: 9 }}>· {p.cat}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── TOP HUD: SEARCH ── */}
      <div style={{
        position: "absolute", top: 20, left: 20, right: 20, zIndex: 50,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <div style={{
          flex: 1,
          background: isDark ? "rgba(6,12,30,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(32px) saturate(180%)",
          border: `1px solid ${isDark ? "rgba(74,158,255,0.3)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 18, padding: "13px 18px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}>
          <Search size={16} color={isDark ? "#4a9eff" : "#3b82f6"} />
          <span style={{ flex: 1, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: 14 }}>Search businesses, streets…</span>
          <Mic size={14} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
        </div>
        {/* Map style toggle */}
        <button onClick={() => setShowStylePicker(!showStylePicker)} style={{
          background: isDark ? "rgba(6,12,30,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(32px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 18, padding: "13px 16px",
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          color: isDark ? "white" : "#1e293b", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        }}>
          <Layers size={16} /> {STYLES[mapStyle]} <ChevronDown size={12} />
        </button>
      </div>

      {/* Style Picker dropdown */}
      {showStylePicker && (
        <div style={{
          position: "absolute", top: 80, right: 20, zIndex: 60,
          background: isDark ? "rgba(6,12,30,0.96)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(32px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}>
          {STYLES.map((s, i) => (
            <button key={s} onClick={() => { setMapStyle(i); setShowStylePicker(false); }} style={{
              display: "block", width: "100%", padding: "12px 20px",
              textAlign: "left", cursor: "pointer", border: "none",
              background: i === mapStyle ? (isDark ? "rgba(74,158,255,0.15)" : "rgba(59,130,246,0.1)") : "transparent",
              color: i === mapStyle ? "#4a9eff" : (isDark ? "white" : "#1e293b"),
              fontSize: 14, fontWeight: i === mapStyle ? 700 : 500,
            }}>
              {["🗺", "🌙", "🛰", "☀️"][i]} {s}
            </button>
          ))}
        </div>
      )}

      {/* ── CATEGORY PILLS ── */}
      <div style={{
        position: "absolute", top: 80, left: 20, zIndex: 50,
        display: "flex", gap: 8,
      }}>
        {["All", "🍽 Food", "💊 Health", "🛍 Shopping", "💻 Tech"].map((pill, i) => (
          <div key={pill} style={{
            background: i === 0
              ? "linear-gradient(135deg, #4a9eff, #3a8ef0)"
              : (isDark ? "rgba(6,12,30,0.85)" : "rgba(255,255,255,0.85)"),
            backdropFilter: "blur(20px)",
            border: `1px solid ${i === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")}`,
            borderRadius: 24, padding: "7px 14px", fontSize: 12,
            color: i === 0 ? "white" : (isDark ? "white" : "#1e293b"),
            fontWeight: i === 0 ? 700 : 500, cursor: "pointer",
            boxShadow: i === 0 ? "0 4px 16px rgba(74,158,255,0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
          }}>{pill}</div>
        ))}
      </div>

      {/* ── LIVE ACTIVITY TICKER ── */}
      <div style={{
        position: "absolute", bottom: 100, left: 20, zIndex: 50,
        background: isDark ? "rgba(6,12,30,0.88)" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${isDark ? "rgba(74,158,255,0.2)" : "rgba(59,130,246,0.2)"}`,
        borderRadius: 12, padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        maxWidth: 340,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "blink 1.2s ease-in-out infinite", flexShrink: 0 }}/>
        <span style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#374151", fontSize: 12, fontWeight: 500 }}>
          {LIVE[liveIdx]}
        </span>
      </div>

      {/* ── RIGHT HUD ── */}
      <div style={{
        position: "absolute", right: 20, bottom: 120, zIndex: 50,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {[Navigation, RotateCcw, Zap].map((Icon, i) => (
          <button key={i} style={{
            width: 44, height: 44, borderRadius: 14,
            background: isDark ? "rgba(6,12,30,0.88)" : "rgba(255,255,255,0.88)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
          }}><Icon size={16}/></button>
        ))}
      </div>

      {/* ── ZOOM CONTROLS ── */}
      <div style={{
        position: "absolute", right: 20, bottom: 260, zIndex: 50,
        background: isDark ? "rgba(6,12,30,0.88)" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}>
        {["+", "−"].map(sym => (
          <button key={sym} style={{
            display: "block", width: 44, height: 44,
            background: "transparent", border: "none",
            color: isDark ? "white" : "#1e293b",
            fontSize: 20, fontWeight: 300, cursor: "pointer",
            borderBottom: sym === "+" ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` : "none",
          }}>{sym}</button>
        ))}
      </div>

      <style>{`
        @keyframes glow { 0% { opacity:.8; transform:translate(-50%,-50%) scale(1); } 100% { opacity:0; transform:translate(-50%,-50%) scale(2); } }
        @keyframes blink { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
      `}</style>
    </div>
  );
}
