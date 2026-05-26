"use client";

import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm shadow-slate-200/40">
      {/* Left: title */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
        <h1 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      {/* Right: search + bell + user */}
      <div className="flex items-center gap-2">
        {/* Search pill */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm">
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 text-[10px] text-slate-300 font-mono border border-slate-200 rounded px-1 py-0.5">⌘K</kbd>
        </button>

        {/* Bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-1 ring-slate-50" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-200">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-700 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 leading-tight capitalize">{user?.role?.replace(/_/g, " ").toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
