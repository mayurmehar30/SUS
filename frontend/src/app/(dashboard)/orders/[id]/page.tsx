"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, X, Save, History, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Order, OrderItem, OrderStatus, Product } from "@/types";
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// ── Uniform grouping helpers ──────────────────────────────────────────────────
interface UniformGroup {
  name: string;
  boys: OrderItem[];
  girls: OrderItem[];
}

function parseUniformGroups(items: OrderItem[]): UniformGroup[] {
  const map = new Map<string, { boys: OrderItem[]; girls: OrderItem[] }>();
  for (const item of items) {
    const notes = item.notes ?? "";
    const boysMatch = notes.match(/^(.+?)\s*-\s*Boys$/i);
    const girlsMatch = notes.match(/^(.+?)\s*-\s*Girls$/i);
    if (boysMatch) {
      const name = boysMatch[1].trim();
      if (!map.has(name)) map.set(name, { boys: [], girls: [] });
      map.get(name)!.boys.push(item);
    } else if (girlsMatch) {
      const name = girlsMatch[1].trim();
      if (!map.has(name)) map.set(name, { boys: [], girls: [] });
      map.get(name)!.girls.push(item);
    } else {
      const name = notes.trim() || "Other";
      if (!map.has(name)) map.set(name, { boys: [], girls: [] });
      map.get(name)!.boys.push(item);
    }
  }
  return Array.from(map.entries()).map(([name, { boys, girls }]) => ({ name, boys, girls }));
}

interface ClassSummaryRow { className: string; boys: number; girls: number; total: number; }

function classSummaryFromHistory(countsJson: string): ClassSummaryRow[] {
  const counts: Array<{ className: string; boysCount: number; girlsCount: number }> =
    JSON.parse(countsJson);
  return counts.map(c => ({
    className: c.className,
    boys: c.boysCount,
    girls: c.girlsCount,
    total: c.boysCount + c.girlsCount,
  }));
}

// ── Count history types & modal ───────────────────────────────────────────────
interface CountEntry { className: string; boysCount: number; girlsCount: number; }
interface HistoryItem { id: number; savedAt: string; countsJson: string; }

function CountHistoryModal({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const counts: CountEntry[] = JSON.parse(item.countsJson);
  const boys  = counts.reduce((s, c) => s + c.boysCount, 0);
  const girls = counts.reduce((s, c) => s + c.girlsCount, 0);
  const date  = new Date(item.savedAt);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 bg-indigo-600 text-white flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <History className="h-4 w-4 text-indigo-200" />
              <span className="font-semibold text-sm">Count Snapshot</span>
            </div>
            <p className="text-indigo-200 text-xs">{dateStr} · {timeStr}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-base">{boys + girls} students</p>
            <p className="text-indigo-200 text-xs">{boys} boys · {girls} girls</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-indigo-500 rounded-lg transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Class</th>
                <th className="text-center px-3 py-2.5 font-medium text-blue-500 text-xs">Boys</th>
                <th className="text-center px-3 py-2.5 font-medium text-pink-500 text-xs">Girls</th>
                <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {counts.map(c => {
                const total = c.boysCount + c.girlsCount;
                return (
                  <tr key={c.className} className="hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 font-medium text-gray-700 text-xs">{c.className}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-blue-600 text-sm">
                      {c.boysCount > 0 ? c.boysCount : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-pink-600 text-sm">
                      {c.girlsCount > 0 ? c.girlsCount : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-indigo-700 text-sm">
                      {total > 0 ? total : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                <td className="px-5 py-2.5 font-bold text-xs text-gray-700">Total</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-blue-600">{boys || "—"}</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-pink-600">{girls || "—"}</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-indigo-700">{boys + girls || "—"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
  });

  const { data: countHistory = [] } = useQuery<HistoryItem[]>({
    queryKey: ["count-history-admin", id],
    queryFn: () => api.get(`/orders/public/${order!.orderToken}/count-history`).then(r => r.data),
    enabled: !!order?.orderToken,
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

          {/* Order items — edit mode: flat list with inline editors */}
          {editMode && editState && (
            <Card>
              <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item, itemIdx) => {
                  const editItem = editState.items[itemIdx];
                  return (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-start justify-between px-4 py-3 bg-gray-50 gap-3">
                        <div className="flex-1 min-w-0">
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
                        </div>
                        <div className="text-right shrink-0">
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
                        </div>
                      </div>

                      {editItem.classStudentCounts.length > 0 && (
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
                              {editItem.classStudentCounts.map((ec, ci) => (
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
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Order items — view mode: grouped by uniform name → boys / girls */}
          {!editMode && (() => {
            const groups = parseUniformGroups(order.items ?? []);
            return (
              <Card>
                <CardHeader><CardTitle>Uniform List</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {groups.map((group, idx) => (
                    <div key={group.name}>
                      {/* Uniform header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <h3 className="font-semibold text-gray-800">{group.name}</h3>
                      </div>

                      <div className="pl-8 space-y-2">
                        {/* Boys */}
                        {group.boys.length > 0 && (
                          <div className="rounded-lg border border-blue-100 overflow-hidden">
                            <div className="px-4 py-2 bg-blue-50">
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Boys</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {group.boys.map(item => (
                                <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                                    {item.productSku && <p className="text-xs text-gray-400 font-mono">{item.productSku}</p>}
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</p>
                                    <p className="text-xs text-gray-400">per student</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Girls */}
                        {group.girls.length > 0 && (
                          <div className="rounded-lg border border-pink-100 overflow-hidden">
                            <div className="px-4 py-2 bg-pink-50">
                              <span className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Girls</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {group.girls.map(item => (
                                <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                                    {item.productSku && <p className="text-xs text-gray-400 font-mono">{item.productSku}</p>}
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</p>
                                    <p className="text-xs text-gray-400">per student</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {idx < groups.length - 1 && <div className="mt-5 border-t border-dashed border-gray-100" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* Class-wise summary — view mode only, sourced from latest count history */}
          {!editMode && (() => {
            const summary = countHistory.length > 0
              ? classSummaryFromHistory(countHistory[0].countsJson)
              : [];
            if (summary.length === 0) return null;
            const totalBoys = summary.reduce((s, r) => s + r.boys, 0);
            const totalGirls = summary.reduce((s, r) => s + r.girls, 0);
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span>Class-wise Summary</span>
                    <div className="flex items-center gap-3 text-sm font-normal text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        {totalBoys} boys
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                        {totalGirls} girls
                      </span>
                      <span className="font-semibold text-indigo-700">{totalBoys + totalGirls} total</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Class</th>
                          <th className="text-center px-4 py-3 font-medium text-blue-500 text-xs">Boys</th>
                          <th className="text-center px-4 py-3 font-medium text-pink-500 text-xs">Girls</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {summary.map(row => (
                          <tr key={row.className} className="hover:bg-gray-50/50">
                            <td className="px-5 py-2.5 font-medium text-gray-700">{row.className}</td>
                            <td className="px-4 py-2.5 text-center">
                              {row.boys > 0 ? <span className="font-semibold text-blue-600">{row.boys}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {row.girls > 0 ? <span className="font-semibold text-pink-600">{row.girls}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {row.total > 0 ? <span className="font-bold text-indigo-700">{row.total}</span> : <span className="text-gray-300">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                          <td className="px-5 py-2.5 font-bold text-xs text-gray-700">Total</td>
                          <td className="px-4 py-2.5 text-center font-bold text-blue-600">{totalBoys || "—"}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-pink-600">{totalGirls || "—"}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-indigo-700">{(totalBoys + totalGirls) || "—"}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

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

          {/* Student count history */}
          {countHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-500" /> Student Count History
                  <span className="ml-auto text-xs font-normal text-gray-400">{countHistory.length} save{countHistory.length !== 1 ? "s" : ""}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {countHistory.map(h => {
                    const counts: CountEntry[] = JSON.parse(h.countsJson);
                    const boys  = counts.reduce((s, c) => s + c.boysCount, 0);
                    const girls = counts.reduce((s, c) => s + c.girlsCount, 0);
                    const date  = new Date(h.savedAt);
                    const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                    const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHistory(h)}
                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-50/50 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">
                            {dateStr} · {timeStr}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{boys} boys · {girls} girls</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{boys + girls} students</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
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
      {selectedHistory && (
        <CountHistoryModal item={selectedHistory} onClose={() => setSelectedHistory(null)} />
      )}
    </DashboardLayout>
  );
}
