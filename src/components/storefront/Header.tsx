import { Search, ShoppingBag, User, ShieldCheck, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header({ onSearch, query }: { onSearch: (q: string) => void; query: string }) {
  const { setOpen, totalCount, isAdmin, toggleAdmin } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-card">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-black leading-none text-foreground">بَركة</div>
            <div className="text-[11px] text-muted-foreground">سوبر ماركت وعطارة</div>
          </div>
        </Link>

        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="h-11 rounded-full border-border bg-secondary/50 pe-10 ps-4 text-sm focus-visible:bg-background"
          />
        </div>

        <Button
          variant={isAdmin ? "default" : "outline"}
          size="sm"
          onClick={toggleAdmin}
          className="hidden h-9 gap-1 rounded-full text-xs md:inline-flex"
          title="تفعيل وضع المسؤول (Dev)"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {isAdmin ? "Admin مفعّل" : "Dev Mode"}
        </Button>

        {isAdmin && (
          <Link to="/admin" className="hidden md:block">
            <Button variant="ghost" size="sm" className="h-9 rounded-full text-xs">لوحة التحكم</Button>
          </Link>
        )}

        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full">
          <User className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="relative h-10 w-10 shrink-0 rounded-full"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge className="absolute -top-1 -end-1 h-5 min-w-5 justify-center rounded-full bg-sale px-1 text-[10px] text-sale-foreground">
              {totalCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile dev toggle */}
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-1.5 md:hidden">
        <button
          onClick={toggleAdmin}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
        >
          <ShieldCheck className="h-3 w-3" />
          {isAdmin ? "Admin مفعّل" : "تفعيل وضع المسؤول"}
        </button>
        {isAdmin && (
          <Link to="/admin" className="text-[11px] font-bold text-primary">
            افتح لوحة التحكم ←
          </Link>
        )}
      </div>
    </header>
  );
}
