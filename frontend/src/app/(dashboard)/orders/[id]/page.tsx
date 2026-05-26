"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, X, Save, History } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus, Product } from "@/types";
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const WORKFLOW: OrderStatus[] = ["SUBMITTED","APPROVED","CUTTING","STITCHING","PACKING","DISPATCHED","DELIVERED"];
const PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID"] as const;

type EditItemState = {
  id: number;
  unitPrice: string;
  notes: string;
  newProductId?: number;
  newProductName?: string;
  classStudentCounts: Array<{
    id?: number;
    className: string;
    boysCount: number;
    girlsCount: number;
    remarks?: string;
  }>;
};

type EditState = {
  notes: string;
  advanceAmount: string;
  paymentStatus: string;
  specialDiscount: string;
  gstPercent: string;
  items: EditItemState[];
};

function buildEditState(order: Order): EditState {
  const gstPct = order.totalAmount > 0
    ? String(Math.round((order.gstAmount / order.totalAmount) * 100))
    : "0";
  return {
    notes: order.notes ?? "",
    advanceAmount: String(Math.round(order.advanceAmount ?? 0)),
    paymentStatus: order.paymentStatus,
    specialDiscount: String(Math.round(order.specialDiscount ?? 0)),
    gstPercent: gstPct,
    items: order.items.map(item => {
      // Use the school's full class list so admin can add counts for missing classes.
      // Fall back to the item's existing counts if the school has no classNames configured.
      const classNames =
        order.school.classNames && order.school.classNames.length > 0
          ? order.school.classNames
          : item.classStudentCounts.map(c => c.className);

      return {
        id: item.id,
        unitPrice: String(Math.round(item.unitPrice)),
        notes: item.notes ?? "",
        classStudentCounts: classNames.map(className => {
          const existing = item.classStudentCounts.find(c => c.className === className);
          return {
            id: existing?.id,
            className,
            boysCount: existing?.boysCount ?? 0,
            girlsCount: existing?.girlsCount ?? 0,
            remarks: existing?.remarks ?? "",
          };
        }),
      };
    }),
  };
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [editMode, setEditMode] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [changingProductIdx, setChangingProductIdx] = useState<number | null>(null);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/orders/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["order", id] }); toast.success("Status updated"); },
  });

  const changingItemId = changingProductIdx !== null && order
    ? order.items[changingProductIdx]?.id
    : null;

  const { data: alternativeProducts, isLoading: alternativesLoading } = useQuery<Product[]>({
    queryKey: ["item-alternatives", changingItemId],
    queryFn: () => api.get(`/orders/items/${changingItemId}/alternatives`).then(r => r.data),
    enabled: changingItemId != null,
    staleTime: 30_000,
  });

  const editMutation = useMutation({
    mutationFn: (payload: object) => api.put(`/orders/${id}/edit`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setEditMode(false);
      toast.success("Order updated");
    },
    onError: () => toast.error("Failed to save changes"),
  });

  function startEdit() {
    if (order) {
      setEditState(buildEditState(order));
      setEditMode(true);
    }
  }

  function cancelEdit() {
    setEditMode(false);
    setEditState(null);
    setChangingProductIdx(null);
  }

  function saveEdit() {
    if (!editState) return;
    const payload = {
      notes: editState.notes,
      advanceAmount: parseFloat(editState.advanceAmount) || 0,
      paymentStatus: editState.paymentStatus,
      specialDiscount: parseFloat(editState.specialDiscount) || 0,
      gstPercent: parseFloat(editState.gstPercent) || 0,
      items: editState.items.map(item => ({
        id: item.id,
        ...(item.newProductId ? { newProductId: item.newProductId } : {}),
        unitPrice: parseFloat(item.unitPrice) || 0,
        notes: item.notes,
        classStudentCounts: item.classStudentCounts.map(c => ({
          id: c.id,
          className: c.className,
          boysCount: c.boysCount,
          girlsCount: c.girlsCount,
          remarks: c.remarks,
        })),
      })),
    };
    editMutation.mutate(payload);
  }

  function updateItemField(itemIdx: number, field: keyof EditItemState, value: string) {
    setEditState(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[itemIdx] = { ...items[itemIdx], [field]: value };
      return { ...prev, items };
    });
  }

  function updateCount(itemIdx: number, countIdx: number, field: "boysCount" | "girlsCount", value: number) {
    setEditState(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const counts = [...items[itemIdx].classStudentCounts];
      counts[countIdx] = { ...counts[countIdx], [field]: value };
      items[itemIdx] = { ...items[itemIdx], classStudentCounts: counts };
      return { ...prev, items };
    });
  }

  if (isLoading) return (
    <DashboardLayout title="Order Details">
      <Skeleton className="h-96 w-full" />
    </DashboardLayout>
  );

  if (!order) return <DashboardLayout title="Order Details"><p>Order not found</p></DashboardLayout>;

  const currentStep = WORKFLOW.indexOf(order.status as OrderStatus);

  return (
    <DashboardLayout title={`Order ${order.orderNumber || "#" + order.id}`}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Button>
        {isSuperAdmin && !editMode && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Order
          </Button>
        )}
        {isSuperAdmin && editMode && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={editMutation.isPending}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={editMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* School info */}
          <Card>
            <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">School</p><p className="font-medium">{order.school?.name}</p></div>
              <div><p className="text-gray-500">Code</p><p className="font-medium font-mono">{order.school?.schoolCode}</p></div>
              <div><p className="text-gray-500">Contact</p><p className="font-medium">{order.school?.contactPerson}</p></div>
              <div><p className="text-gray-500">Mobile</p><p className="font-medium">{order.school?.mobile}</p></div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              {editMode && editState ? (
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editState.notes}
                  onChange={e => setEditState(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                  placeholder="Add notes..."
                />
              ) : (
                <p className="text-sm text-gray-600">{order.notes || <span className="text-gray-400 italic">No notes</span>}</p>
              )}
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item, itemIdx) => {
                const editItem = editMode && editState ? editState.items[itemIdx] : null;
                return (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-start justify-between px-4 py-3 bg-gray-50 gap-3">
                      <div className="flex-1 min-w-0">
                        {editItem ? (
                          <>
                            {changingProductIdx === itemIdx ? (
                              <div className="flex items-center gap-2">
                                <select
                                  className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                                  disabled={alternativesLoading}
                                  value={editItem.newProductId ?? item.productId}
                                  onChange={e => {
                                    const pid = parseInt(e.target.value);
                                    const prod = alternativeProducts?.find(p => p.id === pid);
                                    setEditState(prev => {
                                      if (!prev) return prev;
                                      const items = [...prev.items];
                                      items[itemIdx] = {
                                        ...items[itemIdx],
                                        newProductId: pid,
                                        newProductName: prod?.name,
                                        unitPrice: String(Math.round(prod?.finalPrice ?? parseFloat(items[itemIdx].unitPrice))),
                                      };
                                      return { ...prev, items };
                                    });
                                  }}
                                >
                                  {alternativesLoading
                                    ? <option>Loading products...</option>
                                    : alternativeProducts?.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))
                                  }
                                </select>
                                <button
                                  type="button"
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                  onClick={() => setChangingProductIdx(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                  {editItem.newProductName ?? item.productName}
                                </p>
                                <button
                                  type="button"
                                  className="text-xs text-indigo-500 hover:text-indigo-700 shrink-0"
                                  onClick={() => setChangingProductIdx(itemIdx)}
                                >
                                  Change
                                </button>
                              </div>
                            )}
                            {(item.categoryName || item.subCategoryName) && (
                              <p className="text-xs text-indigo-500 mt-0.5">
                                {item.categoryName}
                                {item.subCategoryName && <span className="text-gray-400"> › {item.subCategoryName}</span>}
                                <span className="text-gray-400"> (alternatives shown)</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{item.productName}</p>
                            {(item.categoryName || item.subCategoryName) && (
                              <p className="text-xs text-indigo-500 mt-0.5">
                                {item.categoryName}
                                {item.subCategoryName && <span className="text-gray-400"> › {item.subCategoryName}</span>}
                              </p>
                            )}
                            {item.productSku && <p className="text-xs text-gray-400 font-mono">{item.productSku}</p>}
                          </>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {editItem ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-gray-500">₹</span>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              className="w-28 h-7 text-sm text-right"
                              value={editItem.unitPrice}
                              onChange={e => updateItemField(itemIdx, "unitPrice", e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                            <p className="text-xs text-gray-400">{item.totalQuantity} pcs @ {formatCurrency(item.unitPrice)}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {(editItem ? editItem.classStudentCounts : item.classStudentCounts)?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="text-left px-4 py-2">Class</th>
                              <th className="text-center px-4 py-2">Boys</th>
                              <th className="text-center px-4 py-2">Girls</th>
                              <th className="text-center px-4 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editItem
                              ? editItem.classStudentCounts.map((ec, ci) => (
                                  <tr key={ec.className} className="border-b last:border-0">
                                    <td className="px-4 py-2 font-medium">{ec.className}</td>
                                    <td className="px-4 py-2 text-center">
                                      <Input
                                        type="number"
                                        min={0}
                                        className="w-16 h-6 text-center text-xs mx-auto"
                                        value={ec.boysCount}
                                        onChange={e => updateCount(itemIdx, ci, "boysCount", parseInt(e.target.value) || 0)}
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <Input
                                        type="number"
                                        min={0}
                                        className="w-16 h-6 text-center text-xs mx-auto"
                                        value={ec.girlsCount}
                                        onChange={e => updateCount(itemIdx, ci, "girlsCount", parseInt(e.target.value) || 0)}
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-center font-semibold">
                                      {ec.boysCount + ec.girlsCount}
                                    </td>
                                  </tr>
                                ))
                              : item.classStudentCounts.map((c, ci) => (
                                  <tr key={ci} className="border-b last:border-0">
                                    <td className="px-4 py-2 font-medium">{c.className}</td>
                                    <td className="px-4 py-2 text-center">{c.boysCount}</td>
                                    <td className="px-4 py-2 text-center">{c.girlsCount}</td>
                                    <td className="px-4 py-2 text-center font-semibold">{c.totalCount}</td>
                                  </tr>
                                ))
                            }
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Admin edit history */}
          {isSuperAdmin && order.adminEdits && order.adminEdits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" /> Edit History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.adminEdits.map(edit => (
                    <div key={edit.id} className="border-l-2 border-indigo-200 pl-3 py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-indigo-700">{edit.editedBy}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(edit.editedAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{edit.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Order summary */}
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {editMode && editState ? (
                <div className="space-y-2">
                  {/* read-only totals */}
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>{formatCurrency(order.totalAmount)}</span>
                  </div>

                  {/* editable GST % */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600 shrink-0">GST (%)</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        className="w-20 h-7 text-sm text-right"
                        value={editState.gstPercent}
                        onChange={e => setEditState(prev => prev ? { ...prev, gstPercent: e.target.value } : prev)}
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  </div>

                  {/* editable special discount */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-orange-600 shrink-0 font-medium">Special Discount (₹)</span>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      className="w-32 h-7 text-sm text-right"
                      value={editState.specialDiscount}
                      onChange={e => setEditState(prev => prev ? { ...prev, specialDiscount: e.target.value } : prev)}
                    />
                  </div>

                  {/* live grand total */}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Grand Total</span>
                    <span className="text-indigo-600">
                      {formatCurrency(Math.max(0, order.totalAmount - (parseFloat(editState.specialDiscount) || 0)))}
                    </span>
                  </div>

                  <div className="border-t pt-2 space-y-2">
                    {/* editable advance */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-green-600 font-medium shrink-0">Advance Paid (₹)</span>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className="w-32 h-7 text-sm text-right"
                        value={editState.advanceAmount}
                        onChange={e => setEditState(prev => prev ? { ...prev, advanceAmount: e.target.value } : prev)}
                      />
                    </div>

                    {/* payment status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-600 shrink-0">Payment Status</span>
                      <select
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editState.paymentStatus}
                        onChange={e => setEditState(prev => prev ? { ...prev, paymentStatus: e.target.value } : prev)}
                      >
                        {PAYMENT_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">GST</span><span>{formatCurrency(order.gstAmount)}</span></div>
                  {order.specialDiscount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Special Discount</span><span>- {formatCurrency(order.specialDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Grand Total</span><span className="text-indigo-600">{formatCurrency(order.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600"><span>Advance Paid</span><span>{formatCurrency(order.advanceAmount)}</span></div>
                  <div className="flex justify-between text-red-500 font-medium"><span>Remaining</span><span>{formatCurrency(order.remainingAmount)}</span></div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Payment</span>
                    <Badge variant={order.paymentStatus === "PAID" ? "default" : order.paymentStatus === "PARTIAL" ? "secondary" : "outline"}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader><CardTitle>Production Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WORKFLOW.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done ? "bg-indigo-600" : "bg-gray-100"
                      }`}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-white" /> : (
                          <span className="text-xs text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${active ? "font-semibold text-indigo-600" : done ? "text-gray-600" : "text-gray-400"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!editMode && order.status !== "DELIVERED" && order.status !== "CANCELLED" && WORKFLOW.includes(order.status as OrderStatus) && (
                <Button
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => {
                    const next = WORKFLOW[currentStep + 1];
                    if (next) statusMutation.mutate(next);
                  }}
                  disabled={currentStep >= WORKFLOW.length - 1 || statusMutation.isPending}
                >
                  Advance to {WORKFLOW[currentStep + 1] ?? "Done"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
