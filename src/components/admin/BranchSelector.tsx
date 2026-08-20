import { useState } from "react";
import { Building2, ChevronDown, MapPin, Check, Sparkles, Store, TrendingUp, Package, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BranchStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  totalProducts: number;
  stockHealth: number; // percentage e.g. 98%
  lowStockItems: number;
}

export interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  city: string;
  address: string;
  phone: string;
  status: "open" | "busy" | "closed";
  isMain?: boolean;
  deliveryZones: string[];
  stats: BranchStats;
}

export const STORE_BRANCHES: Branch[] = [
  {
    id: "branch-dokki",
    name: "فرع الدقي والمهندسين (الفرع الرئيسي)",
    nameEn: "Dokki & Mohandessin Main Branch",
    city: "الجيزة",
    address: "شارع مصدق تقاطع شارع السودان، الدقي",
    phone: "+201099887711",
    status: "open",
    isMain: true,
    deliveryZones: ["الدقي", "المهندسين", "العجوزة", "الزمالك", "أرض اللواء"],
    stats: {
      todayRevenue: 24850,
      todayOrders: 68,
      activeOrders: 7,
      totalProducts: 1420,
      stockHealth: 99,
      lowStockItems: 3,
    },
  },
  {
    id: "branch-nasr-city",
    name: "فرع مدينة نصر والتجمع الخامس",
    nameEn: "Nasr City & New Cairo Branch",
    city: "القاهرة",
    address: "شارع مكرم عبيد بجوار سيتي ستارز، مدينة نصر",
    phone: "+201099887722",
    status: "open",
    deliveryZones: ["مدينة نصر", "مصر الجديدة", "التجمع الأول", "التجمع الخامس", "الرحاب"],
    stats: {
      todayRevenue: 19400,
      todayOrders: 49,
      activeOrders: 5,
      totalProducts: 1350,
      stockHealth: 96,
      lowStockItems: 6,
    },
  },
  {
    id: "branch-maadi",
    name: "فرع المعادي والمقطم",
    nameEn: "Maadi & Mokattam Branch",
    city: "القاهرة",
    address: "شارع النصر تقاطع اللاسلكي، دجلة المعادي",
    phone: "+201099887733",
    status: "open",
    deliveryZones: ["المعادي", "دجلة", "زهراء المعادي", "المقطم", "طرة"],
    stats: {
      todayRevenue: 16200,
      todayOrders: 38,
      activeOrders: 4,
      totalProducts: 1280,
      stockHealth: 98,
      lowStockItems: 2,
    },
  },
];

export const ALL_BRANCHES_AGGREGATE: Branch = {
  id: "all",
  name: "جميع فروع الوادي الأخضر (3 فروع - نظرة موحدة)",
  nameEn: "All Branches (Unified Overview)",
  city: "القاهرة والجيزة",
  address: "تغطية مركزية لمحافظات القاهرة الكبرى والجيزة (3 فروع)",
  phone: "+201099887700",
  status: "open",
  isMain: true,
  deliveryZones: ["كافة مناطق القاهرة الكبرى والجيزة"],
  stats: {
    todayRevenue: 60450,
    todayOrders: 155,
    activeOrders: 16,
    totalProducts: 4050,
    stockHealth: 98,
    lowStockItems: 11,
  },
};

interface BranchSelectorProps {
  selectedBranchId: string;
  onBranchChange: (branch: Branch) => void;
  className?: string;
}

export function BranchSelector({
  selectedBranchId,
  onBranchChange,
  className = "",
}: BranchSelectorProps) {
  const currentBranch =
    selectedBranchId === "all"
      ? ALL_BRANCHES_AGGREGATE
      : STORE_BRANCHES.find((b) => b.id === selectedBranchId) || ALL_BRANCHES_AGGREGATE;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 px-3.5 rounded-2xl border-border/80 bg-card/90 backdrop-blur-xl hover:bg-secondary/70 text-foreground font-bold text-xs gap-2.5 transition-all shadow-xs cursor-pointer",
            className,
          )}
        >
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Store className="h-3.5 w-3.5" />
          </div>

          <div className="flex flex-col items-start text-start leading-tight">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span>الفرع المختار</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="truncate max-w-[160px] text-foreground font-extrabold">
              {currentBranch.name}
            </span>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground me-auto" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl p-2 bg-popover/95 backdrop-blur-2xl border border-border shadow-2xl space-y-1 text-right"
      >
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1.5 flex items-center justify-between">
          <span>اختيار الفرع للتحكم المباشر:</span>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600">
            3 فروع نشطة
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* All Branches Aggregate Option */}
        <DropdownMenuItem
          onClick={() => onBranchChange(ALL_BRANCHES_AGGREGATE)}
          className={cn(
            "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all",
            selectedBranchId === "all"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
              : "hover:bg-secondary/70 text-foreground",
          )}
        >
          <div
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-lg mt-0.5",
              selectedBranchId === "all"
                ? "bg-emerald-500 text-white"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black truncate">كافة الفروع (نظرة شاملة)</span>
              <Badge className="text-[9px] px-1.5 py-0 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-0">
                مجمع
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {ALL_BRANCHES_AGGREGATE.address}
            </p>
            <div className="flex items-center gap-2 pt-0.5 text-[10px]">
              <span className="text-emerald-600 font-medium">● 3 فروع متصلة</span>
              <span className="text-muted-foreground">• 16 طلب جاري</span>
            </div>
          </div>
          {selectedBranchId === "all" && <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* The 3 Specific Branches */}
        {STORE_BRANCHES.map((branch) => {
          const isSelected = branch.id === currentBranch.id;
          return (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => onBranchChange(branch)}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all",
                isSelected
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "hover:bg-secondary/70 text-foreground",
              )}
            >
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg mt-0.5",
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <MapPin className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black truncate">{branch.name}</span>
                  {branch.isMain && (
                    <Badge className="text-[9px] px-1.5 py-0 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border-0">
                      الرئيسي
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{branch.address}</p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                  <span className="text-emerald-600 font-medium">● متاح للتوصيل</span>
                  <span className="text-muted-foreground">• {branch.stats.activeOrders} طلب جاري</span>
                </div>
              </div>

              {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
