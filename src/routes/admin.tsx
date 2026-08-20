import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ColorModeProvider } from "@/lib/color-mode-context";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Store, Database, Building2 } from "lucide-react";
import { BRAND_NAME_AR } from "@/lib/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: `لوحة التحكم — ${BRAND_NAME_AR}` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

export function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/admin/login";
  const { isAdmin, loading } = useAuth();

  // Strict Route Guard: Protect all /admin endpoints except /admin/login
  useEffect(() => {
    if (!loading && !isAdmin && !isLoginRoute) {
      router.history.push("/admin/login");
    }
  }, [isAdmin, loading, isLoginRoute, router]);

  if (isLoginRoute) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background" dir="rtl">
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl hero-gradient text-primary-foreground animate-pulse shadow-elegant">
            <Store className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            جاري التحقق من صلاحيات الإدارة عبر Supabase Auth...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <ColorModeProvider storageKey="admin-color-mode" defaultMode="dark">
      <SidebarProvider>
        <div
          className="flex min-h-screen w-full bg-background selection:bg-emerald-500 selection:text-white"
          dir="rtl"
        >
          <AdminSidebar />
          <SidebarInset className="flex-1 min-w-0">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
              <SidebarTrigger />

              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-black text-foreground">
                  {BRAND_NAME_AR}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">لوحة الإدارة</span>
              </div>

              {/* Verified Supabase Auth Badge */}
              <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>جلسة موثقة • Root Admin</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Branch quick info */}
              <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-foreground border border-border">
                <Building2 className="h-3 w-3 text-emerald-600" />
                <span>3 فروع نشطة (الدقي • مدينة نصر • المعادي)</span>
              </div>

              <div className="mr-auto flex items-center gap-2">
                <ColorModeToggle />
              </div>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ColorModeProvider>
  );
}
