import { BRAND_NAME_AR, BRAND_NAME_EN } from "@/lib/brand";
import { useState } from "react";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Store,
  Sparkles,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Receipt,
  MapPin,
  ChevronLeft,
  Sun,
  Moon,
  LogOut,
  User,
  Heart,
  PhoneCall,
  Clock,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useSettings } from "@/lib/settings-context";
import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { SmartSearchBar } from "./SmartSearchBar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const { totalCount } = useCart();
  const { isAdmin, user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const settings = useSettings();
  const navigate = useNavigate();
  const logoUrl = settings.logo_url;
  const siteName = settings.site_name || (lang === "ar" ? BRAND_NAME_AR : BRAND_NAME_EN);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-3xl border-b border-white/20 dark:border-white/10 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* اليسار: القائمة المنزلقة الفاخرة للعملاء (Drawer) + البحث */}
        <div className="flex items-center gap-1.5">
          {/* Fluid Sliding Drawer Trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="القائمة الرئيسية"
                className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/60 hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 sm:w-96 p-0 border-l border-border/80 bg-background/95 backdrop-blur-2xl text-foreground flex flex-col justify-between"
              dir="rtl"
            >
              {/* Header section of Drawer */}
              <div className="p-5 border-b border-border/70 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl hero-gradient text-white shadow-md">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-foreground leading-tight">
                      {siteName}
                    </h3>
                    <span className="text-[11px] text-[#036233] dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#036233] animate-pulse" />
                      3 فروع متصلة • توصيل سريع
                    </span>
                  </div>
                </div>

                {/* Branches Pill Overview */}
                <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-xs space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                    <span>فروع السوبرماركت (3 فروع):</span>
                    <span className="text-[#036233] font-bold">خدمة 24/7</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold">
                    <div className="p-1 rounded-lg bg-background/80 border border-border/40 text-foreground">
                      الدقي 🛒
                    </div>
                    <div className="p-1 rounded-lg bg-background/80 border border-border/40 text-foreground">
                      مدينة نصر 🏬
                    </div>
                    <div className="p-1 rounded-lg bg-background/80 border border-border/40 text-foreground">
                      المعادي 🚚
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links inside Drawer for Customers */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1">
                  أقسام وتصفح المتجر
                </div>

                <Link
                  to="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-[#036233]" />
                    <span>الرئيسية وعروض اليوم</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/categories"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-[#036233]" />
                    <span>أقسام وسلع السوبرماركت</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-[#036233]" />
                    <span>سلة المشتريات</span>
                  </div>
                  {totalCount > 0 && (
                    <Badge className="bg-[#036233] text-white text-[10px] px-1.5 py-0.5">
                      {totalCount}
                    </Badge>
                  )}
                </Link>

                <Link
                  to="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#036233]" />
                    <span>حسابي وطلباتي السابقة</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>

                {/* Only display admin link if verified admin is logged in */}
                {isAdmin && (
                  <>
                    <div className="pt-3 border-t border-border/50 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 px-2 py-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>صلاحيات المدير العام</span>
                    </div>

                    <Link
                      to="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-xs font-bold text-amber-900 dark:text-amber-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                        <span>لوحة الإدارة المركزية</span>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-200 border-0 text-[9px]">
                        Admin
                      </Badge>
                    </Link>

                    <Link
                      to="/admin/copilot"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#036233]/10 hover:bg-[#036233]/15 border border-[#036233]/20 text-xs font-black text-[#036233] dark:text-emerald-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span>{siteName} AI (المساعد الذكي)</span>
                      </div>
                      <Badge className="bg-[#036233]/20 text-[#036233] dark:text-emerald-200 border-0 text-[9px]">
                        Gemini
                      </Badge>
                    </Link>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border/60 bg-secondary/30 space-y-2">
                {user ? (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <User className="h-4 w-4 text-[#036233]" />
                      <span className="truncate font-bold text-[11px]">{user.email}</span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      خروج
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    search={{ next: undefined }}
                    onClick={() => setDrawerOpen(false)}
                    className="block text-center py-2.5 rounded-xl hero-gradient text-white text-xs font-bold shadow-xs"
                  >
                    تسجيل الدخول / حساب جديد
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Search Bar Toggle */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("search.placeholder") || "بحث"}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/60 hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        {/* المنتصف: الشعار واسم السوبرماركت */}
        <Link to="/" className="flex items-center justify-center gap-2.5 min-w-0 group">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-xl hero-gradient text-white shadow-xs group-hover:scale-105 transition-transform">
              <Store className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col text-start">
            <span className="truncate text-base font-black tracking-tight text-foreground sm:text-lg font-display">
              {siteName}
            </span>
            <span className="text-[9px] text-[#036233] dark:text-emerald-400 font-bold hidden sm:inline -mt-0.5">
              3 فروع نشطة • توصيل فوري
            </span>
          </div>
        </Link>

        {/* اليمين: زر الثيم + حساب المستخدم + السلة (مع إظهار زر الإدارة فقط للأدمن المسجل) */}
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Link
              to="/admin"
              aria-label="لوحة الإدارة"
              className="flex h-9 sm:h-10 items-center gap-1.5 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 transition-all text-xs font-black border border-amber-500/30 active:scale-95 shadow-xs cursor-pointer"
              title="لوحة تحكم الإدارة"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-display hidden sm:inline">لوحة الإدارة</span>
            </Link>
          )}

          <ColorModeToggle className="rounded-2xl bg-secondary/60 hover:bg-secondary" />
          <UserMenu />

          <Link
            id="cart-icon-target"
            to="/cart"
            aria-label={t("nav.cart")}
            className="relative grid h-10 w-10 place-items-center rounded-2xl bg-secondary/60 hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <Badge className="absolute -top-1 -end-1 h-5 min-w-5 justify-center rounded-full bg-[#E55300] hover:bg-[#E55300]/90 px-1 text-[10px] font-black text-white shadow-sm border-2 border-background">
                {totalCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 pb-4 pt-3 sm:px-6 shadow-md">
          <div className="mx-auto max-w-2xl">
            <SmartSearchBar autoFocus onSelectProduct={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
