"use client";
import { ClipboardList, ChevronRight, ChevronLeft, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ClassStudentCount } from "@/types";
import { UniformSet, getUniformEstimate, getUniformTotalQty, hasAnyProduct, getSectionProducts } from "./types";

interface CartSidebarProps {
  uniforms: UniformSet[];
  classRows: ClassStudentCount[];
  grandTotal: number;
  totalQty: number;
  step: number;
  maxStep: number;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
  canProceed: boolean;
  className?: string;
}

export default function CartSidebar({
  uniforms, classRows, grandTotal, totalQty, step, maxStep,
  onNext, onBack, submitting, canProceed, className = "",
}: CartSidebarProps) {
  const withProducts = uniforms.filter(hasAnyProduct);

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Order Summary</h3>
        </div>
        <p className="text-indigo-200 text-xs mt-1">
          {withProducts.length} uniform{withProducts.length !== 1 ? "s" : ""}
          {totalQty > 0 ? ` · ${totalQty} students` : ""}
        </p>
      </div>

      {/* Uniform list */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-gray-50">
        {withProducts.length === 0 ? (
          <div className="py-10 text-center">
            <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No uniforms created yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Create uniforms and add products</p>
          </div>
        ) : (
          withProducts.map(uniform => {
            const est = getUniformEstimate(uniform, classRows);
            const qty = getUniformTotalQty(uniform, classRows);
            const boysProducts = getSectionProducts(uniform, "boys");
            const girlsProducts = getSectionProducts(uniform, "girls");
            return (
              <div key={uniform.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {uniform.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate">{uniform.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {est > 0 ? (
                      <p className="text-xs font-bold text-indigo-600">{formatCurrency(est)}</p>
                    ) : (
                      <p className="text-xs text-gray-400">No counts</p>
                    )}
                    {qty > 0 && <p className="text-xs text-gray-400">{qty} students</p>}
                  </div>
                </div>
                <div className="space-y-0.5 pl-8">
                  {boysProducts.length > 0 && (
                    <p className="text-xs text-gray-500">
                      <span className="text-blue-500 font-medium">B: </span>
                      {boysProducts.map(p => p.name).join(", ")}
                    </p>
                  )}
                  {girlsProducts.length > 0 && (
                    <p className="text-xs text-gray-500">
                      <span className="text-pink-500 font-medium">G: </span>
                      {girlsProducts.map(p => p.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total */}
      {grandTotal > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Estimated Total</span>
            <span className="text-base font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
          </div>
          {totalQty > 0 && (
            <p className="text-xs text-gray-400 mt-0.5 text-right">{totalQty} students</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="px-4 py-4 space-y-2 border-t border-gray-100">
        {step < maxStep ? (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              canProceed
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={submitting || !canProceed}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
            ) : (
              "Submit Order"
            )}
          </button>
        )}
        {step > 1 && (
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
      </div>
    </div>
  );
}
