import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookmarkPlus, ListOrdered, Sparkles, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart, type SavedShoppingList } from "@/lib/cart-context";

interface SaveShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveShoppingListDialog({ open, onOpenChange }: SaveShoppingListDialogProps) {
  const { items, totalPrice, saveCurrentCartAsList, savedLists, loadSavedList, deleteSavedList } =
    useCart();
  const [listName, setListName] = useState("");
  const [activeTab, setActiveTab] = useState<"save" | "saved">("save");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const result = saveCurrentCartAsList(listName);
    if (result) {
      setListName("");
      onOpenChange(false);
    }
  };

  const defaultSuggestedNames = [
    "مشتريات التموين والبقالة الشهرية 🛒",
    "نواقص ومستلزمات البيت 🥫",
    "مستلزمات الفطور والألبان 🥪",
    "عروض اللحوم والدواجن 🥩",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-3xl" dir="rtl">
        <DialogHeader className="border-b border-border/60 p-5 text-start bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-xs">
              <BookmarkPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-black">
                قوائم التسوق الدورية
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                احفظ سلتك الحالية كقائمة متكررة لطلبها بضغطة زر لاحقاً
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 flex rounded-xl bg-background p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("save")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "save"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              حفظ السلة الحالية ({items.length} صنف)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "saved"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              قوائمي المحفوظة ({savedLists.length})
            </button>
          </div>
        </DialogHeader>

        <div className="p-5">
          {activeTab === "save" ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  اسم القائمة الجديدة
                </label>
                <Input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="مثال: مشتريات البقالة الشهرية"
                  className="h-11 rounded-xl text-sm font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  أو اختر اسماً مقترحاً:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defaultSuggestedNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setListName(name)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-border/60 text-foreground transition-all"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>عدد الأصناف:</span>
                  <span>{items.length} صنف</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>السعر الإجمالي التقديري:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {totalPrice.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={items.length === 0}
                  className="flex-1 h-11 rounded-xl hero-gradient text-xs font-black text-primary-foreground shadow-sm"
                >
                  <BookmarkPlus className="h-4 w-4 me-1.5" />
                  حفظ القائمة الآن
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-11 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {savedLists.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-secondary text-2xl">
                    📋
                  </div>
                  <p className="text-xs font-bold text-foreground">لا توجد قوائم تسوق محفوظة بعد</p>
                  <p className="text-[11px] text-muted-foreground">
                    يمكنك حفظ سلتك الحالية للرجوع إليها وطلبها لاحقاً في أي وقت.
                  </p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pe-1">
                  {savedLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-emerald-400 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-foreground truncate">{list.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {list.items.length || list.total_items_count || 0} صنف •{" "}
                          <span className="font-mono font-bold text-emerald-600">
                            {list.total_estimated_price.toFixed(2)} ج.م
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            loadSavedList(list.id, "replace");
                            onOpenChange(false);
                          }}
                          className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 gap-1"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          تحميل للسلة
                        </Button>
                        <button
                          type="button"
                          onClick={() => deleteSavedList(list.id)}
                          className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="حذف القائمة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
