import { useState } from "react";
import { Search, ShoppingBag, Menu, LayoutDashboard, X, Leaf } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useSettings } from "@/lib/settings-context";
import { useSearch } from "@/lib/search-context";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";
import { ColorModeToggle } from "@/components/ColorModeToggle";

export function Header() {
  const { totalCount } = useCart();
  const { isAdmin } = useAuth();
  const { t, lang } = useI18n();
  const settings = useSettings();
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logoUrl = settings.logo_url;
  const siteName = settings.site_name || (lang === "ar" ? "هايبر الوادي - Hyper Wadi" : "Hyper Wadi");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value && pathname !== "/") navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        {/* يسار: قائمة + بحث */}
        <div className="flex items-center gap-1">
          <Link
            to="/categories"
            aria-label={t("nav.categories") || "القائمة"}
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t("search.placeholder") || "بحث"}
            className="grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
          >
            {searchOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Search className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>

        {/* منتصف: اسم المتجر / الشعار */}
        <Link to="/" className="flex items-center justify-center gap-2 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-9 w-auto object-contain" />
          ) : (
            <Leaf className="h-5 w-5 text-primary" strokeWidth={1.5} />
          )}
          <span className="truncate text-base font-medium tracking-tight text-primary sm:text-lg">
            {siteName}
          </span>
        </Link>

        {/* يمين: أدمن + وضع ليلي + مستخدم + سلة */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              aria-label={t("nav.admin")}
              className="hidden md:grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
            >
              <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          <ColorModeToggle className="rounded-full text-primary hover:bg-secondary" />
          <UserMenu />
          <Link
            id="cart-icon-target"
            to="/cart"
            aria-label={t("nav.cart")}
            className="relative grid h-10 w-10 place-items-center rounded-full text-primary transition-colors hover:bg-secondary"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalCount > 0 && (
              <Badge className="absolute -top-0.5 -end-0.5 h-4 min-w-4 justify-center rounded-full bg-accent px-1 text-[10px] font-normal text-accent-foreground">
                {totalCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border/40 bg-background px-5 pb-4 pt-3 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <Input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("search.placeholder")}
                className="h-11 rounded-full border-border bg-[#F9FAFB] dark:bg-secondary pe-10 ps-4 text-sm font-normal focus-visible:bg-white dark:focus-visible:bg-background"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}