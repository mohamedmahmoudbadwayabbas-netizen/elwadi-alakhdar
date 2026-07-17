import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ColorModeProvider } from "@/lib/color-mode-context";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — الوادي الأخضر" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) return;
    if (!loading && !user) router.history.push("/admin/login");
  }, [user, loading, router, isLoginRoute]);

  if (isLoginRoute) return <Outlet />;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold">وصول مرفوض</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            حسابك غير مخوّل بالوصول إلى لوحة التحكم.
          </p>
        </div>
      </div>
    );
  }

  return (
    // ColorModeProvider منفصل هنا (بدون forceMode) عشان الأدمن يقدر يبدّل بزراره الخاص،
    // مستقل عن اختيار المتجر العادي المحفوظ في localStorage تحت نفس المفتاح.
    <ColorModeProvider storageKey="admin-color-mode" defaultMode="dark">
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background" dir="rtl">
          <AdminSidebar />
          <SidebarInset className="flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
              <SidebarTrigger />
              <span className="font-display text-sm font-bold text-muted-foreground">لوحة التحكم</span>
              <div className="mr-auto">
                <ColorModeToggle />
              </div>
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ColorModeProvider>
  );
}
