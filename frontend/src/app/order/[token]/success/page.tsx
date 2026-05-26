"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Phone, Download, MessageCircle } from "lucide-react";
import { Order, AppSettings } from "@/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090/api").replace(/\/api$/, "");
function imgSrc(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}


export default function OrderSuccessPage() {
  const { token } = useParams<{ token: string }>();

  const { data: order } = useQuery<Order>({
    queryKey: ["public-order-success", token],
    queryFn: () => api.get(`/orders/public/${token}`).then(r => r.data),
    enabled: !!token,
  });

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["public-settings"],
    queryFn: () => api.get("/settings/public").then(r => r.data),
  });

  const supportPhone = appSettings?.support_phone || "+91-9999999999";
  const totalQty = order?.items?.reduce((s, item) => s + item.totalQuantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">SUS</div>
            <span className="font-semibold text-gray-800 text-sm">Uniform Manager</span>
          </div>
          <span className="text-xs text-gray-400">Powered by SUS Platform</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Success card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Order Submitted!</h1>
            <p className="text-green-100 text-sm">Thank you. Your uniform order has been received.</p>
          </div>

          {/* Order details */}
          <div className="px-6 py-5">
            {order && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Order Number</p>
                  <p className="font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">School</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{order.school?.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                  <p className="font-bold text-indigo-600 text-sm">{formatCurrency(order.grandTotal || order.totalAmount)}</p>
                </div>
              </div>
            )}

            {/* Items summary */}
            {order?.items && order.items.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Items ({totalQty} pieces)</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {order.items.map(item => {
                    const src = imgSrc(item.productImageUrl);
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                        {src ? (
                          <img src={src} alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-indigo-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.notes}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-700">{item.totalQuantity} pcs</p>
                          <p className="text-xs text-indigo-600 font-medium">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" /> Print Summary
              </button>
              {order && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Order #${order.orderNumber} submitted for ${order.school?.name}. Total: ₹${(order.grandTotal || order.totalAmount || 0).toFixed(0)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Share on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Support footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            Questions? Contact your sales representative
          </p>
          <a
            href={`tel:${supportPhone}`}
            className="inline-flex items-center gap-1.5 mt-2 text-indigo-600 font-medium text-sm hover:underline"
          >
            <Phone className="h-4 w-4" /> {supportPhone}
          </a>
          <p className="text-xs text-gray-400 mt-1">Reference Order #{order?.orderNumber}</p>
        </div>
      </div>
    </div>
  );
}
