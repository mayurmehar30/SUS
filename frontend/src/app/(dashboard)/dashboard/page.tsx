"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2, ClipboardList, Factory, IndianRupee,
  TrendingUp, ArrowUpRight, ArrowRight, Sparkles,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from "@/lib/utils";
import { DashboardStats, Order } from "@/types";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const mockMonthlyData = [
  { month: "Jan", revenue: 120000 },
  { month: "Feb", revenue: 180000 },
  { month: "Mar", revenue: 240000 },
  { month: "Apr", revenue: 160000 },
  { month: "May", revenue: 310000 },
  { month: "Jun", revenue: 280000 },
];

const statConfig = [
  {
    key: "totalSchools",
    label: "Total Schools",
    icon: Building2,
    gradient: "from-sky-400 to-blue-600",
    glow: "shadow-sky-200",
    pill: "bg-sky-50 text-sky-700",
    format: (v: number) => String(v),
    trend: "+2 this month",
  },
  {
    key: "pendingOrders",
    label: "Pending Orders",
    icon: ClipboardList,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-200",
    pill: "bg-amber-50 text-amber-700",
    format: (v: number) => String(v),
    trend: "Awaiting review",
  },
  {
    key: "inProductionOrders",
    label: "In Production",
    icon: Factory,
    gradient: "from-violet-400 to-purple-600",
    glow: "shadow-violet-200",
    pill: "bg-violet-50 text-violet-700",
    format: (v: number) => String(v),
    trend: "Active batches",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: IndianRupee,
    gradient: "from-emerald-400 to-teal-600",
    glow: "shadow-emerald-200",
    pill: "bg-emerald-50 text-emerald-700",
    format: (v: number) => formatCurrency(v),
    trend: "+12% vs last month",
  },
];

const pipelineRows = [
  { key: "pendingOrders",      label: "Submitted",     bar: "bg-blue-500",    badge: "bg-blue-50 text-blue-700"    },
  { key: "inProductionOrders", label: "In Production", bar: "bg-violet-500",  badge: "bg-violet-50 text-violet-700" },
  { key: "activeOrders",       label: "Active",        bar: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700" },
  { key: "deliveredOrders",    label: "Delivered",     bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/dashboard/stats").then(r => r.data),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["orders-recent"],
    queryFn: () => api.get("/orders").then(r => r.data.slice(0, 5)),
  });

  return (
    <DashboardLayout title="Dashboard">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 mb-6 text-white animate-fade-in">
        {/* decorative blobs */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute right-8 top-6 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-indigo-200 font-medium mb-0.5">{greeting()},</p>
            <h2 className="text-2xl font-bold tracking-tight">{user?.name ?? "Admin"}</h2>
            <p className="text-sm text-indigo-200 mt-1.5">
              Here&rsquo;s what&rsquo;s happening with your uniform orders today.
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <Sparkles className="h-7 w-7 text-white/80" />
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statConfig.map(({ key, label, icon: Icon, gradient, glow, pill, format, trend }, i) => {
          const raw = stats?.[key as keyof DashboardStats] ?? 0;
          const value = format(typeof raw === "number" ? raw : 0);
          return (
            <div
              key={key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-md ${glow}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-200" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-28 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
              )}
              <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${pill}`}>
                {trend}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Chart + Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Revenue chart */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up"
          style={{ animationDelay: "380ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Monthly Revenue</p>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months overview</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +18%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={mockMonthlyData} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", fontSize: "12px", padding: "10px 14px" }}
                cursor={{ fill: "#f8fafc", radius: 8 }}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {mockMonthlyData.map((_, i) => (
                  <Cell key={i} fill={i === mockMonthlyData.length - 1 ? "#6366f1" : "#e0e7ff"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order pipeline */}
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up"
          style={{ animationDelay: "460ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-900">Order Pipeline</p>
            <Link href="/orders" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {pipelineRows.map(({ key, label, bar, badge }) => {
                const val = stats?.[key as keyof DashboardStats] ?? 0;
                const total = (stats?.pendingOrders ?? 0) + (stats?.inProductionOrders ?? 0) + (stats?.activeOrders ?? 0) + (stats?.deliveredOrders ?? 0);
                const pct = total > 0 ? Math.round(((val as number) / total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{String(val)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up"
        style={{ animationDelay: "540ms" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <p className="text-sm font-semibold text-gray-900">Recent Orders</p>
            <p className="text-xs text-gray-400 mt-0.5">Latest activity across all schools</p>
          </div>
          <Link href="/orders" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {ordersLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">School</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders?.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {order.orderNumber || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-800">{order.school?.name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-900">{formatCurrency(order.grandTotal)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-sm text-gray-400">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
