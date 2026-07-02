import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "glass" | "solid";
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled = false,
  className = "",
  variant = "glass",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  const triggerClass =
    variant === "glass"
      ? "w-full text-left pl-3 pr-8 py-2 rounded-xl text-sm outline-none transition-all cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-[#4a9eff]/40"
      : "w-full text-left pl-3 pr-8 py-2 rounded-lg text-sm outline-none transition-all cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-[#4a9eff]/40";

  const triggerStyle =
    variant === "glass"
      ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }
      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerClass}
        style={triggerStyle}
      >
        <span className={selected ? "text-white" : "text-white/35"}>
          {selected ? selected.label : placeholder}
        </span>
      </button>
      <ChevronDown
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-transform ${open ? "rotate-180 text-[#4a9eff]/70" : "text-white/40"}`}
      />

      {open && (
        <div
          className="absolute z-[999] mt-1 w-full rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: "#080e1f",
            border: "1px solid rgba(74,158,255,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="px-2 pt-2 pb-1.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#4a9eff]/40 transition-all"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/30 text-center">No results</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    o.value === value
                      ? "text-[#4a9eff] bg-[#4a9eff]/10 font-medium"
                      : "text-white/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
