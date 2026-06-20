import { Search, ShoppingBag, LayoutDashboard, LogIn, Leaf } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header({ onSearch, query }: { onSearch: (q: string) => void; query: string }) {
  const { setOpen, totalCount } = useCart();
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-elegant">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-xl font-bold leading-none text-foreground">الوادي الأخضر</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">سوبر ماركت وعطارة</div>
          </div>
        </Link>

        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث عن منتج، عطارة، توابل..."
            className="h-11 rounded-full border-border bg-secondary/40 pe-10 ps-4 text-sm focus-visible:bg-background"
          />
        </div>

        {isAdmin ? (
          <Link to="/admin" className="hidden md:block">
            <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-full text-xs">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </Button>
          </Link>
        ) : !user ? (
          <Link to="/auth" className="hidden md:block">
            <Button variant="ghost" size="sm" className="h-10 gap-1.5 rounded-full text-xs">
              <LogIn className="h-4 w-4" />
              دخول
            </Button>
          </Link>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="relative h-11 w-11 shrink-0 rounded-full"
          aria-label="السلة"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 min-w-5 justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
              {totalCount}
            </Badge>
          )}
        </Button>
      </div>

      {(isAdmin || !user) && (
        <div className="flex items-center justify-end gap-3 border-t border-border/40 bg-muted/30 px-3 py-1.5 md:hidden">
          {isAdmin ? (
            <Link to="/admin" className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
              <LayoutDashboard className="h-3 w-3" />
              لوحة التحكم
            </Link>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
              <LogIn className="h-3 w-3" />
              تسجيل دخول الأدمن
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
