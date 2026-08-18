import { useState } from "react";
import { Building2, ChevronDown, MapPin, Check, Sparkles, Store } from "lucide-react";
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

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  status: "open" | "busy" | "closed";
  activeOrders: number;
  isMain?: boolean;
}

export const STORE_BRANCHES: Branch[] = [
  {
    id: "all",
    name: "جميع فروع الهايبر (نظرة شاملة)",
    city: "كافة الفروع",
    address: "تغطية كافة منافذ التوزيع المركزية",
    status: "open",
    activeOrders: 42,
    isMain: true,
  },
  {
    id: "branch-main",
    name: "فرع الواحة الرئيسي — مدينة نصر",
    city: "القاهرة",
    address: "شارع الثورة بجوار النادي الأهلي",
    status: "open",
    activeOrders: 19,
    isMain: true,
  },
  {
    id: "branch-zayed",
    name: "فرع هايبر الوادي — الشيخ زايد",
    city: "الجيزة",
    address: "محور 26 يوليو بالقرب من ميدان جهينة",
    status: "open",
    activeOrders: 12,
  },
  {
    id: "branch-tagamoa",
    name: "فرع هايبر الوادي — التجمع الخامس",
    city: "القاهرة الجديدة",
    address: "شارع التسعين الشمالي — مجمع البنوك",
    status: "busy",
    activeOrders: 8,
  },
  {
    id: "branch-mohandessin",
    name: "فرع هايبر الوادي — المهندسين",
    city: "الجيزة",
    address: "شارع البطل أحمد عبد العزيز",
    status: "open",
    activeOrders: 3,
  },
];

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
    STORE_BRANCHES.find((b) => b.id === selectedBranchId) || STORE_BRANCHES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 px-3.5 rounded-2xl border-border bg-card hover:bg-secondary/60 text-foreground font-bold text-xs gap-2.5 transition-all shadow-xs",
            className,
          )}
        >
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Store className="h-3.5 w-3.5" />
          </div>

          <div className="flex flex-col items-start text-start leading-tight">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span>الفرع النشط</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-xs font-black truncate max-w-[160px] sm:max-w-[210px]">
              {currentBranch.name}
            </span>
          </div>

          <ChevronDown className="h-4 w-4 text-muted-foreground ms-1 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-80 rounded-2xl p-2 bg-popover/95 backdrop-blur-xl border border-border shadow-xl space-y-1"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black text-muted-foreground flex items-center justify-between">
          <span>إدارة المخزون وفروع الهايبر</span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {STORE_BRANCHES.length} فروع
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {STORE_BRANCHES.map((b) => {
          const isSelected = b.id === currentBranch.id;
          return (
            <DropdownMenuItem
              key={b.id}
              onClick={() => onBranchChange(b)}
              className={cn(
                "flex items-start justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary font-black"
                  : "hover:bg-secondary/60 text-foreground",
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg mt-0.5",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black truncate">{b.name}</span>
                    {b.isMain && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-md font-extrabold">
                        الرئيسي
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span>{b.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                {isSelected ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                    {b.activeOrders} طلب
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
