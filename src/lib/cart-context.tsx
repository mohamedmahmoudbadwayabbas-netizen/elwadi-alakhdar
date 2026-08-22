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
  /** الخصائص والمميزات الفنية والغذائية */
  characteristics?: string[] | string | null;
  /** طريقة الحفظ والتخزين */
  storage_instructions?: string | null;
  storageInstructions?: string | null;
  /** المصدر وبلد المنشأ */
  origin_source?: string | null;
  originSource?: string | null;
  /** القيم والحقائق الغذائية */
  nutritional_info?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fiber?: string;
    fats?: string;
  } | string | null;
  nutritionalInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fiber?: string;
    fats?: string;
  } | string | null;
};

export type SubstitutionPreference = "call_me" | "auto_best" | "do_not_substitute";

export type CartItem = {
  product: Product;
  /** قطعة count OR كجم weight (decimal) depending on is_by_weight */
  quantity: number;
  /** الوزن المحدد بالكيلوجرام إذا كان المنتج بالوزن (مثال: 0.25، 0.5، 0.75، 1، 1.5) */
  selected_weight?: number;
  /** نص وصفي للوزن (مثال: "250 جم" أو "1 كجم") */
  selected_weight_label?: string;
  /** خيار تفضيل الاستبدال الخاص بهذا المنتج تحديداً */
  substitution_preference?: SubstitutionPreference;
  /** السعر المقدر المحسوب ديناميكياً بناءً على الوزن أو الكمية */
  estimated_price?: number;
};

export type SavedShoppingList = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  items: CartItem[];
  total_estimated_price: number;
  total_items_count: number;
};

export const WEIGHT_OPTIONS = [
  { value: 0.25, label: "250 جم", grams: 250 },
  { value: 0.5, label: "500 جم", grams: 500 },
  { value: 0.75, label: "750 جم", grams: 750 },
  { value: 1.0, label: "1 كجم", grams: 1000 },
  { value: 1.5, label: "1.5 كجم", grams: 1500 },
] as const;

export function formatWeightLabel(weightInKg: number): string {
  if (weightInKg >= 1) {
    return Number.isInteger(weightInKg) ? `${weightInKg} كجم` : `${weightInKg.toFixed(2)} كجم`;
  }
  return `${Math.round(weightInKg * 1000)} جم`;
}

export function calculateEstimatedPrice(product: Product, quantityOrWeight: number): number {
  return +(product.price_per_unit * quantityOrWeight).toFixed(2);
}

type AddItemMeta = {
  selected_weight?: number;
  selected_weight_label?: string;
  substitution_preference?: SubstitutionPreference;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, meta?: AddItemMeta) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPreference: (productId: string, preference: SubstitutionPreference) => void;
  updateItemWeight: (productId: string, weightInKg: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalPrice: number;
  totalCount: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  isMerging: boolean;
  // Recurring Shopping Lists
  savedLists: SavedShoppingList[];
  saveCurrentCartAsList: (listName: string) => SavedShoppingList | null;
  loadSavedList: (listId: string, mode?: "replace" | "append") => boolean;
  deleteSavedList: (listId: string) => void;
  renameSavedList: (listId: string, newName: string) => void;
  refreshSavedLists: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_STORAGE_KEY = "alwadi_cart_v1";
const SAVED_LISTS_STORAGE_KEY = "alwadi_saved_shopping_lists";
const getUserStorageKey = (uid: string) => `alwadi_cart_user_${uid}`;

export function lineSubtotal(product: Product, quantity: number) {
  return +(product.price_per_unit * quantity).toFixed(2);
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
        map.set(item.product.id, {
          ...existing,
          quantity: newQty,
          selected_weight: item.product.is_by_weight ? newQty : existing.selected_weight,
          selected_weight_label: item.product.is_by_weight
            ? formatWeightLabel(newQty)
            : existing.selected_weight_label,
          substitution_preference:
            item.substitution_preference || existing.substitution_preference || "call_me",
          estimated_price: calculateEstimatedPrice(item.product, newQty),
        });
      } else {
        map.set(item.product.id, { ...item });
      }
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedLists, setSavedLists] = useState<SavedShoppingList[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);

  // Load recurring lists from localStorage
  const refreshSavedLists = () => {
    try {
      const raw = localStorage.getItem(SAVED_LISTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedLists(parsed);
          return;
        }
      }
    } catch {}
    setSavedLists([]);
  };

  useEffect(() => {
    refreshSavedLists();
  }, []);

  // Save updated lists to localStorage
  const persistSavedLists = (newList: SavedShoppingList[]) => {
    setSavedLists(newList);
    try {
      localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

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
    const addItem = (product: Product, quantity = 1, meta?: AddItemMeta) => {
      playClickSound();
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        const resolvedWeight =
          meta?.selected_weight ?? (product.is_by_weight ? quantity : undefined);
        const resolvedWeightLabel =
          meta?.selected_weight_label ??
          (product.is_by_weight ? formatWeightLabel(quantity) : undefined);
        const resolvedPref =
          meta?.substitution_preference ?? existing?.substitution_preference ?? "call_me";

        if (existing) {
          const newQty = +(existing.quantity + quantity).toFixed(3);
          return prev.map((i) =>
            i.product.id === product.id
              ? {
                  ...i,
                  quantity: newQty,
                  selected_weight: product.is_by_weight ? newQty : i.selected_weight,
                  selected_weight_label: product.is_by_weight
                    ? formatWeightLabel(newQty)
                    : i.selected_weight_label,
                  substitution_preference:
                    meta?.substitution_preference ?? i.substitution_preference ?? "call_me",
                  estimated_price: calculateEstimatedPrice(product, newQty),
                }
              : i,
          );
        }

        const newItem: CartItem = {
          product,
          quantity,
          selected_weight: resolvedWeight,
          selected_weight_label: resolvedWeightLabel,
          substitution_preference: resolvedPref,
          estimated_price: calculateEstimatedPrice(product, quantity),
        };
        return [...prev, newItem];
      });
    };

    const updateQuantity = (productId: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.product.id !== productId)
          : prev.map((i) =>
              i.product.id === productId
                ? {
                    ...i,
                    quantity,
                    selected_weight: i.product.is_by_weight ? quantity : i.selected_weight,
                    selected_weight_label: i.product.is_by_weight
                      ? formatWeightLabel(quantity)
                      : i.selected_weight_label,
                    estimated_price: calculateEstimatedPrice(i.product, quantity),
                  }
                : i,
            ),
      );
    };

    const updateItemPreference = (productId: string, preference: SubstitutionPreference) => {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, substitution_preference: preference } : i,
        ),
      );
    };

    const updateItemWeight = (productId: string, weightInKg: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity: weightInKg,
                selected_weight: weightInKg,
                selected_weight_label: formatWeightLabel(weightInKg),
                estimated_price: calculateEstimatedPrice(i.product, weightInKg),
              }
            : i,
        ),
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

    // Save cart as a recurring list
    const saveCurrentCartAsList = (listName: string): SavedShoppingList | null => {
      if (items.length === 0) {
        toast.error("السلة فارغة! أضف منتجات أولاً لحفظها كقائمة");
        return null;
      }
      const trimmedName = listName.trim() || "قائمتي الدورية 📋";
      const totalEst = items.reduce(
        (sum, item) => sum + lineSubtotal(item.product, item.quantity),
        0,
      );

      const newList: SavedShoppingList = {
        id: `list-${Date.now()}`,
        name: trimmedName,
        created_at: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(items)),
        total_estimated_price: +totalEst.toFixed(2),
        total_items_count: items.length,
      };

      const updated = [newList, ...savedLists.filter((l) => l.name !== trimmedName)];
      persistSavedLists(updated);
      toast.success(`تم حفظ السلة كقائمة "${trimmedName}" بنجاح 📋✨`, {
        description: `تحتوي على ${items.length} منتج بإجمالي ${totalEst.toFixed(2)} ج.م`,
      });
      return newList;
    };

    // Load saved list into cart
    const loadSavedList = (listId: string, mode: "replace" | "append" = "replace"): boolean => {
      const target = savedLists.find((l) => l.id === listId);
      if (!target || target.items.length === 0) {
        toast.error("القائمة المطلوبة غير موجودة أو فارغة");
        return false;
      }

      playClickSound();
      if (mode === "replace") {
        setItems(JSON.parse(JSON.stringify(target.items)));
      } else {
        setItems((prev) => mergeCartItems(prev, target.items));
      }

      toast.success(`تم استرجاع قائمة "${target.name}" إلى السلة 🛒✨`, {
        description: `تمت إضافة ${target.items.length} منتج بنجاح`,
      });
      setOpen(true);
      return true;
    };

    const deleteSavedList = (listId: string) => {
      const target = savedLists.find((l) => l.id === listId);
      const updated = savedLists.filter((l) => l.id !== listId);
      persistSavedLists(updated);
      toast.success(`تم حذف قائمة "${target?.name || "التسوق"}" 🗑️`);
    };

    const renameSavedList = (listId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      const updated = savedLists.map((l) =>
        l.id === listId ? { ...l, name: trimmed, updated_at: new Date().toISOString() } : l,
      );
      persistSavedLists(updated);
      toast.success("تم تحديث اسم القائمة بنجاح ✏️");
    };

    return {
      items,
      addItem,
      updateQuantity,
      updateItemPreference,
      updateItemWeight,
      removeItem,
      clear,
      totalPrice,
      totalCount,
      isOpen,
      setOpen,
      isMerging,
      savedLists,
      saveCurrentCartAsList,
      loadSavedList,
      deleteSavedList,
      renameSavedList,
      refreshSavedLists,
    };
  }, [items, isOpen, isMerging, userId, savedLists]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
