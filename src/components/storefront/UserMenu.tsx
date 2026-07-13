import { Link, useNavigate } from "@tanstack/react-router";
import { User, LogOut, Languages, Sun, Moon, UserCircle2, LogIn } from "lucide-react";
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
    toast.success(lang === "ar" ? "تم تسجيل الخروج" : "Signed out");
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label={t("menu.account")}>
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-56 bg-popover">
        {user ? (
          <>
            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Admin users see only dashboard link; regular users see account links */}
            {!isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/account" className="flex w-full cursor-pointer items-center gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  <span>{t("menu.account")}</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={toggleLang} className="cursor-pointer">
              <Languages className="h-4 w-4" />
              <span className="flex-1">{t("menu.language")}</span>
              <span className="text-xs text-muted-foreground">{lang === "ar" ? "EN" : "AR"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">{t("menu.theme")}</span>
              <span className="text-xs text-muted-foreground">
                {theme === "light" ? t("theme.dark") : t("theme.light")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>{t("menu.logout")}</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/auth" className="flex w-full cursor-pointer items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>{t("menu.login")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleLang} className="cursor-pointer">
              <Languages className="h-4 w-4" />
              <span className="flex-1">{t("menu.language")}</span>
              <span className="text-xs text-muted-foreground">{lang === "ar" ? "EN" : "AR"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">{t("menu.theme")}</span>
              <span className="text-xs text-muted-foreground">
                {theme === "light" ? t("theme.dark") : t("theme.light")}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
