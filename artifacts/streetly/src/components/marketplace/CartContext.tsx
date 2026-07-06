import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { MarketplaceItem } from "@workspace/api-client-react";

interface CartLine {
  item: MarketplaceItem;
  quantity: number;
}

type CartState = Record<number, CartLine[]>;

interface CartContextValue {
  getLines: (businessId: number) => CartLine[];
  addItem: (businessId: number, item: MarketplaceItem) => void;
  removeItem: (businessId: number, itemId: number) => void;
  setQuantity: (businessId: number, itemId: number, quantity: number) => void;
  clear: (businessId: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Global cart provider, keyed by businessId. This lets a customer navigate
 * between the mini marketplace preview (on the business profile page) and the
 * dedicated full-store view without losing what they've already added to
 * their cart for that business.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  const getLines = useCallback((businessId: number) => state[businessId] ?? [], [state]);

  const addItem = useCallback((businessId: number, item: MarketplaceItem) => {
    setState((prev) => {
      const lines = prev[businessId] ?? [];
      const existing = lines.find((l) => l.item.id === item.id);
      const nextLines = existing
        ? lines.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { item, quantity: 1 }];
      return { ...prev, [businessId]: nextLines };
    });
  }, []);

  const removeItem = useCallback((businessId: number, itemId: number) => {
    setState((prev) => ({
      ...prev,
      [businessId]: (prev[businessId] ?? []).filter((l) => l.item.id !== itemId),
    }));
  }, []);

  const setQuantity = useCallback((businessId: number, itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(businessId, itemId);
      return;
    }
    setState((prev) => ({
      ...prev,
      [businessId]: (prev[businessId] ?? []).map((l) => (l.item.id === itemId ? { ...l, quantity } : l)),
    }));
  }, [removeItem]);

  const clear = useCallback((businessId: number) => {
    setState((prev) => ({ ...prev, [businessId]: [] }));
  }, []);

  return (
    <CartContext.Provider value={{ getLines, addItem, removeItem, setQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(businessId: number) {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");

  const lines = ctx.getLines(businessId);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return {
    lines,
    addItem: (item: MarketplaceItem) => ctx.addItem(businessId, item),
    removeItem: (itemId: number) => ctx.removeItem(businessId, itemId),
    setQuantity: (itemId: number, quantity: number) => ctx.setQuantity(businessId, itemId, quantity),
    clear: () => ctx.clear(businessId),
    subtotal,
    itemCount,
  };
}
