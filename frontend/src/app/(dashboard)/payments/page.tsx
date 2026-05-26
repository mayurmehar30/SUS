"use client";

import { useQuery } from "@tanstack/react-query";
import { useRequireRole } from "@/hooks/useRequireRole";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";

export default function PaymentsPage() {
  const allowed = useRequireRole(["SUPER_ADMIN"]);
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders-payments"],
    queryFn: () => api.get("/orders").then(r =>
      r.data.filter((o: Order) => o.status !== "DRAFT" && o.status !== "CANCELLED")
    ),
  });

  const paymentColor = (status: string) => {
    if (status === "PAID") return "success";
    if (status === "PARTIAL") return "warning";
    return "destructive";
  };

  if (!allowed) return null;

  return (
    <DashboardLayout title="Payments">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Outstanding", value: orders?.reduce((s, o) => s + o.remainingAmount, 0) ?? 0, color: "text-red-600" },
          { label: "Total Advance Received", value: orders?.reduce((s, o) => s + o.advanceAmount, 0) ?? 0, color: "text-green-600" },
          { label: "Total Order Value", value: orders?.reduce((s, o) => s + o.grandTotal, 0) ?? 0, color: "text-indigo-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">School</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Advance</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Remaining</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map(order => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">{order.orderNumber || `#${order.id}`}</td>
                      <td className="px-4 py-3 font-medium">{order.school?.name}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.grandTotal)}</td>
                      <td className="px-4 py-3 text-green-600">{formatCurrency(order.advanceAmount)}</td>
                      <td className="px-4 py-3 text-red-500 font-medium">{formatCurrency(order.remainingAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={paymentColor(order.paymentStatus) as "success" | "warning" | "destructive"}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!orders || orders.length === 0) && (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-400">No payment data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
