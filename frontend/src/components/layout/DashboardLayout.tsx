"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dot-grid">
      {/* Mobile menu button */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden bg-white border border-gray-200 text-gray-600 p-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        <Header title={title} />
        <main className="flex-1 p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
