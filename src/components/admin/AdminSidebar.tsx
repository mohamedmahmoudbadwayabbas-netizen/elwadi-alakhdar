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
  Building2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BRAND_NAME_AR } from "@/lib/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavSection {
  label: string;
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: string;
    badgeVariant?: "emerald" | "amber" | "blue";
  }[];
}

const navSections: NavSection[] = [
  {
    label: "الرئيسية والذكاء الاصطناعي",
    items: [
      {
        title: "نظرة عامة والتحليلات",
        url: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "المساعد الذكي (Gemini AI)",
        url: "/admin/copilot",
        icon: Sparkles,
        badge: "Gemini 3.1",
        badgeVariant: "amber",
      },
    ],
  },
  {
    label: "إدارة العمليات والمخزون",
    items: [
      {
        title: "المنتجات والمخزون (3 فروع)",
        url: "/admin/products",
        icon: Package,
      },
      {
        title: "التصنيفات والسلع",
        url: "/admin/categories",
        icon: ListTree,
      },
      {
        title: "الطلبات والمبيعات الحية",
        url: "/admin/orders",
        icon: Receipt,
      },
    ],
  },
  {
    label: "التسويق والخدمات",
    items: [
      {
        title: "العروض والبانرات",
        url: "/admin/banners",
        icon: ImageIcon,
      },
      {
        title: "الكوبونات والخصومات",
        url: "/admin/coupons",
        icon: Ticket,
      },
      {
        title: "مناطق وفروع التوصيل",
        url: "/admin/delivery-zones",
        icon: MapPin,
      },
      {
        title: "آراء وتقييمات العملاء",
        url: "/admin/reviews",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "المنظومة",
    items: [
      {
        title: "إعدادات الفروع والسلسلة",
        url: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function AdminSidebar() {
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await signOut();
    toast.info("تم تسجيل الخروج بنجاح من لوحة الإدارة");
    router.history.push("/admin/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      side="right"
      className="border-l border-border/80 bg-sidebar/95 backdrop-blur-xl"
    >
      {/* Sidebar Header: Brand + Branch Database Status */}
      <SidebarHeader className="border-b border-sidebar-border p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-md ring-2 ring-emerald-500/20">
            <Store className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-sidebar ring-1 ring-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-black text-sidebar-foreground">
                {BRAND_NAME_AR}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                <Database className="h-3 w-3 shrink-0" />
                <span className="truncate">3 فروع • متصل بالسحابة</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Sidebar Grouped Navigation Content */}
      <SidebarContent className="px-2 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <SidebarGroup key={idx} className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-wider px-2 mb-1.5">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.url, item.exact);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "h-10 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer",
                          active
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-600 hover:text-white"
                            : "text-sidebar-foreground/80 hover:bg-secondary/70 hover:text-sidebar-foreground",
                        )}
                      >
                        <Link
                          to={item.url}
                          className="flex items-center justify-between gap-2.5 w-full"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform",
                                active
                                  ? "text-white"
                                  : "text-emerald-600 dark:text-emerald-400",
                              )}
                            />
                            {!collapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </div>
                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-xs",
                                active
                                  ? "bg-white/20 text-white"
                                  : item.badgeVariant === "amber"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Sidebar Footer: Admin Profile & Actions */}
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2 bg-sidebar/50">
        {!collapsed && (
          <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                <span>حساب الإدارة</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Root Admin
              </span>
            </div>
            <div className="font-mono text-foreground font-bold truncate text-[11px]" dir="ltr">
              {user?.email || "admin@store.com"}
            </div>
          </div>
        )}

        <Link to="/" className="block">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs font-bold rounded-xl border-border/80 hover:bg-secondary cursor-pointer h-9"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            {!collapsed && <span>معاينة واجهة المتجر</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl cursor-pointer h-9"
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && <span>تسجيل الخروج الآمن</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
