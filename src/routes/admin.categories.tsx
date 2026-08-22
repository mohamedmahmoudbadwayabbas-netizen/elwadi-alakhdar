import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Search,
  FolderTree,
  Sparkles,
  Layers,
  Package,
  Check,
  Loader2,
  RefreshCw,
  Grid,
  List,
  ArrowUp,
  ArrowDown,
  Tag,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Database,
  FileImage,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type Cat = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  image_url: string | null;
  parent_id: string | null;
  created_at?: string;
  updated_at?: string;
};

// مكتبة الصور الجاهزة فائقة الجودة للتصنيفات (High-Res Grocery Photography)
const UNPLASH_PRESET_GALLERY = [
  {
    label: "خضروات وفواكه",
    url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "البقالة والتموين",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "الألبان والأجبان",
    url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "لحوم ودواجن",
    url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "المخبوزات والحلويات",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "المشروبات والعصائر",
    url: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "مجمدات ومأكولات بحرية",
    url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "تسالي وسناكس",
    url: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "عناية شخصية ورعاية",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "منظفات ومستلزمات منزل",
    url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80",
  },
];

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "إدارة التصنيفات والأقسام — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  // جلب البيانات من Supabase مع عدد المنتجات المرتبطة بطلب واحد
  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: catData, error: catErr }, { data: prodData }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("products").select("id, category_id"),
      ]);

      if (catErr) throw catErr;

      const fetchedCats = catData ?? [];

      // حساب عدد المنتجات لكل تصنيف
      const counts: Record<string, number> = {};
      prodData?.forEach((p) => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });

      setRows((fetchedCats ?? []) as Cat[]);
      setProductCounts(counts);

      // تفعيل توسيع الأقسام الرئيسية افتراضياً
      const exp: Record<string, boolean> = {};
      catData?.forEach((c) => {
        if (!c.parent_id) exp[c.id] = true;
      });
      setExpandedParents(exp);
    } catch (err: any) {
      toast.error(`تعذر جلب الأقسام: ${err.message || "خطأ في الشبكة"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // رفع صورة القسم بالسحب والإفلات أو اختيار ملف
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالحة (PNG, JPG, WEBP)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("store-assets")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = await supabase.storage
        .from("store-assets")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

      if (!data?.signedUrl) throw new Error("تعذر إنشاء رابط الصورة المرفوعة");

      setEditing((prev) => ({ ...(prev ?? {}), image_url: data.signedUrl }));
      toast.success("تم رفع صورة القسم بنجاح ✨");
    } catch (err: any) {
      toast.error(`فشل رفع الصورة: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  // حفظ قسم جديد أو تعديل قسم حالي
  const saveCategory = async () => {
    if (!editing?.name?.trim()) {
      toast.error("اسم القسم مطلوب لإنشاء أو تعديل التصنيف");
      return;
    }

    const nameTrimmed = editing.name.trim();
    const generatedSlug = (editing.slug || nameTrimmed)
      .toLowerCase()
      .replace(/[^\w\u0621-\u064A]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    const payload = {
      name: nameTrimmed,
      slug: generatedSlug || `cat-${Date.now()}`,
      icon: editing.icon || null,
      image_url: editing.image_url || null,
      parent_id: editing.parent_id || null,
      sort_order: Number(editing.sort_order ?? 0),
    };

    try {
      const res = editing.id
        ? await supabase.from("categories").update(payload).eq("id", editing.id)
        : await supabase.from("categories").insert(payload);

      if (res.error) throw res.error;

      toast.success(
        editing.id ? "تم تحديث بيانات القسم بنجاح ✏️" : "تم إضافة القسم الجديد بنجاح 🎉",
      );
      setEditing(null);
      loadData();
    } catch (err: any) {
      toast.error(`حدث خطأ أثناء الحفظ: ${err.message}`);
    }
  };

  // حذف قسم مع التحقق من عدم وجود أقسام فرعية
  const removeCategory = async (cat: Cat) => {
    const subKids = rows.filter((c) => c.parent_id === cat.id);
    if (subKids.length > 0) {
      toast.error(
        `لا يمكن حذف "${cat.name}" لأنه يحتوي على ${subKids.length} أقسام فرعية! يرجى نقلها أو حذفها أولاً.`,
      );
      return;
    }

    if (!confirm(`هل أنت ألكيد من حذف القسم "${cat.name}"؟`)) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;

      toast.success("تم حذف القسم بنجاح");
      loadData();
    } catch (err: any) {
      toast.error(`تعذر الحذف: ${err.message}`);
    }
  };

  // تغيير ترتيب الأقسام أفقياً أو رأسياً
  const moveSortOrder = async (cat: Cat, direction: -1 | 1) => {
    const siblings = rows
      .filter((c) => c.parent_id === cat.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currIndex = siblings.findIndex((c) => c.id === cat.id);
    const targetCat = siblings[currIndex + direction];

    if (!targetCat) return;

    const tempOrder = cat.sort_order;
    const targetOrder = targetCat.sort_order;

    // Optimistic UI update
    setRows((prev) =>
      prev.map((c) => {
        if (c.id === cat.id) return { ...c, sort_order: targetOrder };
        if (c.id === targetCat.id) return { ...c, sort_order: tempOrder };
        return c;
      }),
    );

    await Promise.all([
      supabase.from("categories").update({ sort_order: targetOrder }).eq("id", cat.id),
      supabase.from("categories").update({ sort_order: tempOrder }).eq("id", targetCat.id),
    ]);
  };

  // فلترة الأقسام بناءً على البحث
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  const parentCategories = useMemo(() => {
    return filteredRows.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  }, [filteredRows]);

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 sm:p-6 pb-24"
      dir="rtl"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-sm">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-foreground">
                إدارة الأقسام والتصنيفات 🗂️
              </h1>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                تحديد الهيكل التنظيمي، الأقسام الرئيسية والفرعية، والصور التوضيحية الفاخرة للمتجر
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
              <span>استيراد أقسام السوبرماركت القياسية</span>
            </Button>
          )}

          <Button
            onClick={() => setEditing({ sort_order: rows.length + 1 })}
            className="rounded-2xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-transform h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة قسم جديد</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & View Switcher & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم القسم أو المعرّف..."
            className="ps-9 h-10 rounded-xl font-bold text-xs bg-background"
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-xl border border-border/40">
            <Layers className="h-4 w-4 text-primary" />
            <span>
              إجمالي الأقسام: <strong className="text-foreground">{rows.length}</strong> (
              {rows.filter((c) => !c.parent_id).length} رئيسي /{" "}
              {rows.filter((c) => c.parent_id).length} فرعي)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
              title="عرض الشبكة (Grid)"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
              title="عرض القائمة (List)"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <CategorySkeletonList />
      ) : parentCategories.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4 bg-card/40">
          <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <FolderTree className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              لم يتم العثور على أي أقسام
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "جرّب تغيير كلمة البحث للحصول على نتائج"
                : "قم بإنشاء أحدث أقسام السوبرماركت لتنظيم منتجات المتجر بأسلوب احترافي"}
            </p>
          </div>
                استيراد الهيكل التمويني الشامل
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {parentCategories.map((parent) => {
            const kids = filteredRows
              .filter((c) => c.parent_id === parent.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            const isExpanded = !!expandedParents[parent.id];
            const linkedProductsCount = productCounts[parent.id] || 0;

            return (
              <motion.div
                key={parent.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0 },
                }}
                className="rounded-3xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all duration-300 overflow-hidden"
              >
                {/* Parent Category Banner / Header */}
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/90">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleExpand(parent.id)}
                      className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>

                    {/* Image / Icon Box */}
                    <div className="relative h-16 w-20 sm:w-24 shrink-0 rounded-2xl overflow-hidden border border-border/80 bg-secondary shadow-xs group">
                      {parent.image_url ? (
                        <img
                          src={parent.image_url}
                          alt={parent.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10">
                          {parent.icon || "🛒"}
                        </div>
                      )}
                      <span className="absolute bottom-1 start-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono px-1.5 py-0.2 rounded-md">
                        #{parent.sort_order}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base font-black text-foreground truncate">
                          {parent.name}
                        </h3>
                        <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          قسم رئيسي
                        </span>
                        <span className="text-[10px] font-extrabold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                          {linkedProductsCount} منتج مرتبط
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground dir-ltr text-right truncate">
                        /{parent.slug}
                      </p>
                    </div>
                  </div>

                  {/* Parent Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-border/50 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                    <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-background">
                      <button
                        onClick={() => moveSortOrder(parent, -1)}
                        className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-px h-4 bg-border/60" />
                      <button
                        onClick={() => moveSortOrder(parent, 1)}
                        className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setEditing({ parent_id: parent.id, sort_order: kids.length + 1 })
                      }
                      className="rounded-xl text-xs font-bold gap-1 h-9 px-2.5"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-500" />
                      <span>قسم فرعي</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditing(parent)}
                      className="h-9 w-9 rounded-xl border-border hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(parent)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories Container */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-border/60 bg-secondary/20 p-3 sm:p-4"
                    >
                      {kids.length === 0 ? (
                        <div className="text-center py-4 text-xs font-bold text-muted-foreground border border-dashed border-border/80 rounded-2xl bg-card/50">
                          لا توجد أقسام فرعية مضافة حتى الآن لـ "{parent.name}". انقر فوق "+ قسم
                          فرعي" لإضافتها.
                        </div>
                      ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {kids.map((kid) => {
                            const subProductCount = productCounts[kid.id] || 0;
                            return (
                              <div
                                key={kid.id}
                                className="group p-3 rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-all shadow-xs flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-secondary border border-border/50">
                                    {kid.image_url ? (
                                      <img
                                        src={kid.image_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-base">
                                        {kid.icon || "🥬"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-black text-xs text-foreground truncate">
                                      {kid.name}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {subProductCount} منتج
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setEditing(kid)}
                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removeCategory(kid)}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {kids.map((kid) => (
                            <div
                              key={kid.id}
                              className="p-2.5 rounded-2xl border border-border/60 bg-card flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-secondary">
                                  {kid.image_url ? (
                                    <img
                                      src={kid.image_url}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-sm">
                                      {kid.icon || "🏷️"}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-foreground block truncate">
                                    {kid.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono dir-ltr block truncate">
                                    /{kid.slug}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveSortOrder(kid, -1)}
                                  className="h-8 w-8"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveSortOrder(kid, 1)}
                                  className="h-8 w-8"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditing(kid)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCategory(kid)}
                                  className="h-8 w-8 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Elastic Modal Form Dialog for Add / Edit Category */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent
          dir="rtl"
          className="max-w-lg rounded-3xl p-6 bg-card border-border shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span>
                {editing?.id
                  ? `تعديل قسم: ${editing.name}`
                  : editing?.parent_id
                    ? "إضافة قسم فرعي جديد"
                    : "إضافة قسم رئيسي جديد"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 pt-2">
              {/* Image Upload Zone & Preset Gallery */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-foreground">
                  صورة القسم الفاخرة
                </span>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative cursor-pointer h-36 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center overflow-hidden ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  {editing.image_url ? (
                    <div className="relative h-full w-full rounded-xl overflow-hidden group">
                      <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                        <Upload className="h-4 w-4" /> تغيير الصورة
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        اسحب الصورة هنا أو{" "}
                        <span className="text-emerald-500 underline">اضغط للاختيار</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        صورة عالية الدقة PNG, WEBP أو JPG
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f);
                    }}
                  />
                </div>

                {/* Preset Fast Image Picker */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    أو اختر صورة جاهزة عالية الجودة بنقرة واحدة:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {UNPLASH_PRESET_GALLERY.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditing({ ...editing, image_url: item.url })}
                        className="relative h-10 w-14 shrink-0 rounded-lg overflow-hidden border border-border/70 hover:border-primary transition-all group"
                        title={item.label}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parent Category Selector */}
              <div className="space-y-1.5">
                <span className="block text-xs font-extrabold text-foreground">
                  القسم الأب (الرئيسي)
                </span>
                <select
                  value={editing.parent_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">— لا يوجد (قسم رئيسي) —</option>
                  {parentCategories
                    .filter((p) => p.id !== editing.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="block text-xs font-extrabold text-foreground">اسم القسم</span>
                  <Input
                    value={editing.name ?? ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="مثال: الفواكه المحلية"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-extrabold text-foreground">
                    الأيقونة (تعبيرية أو رمز)
                  </span>
                  <Input
                    value={editing.icon ?? ""}
                    onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    placeholder="🍎"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              {/* Slug & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="block text-xs font-extrabold text-foreground">
                    المعرّف اللطيف (Slug)
                  </span>
                  <Input
                    value={editing.slug ?? ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="local-fruits"
                    className="h-10 rounded-xl font-mono text-xs dir-ltr text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-extrabold text-foreground">رقم الترتيب</span>
                  <NumberInput
                    value={editing.sort_order ?? 0}
                    onValueChange={(v) =>
                      setEditing({ ...editing, sort_order: parseInt(v || "0", 10) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              className="rounded-xl text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              onClick={saveCategory}
              className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-1.5 px-5 shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>حفظ البيانات</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function CategorySkeletonList() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-3xl bg-secondary/60 border border-border/40 p-4" />
      ))}
    </div>
  );
}
