import { useState, useEffect } from "react";
import { MapPin, Star, Navigation, Activity, Zap, ChevronDown, ShieldCheck } from "lucide-react";

const HEAT_ZONES = [
  { cx: 45, cy: 42, r: 18, intensity: 0.85, color: "#ef4444" },
  { cx: 65, cy: 30, r: 14, intensity: 0.7, color: "#f97316" },
  { cx: 30, cy: 60, r: 12, intensity: 0.55, color: "#f59e0b" },
  { cx: 72, cy: 58, r: 10, intensity: 0.5, color: "#f59e0b" },
  { cx: 55, cy: 70, r: 9, intensity: 0.45, color: "#22c55e" },
  { cx: 20, cy: 35, r: 8, intensity: 0.4, color: "#22c55e" },
  { cx: 80, cy: 45, r: 8, intensity: 0.38, color: "#22c55e" },
];

const PINS = [
  { x: 45, y: 40, color: "#ef4444", name: "Food Hub · 12 businesses", hot: true },
  { x: 65, y: 28, color: "#f97316", name: "Shopping District · 8", hot: true },
  { x: 30, y: 58, color: "#f59e0b", name: "Health Cluster · 5", hot: false },
  { x: 72, y: 56, color: "#22c55e", name: "Tech Zone · 4", hot: false },
];

const STATS = [
  { label: "Active now", value: "284", icon: Activity, color: "#4a9eff" },
  { label: "Businesses", value: "1,840", icon: MapPin, color: "#22c55e" },
  { label: "Avg. Rating", value: "4.6★", icon: Star, color: "#f59e0b" },
];

const LIVE = ["Hot zone: Lekki Phase 1 — 12 check-ins", "Trending: The Lekki Grill · 50 views", "New listing: TechVault Lagos", "Peak hours: 7pm–9pm tonight"];

export function DarkHeatLayer() {
  const [liveIdx, setLiveIdx] = useState(0);
  const [pulseFrame, setPulseFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLiveIdx(i => (i + 1) % LIVE.length), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulseFrame(f => f + 1), 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "linear-gradient(160deg, #06090f 0%, #080d1a 50%, #06090f 100%)",
      fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden",
    }}>

      {/* ── MAP BASE ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="g3" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0L0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
            {/* Heat gradient defs */}
            {HEAT_ZONES.map((z, i) => (
              <radialGradient key={i} id={`heat${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={z.color} stopOpacity={z.intensity * 0.65}/>
                <stop offset="50%" stopColor={z.color} stopOpacity={z.intensity * 0.25}/>
                <stop offset="100%" stopColor={z.color} stopOpacity={0}/>
              </radialGradient>
            ))}
          </defs>

          {/* Grid */}
          <rect width="100%" height="100%" fill="url(#g3)"/>

          {/* Roads — dark night style */}
          <line x1="0" y1="280" x2="1280" y2="280" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
          <line x1="0" y1="480" x2="1280" y2="480" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
          <line x1="320" y1="0" x2="320" y2="800" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
          <line x1="700" y1="0" x2="700" y2="800" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
          <line x1="1000" y1="0" x2="1000" y2="800" stroke="rgba(255,255,255,0.04)" strokeWidth="7"/>
          <line x1="0" y1="160" x2="1280" y2="160" stroke="rgba(255,255,255,0.04)" strokeWidth="7"/>
          <line x1="0" y1="600" x2="1280" y2="100" stroke="rgba(255,255,255,0.09)" strokeWidth="14"/>

          {/* Streetlights along roads */}
          {[80,240,400,560,720,880,1040,1200].map(x => (
            <circle key={x} cx={x} cy={280} r="3" fill="#fff8e1" opacity="0.6"/>
          ))}
          {[80,240,400,560,720,880,1040,1200].map(x => (
            <circle key={x} cx={x} cy={480} r="3" fill="#fff8e1" opacity="0.6"/>
          ))}

          {/* City blocks — very dark */}
          {[[50,20,120,100],[220,20,80,120],[360,20,300,100],[710,20,240,120],[1010,20,220,100],
            [50,190,220,60],[410,190,240,60],[710,190,240,60],[1010,190,220,60],
            [50,310,220,130],[410,310,240,130],[710,310,240,130],[1010,310,220,130],
            [50,510,220,80],[410,510,240,80],[710,510,240,80],[1010,510,220,80],
            [50,640,220,120],[410,640,240,120],[710,640,240,120],[1010,640,220,120]
          ].map(([x,y,w,h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(20,28,50,0.9)" rx="3"/>
          ))}

          {/* Building windows glow */}
          {[[70,30,8,6],[90,50,8,6],[110,30,8,6],[130,50,8,6],
            [260,30,8,6],[280,50,8,6],[300,30,8,6],[320,50,8,6],
            [400,30,8,6],[420,50,8,6],[440,30,8,6],[460,50,8,6],
          ].map(([x,y,w,h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h}
              fill={i%3 === 0 ? "#fff8e1" : i%3 === 1 ? "#e0f0ff" : "#ffe8cc"}
              opacity={0.3 + (i%3)*0.1} rx="1"/>
          ))}

          {/* Water */}
          <ellipse cx="640" cy="760" rx="450" ry="80"
            fill="rgba(74,158,255,0.08)" stroke="rgba(74,158,255,0.12)" strokeWidth="1"/>
          {/* Water shimmer lines */}
          {[0,1,2,3].map(i => (
            <line key={i} x1={290 + i*90} y1={750 + i*4} x2={380 + i*90} y2={745 + i*4}
              stroke="rgba(74,158,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
          ))}

          {/* ── HEAT LAYER ── */}
          {HEAT_ZONES.map((z, i) => (
            <ellipse key={i}
              cx={`${z.cx}%`} cy={`${z.cy}%`}
              rx={`${z.r * 1.4}%`} ry={`${z.r}%`}
              fill={`url(#heat${i})`}
            />
          ))}
        </svg>
      </div>

      {/* ── INDIVIDUAL PINS on hot zones ── */}
      {PINS.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          transform: "translate(-50%, -100%)",
          zIndex: 25, cursor: "pointer",
          filter: `drop-shadow(0 0 16px ${p.color}99)`,
        }}>
          {/* Outer glow ring */}
          {p.hot && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%,-50%)",
              width: 70, height: 70, borderRadius: "50%",
              background: `radial-gradient(circle, ${p.color}33, transparent)`,
              animation: `heatPulse${i} 2.5s ease-out ${i*0.4}s infinite`,
            }}/>
          )}
          <div style={{
            width: p.hot ? 40 : 30, height: p.hot ? 40 : 30,
            borderRadius: "50% 50% 50% 4px",
            transform: "rotate(-45deg)",
            background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`,
            border: "2.5px solid rgba(255,255,255,0.85)",
            boxShadow: `0 4px 20px ${p.color}cc`,
          }}/>
          {/* Info label */}
          <div style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6,10,20,0.92)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${p.color}44`,
            borderRadius: 8, padding: "4px 10px",
            fontSize: 10, fontWeight: 700, color: "white",
            whiteSpace: "nowrap",
            boxShadow: `0 2px 16px ${p.color}44`,
          }}>{p.name}</div>
        </div>
      ))}

      {/* ── TOP HEADER ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
        background: "linear-gradient(to bottom, rgba(6,9,15,0.98) 0%, rgba(6,9,15,0.0) 100%)",
        padding: "20px 24px 40px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "redPulse 1.5s infinite" }}/>
              <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em" }}>LIVE DENSITY MAP</span>
            </div>
            <div style={{ color: "white", fontSize: 20, fontWeight: 800, marginTop: 4 }}>Lagos Business Heatmap</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "10px 16px", textAlign: "center",
              }}>
                <div style={{ color: s.color, fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HEAT LEGEND ── */}
      <div style={{
        position: "absolute", top: "50%", right: 24, transform: "translateY(-50%)",
        zIndex: 50,
        background: "rgba(6,9,15,0.9)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "16px 14px",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 12 }}>DENSITY</div>
        {[
          { color: "#ef4444", label: "Very High" },
          { color: "#f97316", label: "High" },
          { color: "#f59e0b", label: "Medium" },
          { color: "#22c55e", label: "Low" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 24, height: 8, borderRadius: 4,
              background: `linear-gradient(90deg, ${item.color}cc, ${item.color}22)`,
            }}/>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{item.label}</span>
          </div>
        ))}
        {/* Gradient bar */}
        <div style={{
          marginTop: 12, width: "100%", height: 8, borderRadius: 4,
          background: "linear-gradient(90deg, #22c55e, #f59e0b, #f97316, #ef4444)",
        }}/>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Low</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>High</span>
        </div>
      </div>

      {/* ── BOTTOM LIVE TICKER ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "linear-gradient(to top, rgba(6,9,15,0.98) 0%, transparent 100%)",
        padding: "40px 24px 24px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "redPulse 1.2s infinite", flexShrink: 0 }}/>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{LIVE[liveIdx]}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "10px 16px", color: "rgba(255,255,255,0.7)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}><Activity size={14}/> All Areas</button>
          <button style={{
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            border: "none", borderRadius: 12, padding: "10px 18px",
            color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
          }}><Zap size={14}/> Hot Zones</button>
        </div>
      </div>

      <style>{`
        @keyframes redPulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.5; transform:scale(1.4); } }
        @keyframes heatPulse0 { 0%{ opacity:.7; transform:translate(-50%,-50%) scale(1); } 100%{ opacity:0; transform:translate(-50%,-50%) scale(2); } }
        @keyframes heatPulse1 { 0%{ opacity:.7; transform:translate(-50%,-50%) scale(1); } 100%{ opacity:0; transform:translate(-50%,-50%) scale(2); } }
        @keyframes heatPulse2 { 0%{ opacity:.7; transform:translate(-50%,-50%) scale(1); } 100%{ opacity:0; transform:translate(-50%,-50%) scale(2); } }
        @keyframes heatPulse3 { 0%{ opacity:.7; transform:translate(-50%,-50%) scale(1); } 100%{ opacity:0; transform:translate(-50%,-50%) scale(2); } }
      `}</style>
    </div>
  );
}
