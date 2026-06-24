import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
};

export type CartItem = {
  product: Product;
  /** قطعة count OR كجم weight (decimal) depending on is_by_weight */
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => { success: boolean; error?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; error?: string };
  removeItem: (productId: string) => boolean;
  clear: () => boolean;
  totalPrice: number;
  totalCount: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "alwadi_cart_v1";
const MIN_QUANTITY = 0.001; // Minimum for weighted items (1 gram)
const MAX_QUANTITY = 1000; // Maximum quantity per item

/**
 * Calculate the subtotal for a cart item
 * @param product The product
 * @param quantity The quantity (count or weight in kg)
 * @returns The subtotal price
 */
export function lineSubtotal(product: Product, quantity: number): number {
  return product.price_per_unit * quantity;
}

/**
 * Validate and normalize quantity
 * @param quantity The quantity to validate
 * @param isByWeight Whether the product is sold by weight
 * @returns Normalized quantity or error message
 */
function validateQuantity(
  quantity: number,
  isByWeight: boolean
): { valid: boolean; value?: number; error?: string } {
  if (isNaN(quantity) || !isFinite(quantity)) {
    return { valid: false, error: "كمية غير صحيحة" };
  }

  if (isByWeight) {
    // Weighted items: allow decimals (e.g., 0.5 kg, 2.3 kg)
    if (quantity < MIN_QUANTITY) {
      return { valid: false, error: `الحد الأدنى: ${MIN_QUANTITY * 1000} غرام` };
    }
    if (quantity > MAX_QUANTITY) {
      return { valid: false, error: `الحد الأقصى: ${MAX_QUANTITY} كغ` };
    }
    // Round to 3 decimal places (grams precision)
    return { valid: true, value: Math.round(quantity * 1000) / 1000 };
  } else {
    // Piece items: must be integer
    const intQty = Math.floor(quantity);
    if (intQty < 1) {
      return { valid: false, error: "يجب أن تكون الكمية 1 على الأقل" };
    }
    if (intQty > MAX_QUANTITY) {
      return { valid: false, error: `الحد الأقصى: ${MAX_QUANTITY} قطعة` };
    }
    return { valid: true, value: intQty };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        // Validate loaded items
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      toast.error("فشل في تحميل السلة");
    }

    // Capture ?ref=... once for attribution
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) sessionStorage.setItem("alwadi_ref", ref.slice(0, 60));
    } catch (error) {
      console.error("Failed to capture ref parameter:", error);
    }

    setHydrated(true);
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
      toast.error("فشل في حفظ السلة");
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    /**
     * Add an item to the cart
     */
    const addItem = (product: Product, quantity = 1) => {
      try {
        const validation = validateQuantity(quantity, product.is_by_weight);
        if (!validation.valid) {
          toast.error(validation.error || "كمية غير صحيحة");
          return { success: false, error: validation.error };
        }

        const validatedQty = validation.value!;

        setItems((prev) => {
          const existing = prev.find((i) => i.product.id === product.id);
          if (existing) {
            // Product already in cart: update quantity
            const newQty = existing.quantity + validatedQty;
            const newValidation = validateQuantity(newQty, product.is_by_weight);

            if (!newValidation.valid) {
              toast.error(newValidation.error || "تجاوز الحد الأقصى للكمية");
              return prev;
            }

            const updatedItems = prev.map((i) =>
              i.product.id === product.id ? { ...i, quantity: newValidation.value! } : i
            );
            toast.success(`تم تحديث "${product.name}"`);
            return updatedItems;
          }

          // New product: add to cart
          toast.success(`تم إضافة "${product.name}" إلى السلة`);
          return [...prev, { product, quantity: validatedQty }];
        });

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل في إضافة المنتج";
        toast.error(message);
        return { success: false, error: message };
      }
    };

    /**
     * Update the quantity of an item in the cart
     */
    const updateQuantity = (productId: string, quantity: number) => {
      try {
        const item = items.find((i) => i.product.id === productId);
        if (!item) {
          return { success: false, error: "المنتج غير موجود في السلة" };
        }

        const validation = validateQuantity(quantity, item.product.is_by_weight);
        if (!validation.valid) {
          toast.error(validation.error || "كمية غير صحيحة");
          return { success: false, error: validation.error };
        }

        const validatedQty = validation.value!;

        setItems((prev) => {
          if (validatedQty <= 0) {
            // Remove if quantity is 0 or less
            return prev.filter((i) => i.product.id !== productId);
          }
          return prev.map((i) =>
            i.product.id === productId ? { ...i, quantity: validatedQty } : i
          );
        });

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل في تحديث الكمية";
        toast.error(message);
        return { success: false, error: message };
      }
    };

    /**
     * Remove an item from the cart
     */
    const removeItem = (productId: string) => {
      try {
        const item = items.find((i) => i.product.id === productId);
        if (!item) {
          toast.error("المنتج غير موجود في السلة");
          return false;
        }

        setItems((prev) => prev.filter((i) => i.product.id !== productId));
        toast.success(`تم إزالة "${item.product.name}" من السلة`);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل في إزالة المنتج";
        toast.error(message);
        return false;
      }
    };

    /**
     * Clear all items from the cart
     */
    const clear = () => {
      try {
        setItems([]);
        toast.success("تم مسح السلة");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل في مسح السلة";
        toast.error(message);
        return false;
      }
    };

    // Calculate total price
    const totalPrice = items.reduce((sum, item) => sum + lineSubtotal(item.product, item.quantity), 0);

    /**
     * Calculate total count:
     * - For weighted items: sum of all weights (in kg)
     * - For count items: sum of all quantities
     * - This gives the total number of "units" in the cart
     */
    const totalCount = items.reduce((sum, item) => {
      if (item.product.is_by_weight) {
        // For weighted items, accumulate weight (already in kg)
        return sum + item.quantity;
      } else {
        // For count items, accumulate count
        return sum + item.quantity;
      }
    }, 0);

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
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
