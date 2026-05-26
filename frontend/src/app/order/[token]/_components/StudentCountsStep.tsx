"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Save, X, Check, History, ChevronDown, ChevronUp } from "lucide-react";
import { ClassStudentCount } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { UniformSet, getUniformEstimate, hasAnyProduct, getSectionProducts } from "./types";
import api from "@/lib/api";

interface CountEntry { className: string; boysCount: number; girlsCount: number; }
interface HistoryItem  { id: number; savedAt: string; countsJson: string; }

interface StudentCountsStepProps {
  classRows: ClassStudentCount[];
  uniforms: UniformSet[];
  token: string;
  onUpdateRow: (idx: number, field: "boysCount" | "girlsCount", value: number) => void;
  locked?: boolean;
}

export default function StudentCountsStep({ classRows, uniforms, token, onUpdateRow, locked }: StudentCountsStepProps) {
  const withProducts = uniforms.filter(hasAnyProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [editRows, setEditRows] = useState<CountEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sync editRows whenever classRows change and we're not mid-edit
  useEffect(() => {
    if (!isEditing) {
      setEditRows(classRows.map(r => ({ className: r.className, boysCount: r.boysCount, girlsCount: r.girlsCount })));
    }
  }, [classRows, isEditing]);

  const displayRows = isEditing ? editRows : classRows;
  const totalBoys    = displayRows.reduce((s, r) => s + r.boysCount, 0);
  const totalGirls   = displayRows.reduce((s, r) => s + r.girlsCount, 0);
  const totalStudents = totalBoys + totalGirls;

  const { data: history = [], refetch: refetchHistory } = useQuery<HistoryItem[]>({
    queryKey: ["count-history", token],
    queryFn: () => api.get(`/orders/public/${token}/count-history`).then(r => r.data),
    enabled: showHistory,
  });

  const updateEditRow = (idx: number, field: "boysCount" | "girlsCount", value: number) => {
    setEditRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: Math.max(0, value) } : r));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/orders/public/${token}/counts`, {
        counts: editRows.map(r => ({ className: r.className, boysCount: r.boysCount, girlsCount: r.girlsCount })),
      }),
    onSuccess: () => {
      editRows.forEach((row, idx) => {
        onUpdateRow(idx, "boysCount", row.boysCount);
        onUpdateRow(idx, "girlsCount", row.girlsCount);
      });
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Student counts saved");
      if (showHistory) refetchHistory();
    },
    onError: () => toast.error("Failed to save counts"),
  });

  const handleCancel = () => {
    setEditRows(classRows.map(r => ({ className: r.className, boysCount: r.boysCount, girlsCount: r.girlsCount })));
    setIsEditing(false);
  };

  const editTotal = editRows.reduce((s, r) => s + r.boysCount + r.girlsCount, 0);
  const inputCls = "w-full text-center text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 border-gray-200 focus:ring-indigo-300 focus:border-indigo-400";

  return (
    <div className="space-y-4">
      {locked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-amber-600 text-sm font-medium">🔒 This order is locked — student counts cannot be changed.</span>
        </div>
      )}

      {/* Uniform summary chips */}
      {withProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {withProducts.map(u => (
            <div key={u.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {u.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-indigo-700">{u.name}</span>
              <span className="text-xs text-indigo-400">{formatCurrency(getUniformEstimate(u, classRows))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Counts table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Class-wise Student Counts</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? "Enter counts and click Save." : totalStudents > 0 ? `${totalStudents} students across ${classRows.length} classes.` : "No counts saved yet."}
            </p>
          </div>
          {!locked && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || editTotal === 0}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      saved
                        ? "bg-green-500 text-white"
                        : editTotal === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save</>}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> {totalStudents > 0 ? "Edit" : "Add Counts"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Class</th>
                <th className="text-center px-3 py-2.5 font-medium text-blue-500 text-xs">
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Boys
                  </span>
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-pink-500 text-xs">
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Girls
                  </span>
                </th>
                <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayRows.map((row, idx) => {
                const rowTotal = row.boysCount + row.girlsCount;
                return (
                  <tr key={row.className} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-700 text-xs">{row.className}</span>
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number" min={0}
                          value={editRows[idx]?.boysCount || ""}
                          placeholder="0"
                          onChange={e => updateEditRow(idx, "boysCount", parseInt(e.target.value) || 0)}
                          className={inputCls}
                        />
                      ) : (
                        <div className="text-center font-semibold text-blue-600 text-sm">
                          {row.boysCount > 0 ? row.boysCount : <span className="text-gray-300 font-normal">—</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number" min={0}
                          value={editRows[idx]?.girlsCount || ""}
                          placeholder="0"
                          onChange={e => updateEditRow(idx, "girlsCount", parseInt(e.target.value) || 0)}
                          className={inputCls}
                        />
                      ) : (
                        <div className="text-center font-semibold text-pink-600 text-sm">
                          {row.girlsCount > 0 ? row.girlsCount : <span className="text-gray-300 font-normal">—</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-semibold text-sm ${rowTotal > 0 ? "text-indigo-600" : "text-gray-300"}`}>
                        {rowTotal > 0 ? rowTotal : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                <td className="px-4 py-2.5 font-bold text-xs text-gray-700">Total</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-blue-600">{totalBoys || "—"}</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-pink-600">{totalGirls || "—"}</td>
                <td className="px-3 py-2.5 text-center font-bold text-sm text-indigo-700">{totalStudents || "—"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-uniform estimate */}
      {withProducts.length > 0 && totalStudents > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimate per Uniform</p>
          {withProducts.map(u => {
            const est = getUniformEstimate(u, classRows);
            const bp  = getSectionProducts(u, "boys");
            const gp  = getSectionProducts(u, "girls");
            return (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">
                    {bp.length > 0 && `${totalBoys} boys`}
                    {bp.length > 0 && gp.length > 0 && " · "}
                    {gp.length > 0 && `${totalGirls} girls`}
                  </p>
                </div>
                <span className="font-bold text-indigo-600">{formatCurrency(est)}</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-gray-800">Grand Total</span>
            <span className="font-black text-lg text-indigo-700">
              {formatCurrency(withProducts.reduce((s, u) => s + getUniformEstimate(u, classRows), 0))}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => setShowHistory(v => !v)}
        >
          <span className="flex items-center gap-2"><History className="h-4 w-4 text-indigo-400" /> Save History</span>
          {showHistory ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {showHistory && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {history.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No saves recorded yet.</p>
            ) : history.map(h => {
              const counts: CountEntry[] = JSON.parse(h.countsJson);
              const boys  = counts.reduce((s, c) => s + c.boysCount, 0);
              const girls = counts.reduce((s, c) => s + c.girlsCount, 0);
              const date  = new Date(h.savedAt);
              return (
                <div key={h.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}
                      {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs text-indigo-600 font-medium">{boys + girls} students</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{boys} boys · {girls} girls</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
