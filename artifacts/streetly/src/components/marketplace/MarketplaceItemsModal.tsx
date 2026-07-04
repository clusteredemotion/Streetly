import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  useListMarketplaceItemsForManagement,
  useCreateMarketplaceItem,
  useUpdateMarketplaceItem,
  useDeleteMarketplaceItem,
  type MarketplaceItem,
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Trash2, Edit2, Loader2, Save, Package, ImageIcon } from "lucide-react";

function ItemForm({
  initial,
  onCancel,
  onSubmit,
  submitting,
}: {
  initial?: Partial<MarketplaceItem>;
  onCancel: () => void;
  onSubmit: (data: { name: string; description: string; price: number; imageUrl: string }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  const canSubmit = name.trim().length > 0 && parseFloat(price) > 0;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Item Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jollof Rice"
          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details about the item"
          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40 resize-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Price (₦)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Image URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#4a9eff]/40"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-white/50 hover:text-white">Cancel</Button>
        <Button
          size="sm"
          disabled={!canSubmit || submitting}
          onClick={() => onSubmit({ name: name.trim(), description: description.trim(), price: parseFloat(price), imageUrl: imageUrl.trim() })}
          className="bg-[#4a9eff] hover:bg-[#3a8ef0] text-white gap-1.5"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Item
        </Button>
      </div>
    </div>
  );
}

export default function MarketplaceItemsModal({
  businessId,
  businessName,
  onClose,
}: {
  businessId: number;
  businessName: string;
  onClose: () => void;
}) {
  const { data: items, isLoading, refetch } = useListMarketplaceItemsForManagement(businessId);
  const createItem = useCreateMarketplaceItem();
  const updateItem = useUpdateMarketplaceItem();
  const deleteItem = useDeleteMarketplaceItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = async (data: { name: string; description: string; price: number; imageUrl: string }) => {
    await createItem.mutateAsync({
      businessId,
      data: {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        imageUrl: data.imageUrl || undefined,
      },
    });
    setShowAddForm(false);
    refetch();
  };

  const handleUpdate = async (id: number, data: { name: string; description: string; price: number; imageUrl: string }) => {
    await updateItem.mutateAsync({
      id,
      data: {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        imageUrl: data.imageUrl || undefined,
      },
    });
    setEditingId(null);
    refetch();
  };

  const handleToggleAvailable = async (item: MarketplaceItem) => {
    await updateItem.mutateAsync({ id: item.id, data: { isAvailable: !item.isAvailable } });
    refetch();
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteItem.mutateAsync({ id });
      refetch();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#4a9eff]" />
            <h2 className="font-bold text-white text-sm">Marketplace Items — {businessName}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-white/30 text-sm">Loading items...</div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No items listed yet</div>
          ) : (
            items.map((item) => (
              <div key={item.id}>
                {editingId === item.id ? (
                  <ItemForm
                    initial={item}
                    submitting={updateItem.isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(data) => handleUpdate(item.id, data)}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-white/20" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                        {!item.isAvailable && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400 flex-shrink-0">Hidden</span>
                        )}
                      </div>
                      <div className="text-xs text-white/50">{formatCurrency(item.price)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className="text-[11px] px-2 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                        title={item.isAvailable ? "Hide from storefront" : "Show on storefront"}
                      >
                        {item.isAvailable ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => setEditingId(item.id)} className="p-1.5 rounded-lg text-white/50 hover:text-[#4a9eff] hover:bg-white/10">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10"
                      >
                        {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {showAddForm ? (
            <ItemForm
              submitting={createItem.isPending}
              onCancel={() => setShowAddForm(false)}
              onSubmit={handleCreate}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-[#4a9eff] border border-dashed border-[#4a9eff]/30 hover:bg-[#4a9eff]/5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex justify-end flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white">Close</Button>
        </div>
      </motion.div>
    </div>
  );
}
