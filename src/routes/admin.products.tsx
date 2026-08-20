import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Star,
  Check,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  AlertTriangle,
  Tag,
  X,
  ImageIcon,
  RefreshCw,
  Package,
  ArrowUpDown,
  Eye,
  CheckSquare,
  Layers,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { COMPREHENSIVE_CATEGORIES, MOCK_PRODUCTS } from "@/lib/categories-data";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import { normalizeDigits } from "@/lib/i18n-context";
import { SmartProductCopywriterModal } from "@/components/admin/SmartProductCopywriterModal";
import { AdminAiImageGeneratorModal } from "@/components/admin/AdminAiImageGeneratorModal";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "إدارة المنتجات والمخزون — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_per_unit: number;
  old_price: number | null;
  image_url: string | null;
  is_by_weight: boolean;
  unit_label: string;
  is_popular: boolean;
  is_on_sale: boolean;
  is_featured: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  cooking_tip?: string | null;
  cookingTip?: string | null;
  views_count?: number | null;
  viewsCount?: number | null;
  purchase_count?: number | null;
  purchaseCount?: number | null;
  avg_rating?: number | null;
  avgRating?: number | null;
  reviews_count?: number | null;
  reviewsCount?: number | null;
  is_top_seller?: boolean | null;
  isTopSeller?: boolean | null;
};

type Category = { id: string; name: string };

type InlineCell = {
  id: string;
  field: "price_per_unit" | "stock_quantity";
  value: string;
} | null;

const emptyProduct: Partial<Product> = {
  name: "",
  description: "",
  category_id: null,
  price_per_unit: 0,
  old_price: null,
  image_url: null,
  is_by_weight: false,
  unit_label: "قطعة",
  is_popular: false,
  is_on_sale: false,
  is_featured: false,
  stock_quantity: 100,
  low_stock_threshold: 10,
  cooking_tip: "",
  cookingTip: "",
};

function normalizeNumber(v: string | number): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = parseFloat(normalizeDigits(String(v)).replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
}

interface ProductsPageProps {
  onGenerateCookingTip?: (productName?: string) => void;
}

function ProductsPage({ onGenerateCookingTip }: ProductsPageProps = {}) {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [copywriterModalOpen, setCopywriterModalOpen] = useState(false);
  const [aiImageModalOpen, setAiImageModalOpen] = useState(false);

  const syncStorefrontPreview = (prodId?: string) => {
    try {
      localStorage.removeItem("alwadi_products_cache");
    } catch {}
    queryClient.invalidateQueries({ queryKey: ["store-products"] });
    if (prodId) {
      queryClient.invalidateQueries({ queryKey: ["store-product", prodId] });
    }
  };

  // الفلاتر والبحث
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // التعديل المباشر في الجدول (In-line editing)
  const [inlineCell, setInlineCell] = useState<InlineCell>(null);
  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  // إدخال الكلمات المفتاحية / الوسوم (Tags)
  const [tagsInput, setTagsInput] = useState("");
  const [tagsList, setTagsList] = useState<string[]>([]);

  // جلب البيانات من Supabase
  const load = async () => {
    setLoading(true);
    let [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("sort_order"),
    ]);

    if (!p || p.length === 0 || !c || c.length === 0) {
      await autoSeedDatabaseIfNeeded();
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name").order("sort_order"),
      ]);
      p = pRes.data || [];
      c = cRes.data || [];
    }

    setProducts((p ?? []) as Product[]);
    const dbCats = (c ?? []) as Category[];
    if (dbCats.length > 0) {
      setCats(dbCats);
    } else {
      setCats(COMPREHENSIVE_CATEGORIES.map((cat) => ({ id: cat.id, name: cat.name })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // المزامنة عند فتح نافذة تعديل أو إضافة منتج
  useEffect(() => {
    if (editing) {
      if (editing.description && editing.description.includes("#وسوم:")) {
        const parts = editing.description.split("#وسوم:");
        const tags =
          parts[1]
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [];
        setTagsList(tags);
      } else {
        setTagsList([]);
      }
    }
  }, [editing?.id]);

  // إضافة وسم جديد
  const handleAddTag = () => {
    const trimmed = tagsInput.trim().replace(/^#/, "");
    if (trimmed && !tagsList.includes(trimmed)) {
      setTagsList([...tagsList, trimmed]);
      setTagsInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove));
  };

  // تصفية المنتجات الذكية
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // بحث الاسم أو الوصف
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // فلترة القسم
      const matchesCat = selectedCat === "all" || p.category_id === selectedCat;

      // فلترة المخزون
      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
      } else if (stockFilter === "out") {
        matchesStock = p.stock_quantity <= 0;
      } else if (stockFilter === "available") {
        matchesStock = p.stock_quantity > 0;
      } else if (stockFilter === "featured") {
        matchesStock = p.is_featured;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCat, stockFilter]);

  // إحصاءات سريعة
  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter(
      (p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0,
    ).length;
    const out = products.filter((p) => p.stock_quantity <= 0).length;
    const featured = products.filter((p) => p.is_featured).length;
    return { total, low, out, featured };
  }, [products]);

  // حفظ تعديل خلية السعر أو المخزون المباشر (In-line edit save)
  const saveInlineCell = async () => {
    if (!inlineCell) return;
    const { id, field, value } = inlineCell;
    const numValue = normalizeNumber(value);

    if (numValue < 0) {
      toast.error("القيمة لا يمكن أن تكون بالسالب");
      setInlineCell(null);
      return;
    }

    setSavingCellId(id);

    const updatePayload: any = { [field]: numValue };
    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);

    setSavingCellId(null);
    setInlineCell(null);

    if (error) {
      toast.error(`فشل التحديث: ${error.message}`);
    } else {
      // تحديث الحالة المحلية فورا
      setProducts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: numValue } : item)),
      );
      setRecentlySavedId(id);
      syncStorefrontPreview(id);
      toast.success(
        field === "price_per_unit" ? "تم تحديث السعر بنجاح ✨" : "تم تحديث كمية المخزون ✨",
      );
      setTimeout(() => setRecentlySavedId(null), 2500);
    }
  };

  // تبديل سريع للعرض الخاص (is_on_sale)
  const toggleOnSale = async (p: Product) => {
    const newVal = !p.is_on_sale;
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, is_on_sale: newVal } : item)),
    );

    const { error } = await supabase.from("products").update({ is_on_sale: newVal }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      load();
    } else {
      syncStorefrontPreview(p.id);
      toast.success(newVal ? "تم وضع علامة عرض خاص 🔥" : "تم إلغاء العرض الخاص");
    }
  };

  // توليد نصيحة طبخ بالذكاء الاصطناعي (محاكاة تفاعلية للـ UX)
  const handleGenerateCookingTip = async () => {
    if (!editing) return;
    setIsGeneratingTip(true);
    try {
      if (onGenerateCookingTip) {
        await Promise.resolve(onGenerateCookingTip(editing.name));
      }
      // محاكاة تأخير زمني للاستدعاء (~800ms) لإظهار الـ Loading state
      await new Promise((resolve) => setTimeout(resolve, 800));

      const productName = editing.name?.trim() || "هذا المنتج";
      const sampleTips = [
        `للحصول على ألذ نكهة لـ (${productName})، يُفضل غسله وتجفيفه بعناية قبل الطهي وإضافة لمسة من زيت الزيتون البكر والأعشاب الطازجة.`,
        `يُحفظ (${productName}) في مكان جاف وبارد، ويُفضل طهيه على نار هادئة لضمان النضج المثالي والاحتفاظ بالقيمة الغذائية العالية.`,
        `لأفضل قوام ونكهة غنية، انقع (${productName}) في تتبيلة الليمون والتوابل الخاصة لمدة 15 دقيقة قبل الشواء أو التقديم.`,
        `يُفضل تقديمه طازجاً مع رشة ملح بحري ورذاذ ليمون لتعزيز النكهة الطبيعية الشهية لـ (${productName}).`,
      ];
      const generatedPlaceholder = sampleTips[Math.floor(Math.random() * sampleTips.length)];

      setEditing((prev) =>
        prev
          ? {
              ...prev,
              cooking_tip: generatedPlaceholder,
              cookingTip: generatedPlaceholder,
            }
          : null,
      );
      toast.success("تم توليد نصيحة الطبخ بالذكاء الاصطناعي بنجاح ✨", {
        description: `تم إدراج النصيحة الخاصة بـ "${productName}" في الحقل لمعاينتها.`,
      });
    } catch {
      toast.error("تعذر توليد النصيحة في الوقت الحالي، يرجى المحاولة لاحقاً.");
    } finally {
      setIsGeneratingTip(false);
    }
  };

  // حفظ المنتج بالكامل (من النافذة المنبثقة)
  const saveFullProduct = async () => {
    if (!editing?.name?.trim()) {
      toast.error("اسم المنتج مطلوب");
      return;
    }

    if (!editing.category_id) {
      toast.error("يرجى اختيار القسم التابع له المنتج (إلزامي)");
      return;
    }

    const price = Number(editing.price_per_unit);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("السعر يجب أن يكون رقماً موجباً أكبر من الصفر");
      return;
    }

    if (editing.is_by_weight && !editing.unit_label?.trim()) {
      toast.error("يرجى كتابة وحدة الوزن (مثال: كجم، جرام)");
      return;
    }

    setSaving(true);

    // دمج الوسوم والكلمات المفتاحية في الوصف
    let finalDesc = (editing.description || "").split("#وسوم:")[0].trim();
    if (tagsList.length > 0) {
      finalDesc = `${finalDesc}\n\n#وسوم: ${tagsList.join(", ")}`.trim();
    }

    const payload = {
      name: editing.name.trim(),
      description: finalDesc || null,
      category_id: editing.category_id || null,
      price_per_unit: price,
      old_price: editing.old_price ? Number(editing.old_price) : null,
      image_url: editing.image_url || null,
      is_by_weight: !!editing.is_by_weight,
      unit_label: editing.unit_label || (editing.is_by_weight ? "كجم" : "قطعة"),
      is_popular: !!editing.is_popular,
      is_on_sale: !!editing.is_on_sale,
      is_featured: !!editing.is_featured,
      stock_quantity: Number(editing.stock_quantity ?? 0),
      low_stock_threshold: Number(editing.low_stock_threshold ?? 10),
      cooking_tip: (editing.cooking_tip || (editing as any).cookingTip || "").trim() || null,
      is_top_seller: !!(editing.is_top_seller ?? (editing as any).isTopSeller),
    };

    const res = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    toast.success(editing.id ? "تم تحديث بيانات المنتج بنجاح ✨" : "تمت إضافة المنتج بنجاح 🎉");
    const savedId = editing.id;
    setEditing(null);
    syncStorefrontPreview(savedId);
    load();
  };

  // حذف منتج
  const removeProduct = async (id: string, name: string) => {
    if (!confirm(`هل أنت تأكد من حذف المنتج "${name}" نهائياً؟`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم حذف المنتج");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      syncStorefrontPreview(id);
    }
  };

  // رفع الصورة مع دعم Drag & Drop
  const processImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (error) {
      toast.error(`خطأ أثناء رفع الصورة: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);

    let finalUrl = publicData?.publicUrl;

    if (!finalUrl) {
      const { data: signData } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      finalUrl = signData?.signedUrl || "";
    }

    setEditing((e) => ({ ...(e ?? {}), image_url: finalUrl }));
    setUploading(false);
    toast.success("تمت المعاينة ورفع الصورة بنجاح 🖼️");
  };

  // معالجة السحب والإفلات
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 p-4 sm:p-6"
    >
      {/* رأس الصفحة والملاحظات الإحصائية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black text-foreground">
              إدارة المنتجات والمخزون 📦
            </h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              تعديل مباشر متاح
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            انقر مرتين (Double Click) على السعر أو المخزون للتعديل السريع المباشر في الجدول
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing({ ...emptyProduct });
            setTagsList([]);
          }}
          className="rounded-2xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-4 w-4" /> إضافة منتج جديد
        </Button>
      </div>

      {/* بطاقات الإحصاءات السريعة للمخزون */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground">إجمالي المنتجات</div>
            <div className="text-xl font-black text-foreground mt-0.5">{stats.total}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground">الأكثر مبيعاً</div>
            <div className="text-xl font-black text-amber-500 mt-0.5">{stats.featured}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 fill-amber-500/20" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground">مخزون منخفض</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.low}
            </div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-bold text-muted-foreground">نفد من المخزون</div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{stats.out}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
            <X className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* شريط البحث والفلترة المتقدم */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card/60 p-3 rounded-2xl border border-border shadow-xs">
        {/* بحث بالاسم والوصف */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المنتج أو الكلمات المفتاحية..."
            className="ps-9 pe-9 h-10 rounded-xl text-xs font-bold bg-background/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* فلترة القسم */}
        <div className="w-full sm:w-48">
          <Select value={selectedCat} onValueChange={setSelectedCat}>
            <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-background/80">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">
                جميع الأقسام ({products.length})
              </SelectItem>
              {cats.map((c) => (
                <SelectItem key={c.id} value={c.id} className="font-bold">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلترة حالة المخزون */}
        <div className="w-full sm:w-40">
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-background/80">
              <SelectValue placeholder="حالة المخزون" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold">
                كل الحالات
              </SelectItem>
              <SelectItem value="available" className="font-bold text-emerald-600">
                متوفر بالمتجر
              </SelectItem>
              <SelectItem value="low" className="font-bold text-amber-600">
                مخزون منخفض ⚠️
              </SelectItem>
              <SelectItem value="out" className="font-bold text-rose-600">
                نفد المخزون ❌
              </SelectItem>
              <SelectItem value="featured" className="font-bold text-amber-500">
                الأكثر مبيعاً ⭐
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* إعادة تنشيط */}
        <Button
          variant="outline"
          size="icon"
          onClick={load}
          title="تحديث البيانات"
          className="h-10 w-10 rounded-xl shrink-0 border-border bg-background"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      {/* جدول المنتجات المطور */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/60 text-xs font-extrabold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 text-start">تفاصيل المنتج</th>
                <th className="p-3.5 text-start">القسم</th>
                <th className="p-3.5 text-start min-w-[120px]">
                  السعر{" "}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    (نقر مزدوج للتعديل)
                  </span>
                </th>
                <th className="p-3.5 text-start min-w-[110px]">
                  المخزون{" "}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    (نقر مزدوج)
                  </span>
                </th>
                <th className="p-3.5 text-center">أكثر مبيعاً</th>
                <th className="p-3.5 text-center">عرض خاص</th>
                <th className="p-3.5 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.map((p, idx) => {
                const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
                const isOut = p.stock_quantity <= 0;
                const catName = cats.find((c) => c.id === p.category_id)?.name || "بدون قسم";
                const isRecentlySaved = recentlySavedId === p.id;

                const isEditingPrice =
                  inlineCell?.id === p.id && inlineCell.field === "price_per_unit";
                const isEditingStock =
                  inlineCell?.id === p.id && inlineCell.field === "stock_quantity";

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className={`group transition-colors ${
                      isRecentlySaved
                        ? "bg-emerald-500/10 dark:bg-emerald-950/40"
                        : "hover:bg-secondary/40"
                    }`}
                  >
                    {/* تفاصيل المنتج والصورة */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-secondary/80">
                          {p.image_url ? (
                            <img src={p.image_url} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xl">🌿</div>
                          )}
                          {p.is_on_sale && (
                            <span className="absolute top-0 end-0 bg-rose-500 text-white text-[9px] font-black px-1 rounded-bs-lg">
                              خصم
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-black text-sm text-foreground flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isRecentlySaved && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/20 px-1.5 py-0.2 rounded-full animate-bounce">
                                <Check className="h-3 w-3" /> تم الحفظ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2 mt-0.5">
                            <span className="bg-secondary px-2 py-0.5 rounded-md text-[10px]">
                              {p.is_by_weight ? `موزون (${p.unit_label})` : p.unit_label || "قطعة"}
                            </span>
                            {p.old_price && (
                              <span className="line-through text-rose-500/80 font-bold">
                                {p.old_price} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* القسم */}
                    <td className="p-3.5">
                      <span className="inline-block text-xs font-bold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-xl border border-border/50">
                        {catName}
                      </span>
                    </td>

                    {/* السعر مع إمكانية التعديل السريع المباشر (In-line Edit) */}
                    <td
                      className="p-3.5 cursor-pointer select-none"
                      onDoubleClick={() =>
                        setInlineCell({
                          id: p.id,
                          field: "price_per_unit",
                          value: String(p.price_per_unit),
                        })
                      }
                      title="انقر مرتين لتعديل السعر مباشرة"
                    >
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            type="number"
                            step="0.1"
                            value={inlineCell.value}
                            onChange={(e) =>
                              setInlineCell({ ...inlineCell, value: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineCell();
                              if (e.key === "Escape") setInlineCell(null);
                            }}
                            onBlur={saveInlineCell}
                            className="h-8 w-24 text-xs font-black rounded-lg border-emerald-500 focus-visible:ring-emerald-500"
                          />
                          {savingCellId === p.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                          )}
                        </div>
                      ) : (
                        <div className="group-hover:text-primary transition-colors flex items-center gap-1 font-black text-sm text-foreground">
                          <span>{p.price_per_unit.toFixed(2)} ج.م</span>
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 text-muted-foreground" />
                        </div>
                      )}
                    </td>

                    {/* كمية المخزون مع إمكانية التعديل المباشر (In-line Edit) */}
                    <td
                      className="p-3.5 cursor-pointer select-none"
                      onDoubleClick={() =>
                        setInlineCell({
                          id: p.id,
                          field: "stock_quantity",
                          value: String(p.stock_quantity),
                        })
                      }
                      title="انقر مرتين لتعديل كمية المخزون مباشرة"
                    >
                      {isEditingStock ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            type="number"
                            value={inlineCell.value}
                            onChange={(e) =>
                              setInlineCell({ ...inlineCell, value: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineCell();
                              if (e.key === "Escape") setInlineCell(null);
                            }}
                            onBlur={saveInlineCell}
                            className="h-8 w-20 text-xs font-black rounded-lg border-emerald-500 focus-visible:ring-emerald-500"
                          />
                          {savingCellId === p.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span
                            className={
                              isOut
                                ? "text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md font-black"
                                : isLow
                                  ? "text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md font-black"
                                  : "text-foreground"
                            }
                          >
                            {p.stock_quantity}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] text-rose-600 font-extrabold">نفد</span>
                          ) : isLow ? (
                            <span className="text-[10px] text-amber-600 font-extrabold">منخفض</span>
                          ) : null}
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 text-muted-foreground ms-1" />
                        </div>
                      )}
                    </td>

                    {/* حالة الأكثر مبيعاً (قراءة تلقائية بدون زر يدوي) */}
                    <td className="p-3.5 text-center">
                      {Boolean(p.is_top_seller || p.isTopSeller || p.is_featured) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] px-2 py-0.5 border border-amber-500/20 shadow-2xs"
                          title="شارة الأكثر مبيعاً (تلقائية)"
                        >
                          <Flame className="h-3 w-3 fill-amber-500/20 text-amber-500" /> أكثر مبيعاً
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40 font-medium">—</span>
                      )}
                    </td>

                    {/* مفتاح العرض الخاص (Sale Toggle) */}
                    <td className="p-3.5 text-center">
                      <Switch checked={p.is_on_sale} onCheckedChange={() => toggleOnSale(p)} />
                    </td>

                    {/* الإجراءات */}
                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(p)}
                          className="h-8 w-8 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600"
                          title="تعديل تفاصيل المنتج"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(p.id, p.name)}
                          className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-rose-600"
                          title="حذف المنتج"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-xs font-bold text-muted-foreground"
                  >
                    لا توجد منتجات تطابق معايير البحث والفلترة 🍃
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة إضافة / تعديل المنتج مع Drag & Drop ومنطقة الرفع والوسوم */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent
          className="max-h-[92vh] max-w-2xl overflow-y-auto bg-card backdrop-blur-md rounded-3xl p-6 border-border"
          dir="rtl"
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 pb-3">
            <DialogTitle className="font-display text-lg font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>{editing?.id ? "تعديل تفاصيل المنتج" : "إضافة منتج جديد للمتجر"}</span>
            </DialogTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopywriterModalOpen(true)}
              className="h-8 rounded-xl text-xs font-black gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>كاتب أوصاف AI ✍️</span>
            </Button>
          </DialogHeader>

          {editing && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {/* اسم المنتج */}
              <Field label="اسم المنتج (مطلوب)" full>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="مثال: خيار بلدي طازج"
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </Field>

              {/* اختيار القسم الإلزامي */}
              <Field label="القسم التابع له المنتج (إلزامي)" full>
                <Select
                  value={editing.category_id ?? "__none__"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, category_id: v === "__none__" ? null : v })
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl font-bold text-xs bg-background">
                    <SelectValue placeholder="-- اختر قسم المنتج (إلزامي) --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="font-bold text-rose-500">
                      اختر القسم بالأسفل 👇
                    </SelectItem>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* الوصف */}
              <Field label="الوصف التوضيحي" full>
                <Textarea
                  rows={2}
                  value={(editing.description || "").split("#وسوم:")[0].trim()}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="ملاحظات حول جودة المنتج، المصدر، أو القيمة الغذائية..."
                  className="rounded-xl font-bold text-xs"
                />
              </Field>

              {/* الوسوم والكلمات المفتاحية (Tags) */}
              <Field label="الوسوم والكلمات المفتاحية (Tags)" full>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="اكتب وسم ثم اضغط إضافة (مثال: طازج، عضوي)"
                      className="h-9 rounded-xl font-bold text-xs flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="secondary"
                      className="h-9 rounded-xl text-xs font-bold px-3"
                    >
                      إضافة
                    </Button>
                  </div>
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-rose-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* السعر الحالي والسعر القديم */}
              <Field label={editing.is_by_weight ? "السعر / كجم (ج.م)" : "السعر الحالي (ج.م)"}>
                <NumberInput
                  value={editing.price_per_unit ?? 0}
                  onValueChange={(v) =>
                    setEditing({ ...editing, price_per_unit: normalizeNumber(v) })
                  }
                />
              </Field>

              <Field label="السعر السابق / القديم (اختياري)">
                <NumberInput
                  value={editing.old_price ?? ""}
                  onValueChange={(v) =>
                    setEditing({ ...editing, old_price: v ? normalizeNumber(v) : null })
                  }
                />
              </Field>

              {/* المخزون وحد التنبيه */}
              <Field label="كمية المخزون بالمتجر">
                <NumberInput
                  decimal={false}
                  value={editing.stock_quantity ?? 0}
                  onValueChange={(v) =>
                    setEditing({ ...editing, stock_quantity: normalizeNumber(v) })
                  }
                />
              </Field>

              <Field label="حد التنبيه للمخزون المنخفض">
                <NumberInput
                  decimal={false}
                  value={editing.low_stock_threshold ?? 10}
                  onValueChange={(v) =>
                    setEditing({ ...editing, low_stock_threshold: normalizeNumber(v) })
                  }
                />
              </Field>

              {/* وحدة العرض والموزون */}
              <Field label="وحدة العرض والبيع">
                <Input
                  value={editing.unit_label ?? ""}
                  onChange={(e) => setEditing({ ...editing, unit_label: e.target.value })}
                  placeholder="مثال: قطعة / كجم / طبق"
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </Field>

              {/* حقل نصيحة الطبخ والتحضير مع زر التوليد بالذكاء الاصطناعي */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>نصيحة الطبخ والتحضير (Cooking Tip)</span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingTip}
                    onClick={handleGenerateCookingTip}
                    className="h-8 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 hover:text-amber-800 text-[11px] font-black gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isGeneratingTip ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                        <span>جاري التوليد...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>توليد نصيحة طبخ بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={editing.cooking_tip || editing.cookingTip || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      cooking_tip: e.target.value,
                      cookingTip: e.target.value,
                    })
                  }
                  placeholder="اكتب نصيحة طبخ أو اقتراح تحضير مميز للعملاء..."
                  className="rounded-xl font-bold text-xs bg-background"
                />
              </div>

              {/* الخيارات والتغييرات السريعة */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 rounded-2xl border border-border bg-secondary/30 p-3">
                <Toggle
                  label="موزون (كجم)"
                  checked={!!editing.is_by_weight}
                  onChange={(v) =>
                    setEditing({
                      ...editing,
                      is_by_weight: v,
                      unit_label: v ? "كجم" : editing.unit_label || "قطعة",
                    })
                  }
                />
                <Toggle
                  label="عرض خاص"
                  checked={!!editing.is_on_sale}
                  onChange={(v) => setEditing({ ...editing, is_on_sale: v })}
                />
              </div>

              {/* منطقة رفع الصور مع السحب والإفلات وتوليد الصور بالذكاء الاصطناعي Drag & Drop Zone */}
              <Field label="صورة المنتج (رفع أو توليد بالذكاء الاصطناعي)" full>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                      : "border-border hover:border-emerald-500/50 bg-secondary/20"
                  }`}
                >
                  {editing.image_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group w-36 h-36 rounded-2xl overflow-hidden border border-border shadow-xs">
                        <img
                          src={editing.image_url}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, image_url: null })}
                          className="absolute top-1 end-1 bg-rose-600 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                          title="حذف الصورة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAiImageModalOpen(true)}
                          className="h-8 rounded-xl text-xs font-black bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>تعديل الصورة بالـ AI (Gemini)</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2.5">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-extrabold text-foreground">
                        اسحب واسقط صورة المنتج هنا، أو اختر التوليد بالذكاء الاصطناعي
                      </div>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        يدعم صيغ PNG, JPG, WEBP أو الإنشاء عبر Google Gemini 3.1 Flash Image
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl hero-gradient text-primary-foreground px-4 py-2 text-xs font-black shadow-xs hover:opacity-90">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploading ? "جاري الرفع..." : "اختر صورة من جهازك"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] && processImageUpload(e.target.files[0])
                            }
                          />
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAiImageModalOpen(true)}
                          className="rounded-xl px-3.5 py-2 text-xs font-black bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 gap-1.5 shadow-xs"
                        >
                          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>توليد صورة بالـ AI ✨</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* حقل الرابط اليدوي للاستخدام المباشر إن وجد */}
                  <div className="w-full mt-3 pt-3 border-t border-border/60">
                    <Input
                      value={editing.image_url || ""}
                      onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                      placeholder="أو الصق رابط صورة مباشر هنا..."
                      className="h-8 text-[11px] font-bold rounded-lg bg-background"
                    />
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* Modal توليد الصور بالذكاء الاصطناعي للمنتجات */}
          <AdminAiImageGeneratorModal
            open={aiImageModalOpen}
            onOpenChange={setAiImageModalOpen}
            onImageSelected={(url) => {
              if (editing) {
                setEditing({ ...editing, image_url: url });
              }
            }}
            initialImageUrl={editing?.image_url}
            initialPrompt={
              editing?.name
                ? `صورة استوديو تجارية فائقة الجودة لمنتج ${editing.name}${editing.description ? ` - ${editing.description}` : ""}`
                : ""
            }
            categoryHint={cats.find((c) => c.id === editing?.category_id)?.name}
            title={
              editing?.name
                ? `توليد صورة لمنتج: ${editing.name}`
                : "توليد صورة منتج بالذكاء الاصطناعي"
            }
          />

          <DialogFooter className="gap-2 pt-2 border-t border-border mt-4">
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              className="rounded-xl font-bold text-xs"
            >
              إلغاء
            </Button>
            <Button
              onClick={saveFullProduct}
              disabled={saving}
              className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              حفظ وتأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال كاتب المحتوى الذكي */}
      <SmartProductCopywriterModal
        open={copywriterModalOpen}
        onOpenChange={setCopywriterModalOpen}
        initialProductName={editing?.name ?? ""}
        initialCategoryName={cats.find((c) => c.id === editing?.category_id)?.name ?? ""}
        isByWeight={Boolean(editing?.is_by_weight)}
        onApplyCopywriting={(data) => {
          if (editing) {
            setEditing({
              ...editing,
              name: data.name || editing.name,
              description: data.description,
              cooking_tip: data.cookingTip || editing.cooking_tip,
              cookingTip: data.cookingTip || editing.cookingTip,
            });
            if (data.tags && data.tags.length > 0) {
              setTagsList((prev) => Array.from(new Set([...prev, ...data.tags])));
            }
          }
        }}
      />
    </motion.div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-extrabold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 border border-border/50">
      <Label className="text-[11px] font-bold text-foreground cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-12 w-full rounded-2xl bg-secondary/80" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 w-full rounded-2xl bg-secondary/50 border border-border/40" />
      ))}
    </div>
  );
}
