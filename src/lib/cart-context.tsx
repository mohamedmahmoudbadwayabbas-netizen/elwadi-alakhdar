import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { playClickSound } from "@/lib/sounds";


export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  price_per_unit: number; // For is_by_weight: price per 1 KG. Otherwise: price per piece.
  old_price: number | null;
  image_url: string | null;
  is_by_weight: boolean;
  unit_label: string;
  is_popular: boolean;
  is_on_sale: boolean;
  is_featured?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
};

export type CartItem = {
  product: Product;
  /** قطعة count OR كجم weight (decimal) depending on is_by_weight */
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalPrice: number;
  totalCount: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "alwadi_cart_v1";

export function lineSubtotal(product: Product, quantity: number) {
  return product.price_per_unit * quantity;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    // Capture ?ref=... once for attribution
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) sessionStorage.setItem("alwadi_ref", ref.slice(0, 60));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      playClickSound();
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: +(i.quantity + quantity).toFixed(3) } : i,
          );
        }
        return [...prev, { product, quantity }];
      });
    };
    const updateQuantity = (productId: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.product.id !== productId)
          : prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
      );
    };
    const removeItem = (productId: string) =>
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    const clear = () => setItems([]);
    const totalPrice = items.reduce((s, i) => s + lineSubtotal(i.product, i.quantity), 0);
    const totalCount = items.reduce((s, i) => s + (i.product.is_by_weight ? 1 : i.quantity), 0);
    return { items, addItem, updateQuantity, removeItem, clear, totalPrice, totalCount, isOpen, setOpen };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
