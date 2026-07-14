import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2, MapPin } from "lucide-react";
import { getApiBase } from "@/lib/utils";

const BASE = getApiBase();

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

const MAP_STYLES: Array<{
  key: string;
  label: string;
  emoji: string;
  description: string;
  previewColor: string;
  previewAccent: string;
}> = [
  {
    key: "explore",
    label: "Voyager",
    emoji: "🗺",
    description: "Colorful, detailed, great for discovery",
    previewColor: "#e8f4f8",
    previewAccent: "#4a9eff",
  },
  {
    key: "positron",
    label: "Positron",
    emoji: "⬜",
    description: "Ultra-clean, minimal white — sharp labels",
    previewColor: "#f5f5f0",
    previewAccent: "#888",
  },
  {
    key: "light",
    label: "Light",
    emoji: "☀️",
    description: "Soft light tones, easy on the eye",
    previewColor: "#f0ece4",
    previewAccent: "#b0a090",
  },
  {
    key: "dark",
    label: "Dark Matter",
    emoji: "🌙",
    description: "Sleek dark background, white labels",
    previewColor: "#1a1a2e",
    previewAccent: "#4a9eff",
  },
  {
    key: "satellite",
    label: "Satellite",
    emoji: "🛰",
    description: "Real aerial imagery with street labels",
    previewColor: "#2d4a1e",
    previewAccent: "#7ec850",
  },
  {
    key: "topo",
    label: "Topo Map",
    emoji: "⛰",
    description: "Terrain contours, green forests, elevation",
    previewColor: "#dbe8d0",
    previewAccent: "#5a7a40",
  },
  {
    key: "natgeo",
    label: "National Geographic",
    emoji: "🌍",
    description: "Warm, vintage cartographic style",
    previewColor: "#e8dcc8",
    previewAccent: "#8b6914",
  },
  {
    key: "ocean",
    label: "Ocean Basemap",
    emoji: "🌊",
    description: "Beautiful blue ocean depth detail",
    previewColor: "#0d2d4a",
    previewAccent: "#1a9ed8",
  },
  {
    key: "alidade",
    label: "Alidade Smooth",
    emoji: "🎨",
    description: "Stadia's refined muted style — elegant and minimal",
    previewColor: "#f0ede8",
    previewAccent: "#9e8c7a",
  },
];

function useAdminSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/settings`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    staleTime: 10_000,
  });
}

function useSaveMapStyle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`${BASE}/api/admin/settings`, {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify({ default_map_style: key }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export default function AdminMapStylePanel() {
  const { data: settings, isLoading } = useAdminSettings();
  const saveStyle = useSaveMapStyle();
  const [saved, setSaved] = useState<string | null>(null);

  const current = settings?.default_map_style ?? "explore";

  const handleSelect = async (key: string) => {
    await saveStyle.mutateAsync(key);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Default Map Style</h2>
        <p className="text-sm text-white/50">
          Choose which map style visitors see when they first open the home page.
          They can still switch styles themselves during their session.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-white/40 py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading settings…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MAP_STYLES.map((style) => {
            const isActive = current === style.key;
            const isSaving = saveStyle.isPending && saveStyle.variables === style.key;
            const justSaved = saved === style.key;
            return (
              <button
                key={style.key}
                onClick={() => handleSelect(style.key)}
                disabled={saveStyle.isPending}
                className="group relative flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200 focus:outline-none"
                style={{
                  border: isActive
                    ? "2px solid rgba(74,158,255,0.8)"
                    : "2px solid rgba(255,255,255,0.07)",
                  background: isActive
                    ? "rgba(74,158,255,0.08)"
                    : "rgba(255,255,255,0.03)",
                  boxShadow: isActive ? "0 0 0 4px rgba(74,158,255,0.12)" : "none",
                }}
              >
                {/* Map preview block */}
                <div
                  className="relative h-24 w-full flex items-center justify-center overflow-hidden"
                  style={{ background: style.previewColor }}
                >
                  {/* Fake road lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 120 96">
                    <line x1="0" y1="48" x2="120" y2="48" stroke={style.previewAccent} strokeWidth="3" />
                    <line x1="60" y1="0" x2="60" y2="96" stroke={style.previewAccent} strokeWidth="3" />
                    <line x1="0" y1="25" x2="120" y2="70" stroke={style.previewAccent} strokeWidth="1.5" />
                    <line x1="20" y1="0" x2="100" y2="96" stroke={style.previewAccent} strokeWidth="1" />
                    <circle cx="60" cy="48" r="6" fill={style.previewAccent} opacity="0.8" />
                  </svg>
                  <span className="relative text-2xl z-10 drop-shadow-lg">{style.emoji}</span>

                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-blue-300"
                      style={{ background: "rgba(37,99,235,0.85)" }}>
                      <CheckCircle className="h-3 w-3" /> Active
                    </div>
                  )}
                </div>

                {/* Info + action */}
                <div className="p-3">
                  <div className="font-semibold text-sm text-white mb-0.5">{style.label}</div>
                  <div className="text-[11px] text-white/45 leading-tight mb-3">{style.description}</div>

                  <div
                    className="w-full text-center text-xs font-semibold py-1.5 rounded-lg transition-colors"
                    style={{
                      background: isActive
                        ? "rgba(74,158,255,0.2)"
                        : "rgba(255,255,255,0.08)",
                      color: isActive ? "#60a5fa" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                      </span>
                    ) : justSaved ? (
                      <span className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle className="h-3 w-3" /> Saved!
                      </span>
                    ) : isActive ? (
                      "Current default"
                    ) : (
                      "Set as default"
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {saveStyle.isError && (
        <p className="mt-4 text-sm text-red-400 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Failed to save — please try again.
        </p>
      )}
    </div>
  );
}
