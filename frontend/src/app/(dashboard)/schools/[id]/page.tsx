"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, History, ChevronRight, X, Building2,
  Phone, Mail, MapPin, Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { School, Order, OrderItem } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CountEntry { className: string; boysCount: number; girlsCount: number; }
interface HistoryItem { id: number; savedAt: string; countsJson: string; savedBy?: string; }

interface UniformGenderSection {
  items: OrderItem[];
}

interface UniformGroup {
  name: string;
  boys: UniformGenderSection;
  girls: UniformGenderSection;
}

interface ClassSummaryRow {
  className: string;
  boys: number;
  girls: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

  return Array.from(map.entries()).map(([name, { boys, girls }]) => ({
    name,
    boys: { items: boys },
    girls: { items: girls },
  }));
}

function deriveClassSummary(items: OrderItem[]): ClassSummaryRow[] {
  const classMap = new Map<string, { boys: number; girls: number }>();

  for (const item of items) {
    for (const count of item.classStudentCounts ?? []) {
      if (!classMap.has(count.className)) {
        classMap.set(count.className, { boys: 0, girls: 0 });
      }
      const entry = classMap.get(count.className)!;
      if (count.boysCount > entry.boys) entry.boys = count.boysCount;
      if (count.girlsCount > entry.girls) entry.girls = count.girlsCount;
    }
  }

  return Array.from(classMap.entries()).map(([className, { boys, girls }]) => ({
    className,
    boys,
    girls,
    total: boys + girls,
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CountHistoryModal({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const counts: CountEntry[] = JSON.parse(item.countsJson);
  const boys = counts.reduce((s, c) => s + c.boysCount, 0);
  const girls = counts.reduce((s, c) => s + c.girlsCount, 0);
  const date = new Date(item.savedAt);
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

function GenderProductRows({ label, items, color }: {
  label: string;
  items: OrderItem[];
  color: "blue" | "pink";
}) {
  if (items.length === 0) return null;
  const textColor = color === "blue" ? "text-blue-700" : "text-pink-700";
  const bgColor = color === "blue" ? "bg-blue-50" : "bg-pink-50";
  const borderColor = color === "blue" ? "border-blue-100" : "border-pink-100";

  return (
    <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-4 py-2 ${bgColor}`}>
        <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide`}>{label}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
              {item.productSku && (
                <p className="text-xs text-gray-400 font-mono">{item.productSku}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</p>
              <p className="text-xs text-gray-400">per student</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  const { data: school, isLoading: schoolLoading } = useQuery<School>({
    queryKey: ["school", id],
    queryFn: () => api.get(`/schools/${id}`).then(r => r.data),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["school-orders", id],
    queryFn: () => api.get(`/schools/${id}/orders`).then(r => r.data),
    enabled: !!id,
  });

  const activeOrder: Order | undefined =
    orders.find(o => o.id === selectedOrderId) ?? orders[0];

  const { data: countHistory = [] } = useQuery<HistoryItem[]>({
    queryKey: ["count-history-school", activeOrder?.orderToken],
    queryFn: () =>
      api.get(`/orders/public/${activeOrder!.orderToken}/count-history`).then(r => r.data),
    enabled: !!activeOrder?.orderToken,
  });

  const uniformGroups = activeOrder ? parseUniformGroups(activeOrder.items ?? []) : [];
  const classSummary = activeOrder ? deriveClassSummary(activeOrder.items ?? []) : [];
  const totalBoys = classSummary.reduce((s, r) => s + r.boys, 0);
  const totalGirls = classSummary.reduce((s, r) => s + r.girls, 0);

  const isLoading = schoolLoading || ordersLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="School Details">
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </DashboardLayout>
    );
  }

  if (!school) {
    return (
      <DashboardLayout title="School Details">
        <p className="text-gray-500">School not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={school.name}>
      {/* Back button */}
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Schools
        </Button>
        {orders.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Order:</span>
            <select
              className="text-sm border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              value={selectedOrderId ?? activeOrder?.id ?? ""}
              onChange={e => setSelectedOrderId(Number(e.target.value))}
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber ?? `#${o.id}`} — {formatDate(o.createdAt)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* School Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {school.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{school.name}</h2>
                <Badge variant={school.active ? "success" : "secondary"}>
                  {school.active ? "Active" : "Inactive"}
                </Badge>
                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {school.schoolCode}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {school.address && (
                  <div className="flex items-start gap-1.5 text-gray-500">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{school.address}</span>
                  </div>
                )}
                {school.contactPerson && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{school.contactPerson}{school.contactPersonRole && ` (${school.contactPersonRole})`}</span>
                  </div>
                )}
                {school.mobile && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{school.mobile}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{school.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No orders state */}
      {orders.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">This school hasn&apos;t submitted an order.</p>
          </CardContent>
        </Card>
      )}

      {activeOrder && (
        <div className="space-y-6">
          {/* Order meta */}
          {activeOrder.orderNumber && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-mono font-semibold text-gray-700">{activeOrder.orderNumber}</span>
              <span>·</span>
              <span>{formatDate(activeOrder.submittedAt ?? activeOrder.createdAt)}</span>
              <span>·</span>
              <Badge variant="secondary" className="text-xs">{activeOrder.status}</Badge>
            </div>
          )}

          {/* ── Uniform List ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Uniform List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {uniformGroups.length === 0 && (
                <p className="text-gray-400 text-sm italic">No uniform items found in this order.</p>
              )}
              {uniformGroups.map((group, idx) => (
                <div key={group.name} className="space-y-3">
                  {/* Uniform header */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                  </div>

                  <div className="pl-8 space-y-2">
                    <GenderProductRows label="Boys" items={group.boys.items} color="blue" />
                    <GenderProductRows label="Girls" items={group.girls.items} color="pink" />
                  </div>

                  {idx < uniformGroups.length - 1 && (
                    <div className="border-t border-dashed border-gray-100" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Class-wise Summary ────────────────────────────────────────── */}
          {classSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Class-wise Summary</span>
                  <div className="flex items-center gap-3 text-sm font-normal text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      {totalBoys} boys
                    </span>
                    <span className="flex items-center gap-1">
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
                      {classSummary.map(row => (
                        <tr key={row.className} className="hover:bg-gray-50/50">
                          <td className="px-5 py-2.5 font-medium text-gray-700">{row.className}</td>
                          <td className="px-4 py-2.5 text-center">
                            {row.boys > 0
                              ? <span className="font-semibold text-blue-600">{row.boys}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.girls > 0
                              ? <span className="font-semibold text-pink-600">{row.girls}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.total > 0
                              ? <span className="font-bold text-indigo-700">{row.total}</span>
                              : <span className="text-gray-300">—</span>
                            }
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
          )}

          {/* ── Class-wise Count History ──────────────────────────────────── */}
          {countHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-500" />
                  Class-wise Count History
                  <span className="ml-auto text-xs font-normal text-gray-400">
                    {countHistory.length} save{countHistory.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {countHistory.map(h => {
                    const counts: CountEntry[] = JSON.parse(h.countsJson);
                    const boys = counts.reduce((s, c) => s + c.boysCount, 0);
                    const girls = counts.reduce((s, c) => s + c.girlsCount, 0);
                    const date = new Date(h.savedAt);
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedHistory && (
        <CountHistoryModal item={selectedHistory} onClose={() => setSelectedHistory(null)} />
      )}
    </DashboardLayout>
  );
}
