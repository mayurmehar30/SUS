"use client";
import { Package, FileText, Truck, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ClassStudentCount } from "@/types";
import { UniformSet, getUniformEstimate, getUniformTotalQty, hasAnyProduct, getSectionProducts } from "./types";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090/api").replace(/\/api$/, "");
function imgSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

function ProductThumb({ url, name }: { url: string | null | undefined; name: string }) {
  const src = imgSrc(url);
  if (!src) {
    return (
      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-indigo-400">{name.charAt(0)}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0 bg-gray-50"
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

interface ContactPerson {
  name: string;
  role: string;
  mobile: string;
  email: string;
}

interface OrderSummaryStepProps {
  uniforms: UniformSet[];
  classRows: ClassStudentCount[];
  orderNotes: string;
  deliveryNotes: string;
  onNotesChange: (v: string) => void;
  onDeliveryChange: (v: string) => void;
  termsAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  schoolName: string;
  cp1: ContactPerson;
  cp2: ContactPerson;
}

function UniformSummaryRow({ uniform, classRows }: { uniform: UniformSet; classRows: ClassStudentCount[] }) {
  const estimate = getUniformEstimate(uniform, classRows);
  const totalQty = getUniformTotalQty(uniform, classRows);
  const boysQty = classRows.reduce((s, r) => s + r.boysCount, 0);
  const girlsQty = classRows.reduce((s, r) => s + r.girlsCount, 0);
  const boysProducts = getSectionProducts(uniform, "boys");
  const girlsProducts = getSectionProducts(uniform, "girls");

  return (
    <div className="px-5 py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {uniform.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{uniform.name}</p>
            <span className="text-xs text-indigo-500 font-medium">{uniform.uniformType}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-800 text-base">{formatCurrency(estimate)}</p>
          <p className="text-sm text-gray-400 font-medium">{totalQty} students</p>
        </div>
      </div>
      <div className="pl-9 space-y-2">
        {boysProducts.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-blue-600">Boys</span>
            {boysProducts.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <ProductThumb url={p.images?.[0]?.imageUrl} name={p.name} />
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700 font-medium truncate">{p.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{boysQty} × {formatCurrency(p.finalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {girlsProducts.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-pink-600">Girls</span>
            {girlsProducts.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <ProductThumb url={p.images?.[0]?.imageUrl} name={p.name} />
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700 font-medium truncate">{p.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{girlsQty} × {formatCurrency(p.finalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderSummaryStep({
  uniforms, classRows, orderNotes, deliveryNotes, onNotesChange, onDeliveryChange,
  termsAccepted, onTermsChange, schoolName, cp1, cp2,
}: OrderSummaryStepProps) {
  const withProducts = uniforms.filter(hasAnyProduct);
  const grandTotal = withProducts.reduce((s, u) => s + getUniformEstimate(u, classRows), 0);
  const totalStudents = withProducts.reduce((s, u) => s + getUniformTotalQty(u, classRows), 0);

  return (
    <div className="space-y-5">
      {/* Uniform-wise product summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Uniform Summary</h3>
          <span className="ml-auto text-xs text-gray-400">{withProducts.length} uniform{withProducts.length !== 1 ? "s" : ""}</span>
        </div>
        {withProducts.map(u => <UniformSummaryRow key={u.id} uniform={u} classRows={classRows} />)}
      </div>

      {/* Student count summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Student Count Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-2.5 font-medium text-gray-500">Uniform</th>
                <th className="text-center px-3 py-2.5 font-medium text-blue-500">Boys</th>
                <th className="text-center px-3 py-2.5 font-medium text-pink-500">Girls</th>
                <th className="text-center px-3 py-2.5 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withProducts.map(u => {
                const boys = classRows.reduce((s, r) => s + r.boysCount, 0);
                const girls = classRows.reduce((s, r) => s + r.girlsCount, 0);
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-2.5 font-medium text-gray-700 max-w-[160px]">
                      <div className="truncate">{u.name}</div>
                      <div className="text-gray-400 font-normal">{u.uniformType}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-blue-600 text-base">{boys}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-pink-600 text-base">{girls}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-indigo-700 text-base">{boys + girls}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-50 border-t-2 border-indigo-100 font-bold">
                <td className="px-5 py-2.5 text-gray-700">Grand Total</td>
                <td className="px-3 py-2.5 text-center text-blue-600 text-base">
                  {classRows.reduce((s, r) => s + r.boysCount, 0)}
                </td>
                <td className="px-3 py-2.5 text-center text-pink-600 text-base">
                  {classRows.reduce((s, r) => s + r.girlsCount, 0)}
                </td>
                <td className="px-3 py-2.5 text-center text-indigo-700 text-base">{totalStudents}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Truck className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Payment Summary</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          {withProducts.map(u => (
            <div key={u.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{u.name}</span>
              <span className="font-semibold text-gray-800 text-base">{formatCurrency(getUniformEstimate(u, classRows))}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Grand Total</span>
            <span className="font-bold text-xl text-indigo-600">{formatCurrency(grandTotal)}</span>
          </div>
          <p className="text-xs text-gray-400">Final invoice will be generated after admin approval</p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Instructions</label>
          <textarea
            value={deliveryNotes}
            onChange={e => onDeliveryChange(e.target.value)}
            rows={2}
            placeholder="e.g. Deliver to school office, contact Principal's office..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
          <textarea
            value={orderNotes}
            onChange={e => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Any special requirements or remarks..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Contact persons */}
      {(cp1.name || cp2.name) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Contact Persons</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cp1.name && (
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-1">
                <div className="col-span-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Contact Person 1</div>
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800">{cp1.name}</p>
                </div>
                {cp1.role && (
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="text-sm font-medium text-gray-800">{cp1.role}</p>
                  </div>
                )}
                {cp1.mobile && (
                  <div>
                    <p className="text-xs text-gray-400">Mobile</p>
                    <p className="text-sm text-gray-700">{cp1.mobile}</p>
                  </div>
                )}
                {cp1.email && (
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-700 break-all">{cp1.email}</p>
                  </div>
                )}
              </div>
            )}
            {cp2.name && (
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-1">
                <div className="col-span-2 text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Contact Person 2</div>
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800">{cp2.name}</p>
                </div>
                {cp2.role && (
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="text-sm font-medium text-gray-800">{cp2.role}</p>
                  </div>
                )}
                {cp2.mobile && (
                  <div>
                    <p className="text-xs text-gray-400">Mobile</p>
                    <p className="text-sm text-gray-700">{cp2.mobile}</p>
                  </div>
                )}
                {cp2.email && (
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-700 break-all">{cp2.email}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={e => onTermsChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-indigo-600 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">I confirm this order on behalf of {schoolName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              By checking this box, I confirm that the student counts and product selections are accurate and authorized.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
