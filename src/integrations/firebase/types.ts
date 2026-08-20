export interface StoreBranch {
  id: string;
  name: string;
  nameEn: string;
  code: "DOKKI_MAIN" | "NASR_CITY" | "MAADI";
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  status: "open" | "busy" | "closed";
  isMain: boolean;
  latitude: number;
  longitude: number;
  deliveryZones: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  metrics: {
    dailyRevenue: number;
    dailyOrders: number;
    activeOrders: number;
    lowStockCount: number;
  };
  managerName: string;
  managerEmail: string;
}

export interface BranchInventory {
  branchId: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  shelfLocation?: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  subCategory?: string;
  description: string;
  chefTips?: string; // نصيحة الشيف الذكية
  price: number;
  originalPrice?: number;
  unit: string;
  unitStep?: number;
  barcode?: string;
  sku?: string;
  imageUrl: string;
  images?: string[];
  isFeatured?: boolean;
  isOrganic?: boolean;
  discountPercentage?: number;
  rating?: number;
  ratingsCount?: number;
  nutritionInfo?: {
    calories?: number;
    protein?: string;
    fat?: string;
    carbs?: string;
  };
  // Multi-branch inventory mapping
  branchInventory: {
    [branchId: string]: BranchInventory;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  imageUrl?: string;
  substitutionPreference?: "contact_me" | "best_match" | "refund" | "do_not_substitute";
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    fullAddress: string;
    city: string;
    district: string;
    building?: string;
    floor?: string;
    apartment?: string;
    latitude?: number;
    longitude?: number;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "cash_on_delivery" | "card_on_delivery" | "online_card" | "vodafone_cash";
  paymentStatus: "unpaid" | "paid" | "refunded";
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  deliverySlot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeNameEn: string;
  chainName: string;
  totalBranches: number;
  primaryAdminEmail: string;
  currency: string;
  taxRate: number;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderAmount: number;
  supportPhone: string;
  supportWhatsApp: string;
  loyaltyPointsRatio: number;
  theme: {
    primaryColor: string;
    palette: string;
    fontFamily: string;
  };
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: "super_admin" | "branch_manager" | "staff";
  assignedBranchId?: string; // "all" for super_admin
  createdAt: string;
}
