import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { StoreBranch, Product, Order, StoreSettings } from "./types";
import { INITIAL_STORE_SETTINGS } from "./seed-data";

// In-Memory & LocalStorage Cache for instant reactive rendering & offline tolerance
const STORAGE_KEY_BRANCHES = "alwadi_firestore_branches_v1";
const STORAGE_KEY_PRODUCTS = "alwadi_firestore_products_v1";
const STORAGE_KEY_ORDERS = "alwadi_firestore_orders_v1";
const STORAGE_KEY_SETTINGS = "alwadi_firestore_settings_v1";

function loadFromLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function saveToLocal<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────
// 1. BRANCHES REPOSITORY
// ─────────────────────────────────────────────────────────────
export async function getBranches(): Promise<StoreBranch[]> {
  try {
    const snap = await getDocs(collection(db, "branches"));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StoreBranch));
      saveToLocal(STORAGE_KEY_BRANCHES, list);
      return list;
    }
  } catch (e) {
    console.warn("Firestore getBranches fallback to local:", e);
  }

  const cached = loadFromLocal<StoreBranch[]>(STORAGE_KEY_BRANCHES, []);
  return cached;
}

export async function getBranchById(branchId: string): Promise<StoreBranch | null> {
  const branches = await getBranches();
  return branches.find((b) => b.id === branchId) || null;
}

export async function updateBranchStatus(
  branchId: string,
  status: "open" | "busy" | "closed",
): Promise<boolean> {
  try {
    const branchRef = doc(db, "branches", branchId);
    await updateDoc(branchRef, { status, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn("Firestore updateBranchStatus local fallback:", e);
  }

  // Update local cache
  const list = loadFromLocal<StoreBranch[]>(STORAGE_KEY_BRANCHES, []);
  const updated = list.map((b) => (b.id === branchId ? { ...b, status } : b));
  saveToLocal(STORAGE_KEY_BRANCHES, updated);
  return true;
}

// ─────────────────────────────────────────────────────────────
// 2. PRODUCTS REPOSITORY (MULTI-BRANCH CATALOG)
// ─────────────────────────────────────────────────────────────
export async function getProducts(branchId?: string): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      saveToLocal(STORAGE_KEY_PRODUCTS, list);
      if (branchId && branchId !== "all") {
        return list.filter((p) => p.branchInventory?.[branchId]?.isAvailable !== false);
      }
      return list;
    }
  } catch (e) {
    console.warn("Firestore getProducts fallback to local:", e);
  }

  const cached = loadFromLocal<Product[]>(STORAGE_KEY_PRODUCTS, []);
  if (branchId && branchId !== "all") {
    return cached.filter((p) => p.branchInventory?.[branchId]?.isAvailable !== false);
  }
  return cached;
}

export async function saveProduct(product: Product): Promise<boolean> {
  try {
    const ref = doc(db, "products", product.id);
    await setDoc(ref, { ...product, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("Firestore saveProduct fallback:", e);
  }

  const list = loadFromLocal<Product[]>(STORAGE_KEY_PRODUCTS, []);
  const exists = list.some((p) => p.id === product.id);
  const updated = exists ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list];
  saveToLocal(STORAGE_KEY_PRODUCTS, updated);
  return true;
}

export async function updateBranchStock(
  productId: string,
  branchId: string,
  newStock: number,
): Promise<boolean> {
  const products = await getProducts();
  const prod = products.find((p) => p.id === productId);
  if (!prod) return false;

  const currentInv = prod.branchInventory || {};
  const branchInv = currentInv[branchId] || {
    branchId,
    stockQuantity: 0,
    lowStockThreshold: 10,
    isAvailable: true,
  };

  branchInv.stockQuantity = newStock;
  branchInv.isAvailable = newStock > 0;
  currentInv[branchId] = branchInv;
  prod.branchInventory = currentInv;

  return saveProduct(prod);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (e) {
    console.warn("Firestore deleteProduct fallback:", e);
  }

  const list = loadFromLocal<Product[]>(STORAGE_KEY_PRODUCTS, []);
  const updated = list.filter((p) => p.id !== productId);
  saveToLocal(STORAGE_KEY_PRODUCTS, updated);
  return true;
}

// ─────────────────────────────────────────────────────────────
// 3. ORDERS REPOSITORY (MULTI-BRANCH ORDER SYSTEM)
// ─────────────────────────────────────────────────────────────
export async function getOrders(branchId?: string): Promise<Order[]> {
  try {
    let q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    if (branchId && branchId !== "all") {
      q = query(collection(db, "orders"), where("branchId", "==", branchId), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      saveToLocal(STORAGE_KEY_ORDERS, list);
      return list;
    }
  } catch (e) {
    console.warn("Firestore getOrders fallback to local:", e);
  }

  const cached = loadFromLocal<Order[]>(STORAGE_KEY_ORDERS, []);
  if (branchId && branchId !== "all") {
    return cached.filter((o) => o.branchId === branchId);
  }
  return cached;
}

export async function createOrder(order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
  const orderNumber = `ALWADI-${Math.floor(100000 + Math.random() * 900000)}`;
  const id = `order-${Date.now()}`;
  const now = new Date().toISOString();

  const fullOrder: Order = {
    ...order,
    id,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, "orders", id), fullOrder);
  } catch (e) {
    console.warn("Firestore createOrder local fallback:", e);
  }

  const list = loadFromLocal<Order[]>(STORAGE_KEY_ORDERS, []);
  saveToLocal(STORAGE_KEY_ORDERS, [fullOrder, ...list]);
  return fullOrder;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  driverInfo?: { driverId?: string; driverName?: string; driverPhone?: string },
): Promise<boolean> {
  const updates: Partial<Order> = {
    status,
    updatedAt: new Date().toISOString(),
    ...(driverInfo || {}),
  };

  try {
    await updateDoc(doc(db, "orders", orderId), updates);
  } catch (e) {
    console.warn("Firestore updateOrderStatus fallback:", e);
  }

  const list = loadFromLocal<Order[]>(STORAGE_KEY_ORDERS, []);
  const updated = list.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
  saveToLocal(STORAGE_KEY_ORDERS, updated);
  return true;
}

// ─────────────────────────────────────────────────────────────
// 4. STORE SETTINGS & MULTI-BRANCH CONFIG
// ─────────────────────────────────────────────────────────────
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(doc(db, "store_settings", "chain_config"));
    if (snap.exists()) {
      const data = snap.data() as StoreSettings;
      saveToLocal(STORAGE_KEY_SETTINGS, data);
      return data;
    }
  } catch (e) {
    console.warn("Firestore getStoreSettings fallback:", e);
  }

  return loadFromLocal<StoreSettings>(STORAGE_KEY_SETTINGS, INITIAL_STORE_SETTINGS);
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated: StoreSettings = { ...current, ...settings };

  try {
    await setDoc(doc(db, "store_settings", "chain_config"), updated, { merge: true });
  } catch (e) {
    console.warn("Firestore updateStoreSettings fallback:", e);
  }

  saveToLocal(STORAGE_KEY_SETTINGS, updated);
  return updated;
}
