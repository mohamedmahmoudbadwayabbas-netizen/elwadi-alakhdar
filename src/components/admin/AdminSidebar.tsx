import { Link, useRouterState } from "@tanstack/react-router";
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
  Leaf,
  ExternalLink,
  Ticket,
  MessageSquare,
  UserCircle2,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const items = [
  { title: "نظرة عامة", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "المنتجات", url: "/admin/products", icon: Package },
  { title: "التصنيفات", url: "/admin/categories", icon: ListTree },
  { title: "البانرات", url: "/admin/banners", icon: ImageIcon },
  { title: "الطلبات", url: "/admin/orders", icon: Receipt },
  { title: "مناطق التوصيل", url: "/admin/delivery-zones", icon: MapPin },
  { title: "الكوبونات", url: "/admin/coupons", icon: Ticket },
  { title: "التقييمات", url: "/admin/reviews", icon: MessageSquare },
  { title: "الملف الشخصي", url: "/admin/profile", icon: UserCircle2 },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl hero-gradient text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold text-sidebar-foreground">
                سمارت ستور
              </div>
              <div className="truncate text-[10px] text-muted-foreground">لوحة التحكم</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Link to="/" className="block">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <ExternalLink className="h-4 w-4" />
            {!collapsed && "عرض المتجر"}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && (user?.email?.slice(0, 16) ?? "خروج")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
