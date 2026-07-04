import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MarketplaceItem } from "@workspace/api-client-react";

interface CartLine {
  item: MarketplaceItem;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (item: MarketplaceItem) => void;
  removeItem: (itemId: number) => void;
  setQuantity: (itemId: number, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = (item: MarketplaceItem) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: number) => {
    setLines((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  const setQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setLines((prev) => prev.map((l) => (l.item.id === itemId ? { ...l, quantity } : l)));
  };

  const clear = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addItem, removeItem, setQuantity, clear, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
