import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ListTree,
  Receipt,
  Settings,
  LogOut,
  Store,
  ExternalLink,
  Ticket,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  ShieldCheck,
  Database,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BRAND_NAME_AR, ADMIN_PRIMARY_EMAIL } from "@/lib/brand";
import { toast } from "sonner";

const items = [
  { title: "نظرة عامة والتحليلات", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "الذكاء الاصطناعي (Gemini AI)", url: "/admin/copilot", icon: Sparkles, badge: "Gemini 3.1 Pro" },
  { title: "المنتجات والمخزون (3 فروع)", url: "/admin/products", icon: Package },
  { title: "التصنيفات والسلع", url: "/admin/categories", icon: ListTree },
  { title: "العروض والبانرات", url: "/admin/banners", icon: ImageIcon },
  { title: "الطلبات والمبيعات", url: "/admin/orders", icon: Receipt },
  { title: "مناطق وفروع التوصيل", url: "/admin/delivery-zones", icon: MapPin },
  { title: "الكوبونات والخصومات", url: "/admin/coupons", icon: Ticket },
  { title: "آراء وتقييمات العملاء", url: "/admin/reviews", icon: MessageSquare },
  { title: "إعدادات الفروع والسلسلة", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { signOut } = useAuth();

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await signOut();
    toast.info("تم تسجيل الخروج بنجاح من لوحة الإدارة");
    router.history.push("/admin/login");
  };

  return (
    <Sidebar collapsible="icon" side="right" className="border-l border-border/80">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-black text-sidebar-foreground">
                {BRAND_NAME_AR}
              </div>
              <div className="truncate text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>3 فروع • Supabase DB</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase text-muted-foreground">
            لوحة الإدارة والتحكم
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    className="font-bold text-xs rounded-xl"
                  >
                    <Link to={item.url} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0 text-emerald-600" />
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/60 text-[11px] space-y-1">
            <div className="font-mono text-muted-foreground truncate text-[10px]">
              {ADMIN_PRIMARY_EMAIL}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Root Admin • متصل</span>
            </div>
          </div>
        )}

        <Link to="/" className="block">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs font-bold rounded-xl">
            <ExternalLink className="h-4 w-4" />
            {!collapsed && "معاينة واجهة المتجر"}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "تسجيل الخروج"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
