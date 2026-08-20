import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  Tag,
  BookOpen,
  Zap,
  ArrowLeft,
  X,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateProductCopywriting, ProductCopywriterResult } from "@/services/gemini36Service";
import { toast } from "sonner";

interface SmartProductCopywriterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductName?: string;
  initialCategoryName?: string;
  isByWeight?: boolean;
  onApplyCopywriting?: (data: {
    name?: string;
    description: string;
    tags: string[];
    cookingTip: string;
  }) => void;
}

export function SmartProductCopywriterModal({
  open,
  onOpenChange,
  initialProductName = "",
  initialCategoryName = "",
  isByWeight = false,
  onApplyCopywriting,
}: SmartProductCopywriterModalProps) {
  const [productName, setProductName] = useState(initialProductName);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductCopywriterResult | null>(null);

  // Sync props when modal opens
  React.useEffect(() => {
    if (open) {
      setProductName(initialProductName);
      setCategoryName(initialCategoryName);
      if (initialProductName.trim()) {
        handleGenerate(initialProductName, initialCategoryName);
      }
    }
  }, [open, initialProductName, initialCategoryName]);

  const handleGenerate = async (nameToUse = productName, catToUse = categoryName) => {
    if (!nameToUse.trim()) {
      toast.error("يرجى إدخال اسم المنتج أولاً");
      return;
    }
    setLoading(true);
    try {
      const res = await generateProductCopywriting({
        productName: nameToUse,
        categoryName: catToUse,
        isByWeight,
      });
      setResult(res);
    } catch (e) {
      toast.error("حدث خطأ أثناء صياغة وصف المنتج");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    if (onApplyCopywriting) {
      onApplyCopywriting({
        name: result.enhancedTitle,
        description: result.seoDescription,
        tags: result.tags,
        cookingTip: result.cookingTip,
      });
      toast.success("تم إدراج نصوص الذكاء الاصطناعي في حقول المنتج بنجاح! ✨");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl rounded-3xl p-0 overflow-hidden text-right border-border/80 shadow-2xl"
        dir="rtl"
      >
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-gradient-to-l from-emerald-500/10 via-card to-card text-right">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black font-display text-foreground">
                كاتب أوصاف المنتجات الذكي (AI Smart Copywriter)
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                توليد أوصاف تسويقية احترافية، وسوم SEO، ونصائح طهي مخصصة بنقرة واحدة
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7 space-y-1">
              <label className="text-xs font-bold text-foreground">اسم المنتج الأساسي:</label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="مثال: لحم مفروم بلدي / جبن قريش / طماطم بلدي"
                className="h-9 rounded-xl font-bold text-xs"
              />
            </div>
            <div className="sm:col-span-5 space-y-1">
              <label className="text-xs font-bold text-foreground">القسم (اختياري):</label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="مثال: اللحوم / الألبان"
                className="h-9 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          <Button
            type="button"
            disabled={loading || !productName.trim()}
            onClick={() => handleGenerate()}
            className="w-full h-10 rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري صياغة المحتوى التسويقي بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>توليد المحتوى التسويقي الشامل ✨</span>
              </>
            )}
          </Button>

          {/* Results Preview */}
          {result && (
            <div className="space-y-3.5 pt-2">
              {/* Enhanced Title */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3 text-emerald-600" />
                  <span>العنوان التجاري المقترح:</span>
                </span>
                <p className="text-sm font-black text-foreground font-display">
                  {result.enhancedTitle}
                </p>
              </div>

              {/* SEO Description */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-emerald-600" />
                  <span>الوصف التسويقي الموسّع (SEO Description):</span>
                </span>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {result.seoDescription}
                </p>
              </div>

              {/* Tags & Keywords */}
              {result.tags?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    الوسوم والكلمات المفتاحية المولدة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking / Preparation Tip */}
              {result.cookingTip && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-amber-900 dark:text-amber-200">
                  <span className="text-[11px] font-extrabold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>نصيحة الطبخ أو التحضير (Cooking Tip):</span>
                  </span>
                  <p className="text-xs font-bold leading-relaxed">{result.cookingTip}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-card flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-9"
          >
            إلغاء
          </Button>

          {result && (
            <Button
              type="button"
              onClick={handleApply}
              className="rounded-xl hero-gradient text-primary-foreground font-black text-xs h-9 gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>إدراج في بيانات المنتج</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
