import { BRAND_NAME_AR, BRAND_NAME_EN } from "@/lib/brand";
import { useState } from "react";
import { Search, ShoppingBag, Menu, X, Store } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useSettings } from "@/lib/settings-context";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { SmartSearchBar } from "./SmartSearchBar";

export function Header() {
  const { totalCount } = useCart();
  const { isAdmin } = useAuth();
  const { t, lang } = useI18n();
  const settings = useSettings();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logoUrl = settings.logo_url;
  const siteName =
    settings.site_name || (lang === "ar" ? BRAND_NAME_AR : BRAND_NAME_EN);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* يسار: قائمة + بحث */}
        <div className="flex items-center gap-1">
          <Link
            to="/categories"
            aria-label={t("nav.categories") || "القائمة"}
            className="grid h-10 w-10 place-items-center rounded-2xl text-primary transition-colors hover:bg-secondary"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("search.placeholder") || "بحث"}
            className="grid h-10 w-10 place-items-center rounded-2xl text-primary transition-colors hover:bg-secondary"
          >
            {searchOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Search className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* منتصف: اسم المتجر / الشعار */}
        <Link to="/" className="flex items-center justify-center gap-2 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <Store className="h-5 w-5 text-primary" strokeWidth={2} />
          )}
          <span className="truncate text-base font-black tracking-tight text-foreground sm:text-lg font-display">
            {siteName}
          </span>
        </Link>

        {/* يمين: أدمن + وضع ليلي + مستخدم + سلة */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              aria-label={t("nav.admin") || "لوحة الإدارة"}
              className="grid h-10 px-2.5 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300 transition-colors hover:bg-amber-500/20 text-xs font-black gap-1 shadow-2xs border border-amber-500/20"
              title="لوحة تحكم الأدمن"
            >
              <div className="flex items-center gap-1">
                <span>👑</span>
                <span className="hidden sm:inline">الإدارة</span>
              </div>
            </Link>
          )}
          <ColorModeToggle className="rounded-2xl text-primary hover:bg-secondary" />
          <UserMenu />
          <Link
            id="cart-icon-target"
            to="/cart"
            aria-label={t("nav.cart")}
            className="relative grid h-10 w-10 place-items-center rounded-2xl text-foreground transition-colors hover:bg-secondary"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalCount > 0 && (
              <Badge className="absolute -top-0.5 -end-0.5 h-4 min-w-4 justify-center rounded-full hero-gradient px-1 text-[10px] font-black text-primary-foreground shadow-sm">
                {totalCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border/50 bg-card px-4 pb-4 pt-3 sm:px-6 shadow-md">
          <div className="mx-auto max-w-2xl">
            <SmartSearchBar autoFocus onSelectProduct={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
