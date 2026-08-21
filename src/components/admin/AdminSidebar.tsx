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
import { BRAND_NAME_AR } from "@/lib/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavSection {
  label: string;
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    exact?: boolean;
    badge?: string;
    badgeVariant?: "emerald" | "amber" | "zinc";
  }[];
}

const navSections: NavSection[] = [
  {
    label: "الرئيسية والذكاء الاصطناعي",
    items: [
      {
        title: "لوحة المؤشرات",
        url: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "المساعد الذكي",
        url: "/admin/copilot",
        icon: Sparkles,
        badge: "AI 3.1",
        badgeVariant: "emerald",
      },
    ],
  },
  {
    label: "العمليات والمخزون",
    items: [
      {
        title: "المنتجات والمخزون",
        url: "/admin/products",
        icon: Package,
      },
      {
        title: "التصنيفات",
        url: "/admin/categories",
        icon: ListTree,
      },
      {
        title: "الطلبات والمبيعات",
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
        title: "مناطق التوصيل",
        url: "/admin/delivery-zones",
        icon: MapPin,
      },
      {
        title: "تقييمات العملاء",
        url: "/admin/reviews",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "النظام",
    items: [
      {
        title: "الإعدادات العامة",
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
    toast.info("تم تسجيل الخروج بنجاح");
    router.history.push("/admin/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      side="right"
      className="border-l border-zinc-200/80 bg-white dark:bg-zinc-900"
    >
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-zinc-100 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-emerald-600 shadow-xs">
            <Store className="h-4 w-4" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {BRAND_NAME_AR}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <Database className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={1.5} />
                <span className="truncate">لوحة التحكم السحابية</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Sidebar Navigation */}
      <SidebarContent className="px-3 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <SidebarGroup key={idx} className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-normal px-2 mb-1">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.url, item.exact);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "h-9 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                          active
                            ? "bg-zinc-100 text-emerald-700 font-semibold dark:bg-zinc-800 dark:text-emerald-400"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200",
                        )}
                      >
                        <Link
                          to={item.url}
                          className="flex items-center justify-between gap-2.5 w-full"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                active
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500",
                              )}
                              strokeWidth={1.5}
                            />
                            {!collapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </div>
                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-1.5 py-0.2 rounded-md shrink-0",
                                active
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
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

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-zinc-100 dark:border-zinc-800 p-3 space-y-1.5">
        {!collapsed && (
          <div className="px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" strokeWidth={1.5} />
              <span className="truncate text-zinc-600 dark:text-zinc-300 font-mono text-[10px]" dir="ltr">
                {user?.email || "admin@store.com"}
              </span>
            </div>
            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
              مسؤول
            </span>
          </div>
        )}

        <Link to="/" className="block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer h-8 px-2"
          >
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
            {!collapsed && <span>عرض المتجر</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer h-8 px-2"
        >
          <LogOut className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

