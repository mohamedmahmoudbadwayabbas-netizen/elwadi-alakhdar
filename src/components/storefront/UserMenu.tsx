import { Link, useNavigate } from "@tanstack/react-router";
import {
  User,
  LogOut,
  Languages,
  Sun,
  Moon,
  UserCircle2,
  LogIn,
  LayoutDashboard,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const { t, lang, theme, toggleLang, toggleTheme, dir } = useI18n();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Signed out successfully");
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 shrink-0 rounded-2xl bg-secondary/60 hover:bg-secondary cursor-pointer"
          aria-label={t("menu.account")}
        >
          <User className="h-5 w-5" />
          {isAdmin && (
            <span
              className="absolute -top-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[9px] text-white font-black shadow-xs"
              title="مسؤول المتجر"
            >
              👑
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={dir === "rtl" ? "start" : "end"}
        className="w-60 rounded-2xl bg-popover/95 backdrop-blur-2xl p-2 shadow-2xl border border-border"
        dir="rtl"
      >
        {user ? (
          <>
            <DropdownMenuLabel className="p-2 text-xs">
              <div className="truncate font-bold text-foreground">{user.email}</div>
              {isAdmin ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="h-3 w-3" /> مسئول النظام (Admin)
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-normal">عميل مسجّل</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* رابط لوحة الإدارة يظهر حصراً وفقط إذا كان المستخدم Admin مؤكد */}
            {isAdmin && (
              <>
                <DropdownMenuItem
                  asChild
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 my-1 font-bold rounded-xl cursor-pointer"
                >
                  <Link to="/admin" className="flex w-full items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>لوحة تحكم الإدارة</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link to="/account" className="flex w-full items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-emerald-600" />
                <span>حسابي وطلباتي</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={toggleLang} className="cursor-pointer rounded-xl">
              <Languages className="h-4 w-4" />
              <span className="flex-1">{t("menu.language")}</span>
              <span className="text-xs text-muted-foreground font-bold">{lang === "ar" ? "EN" : "AR"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer rounded-xl">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">{t("menu.theme")}</span>
              <span className="text-xs text-muted-foreground font-bold">
                {theme === "light" ? t("theme.dark") : t("theme.light")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive rounded-xl font-bold"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("menu.logout")}</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link
                to="/auth"
                search={{ next: undefined }}
                className="flex w-full items-center gap-2 font-bold"
              >
                <LogIn className="h-4 w-4 text-emerald-600" />
                <span>تسجيل الدخول / حساب جديد</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleLang} className="cursor-pointer rounded-xl">
              <Languages className="h-4 w-4" />
              <span className="flex-1">{t("menu.language")}</span>
              <span className="text-xs text-muted-foreground font-bold">{lang === "ar" ? "EN" : "AR"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer rounded-xl">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">{t("menu.theme")}</span>
              <span className="text-xs text-muted-foreground font-bold">
                {theme === "light" ? t("theme.dark") : t("theme.light")}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
