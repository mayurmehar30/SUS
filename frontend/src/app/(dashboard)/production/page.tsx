"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/hooks/useRequireRole";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Order, OrderStatus } from "@/types";
import { formatDate, ORDER_STATUS_COLORS } from "@/lib/utils";
import api from "@/lib/api";

const PRODUCTION_STAGES: OrderStatus[] = ["APPROVED", "CUTTING", "STITCHING", "PACKING", "DISPATCHED"];

export default function ProductionPage() {
  const allowed = useRequireRole(["SUPER_ADMIN", "FACTORY_MANAGER"]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const queries = PRODUCTION_STAGES.map(status => ({
    status,
    query: useQuery<Order[]>({
      queryKey: ["orders", status],
      queryFn: () => api.get("/orders", { params: { status } }).then(r => r.data),
    }),
  }));

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/orders/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      PRODUCTION_STAGES.forEach(s => queryClient.invalidateQueries({ queryKey: ["orders", s] }));
      toast.success("Status updated");
    },
  });

  const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
    APPROVED: "CUTTING", CUTTING: "STITCHING", STITCHING: "PACKING", PACKING: "DISPATCHED", DISPATCHED: "DELIVERED",
  };

  if (!allowed) return null;

  return (
    <DashboardLayout title="Production Tracking">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {queries.map(({ status, query }) => (
          <div key={status} className="min-w-[200px]">
            <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg text-xs font-semibold ${ORDER_STATUS_COLORS[status]}`}>
              <span>{status}</span>
              <span className="ml-auto bg-white/50 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {query.data?.length ?? 0}
              </span>
            </div>
            <div className="space-y-3">
              {query.isLoading ? (
                [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                query.data?.map(order => (
                  <Card key={order.id} className="cursor-pointer hover:border-indigo-300 transition-colors">
                    <CardContent className="p-3">
                      <p className="font-mono text-xs font-semibold text-indigo-600 mb-1">
                        {order.orderNumber || `#${order.id}`}
                      </p>
                      <p className="text-sm font-medium text-gray-800 mb-1 truncate">{order.school?.name}</p>
                      <p className="text-xs text-gray-400">{order.items?.length ?? 0} items · {formatDate(order.createdAt)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 text-xs h-7"
                        onClick={() => NEXT[status] && statusMutation.mutate({ id: order.id, status: NEXT[status]! })}
                      >
                        Move → {NEXT[status]}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
              {!query.isLoading && query.data?.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No orders</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
