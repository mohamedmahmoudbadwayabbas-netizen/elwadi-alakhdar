import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  price_per_unit: number;
  old_price: number | null;
  image_url: string | null;
  is_by_weight: boolean;
  unit_label: string;
  is_popular: boolean;
  is_on_sale: boolean;
};

export type CartItem = {
  product: Product;
  /** قطعة count OR كجم weight depending on is_by_weight */
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
  isAdmin: boolean;
  toggleAdmin: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "baraka_cart_v1";
const ADMIN_KEY = "baraka_dev_admin";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      setIsAdmin(localStorage.getItem(ADMIN_KEY) === "1");
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: +(i.quantity + quantity).toFixed(2) } : i,
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
    const totalPrice = items.reduce((s, i) => s + i.product.price_per_unit * i.quantity, 0);
    const totalCount = items.reduce((s, i) => s + (i.product.is_by_weight ? 1 : i.quantity), 0);
    const toggleAdmin = () => {
      setIsAdmin((v) => {
        const next = !v;
        try { localStorage.setItem(ADMIN_KEY, next ? "1" : "0"); } catch {}
        return next;
      });
    };
    return { items, addItem, updateQuantity, removeItem, clear, totalPrice, totalCount, isOpen, setOpen, isAdmin, toggleAdmin };
  }, [items, isOpen, isAdmin]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
