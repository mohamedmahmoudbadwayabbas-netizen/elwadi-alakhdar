import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { playClickSound } from "@/lib/sounds";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  /** إحصاءات المنتج ونصيحة الطبخ (تغذية مرنة للواجهة) */
  views_count?: number | null;
  purchase_count?: number | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  cooking_tip?: string | null;
  is_top_seller?: boolean | null;
  viewsCount?: number | null;
  purchaseCount?: number | null;
  avgRating?: number | null;
  reviewsCount?: number | null;
  cookingTip?: string | null;
  isTopSeller?: boolean | null;
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
  isMerging: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_STORAGE_KEY = "alwadi_cart_v1";
const getUserStorageKey = (uid: string) => `alwadi_cart_user_${uid}`;

export function lineSubtotal(product: Product, quantity: number) {
  return product.price_per_unit * quantity;
}

/** Merges guest cart items with user's existing cart items (sums duplicate product quantities) */
function mergeCartItems(userItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of userItems) {
    if (item && item.product && item.product.id) {
      map.set(item.product.id, { ...item });
    }
  }

  for (const item of guestItems) {
    if (item && item.product && item.product.id) {
      const existing = map.get(item.product.id);
      if (existing) {
        const newQty = +(existing.quantity + item.quantity).toFixed(3);
        map.set(item.product.id, { ...existing, quantity: newQty });
      } else {
        map.set(item.product.id, { ...item });
      }
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);

  // Capture referral attribution parameter once
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) sessionStorage.setItem("alwadi_ref", ref.slice(0, 60));
    } catch {}
  }, []);

  // Listen to Supabase Auth state changes & manage cart merging
  useEffect(() => {
    let active = true;

    // Initial session load
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const uid = data.session?.user.id ?? null;
      currentUserIdRef.current = uid;
      setUserId(uid);

      if (uid) {
        // Load user cart & merge guest cart if exists
        loadAndMergeUserCart(uid);
      } else {
        // Load guest cart
        try {
          const raw = localStorage.getItem(GUEST_STORAGE_KEY);
          if (raw) setItems(JSON.parse(raw));
        } catch {}
        setHydrated(true);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const newUid = session?.user.id ?? null;
      const prevUid = currentUserIdRef.current;
      currentUserIdRef.current = newUid;
      setUserId(newUid);

      if (event === "SIGNED_IN" && newUid) {
        loadAndMergeUserCart(newUid);
      } else if (event === "SIGNED_OUT") {
        // Load guest cart on logout
        try {
          const raw = localStorage.getItem(GUEST_STORAGE_KEY);
          setItems(raw ? JSON.parse(raw) : []);
        } catch {
          setItems([]);
        }
      }
    });

    return () => {
      active = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const loadAndMergeUserCart = (uid: string) => {
    setIsMerging(true);
    let guestCart: CartItem[] = [];
    try {
      const guestRaw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestRaw) guestCart = JSON.parse(guestRaw);
    } catch {}

    let userCart: CartItem[] = [];
    try {
      const userRaw = localStorage.getItem(getUserStorageKey(uid));
      if (userRaw) userCart = JSON.parse(userRaw);
    } catch {}

    if (guestCart.length > 0) {
      // Merge guest items into user cart
      const merged = mergeCartItems(userCart, guestCart);
      setItems(merged);
      try {
        localStorage.setItem(getUserStorageKey(uid), JSON.stringify(merged));
        // Clear guest cart to avoid re-merging
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {}

      toast.success("تم دمج سلة التسوق مع حسابك الشخصي بنجاح 🛒✨", {
        description: `تم حفظ ${merged.length} منتج في حسابك.`,
      });
    } else {
      setItems(userCart);
    }

    setHydrated(true);
    setIsMerging(false);
  };

  // Persist cart items whenever items or userId changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (userId) {
        localStorage.setItem(getUserStorageKey(userId), JSON.stringify(items));
      } else {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
      }
    } catch {}
  }, [items, hydrated, userId]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      playClickSound();
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: +(i.quantity + quantity).toFixed(3) }
              : i,
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

    const clear = () => {
      setItems([]);
      try {
        if (userId) localStorage.removeItem(getUserStorageKey(userId));
        else localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {}
    };

    const totalPrice = items.reduce((s, i) => s + lineSubtotal(i.product, i.quantity), 0);
    const totalCount = items.reduce((s, i) => s + (i.product.is_by_weight ? 1 : i.quantity), 0);

    return {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      totalPrice,
      totalCount,
      isOpen,
      setOpen,
      isMerging,
    };
  }, [items, isOpen, isMerging, userId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
