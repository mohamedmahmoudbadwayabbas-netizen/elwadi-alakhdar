import { useState } from "react";
import { Building2, TrendingUp, Package, Clock, CheckCircle2, MapPin, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { STORE_BRANCHES, Branch } from "./BranchSelector";
import { AnimatedCounter } from "@/components/admin/AnimatedCounter";

interface BranchCardsOverviewProps {
  onSelectBranch?: (branchId: string) => void;
  selectedBranchId?: string;
}

export function BranchCardsOverview({
  onSelectBranch,
  selectedBranchId = "all",
}: BranchCardsOverviewProps) {
  const [internalSelected, setInternalSelected] = useState<string>(selectedBranchId);

  const activeId = selectedBranchId || internalSelected;

  const handleCardClick = (branchId: string) => {
    const newId = activeId === branchId ? "all" : branchId;
    setInternalSelected(newId);
    if (onSelectBranch) {
      onSelectBranch(newId);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-black text-foreground tracking-tight">
                سلسلة الفروع الثلاثة (سوبرماركت الوادي الأخضر)
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                مزامنة حية • Supabase
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              انقر على أي فرع لتصفية التحليلات وعرض حركة المبيعات والمخزون المباشر
            </p>
          </div>
        </div>

        {activeId !== "all" && (
          <button
            onClick={() => handleCardClick("all")}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 cursor-pointer"
          >
            عرض النظرة الموحدة لكافة الفروع ↺
          </button>
        )}
      </div>

      {/* 3 Spacious Visual Cards (Neo-Minimalism & Glassmorphism) */}
      <div className="grid gap-4 md:grid-cols-3">
        {STORE_BRANCHES.map((branch) => {
          const isMain = branch.isMain;
          const isSelected = activeId === branch.id;

          return (
            <div
              key={branch.id}
              onClick={() => handleCardClick(branch.id)}
              className={`group relative rounded-3xl border p-5 transition-all duration-300 cursor-pointer backdrop-blur-2xl ${
                isSelected
                  ? "bg-card/95 border-emerald-500/80 shadow-elegant ring-2 ring-emerald-500/30 scale-[1.01]"
                  : "bg-card/70 border-border/70 hover:border-emerald-500/40 hover:bg-card/90 hover:shadow-md"
              }`}
            >
              {/* Top Row: Branch Header & Location */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-black text-sm text-foreground truncate">
                      {branch.name}
                    </span>
                    {isMain && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        الفرع الرئيسي ⭐
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                </div>

                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "hero-gradient text-white shadow-sm"
                      : "bg-secondary text-foreground border border-border/60"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              {/* 3 Metrics: Sales, Active Orders, Stock */}
              <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-2xl bg-secondary/40 border border-border/50">
                {/* Metric 1: Sales */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    مبيعات اليوم
                  </span>
                  <span className="font-display font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                    <AnimatedCounter value={branch.stats.todayRevenue} suffix="ج.م" />
                  </span>
                </div>

                {/* Metric 2: Active Orders */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    طلبات جارية
                  </span>
                  <span className="font-display font-black text-xs sm:text-sm text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>{branch.stats.activeOrders} طلب</span>
                  </span>
                </div>

                {/* Metric 3: Stock Health */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    جاهزية الرفوف
                  </span>
                  <span className="font-display font-black text-xs sm:text-sm text-foreground flex items-center gap-1">
                    <Package className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{branch.stats.stockHealth}%</span>
                  </span>
                </div>
              </div>

              {/* Status and Low Stock Notification */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 font-bold">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-[10px]">إجمالي الأصناف:</span>
                  <strong className="text-foreground">{branch.stats.totalProducts} صنف</strong>
                  {branch.stats.lowStockItems > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-bold">
                      • {branch.stats.lowStockItems} بحاجة لتوريد
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px]">جاهز للتوصيل</span>
                </div>
              </div>

              {/* Delivery zones pills */}
              <div className="mt-3 flex items-center gap-1 flex-wrap">
                {branch.deliveryZones.slice(0, 3).map((zone) => (
                  <span
                    key={zone}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-background/80 border border-border/60 text-muted-foreground"
                  >
                    {zone}
                  </span>
                ))}
                {branch.deliveryZones.length > 3 && (
                  <span className="text-[9px] font-bold text-muted-foreground">
                    +{branch.deliveryZones.length - 3} أخرى
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
