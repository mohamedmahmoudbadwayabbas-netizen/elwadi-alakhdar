import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ColorModeProvider } from "@/lib/color-mode-context";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Store, Database, Building2, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { BRAND_NAME_AR } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
      <div className="min-h-screen grid place-items-center bg-zinc-50 dark:bg-zinc-950" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" strokeWidth={1.5} />
          <p className="text-xs font-medium text-zinc-500">
            جاري التحقق من صلاحيات المسؤول...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <ColorModeProvider storageKey="admin-color-mode" defaultMode="light">
      <SidebarProvider>
        <div
          className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
          dir="rtl"
        >
          <AdminSidebar />
          <SidebarInset className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-4 sm:px-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer" />
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {BRAND_NAME_AR}
                  </span>
                  <span className="text-xs text-zinc-400 font-normal hidden sm:inline">/</span>
                  <span className="text-xs text-zinc-500 font-normal hidden sm:inline">
                    لوحة الإدارة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/admin/copilot">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer gap-1.5 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
                    <span className="hidden sm:inline">المساعد الذكي</span>
                  </Button>
                </Link>

                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

                <ColorModeToggle />

                <Link to="/" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer gap-1 text-xs"
                    title="معاينة المتجر"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="hidden md:inline">المتجر</span>
                  </Button>
                </Link>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ColorModeProvider>
  );
}

