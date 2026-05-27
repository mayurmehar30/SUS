"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, X, Save, History, ChevronRight, Images, ChevronLeft, Plus, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Order, OrderItem, OrderStatus, Product, ApiPage } from "@/types";
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

// ── Image lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({ images, initialIndex, productName, onClose }: {
  images: string[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-64 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <p className="text-xs font-semibold text-gray-800 truncate pr-2">{productName}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {images.length > 1 && <span className="text-xs text-gray-400">{idx + 1}/{images.length}</span>}
            <button onClick={onClose} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div className="relative bg-gray-50 h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx]}
            alt={`${productName} ${idx + 1}`}
            className="w-full h-full object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1 p-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-10 h-10 rounded overflow-hidden border-2 transition-colors ${
                  i === idx ? "border-indigo-500" : "border-transparent hover:border-gray-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Count history types & modal ───────────────────────────────────────────────
interface CountEntry { className: string; boysCount: number; girlsCount: number; }
interface HistoryItem { id: number; savedAt: string; countsJson: string; savedBy?: string; }

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
            {item.savedBy && <p className="text-indigo-300 text-xs mt-0.5">By {item.savedBy}</p>}
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
  newProductImages?: string[];
  classStudentCounts: Array<{
    id?: number;
    className: string;
    boysCount: number;
    girlsCount: number;
    remarks?: string;
  }>;
};

type NewEditItem = {
  tempId: string;
  productId: number;
  productName: string;
  productImages: string[];
  unitPrice: string;
  notes: string;
  totalQuantity: string;
};

type EditState = {
  notes: string;
  advanceAmount: string;
  paymentStatus: string;
  specialDiscount: string;
  gstPercent: string;
  items: EditItemState[];
  removedItemIds: number[];
  newItems: NewEditItem[];
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
    removedItemIds: [],
    newItems: [],
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
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number; name: string } | null>(null);

  // Class-wise summary inline editing
  type CountRow = { className: string; boysCount: number; girlsCount: number };
  const [classCountsEditing, setClassCountsEditing] = useState(false);
  const [classCountsEditRows, setClassCountsEditRows] = useState<CountRow[]>([]);

  // Collapsed uniform groups (view + edit mode)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (name: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addItemForm, setAddItemForm] = useState({ productId: 0, productName: "", productImages: [] as string[], unitPrice: "", notes: "", totalQuantity: "0" });

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

  const { data: allProductsPage } = useQuery<ApiPage<Product>>({
    queryKey: ["all-products-edit"],
    queryFn: () => api.get("/products", { params: { active: true, size: 500 } }).then(r => r.data),
    enabled: editMode,
    staleTime: 60_000,
  });
  const allProducts = allProductsPage?.content ?? [];

  const editMutation = useMutation({
    mutationFn: (payload: object) => api.put(`/orders/${id}/edit`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setEditMode(false);
      toast.success("Order updated");
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const saveCountsMutation = useMutation({
    mutationFn: (rows: Array<{ className: string; boysCount: number; girlsCount: number }>) =>
      api.put(`/orders/public/${order?.orderToken}/counts`, {
        counts: rows,
        savedBy: user?.name || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["count-history-admin", id] });
      setClassCountsEditing(false);
      toast.success("Student counts saved");
    },
    onError: () => toast.error("Failed to save counts"),
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
    setShowAddForm(false);
    setCollapsedGroups(new Set());
  }

  function saveEdit() {
    if (!editState) return;
    const payload = {
      notes: editState.notes,
      advanceAmount: parseFloat(editState.advanceAmount) || 0,
      paymentStatus: editState.paymentStatus,
      specialDiscount: parseFloat(editState.specialDiscount) || 0,
      gstPercent: parseFloat(editState.gstPercent) || 0,
      items: editState.items
        .filter(item => !editState.removedItemIds.includes(item.id))
        .map(item => ({
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
      removeItemIds: editState.removedItemIds,
      newItems: editState.newItems.map(ni => ({
        productId: ni.productId,
        unitPrice: parseFloat(ni.unitPrice) || 0,
        notes: ni.notes,
        totalQuantity: parseInt(ni.totalQuantity) || 0,
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

          {/* Order items — edit mode: grouped by uniform name → Boys / Girls sections */}
          {editMode && editState && (() => {
            const groups = parseUniformGroups(order.items ?? []);

            const updateGroupCount = (
              groupItems: OrderItem[],
              countIdx: number,
              field: "boysCount" | "girlsCount",
              value: number,
            ) => {
              setEditState(prev => {
                if (!prev) return prev;
                const items = [...prev.items];
                for (const gi of groupItems) {
                  const idx = order.items.findIndex(i => i.id === gi.id);
                  if (idx < 0) continue;
                  const counts = [...items[idx].classStudentCounts];
                  counts[countIdx] = { ...counts[countIdx], [field]: value };
                  items[idx] = { ...items[idx], classStudentCounts: counts };
                }
                return { ...prev, items };
              });
            };

            const notesSuggestions = Array.from(new Set((order.items ?? []).map(i => i.notes).filter(Boolean)));

            return (
              <Card>
                <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {groups.map((group, gIdx) => {
                    const isCollapsed = collapsedGroups.has(group.name);
                    return (
                    <div key={group.name}>
                      {/* Uniform header with collapse toggle */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.name)}
                        className="flex items-center gap-2 mb-3 w-full text-left group/header"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {gIdx + 1}
                        </div>
                        <h3 className="font-semibold text-gray-800 flex-1">{group.name}</h3>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                      </button>

                      {!isCollapsed && (<>
                      <div className="pl-8 space-y-3">
                        {(["boys", "girls"] as const).map(gender => {
                          const genderItems = group[gender].filter(i => !editState.removedItemIds.includes(i.id));
                          if (genderItems.length === 0) return null;
                          const isBoys = gender === "boys";
                          const countField = isBoys ? "boysCount" : "girlsCount";
                          const firstFlatIdx = order.items.findIndex(i => i.id === genderItems[0].id);
                          const sharedCounts = editState.items[firstFlatIdx]?.classStudentCounts ?? [];

                          return (
                            <div key={gender} className={`rounded-lg border overflow-hidden ${isBoys ? "border-blue-100" : "border-pink-100"}`}>
                              {/* Gender header */}
                              <div className={`px-4 py-2 ${isBoys ? "bg-blue-50" : "bg-pink-50"}`}>
                                <span className={`text-xs font-semibold uppercase tracking-wide ${isBoys ? "text-blue-700" : "text-pink-700"}`}>
                                  {isBoys ? "Boys" : "Girls"}
                                </span>
                              </div>

                              {/* Product rows */}
                              <div className="divide-y divide-gray-50">
                                {genderItems.map(item => {
                                  const itemIdx = order.items.findIndex(i => i.id === item.id);
                                  const editItem = editState.items[itemIdx];
                                  const imgs = editItem.newProductImages !== undefined
                                    ? editItem.newProductImages
                                    : (item.productImages ?? (item.productImageUrl ? [item.productImageUrl] : []));
                                  return (
                                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                                      {/* Thumbnail */}
                                      <div className="flex-shrink-0">
                                        {imgs.length > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => setLightbox({ images: imgs, idx: 0, name: editItem.newProductName ?? item.productName })}
                                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors block"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgs[0]} alt={item.productName} className="w-full h-full object-cover" />
                                          </button>
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                            <Images className="h-3.5 w-3.5 text-gray-300" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Name + change button */}
                                      <div className="flex-1 min-w-0">
                                        {changingProductIdx === itemIdx ? (
                                          <div className="flex items-center gap-2">
                                            <select
                                              className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                                              disabled={alternativesLoading}
                                              value={editItem.newProductId ?? item.productId}
                                              onChange={e => {
                                                const pid = parseInt(e.target.value);
                                                const prod = alternativeProducts?.find(p => p.id === pid);
                                                setEditState(prev => {
                                                  if (!prev) return prev;
                                                  const its = [...prev.items];
                                                  its[itemIdx] = {
                                                    ...its[itemIdx],
                                                    newProductId: pid,
                                                    newProductName: prod?.name,
                                                    newProductImages: prod?.images?.map(img => img.imageUrl) ?? [],
                                                    unitPrice: String(Math.round(prod?.finalPrice ?? parseFloat(its[itemIdx].unitPrice))),
                                                  };
                                                  return { ...prev, items: its };
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
                                              className="text-gray-400 hover:text-gray-600"
                                              onClick={() => setChangingProductIdx(null)}
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-xs font-medium text-gray-800 truncate">
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
                                      </div>

                                      {/* Price input */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-xs text-gray-500">₹</span>
                                        <Input
                                          type="number"
                                          min={0}
                                          step="1"
                                          className="w-24 h-7 text-xs text-right"
                                          value={editItem.unitPrice}
                                          onChange={e => updateItemField(itemIdx, "unitPrice", e.target.value)}
                                        />
                                      </div>
                                      {/* Remove button */}
                                      <button
                                        type="button"
                                        title="Remove item"
                                        onClick={() => setEditState(prev => prev ? { ...prev, removedItemIds: [...prev.removedItemIds, item.id] } : prev)}
                                        className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Shared class-count table for this gender group */}
                              {sharedCounts.length > 0 && (
                                <div className="overflow-x-auto border-t border-gray-100">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className={`border-b text-gray-500 ${isBoys ? "bg-blue-50/50" : "bg-pink-50/50"}`}>
                                        <th className="text-left px-4 py-2 font-medium">Class</th>
                                        <th className={`text-center px-4 py-2 font-medium ${isBoys ? "text-blue-500" : "text-pink-500"}`}>
                                          {isBoys ? "Boys" : "Girls"}
                                        </th>
                                        <th className="text-center px-4 py-2 font-medium text-gray-400">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sharedCounts.map((ec, ci) => (
                                        <tr key={ec.className} className="border-b last:border-0">
                                          <td className="px-4 py-2 font-medium">{ec.className}</td>
                                          <td className="px-4 py-2 text-center">
                                            <Input
                                              type="number"
                                              min={0}
                                              className={`w-16 h-6 text-center text-xs mx-auto ${isBoys ? "border-blue-200 focus-visible:ring-blue-400" : "border-pink-200 focus-visible:ring-pink-400"}`}
                                              value={ec[countField]}
                                              onChange={e => updateGroupCount(genderItems, ci, countField, parseInt(e.target.value) || 0)}
                                            />
                                          </td>
                                          <td className="px-4 py-2 text-center font-semibold text-gray-600">
                                            {ec[countField]}
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
                      </div>

                      {/* Removed items in this group */}
                      {(() => {
                        const removedInGroup = [...group.boys, ...group.girls].filter(i => editState.removedItemIds.includes(i.id));
                        if (!removedInGroup.length) return null;
                        return (
                          <div className="pl-8 mt-2 space-y-1">
                            {removedInGroup.map(item => (
                              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                                <span className="text-xs text-red-400 line-through flex-1">{item.productName}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditState(prev => prev ? { ...prev, removedItemIds: prev.removedItemIds.filter(rid => rid !== item.id) } : prev)}
                                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 flex-shrink-0"
                                >
                                  <RotateCcw className="h-3 w-3" /> Undo
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      </>)}

                      {gIdx < groups.length - 1 && <div className="mt-5 border-t border-dashed border-gray-100" />}
                    </div>
                  );})}

                  {/* New items added this session */}
                  {editState.newItems.length > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">New Items Added</p>
                      {editState.newItems.map(ni => (
                        <div key={ni.tempId} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                          {ni.productImages.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ni.productImages[0]} alt={ni.productName} className="w-9 h-9 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <Images className="h-3.5 w-3.5 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{ni.productName}</p>
                            {ni.notes && <p className="text-xs text-gray-400">{ni.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">₹</span>
                            <Input
                              type="number" min={0} step="1"
                              className="w-20 h-7 text-xs text-right"
                              value={ni.unitPrice}
                              onChange={e => setEditState(prev => prev ? {
                                ...prev,
                                newItems: prev.newItems.map(x => x.tempId === ni.tempId ? { ...x, unitPrice: e.target.value } : x)
                              } : prev)}
                            />
                            <span className="text-xs text-gray-400">×</span>
                            <Input
                              type="number" min={0}
                              className="w-16 h-7 text-xs text-center"
                              value={ni.totalQuantity}
                              onChange={e => setEditState(prev => prev ? {
                                ...prev,
                                newItems: prev.newItems.map(x => x.tempId === ni.tempId ? { ...x, totalQuantity: e.target.value } : x)
                              } : prev)}
                            />
                            <span className="text-xs text-gray-500">pcs</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditState(prev => prev ? { ...prev, newItems: prev.newItems.filter(x => x.tempId !== ni.tempId) } : prev)}
                            className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Item form */}
                  {showAddForm ? (
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Add Product</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Product</label>
                          <select
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={addItemForm.productId || ""}
                            onChange={e => {
                              const pid = parseInt(e.target.value);
                              const prod = allProducts.find(p => p.id === pid);
                              setAddItemForm(f => ({
                                ...f,
                                productId: pid,
                                productName: prod?.name ?? "",
                                productImages: prod?.images?.map(img => img.imageUrl) ?? [],
                                unitPrice: String(Math.round(prod?.finalPrice ?? 0)),
                              }));
                            }}
                          >
                            <option value="">— Select a product —</option>
                            {allProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Notes / Uniform label</label>
                            <input
                              list="notes-suggestions"
                              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              placeholder="e.g. School Uniform - Boys"
                              value={addItemForm.notes}
                              onChange={e => setAddItemForm(f => ({ ...f, notes: e.target.value }))}
                            />
                            <datalist id="notes-suggestions">
                              {notesSuggestions.map(s => <option key={s} value={s ?? ""} />)}
                            </datalist>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Unit Price (₹)</label>
                            <Input
                              type="number" min={0} step="1"
                              className="h-9 text-sm"
                              value={addItemForm.unitPrice}
                              onChange={e => setAddItemForm(f => ({ ...f, unitPrice: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Quantity (pieces)</label>
                          <Input
                            type="number" min={0}
                            className="h-9 text-sm w-32"
                            value={addItemForm.totalQuantity}
                            onChange={e => setAddItemForm(f => ({ ...f, totalQuantity: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowAddForm(false); setAddItemForm({ productId: 0, productName: "", productImages: [], unitPrice: "", notes: "", totalQuantity: "0" }); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!addItemForm.productId}
                          onClick={() => {
                            if (!addItemForm.productId) return;
                            const tempId = `new-${Date.now()}`;
                            setEditState(prev => prev ? {
                              ...prev,
                              newItems: [...prev.newItems, { ...addItemForm, tempId }],
                            } : prev);
                            setShowAddForm(false);
                            setAddItemForm({ productId: 0, productName: "", productImages: [], unitPrice: "", notes: "", totalQuantity: "0" });
                          }}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-3 w-3 inline mr-1" />Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Product
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Order items — view mode: grouped by uniform name → boys / girls */}
          {!editMode && (() => {
            const groups = parseUniformGroups(order.items ?? []);
            return (
              <Card>
                <CardHeader><CardTitle>Uniform List</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {groups.map((group, idx) => {
                    const isCollapsed = collapsedGroups.has(group.name);
                    return (
                    <div key={group.name}>
                      {/* Uniform header with collapse */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.name)}
                        className="flex items-center gap-2 mb-3 w-full text-left group/header"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <h3 className="font-semibold text-gray-800 flex-1">{group.name}</h3>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                      </button>

                      {!isCollapsed && <div className="pl-8 space-y-2">
                        {(["boys", "girls"] as const).map(gender => {
                          const items = group[gender];
                          if (items.length === 0) return null;
                          const isBoys = gender === "boys";
                          return (
                            <div key={gender} className={`rounded-lg border overflow-hidden ${isBoys ? "border-blue-100" : "border-pink-100"}`}>
                              <div className={`px-4 py-2 ${isBoys ? "bg-blue-50" : "bg-pink-50"}`}>
                                <span className={`text-xs font-semibold uppercase tracking-wide ${isBoys ? "text-blue-700" : "text-pink-700"}`}>
                                  {isBoys ? "Boys" : "Girls"}
                                </span>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {items.map(item => {
                                  const imgs = item.productImages ?? (item.productImageUrl ? [item.productImageUrl] : []);
                                  return (
                                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group/row">
                                      {/* Thumbnail */}
                                      <div className="relative flex-shrink-0">
                                        {imgs.length > 0 ? (
                                          <button
                                            onClick={() => setLightbox({ images: imgs, idx: 0, name: item.productName })}
                                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors block relative"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgs[0]} alt={item.productName} className="w-full h-full object-cover" />
                                            {imgs.length > 1 && (
                                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity rounded-lg">
                                                <span className="text-white text-xs font-bold flex items-center gap-0.5">
                                                  <Images className="h-3 w-3" />{imgs.length}
                                                </span>
                                              </div>
                                            )}
                                          </button>
                                        ) : (
                                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                            <Images className="h-4 w-4 text-gray-300" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Name + SKU */}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                                        {item.productSku && <p className="text-xs text-gray-400 font-mono">{item.productSku}</p>}
                                        {imgs.length > 1 && (
                                          <button
                                            onClick={() => setLightbox({ images: imgs, idx: 0, name: item.productName })}
                                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                                          >
                                            View {imgs.length} photos
                                          </button>
                                        )}
                                      </div>

                                      {/* Price */}
                                      <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</p>
                                        <p className="text-xs text-gray-400">per student</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>}

                      {idx < groups.length - 1 && <div className="mt-5 border-t border-dashed border-gray-100" />}
                    </div>
                  );})}
                </CardContent>
              </Card>
            );
          })()}

          {/* Class-wise Summary — editable, merged with count history */}
          {(() => {
            const latestRows: Array<{ className: string; boysCount: number; girlsCount: number }> =
              countHistory.length > 0
                ? JSON.parse(countHistory[0].countsJson)
                : (order.school.classNames ?? []).map(cn => ({ className: cn, boysCount: 0, girlsCount: 0 }));
            if (latestRows.length === 0) return null;

            const displayRows = classCountsEditing ? classCountsEditRows : latestRows;
            const totalBoys   = displayRows.reduce((s, r) => s + r.boysCount, 0);
            const totalGirls  = displayRows.reduce((s, r) => s + r.girlsCount, 0);
            const editTotal   = classCountsEditing ? classCountsEditRows.reduce((s, r) => s + r.boysCount + r.girlsCount, 0) : 0;
            // Hide columns that are all zeros in view mode; always show both in edit mode
            const showBoys  = classCountsEditing || totalBoys > 0;
            const showGirls = classCountsEditing || totalGirls > 0;
            const summaryCollapsed = collapsedGroups.has("__summary__");

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup("__summary__")}
                      className="flex items-center gap-2 text-left"
                    >
                      <span>Class-wise Summary</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${summaryCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <div className="flex items-center gap-2">
                      {!classCountsEditing && (
                        <div className="flex items-center gap-3 text-xs font-normal text-gray-500 mr-1">
                          {showBoys && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{totalBoys} boys</span>}
                          {showGirls && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />{totalGirls} girls</span>}
                          <span className="font-semibold text-indigo-700">{totalBoys + totalGirls} total</span>
                        </div>
                      )}
                      {classCountsEditing ? (
                        <>
                          <button
                            onClick={() => setClassCountsEditing(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                          <button
                            onClick={() => saveCountsMutation.mutate(classCountsEditRows)}
                            disabled={saveCountsMutation.isPending || editTotal === 0}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              editTotal === 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            <Save className="h-3 w-3" /> Save Counts
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setClassCountsEditRows(latestRows.map(r => ({ ...r })));
                            setClassCountsEditing(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> {totalBoys + totalGirls > 0 ? "Edit" : "Add Counts"}
                        </button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!summaryCollapsed && <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gradient-to-r from-indigo-50 to-slate-50">
                          <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Class</th>
                          {showBoys && <th className="text-center px-4 py-3 font-medium text-blue-500 text-xs">
                            <span className="flex items-center justify-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Boys
                            </span>
                          </th>}
                          {showGirls && <th className="text-center px-4 py-3 font-medium text-pink-500 text-xs">
                            <span className="flex items-center justify-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Girls
                            </span>
                          </th>}
                          <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayRows.map((row, idx) => {
                          const rowTotal = row.boysCount + row.girlsCount;
                          return (
                            <tr key={row.className} className="hover:bg-gray-50/50">
                              <td className="px-5 py-2.5 font-medium text-gray-700 text-xs">{row.className}</td>
                              {showBoys && <td className="px-4 py-2 text-center">
                                {classCountsEditing ? (
                                  <input
                                    type="number" min={0}
                                    value={classCountsEditRows[idx]?.boysCount || ""}
                                    placeholder="0"
                                    onChange={e => setClassCountsEditRows(prev => prev.map((r, i) => i === idx ? { ...r, boysCount: parseInt(e.target.value) || 0 } : r))}
                                    className="w-full text-center text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 border-gray-200 focus:ring-indigo-300 focus:border-indigo-400"
                                  />
                                ) : (
                                  row.boysCount > 0
                                    ? <span className="font-semibold text-blue-600">{row.boysCount}</span>
                                    : <span className="text-gray-300">—</span>
                                )}
                              </td>}
                              {showGirls && <td className="px-4 py-2 text-center">
                                {classCountsEditing ? (
                                  <input
                                    type="number" min={0}
                                    value={classCountsEditRows[idx]?.girlsCount || ""}
                                    placeholder="0"
                                    onChange={e => setClassCountsEditRows(prev => prev.map((r, i) => i === idx ? { ...r, girlsCount: parseInt(e.target.value) || 0 } : r))}
                                    className="w-full text-center text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 border-gray-200 focus:ring-indigo-300 focus:border-indigo-400"
                                  />
                                ) : (
                                  row.girlsCount > 0
                                    ? <span className="font-semibold text-pink-600">{row.girlsCount}</span>
                                    : <span className="text-gray-300">—</span>
                                )}
                              </td>}
                              <td className="px-4 py-2.5 text-center">
                                {rowTotal > 0
                                  ? <span className="font-bold text-indigo-700">{rowTotal}</span>
                                  : <span className="text-gray-300">—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                          <td className="px-5 py-2.5 font-bold text-xs text-gray-700">Total</td>
                          {showBoys && <td className="px-4 py-2.5 text-center font-bold text-blue-600">{totalBoys || "—"}</td>}
                          {showGirls && <td className="px-4 py-2.5 text-center font-bold text-pink-600">{totalGirls || "—"}</td>}
                          <td className="px-4 py-2.5 text-center font-bold text-indigo-700">{(totalBoys + totalGirls) || "—"}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>}

                  {/* Save history — inline below the table */}
                  {countHistory.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 px-5 py-2 flex items-center gap-2 bg-gray-50/50">
                        <History className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-xs font-semibold text-gray-600">Save History</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {countHistory.length} save{countHistory.length !== 1 ? "s" : ""}
                        </span>
                      </div>
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
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {h.savedBy && <span className="text-indigo-500 font-medium">{h.savedBy} · </span>}
                                  {boys} boys · {girls} girls
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-bold text-indigo-600">{boys + girls} students</span>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.idx}
          productName={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </DashboardLayout>
  );
}
