import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListMarketplaceItems } from "@workspace/api-client-react";
import { ShoppingCart, Plus, Minus, Package, ImageIcon } from "lucide-react";
import { useCart, CartProvider } from "./CartContext";
import MarketplaceCheckoutModal from "./MarketplaceCheckoutModal";
import { formatCurrency } from "@/lib/utils";

function MarketplaceSectionInner({
  businessId,
  businessName,
  businessLat,
  businessLon,
}: {
  businessId: number;
  businessName: string;
  businessLat: number | null;
  businessLon: number | null;
}) {
  const { data: items, isLoading } = useListMarketplaceItems(businessId);
  const { lines, addItem, setQuantity, subtotal, itemCount } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const quantityFor = (itemId: number) => lines.find((l) => l.item.id === itemId)?.quantity ?? 0;

  if (isLoading) return null;
  if (!items || items.length === 0) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-[#4a9eff]" />
          <h3 className="font-bold text-white/90 text-sm uppercase tracking-wider">Order Online</h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const qty = quantityFor(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                  {item.description && <p className="text-xs text-white/40 truncate">{item.description}</p>}
                  <p className="text-sm font-bold text-[#4a9eff] mt-0.5">{formatCurrency(item.price)}</p>
                </div>
                {qty > 0 ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setQuantity(item.id, qty - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 text-white hover:bg-white/20">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-semibold text-white w-4 text-center">{qty}</span>
                    <button onClick={() => setQuantity(item.id, qty + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#4a9eff] text-white hover:bg-[#3a8ef0]">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => addItem(item)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#4a9eff]/15 text-[#4a9eff] hover:bg-[#4a9eff]/25 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1500] w-[calc(100%-2rem)] max-w-md"
          >
            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-[#4a9eff] hover:bg-[#3a8ef0] text-white transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart className="h-4 w-4" /> {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold">
                {formatCurrency(subtotal)} · Checkout
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <MarketplaceCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        businessId={businessId}
        businessName={businessName}
        businessLat={businessLat}
        businessLon={businessLon}
      />
    </>
  );
}

export default function MarketplaceSection(props: {
  businessId: number;
  businessName: string;
  businessLat: number | null;
  businessLon: number | null;
}) {
  return (
    <CartProvider>
      <MarketplaceSectionInner {...props} />
    </CartProvider>
  );
}
