import { useState } from "react";
import { Star, ShieldCheck, MapPin, Phone, Clock, Navigation, X } from "lucide-react";

const PINS = [
  { id: 1, x: 38, y: 42, color: "#ef4444", label: "Food & Drinks", name: "Mama Nkechi Kitchen", cat: "Food & Drinks", rating: 4.8, phone: "+234 801 234 5678", hours: "7am–10pm", verified: true, photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80" },
  { id: 2, x: 55, y: 30, color: "#ef4444", label: "Food", name: "The Lekki Grill", cat: "Food & Drinks", rating: 4.5, phone: "+234 802 345 6789", hours: "11am–11pm", verified: true, photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" },
  { id: 3, x: 72, y: 55, color: "#22c55e", label: "Health", name: "Sunrise Pharmacy", cat: "Health & Wellness", rating: 4.3, phone: "+234 803 456 7890", hours: "8am–9pm", verified: false, photo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" },
  { id: 4, x: 25, y: 65, color: "#8b5cf6", label: "Edu", name: "LearnHub Academy", cat: "Education", rating: 4.7, phone: "+234 804 567 8901", hours: "8am–5pm", verified: true, photo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80" },
  { id: 5, x: 62, y: 72, color: "#f59e0b", label: "Retail", name: "Glamour Studio", cat: "Beauty & Personal Care", rating: 4.9, phone: "+234 805 678 9012", hours: "9am–8pm", verified: true, photo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80" },
];

const CLUSTERS = [
  { x: 48, y: 52, count: 7, color: "#4a9eff" },
  { x: 18, y: 38, count: 4, color: "#4a9eff" },
  { x: 82, y: 35, count: 12, color: "#4a9eff" },
  { x: 88, y: 68, count: 3, color: "#4a9eff" },
];

export function ClusteredMarkers() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<typeof PINS[0] | null>(null);

  const pin = hovered !== null ? PINS.find(p => p.id === hovered) : null;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#060c1e", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* ── MAP BACKGROUND ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {/* Map tile simulation */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(74,158,255,0.07)" strokeWidth="0.5"/>
            </pattern>
            <pattern id="roads" width="180" height="180" patternUnits="userSpaceOnUse">
              <rect width="180" height="180" fill="none"/>
              <line x1="0" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
              <line x1="90" y1="0" x2="90" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
              <line x1="0" y1="130" x2="180" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/>
              <line x1="40" y1="0" x2="40" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/>
              <line x1="140" y1="0" x2="140" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <rect width="100%" height="100%" fill="url(#roads)"/>
          {/* Diagonal main road */}
          <line x1="0" y1="600" x2="1280" y2="200" stroke="rgba(255,255,255,0.09)" strokeWidth="10"/>
          <line x1="200" y1="800" x2="900" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
          {/* Blocks / buildings */}
          {[[80,120,90,60],[250,80,120,70],[420,100,80,80],[600,50,100,90],[800,90,90,70],[950,60,110,80],[1100,100,120,60],
            [50,260,100,80],[200,240,130,70],[380,270,90,90],[560,250,100,80],[730,240,120,70],[890,260,80,90],[1060,230,110,70],
            [100,400,90,80],[290,380,120,90],[470,400,100,70],[660,390,90,80],[820,380,130,90],[1000,400,100,70],[1150,380,110,80],
            [60,540,110,70],[250,520,90,80],[430,540,120,90],[600,530,80,70],[780,520,110,80],[960,540,90,70],[1130,520,100,90],
            [80,660,100,80],[270,640,120,70],[450,660,90,90],[630,650,110,80],[800,640,80,70],[990,660,120,90],[1160,640,90,80]
          ].map(([x,y,w,h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h}
              fill={`rgba(${[30,40,50][i%3]},${[45,55,60][i%3]},${[80,90,100][i%3]},0.6)`}
              rx="2"/>
          ))}
          {/* Water body */}
          <ellipse cx="640" cy="720" rx="300" ry="80" fill="rgba(74,158,255,0.06)" />
        </svg>

        {/* Subtle gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 40%, rgba(74,158,255,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* ── CLUSTER BUBBLES ── */}
      {CLUSTERS.map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${c.x}%`, top: `${c.y}%`,
          transform: "translate(-50%,-50%)",
          zIndex: 10,
          cursor: "pointer",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: `radial-gradient(circle, ${c.color}ee, ${c.color}99)`,
            border: `3px solid white`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 24px ${c.color}88, 0 0 0 8px ${c.color}22`,
            flexDirection: "column",
            animation: `clusterPulse 2.5s ease-in-out ${i * 0.4}s infinite`,
          }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{c.count}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: 600 }}>places</span>
          </div>
        </div>
      ))}

      {/* ── INDIVIDUAL PINS ── */}
      {PINS.map(p => (
        <div key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            transform: "translate(-50%, -100%)",
            zIndex: hovered === p.id ? 30 : 20,
            cursor: "pointer",
            filter: hovered === p.id ? `drop-shadow(0 8px 24px ${p.color}99)` : `drop-shadow(0 4px 12px ${p.color}66)`,
          }}
          onMouseEnter={() => setHovered(p.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setSelected(p)}
        >
          {/* Pin body */}
          <div style={{
            width: hovered === p.id ? 42 : 34, height: hovered === p.id ? 42 : 34,
            borderRadius: "50% 50% 50% 4px",
            transform: "rotate(-45deg)",
            background: `linear-gradient(135deg, ${p.color}, ${p.color}bb)`,
            border: "3px solid white",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            position: "relative",
          }}>
            {/* Pulsing ring for featured */}
            {p.verified && (
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${p.color}44, transparent)`,
                animation: "pinPulse 2s ease-out infinite",
              }}/>
            )}
          </div>

          {/* Hover photo card */}
          {hovered === p.id && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              background: "rgba(6,12,30,0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              animation: "cardPop 0.2s ease",
            }}>
              <img src={p.photo} alt={p.name} style={{ width: "100%", height: 90, objectFit: "cover" }} />
              <div style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  {p.verified && <ShieldCheck size={11} color="#4a9eff" />}
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{p.cat}</span>
                </div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>{p.rating}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>· {p.hours}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── SEARCH BAR ── */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        zIndex: 50, width: 480,
      }}>
        <div style={{
          background: "rgba(6,12,30,0.88)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(74,158,255,0.25)",
          borderRadius: 16,
          padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          <MapPin size={16} color="#4a9eff" />
          <input placeholder="Search businesses, streets, areas…" style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "white", fontSize: 14,
          }} defaultValue="" readOnly />
          <div style={{
            background: "rgba(74,158,255,0.15)", border: "1px solid rgba(74,158,255,0.25)",
            borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#4a9eff", fontWeight: 600,
          }}>28 results</div>
        </div>
        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
          {["All", "🍽 Food", "💊 Health", "🛍 Shopping", "💻 Tech", "✨ Beauty", "🚗 Auto"].map((pill, i) => (
            <div key={pill} style={{
              background: i === 0 ? "#4a9eff" : "rgba(255,255,255,0.07)",
              border: `1px solid ${i === 0 ? "#4a9eff" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "white",
              whiteSpace: "nowrap", cursor: "pointer", fontWeight: i === 0 ? 700 : 500,
              backdropFilter: "blur(12px)",
            }}>{pill}</div>
          ))}
        </div>
      </div>

      {/* ── SELECTED BUSINESS PANEL ── */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, width: 480,
          background: "rgba(6,12,30,0.96)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(74,158,255,0.2)",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ position: "relative" }}>
            <img src={selected.photo} alt={selected.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(6,12,30,0.9))" }} />
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", cursor: "pointer",
            }}><X size={14}/></button>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ background: "rgba(74,158,255,0.15)", color: "#4a9eff", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{selected.cat}</span>
              {selected.verified && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#4a9eff", fontSize: 11 }}><ShieldCheck size={11}/>Verified</span>}
            </div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{selected.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={13} color="#f59e0b" fill="#f59e0b" />
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>{selected.rating}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <Phone size={12}/> {selected.phone}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <Clock size={12}/> {selected.hours}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{
                flex: 1, background: "linear-gradient(135deg, #4a9eff, #3a8ef0)",
                border: "none", borderRadius: 12, padding: "12px 0",
                color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: "0 4px 20px rgba(74,158,255,0.4)",
              }}><Navigation size={14}/> Get Directions</button>
              <button style={{
                flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "12px 0", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>View Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEGEND ── */}
      <div style={{
        position: "absolute", bottom: 24, right: 20, zIndex: 40,
        background: "rgba(6,12,30,0.88)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: "0.06em" }}>CLUSTER KEY</div>
        {[{ color: "#ef4444", label: "Food & Health" }, { color: "#22c55e", label: "Services" }, { color: "#4a9eff", label: "Multiple types" }].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes clusterPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); }
          50% { transform: translate(-50%,-50%) scale(1.06); }
        }
        @keyframes pinPulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes cardPop {
          from { opacity: 0; transform: translateX(-50%) scale(0.92) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
