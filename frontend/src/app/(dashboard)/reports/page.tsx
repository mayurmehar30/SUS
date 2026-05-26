"use client";

import { useQuery } from "@tanstack/react-query";
import { useRequireRole } from "@/hooks/useRequireRole";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/api";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function ReportsPage() {
  const allowed = useRequireRole(["SUPER_ADMIN"]);
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders-reports"],
    queryFn: () => api.get("/orders").then(r => r.data),
  });

  const statusData = orders ? Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })) : [];

  const schoolData = orders ? Object.entries(
    orders.reduce((acc, o) => {
      const name = o.school?.name || "Unknown";
      if (!acc[name]) acc[name] = { name, orders: 0, revenue: 0 };
      acc[name].orders++;
      acc[name].revenue += o.grandTotal;
      return acc;
    }, {} as Record<string, { name: string; orders: number; revenue: number }>)
  ).map(([, v]) => v).sort((a, b) => b.revenue - a.revenue).slice(0, 10) : [];

  if (!allowed) return null;

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by School</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={schoolData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>School-wise Order Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">School</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Orders</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {schoolData.map(row => (
                  <tr key={row.name} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right">{row.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-600">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
