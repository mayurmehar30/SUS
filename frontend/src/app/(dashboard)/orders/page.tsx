"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, Lock, LockOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from "@/lib/utils";
import api from "@/lib/api";

const STATUSES: OrderStatus[] = ["SUBMITTED","APPROVED","CUTTING","STITCHING","PACKING","DISPATCHED","DELIVERED","CANCELLED"];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  SUBMITTED: "APPROVED",
  APPROVED: "CUTTING",
  CUTTING: "STITCHING",
  STITCHING: "PACKING",
  PACKING: "DISPATCHED",
  DISPATCHED: "DELIVERED",
};

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders", statusFilter],
    queryFn: () => api.get("/orders", { params: statusFilter !== "all" ? { status: statusFilter } : {} }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/orders/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, lock }: { id: number; lock: boolean }) =>
      api.post(`/orders/${id}/${lock ? "lock" : "unlock"}`),
    onSuccess: (_, { lock }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(lock ? "Order locked" : "Order unlocked");
    },
    onError: () => toast.error("Failed to update lock"),
  });

  return (
    <DashboardLayout title="Orders">
      {/* Filter chips */}
      <div className="flex gap-1.5 mb-5 flex-wrap animate-fade-in">
        {["all", ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">School</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Items</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Lock</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders?.map((order, i) => (
                  <tr key={order.id} className="hover:bg-gray-50/40 transition-colors group animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        {order.orderNumber || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-gray-800">{order.school?.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{order.items?.length ?? 0} items</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-gray-900">{formatCurrency(order.grandTotal)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <button
                        onClick={() => lockMutation.mutate({ id: order.id, lock: !order.locked })}
                        title={order.locked ? "Unlock order" : "Lock order"}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          order.locked
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                        }`}
                      >
                        {order.locked
                          ? <><Lock className="h-3 w-3" /> Locked</>
                          : <><LockOpen className="h-3 w-3" /> Open</>}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => statusMutation.mutate({ id: order.id, status: NEXT_STATUS[order.status]! })}
                            className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            {NEXT_STATUS[order.status]} <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-gray-400">No orders found</td>
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
