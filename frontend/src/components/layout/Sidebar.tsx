"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Package, ClipboardList,
  Factory, CreditCard, BarChart3, Settings, LogOut,
  X, ChevronLeft, ChevronRight, Tag, Store,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, roles: ["SUPER_ADMIN", "SALESMAN", "FACTORY_MANAGER"], color: { bg: "bg-indigo-500/20", text: "text-indigo-300", icon: "text-indigo-400", dot: "bg-indigo-400" } },
  { href: "/schools",    label: "Schools",     icon: Building2,       roles: ["SUPER_ADMIN", "SALESMAN"],                   color: { bg: "bg-sky-500/20",    text: "text-sky-300",    icon: "text-sky-400",    dot: "bg-sky-400"    } },
  { href: "/orders",     label: "Orders",      icon: ClipboardList,   roles: ["SUPER_ADMIN", "SALESMAN", "FACTORY_MANAGER"], color: { bg: "bg-amber-500/20",  text: "text-amber-300",  icon: "text-amber-400",  dot: "bg-amber-400"  } },
  { href: "/catalog",    label: "Catalog",     icon: Package,         roles: ["SUPER_ADMIN", "SALESMAN", "FACTORY_MANAGER"], color: { bg: "bg-violet-500/20", text: "text-violet-300", icon: "text-violet-400", dot: "bg-violet-400" } },
  { href: "/categories", label: "Categories",  icon: Tag,             roles: ["SUPER_ADMIN"],                               color: { bg: "bg-emerald-500/20",text: "text-emerald-300",icon: "text-emerald-400",dot: "bg-emerald-400"} },
  { href: "/vendors",    label: "Vendors",     icon: Store,           roles: ["SUPER_ADMIN"],                               color: { bg: "bg-rose-500/20",   text: "text-rose-300",   icon: "text-rose-400",   dot: "bg-rose-400"   } },
  { href: "/production", label: "Production",  icon: Factory,         roles: ["SUPER_ADMIN", "FACTORY_MANAGER"],            color: { bg: "bg-orange-500/20", text: "text-orange-300", icon: "text-orange-400", dot: "bg-orange-400" } },
  { href: "/payments",   label: "Payments",    icon: CreditCard,      roles: ["SUPER_ADMIN"],                               color: { bg: "bg-teal-500/20",   text: "text-teal-300",   icon: "text-teal-400",   dot: "bg-teal-400"   } },
  { href: "/reports",    label: "Reports",     icon: BarChart3,       roles: ["SUPER_ADMIN"],                               color: { bg: "bg-cyan-500/20",   text: "text-cyan-300",   icon: "text-cyan-400",   dot: "bg-cyan-400"   } },
  { href: "/settings",   label: "Settings",    icon: Settings,        roles: ["SUPER_ADMIN", "SALESMAN", "FACTORY_MANAGER"], color: { bg: "bg-slate-500/20",  text: "text-slate-300",  icon: "text-slate-400",  dot: "bg-slate-400"  } },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => {
    const visible = navItems.filter(item => !user?.role || item.roles.includes(user.role));

    return (
      <div className="flex flex-col h-full bg-slate-900">
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-slate-800 shrink-0",
          collapsed && !mobile ? "px-3 py-4 justify-center" : "px-5 py-4 gap-3"
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
            <span className="text-white font-bold text-[11px] tracking-wide">SUS</span>
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Uniform Manager</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">School Portal</p>
            </div>
          )}
          {!mobile && (
            <button
              onClick={onToggleCollapse}
              className="ml-auto text-slate-600 hover:text-slate-300 transition-colors shrink-0 p-1 rounded-md hover:bg-slate-800"
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          )}
          {mobile && (
            <button onClick={onCloseMobile} className="ml-auto text-slate-400 hover:text-slate-200 p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visible.map(({ href, label, icon: Icon, color }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={mobile ? onCloseMobile : undefined}
                title={collapsed && !mobile ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-150 group",
                  collapsed && !mobile ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? `${color.bg} ${color.text} font-semibold`
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 font-medium"
                )}
              >
                <Icon className={cn(
                  "h-[17px] w-[17px] shrink-0 transition-colors",
                  isActive ? color.icon : "text-slate-500 group-hover:text-slate-300"
                )} />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
                {(!collapsed || mobile) && isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          {collapsed && !mobile ? (
            <div className="flex flex-col items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-default"
                title={user?.name}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 leading-tight truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate capitalize">
                  {user?.role?.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onCloseMobile} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent mobile />
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col h-screen fixed left-0 top-0 z-30 border-r border-slate-800 transition-all duration-300 shadow-xl shadow-black/20",
        collapsed ? "w-16" : "w-60"
      )}>
        <NavContent />
      </aside>
    </>
  );
}
