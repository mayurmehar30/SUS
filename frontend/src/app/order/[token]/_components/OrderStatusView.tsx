"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, ChevronDown, ChevronUp, Users, History } from "lucide-react";
import { Order, ClassStudentCount } from "@/types";
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_COLORS } from "@/lib/utils";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090/api").replace(/\/api$/, "");
function imgSrc(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}
import { UniformSet } from "./types";
import StudentCountsStep from "./StudentCountsStep";
import api from "@/lib/api";

interface Props {
  order: Order;
  token: string;
  classRows: ClassStudentCount[];
  onUpdateRow: (idx: number, field: "boysCount" | "girlsCount", value: number) => void;
}

export default function OrderStatusView({ order, token, classRows, onUpdateRow }: Props) {
  const router = useRouter();
  const [showItems, setShowItems] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  function toggleItemExpand(id: number) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isLocked = !!order.locked;
  const isDelivered = order.status === "DELIVERED";
  const canPlaceNewOrder = isLocked || isDelivered;
  const countsLocked = isLocked || isDelivered;

  const newOrderMutation = useMutation({
    mutationFn: () => api.post(`/orders/public/${token}/new-order`).then(r => r.data),
    onSuccess: (data) => {
      toast.success("New order created!");
      router.push(`/order/${data.orderToken}`);
    },
    onError: () => toast.error("Failed to create new order. Please try again."),
  });

  const totalQty = order.items?.reduce((s, i) => s + i.totalQuantity, 0) ?? 0;
  const statusBadge = ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-5">

      {/* Status Banner */}
      {canPlaceNewOrder ? (
        <div className={`rounded-2xl px-5 py-4 border flex items-start gap-3 ${
          isDelivered
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <span className="text-2xl flex-shrink-0 mt-0.5">{isDelivered ? "🎉" : "🔒"}</span>
          <div>
            <p className={`font-bold text-base ${isDelivered ? "text-green-800" : "text-amber-800"}`}>
              {isDelivered ? "Order Delivered!" : "Order Locked"}
            </p>
            <p className={`text-sm mt-0.5 ${isDelivered ? "text-green-600" : "text-amber-600"}`}>
              {isDelivered
                ? "Your uniforms have been delivered. You can now place a new order for the next season."
                : "Admin has locked this order. No further changes can be made. You can start a new order below."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">📋</span>
          <div>
            <p className="font-bold text-base text-indigo-800">Order In Progress</p>
            <p className="text-sm mt-0.5 text-indigo-600">
              Your order is being processed. You can still update student counts below until the order is locked.
            </p>
          </div>
        </div>
      )}

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Order Number</p>
            <p className="font-bold text-gray-900 font-mono text-base">{order.orderNumber || `#${order.id}`}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}>
            {order.status}
          </span>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">School</p>
            <p className="text-sm font-semibold text-gray-800">{order.school?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Submitted On</p>
            <p className="text-sm font-semibold text-gray-800">
              {order.submittedAt ? formatDate(order.submittedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Pieces</p>
            <p className="text-sm font-semibold text-gray-800">{totalQty} pcs</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Grand Total</p>
            <p className="text-sm font-bold text-indigo-600">{formatCurrency(order.grandTotal)}</p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="px-5 pb-4 space-y-1.5 border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700 font-medium">{formatCurrency(order.totalAmount)}</span>
          </div>
          {order.gstAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">GST (incl. in prices)</span>
              <span className="text-gray-500">{formatCurrency(order.gstAmount)}</span>
            </div>
          )}
          {(order.specialDiscount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium">Special Discount</span>
              <span className="text-green-600 font-medium">- {formatCurrency(order.specialDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base border-t border-gray-100 pt-2 mt-1">
            <span className="font-bold text-gray-900">Grand Total</span>
            <span className="font-black text-indigo-700">{formatCurrency(order.grandTotal)}</span>
          </div>
          {(order.advanceAmount ?? 0) > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Advance Paid</span>
                <span className="text-emerald-600 font-medium">- {formatCurrency(order.advanceAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-semibold">Remaining</span>
                <span className={`font-bold ${(order.remainingAmount ?? 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {formatCurrency(order.remainingAmount ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Collapsible items */}
        {order.items && order.items.length > 0 && (
          <>
            <button
              className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowItems(v => !v)}
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" />
                Order Items ({order.items.length} products)
              </span>
              {showItems
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {showItems && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {order.items.map(item => {
                  const src = imgSrc(item.productImageUrl);
                  const isExpanded = expandedItems.has(item.id);
                  const hasCounts = item.classStudentCounts && item.classStudentCounts.length > 0;
                  return (
                    <div key={item.id}>
                      <div className="px-5 py-3 flex items-center gap-3">
                        {src ? (
                          <img src={src} alt={item.productName}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-indigo-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                          {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                          {hasCounts && (
                            <button
                              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                              onClick={() => toggleItemExpand(item.id)}
                            >
                              <Users className="h-3 w-3" />
                              {isExpanded ? "Hide class counts" : "Show class counts"}
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-700">{item.totalQuantity} pcs</p>
                          <p className="text-xs text-indigo-600 font-medium">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                      {isExpanded && hasCounts && (
                        <div className="mx-5 mb-3 rounded-xl border border-gray-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 text-left font-medium">Class</th>
                                <th className="px-3 py-2 text-center font-medium">Boys</th>
                                <th className="px-3 py-2 text-center font-medium">Girls</th>
                                <th className="px-3 py-2 text-center font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {item.classStudentCounts.map((c, ci) => (
                                <tr key={ci} className="bg-white">
                                  <td className="px-3 py-1.5 text-gray-700 font-medium">{c.className}</td>
                                  <td className="px-3 py-1.5 text-center text-gray-600">{c.boysCount}</td>
                                  <td className="px-3 py-1.5 text-center text-gray-600">{c.girlsCount}</td>
                                  <td className="px-3 py-1.5 text-center font-semibold text-gray-800">{c.totalCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="px-5 py-3 space-y-1 bg-gray-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700 font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  {(order.specialDiscount ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Special Discount</span>
                      <span className="text-green-600">- {formatCurrency(order.specialDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-1.5">
                    <span className="text-sm font-bold text-gray-800">Grand Total</span>
                    <span className="text-base font-black text-indigo-700">{formatCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Edit History */}
      {order.adminEdits && order.adminEdits.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-100">
            <History className="h-4 w-4 text-indigo-400" />
            <p className="font-semibold text-gray-800 text-sm">Order Updates</p>
            <span className="ml-auto text-xs text-gray-400">{order.adminEdits.length} change{order.adminEdits.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {order.adminEdits.map(edit => (
              <div key={edit.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-indigo-600">{edit.editedBy}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(edit.editedAt)}</p>
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-line">{edit.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Counts + History */}
      <StudentCountsStep
        classRows={classRows}
        uniforms={[] as UniformSet[]}
        token={token}
        onUpdateRow={onUpdateRow}
        locked={countsLocked}
      />

      {/* Place New Order */}
      {canPlaceNewOrder && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-6 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plus className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="font-bold text-gray-900 mb-1">Ready for a new order?</p>
          <p className="text-sm text-gray-400 mb-4">
            Start a fresh uniform order for {order.school?.name}.
          </p>
          <button
            onClick={() => newOrderMutation.mutate()}
            disabled={newOrderMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {newOrderMutation.isPending ? "Creating..." : "Place New Order"}
          </button>
        </div>
      )}
    </div>
  );
}
