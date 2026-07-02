import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Check, X, Store } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("streetly_token") ?? ""}`,
});

const ICON_OPTIONS = [
  "Store", "Utensils", "ShoppingBag", "Wrench", "GraduationCap", "HeartPulse",
  "Car", "Home", "Laptop", "Shirt", "Music", "Camera", "Dumbbell", "Plane",
  "Building2", "Coffee", "Scissors", "Zap", "Globe", "BookOpen",
];

type Category = { id: number; name: string; icon: string; createdAt: string };

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Category;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Store");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setError("Category name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url = initial
        ? `${BASE}/api/admin/categories/${initial.id}`
        : `${BASE}/api/admin/categories`;
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify({ name: name.trim(), icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSave();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-[#4a9eff]/30 bg-[#0d1f3c] p-4 mb-4"
    >
      <h3 className="text-sm font-bold text-white mb-3">
        {initial ? "Edit Category" : "New Category"}
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Category Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Food & Beverages"
            className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#4a9eff]/50 placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Icon (Lucide name)</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                  icon === ic
                    ? "bg-[#4a9eff]/20 border-[#4a9eff]/50 text-[#4a9eff]"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="gap-1 bg-[#4a9eff] hover:bg-[#3a8eef] text-white"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}
            className="gap-1 border-white/20 text-white/60 hover:bg-white/10">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["admin-categories-mgmt"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/categories`, { headers: authHeader() });
      return res.json();
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories-mgmt"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? Businesses in this category will lose their category.`)) return;
    setDeleting(cat.id);
    try {
      await fetch(`${BASE}/api/admin/categories/${cat.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Categories</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Manage all business categories. New categories appear site-wide instantly.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowNew(true); setEditCat(null); }}
          className="gap-1.5 bg-[#4a9eff] hover:bg-[#3a8eef] text-white"
        >
          <Plus className="h-3.5 w-3.5" /> New Category
        </Button>
      </div>

      <AnimatePresence>
        {showNew && (
          <CategoryForm
            onSave={() => { setShowNew(false); refresh(); }}
            onCancel={() => setShowNew(false)}
          />
        )}
        {editCat && (
          <CategoryForm
            key={editCat.id}
            initial={editCat}
            onSave={() => { setEditCat(null); refresh(); }}
            onCancel={() => setEditCat(null)}
          />
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-sm text-white/40 py-8 text-center">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <Store className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No categories yet. Create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#4a9eff]/15 flex items-center justify-center flex-shrink-0">
                <Store className="h-4 w-4 text-[#4a9eff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{cat.name}</p>
                <p className="text-xs text-white/40">Icon: {cat.icon}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditCat(cat); setShowNew(false); }}
                  className="gap-1 text-[#4a9eff] border-[#4a9eff]/30 hover:bg-[#4a9eff]/10 h-7 px-2"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(cat)}
                  disabled={deleting === cat.id}
                  className="gap-1 text-red-400 border-red-400/30 hover:bg-red-400/10 h-7 px-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-[#4a9eff]/5 border border-[#4a9eff]/15">
        <p className="text-xs text-[#4a9eff]/80 font-medium">
          ✦ Categories created here appear immediately in:
          <span className="text-white/60"> Browse by Industry</span>,
          <span className="text-white/60"> Business search filters</span>, and
          <span className="text-white/60"> all category dropdowns</span> across the site.
        </p>
      </div>
    </div>
  );
}
