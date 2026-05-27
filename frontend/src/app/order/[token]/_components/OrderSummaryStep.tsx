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

function ProductChip({ url, name, gender }: { url: string | null | undefined; name: string; gender: "boys" | "girls" }) {
  const src = imgSrc(url);
  const accent = gender === "boys"
    ? "border-blue-100 bg-blue-50/60 hover:border-blue-300"
    : "border-pink-100 bg-pink-50/60 hover:border-pink-300";
  const initAccent = gender === "boys"
    ? "bg-blue-100 text-blue-600"
    : "bg-pink-100 text-pink-600";
  return (
    <div className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors cursor-default ${accent}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white shadow-sm"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${initAccent}`}>
          {name.charAt(0)}
        </div>
      )}
      <span className="text-xs font-semibold text-gray-700 leading-tight line-clamp-2">{name}</span>

      {/* Hover image preview */}
      {src && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 overflow-hidden">
            <img
              src={src}
              alt={name}
              className="w-44 h-44 object-cover rounded-xl"
            />
            <p className="text-xs font-semibold text-gray-700 text-center mt-1.5 mb-0.5 px-1 truncate max-w-[11rem]">{name}</p>
          </div>
          {/* Arrow */}
          <div className="w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45 mx-auto -mt-1.5 shadow-sm" />
        </div>
      )}
    </div>
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
  const totalQty = getUniformTotalQty(uniform, classRows);
  const boysQty  = classRows.reduce((s, r) => s + r.boysCount, 0);
  const girlsQty = classRows.reduce((s, r) => s + r.girlsCount, 0);
  const boysProducts  = getSectionProducts(uniform, "boys");
  const girlsProducts = getSectionProducts(uniform, "girls");

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {uniform.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">{uniform.name}</p>
            <span className="text-[11px] text-indigo-500 font-semibold">{uniform.uniformType}</span>
          </div>
        </div>
        {totalQty > 0 && (
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full flex-shrink-0">
            {totalQty} students
          </span>
        )}
      </div>

      {/* Products */}
      <div className="px-5 py-4 space-y-4">
        {boysProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Boys</span>
              {boysQty > 0 && (
                <span className="text-[10px] text-blue-400 font-semibold ml-1">{boysQty} students</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {boysProducts.map(p => (
                <ProductChip key={p.id} url={p.images?.[0]?.imageUrl} name={p.name} gender="boys" />
              ))}
            </div>
          </div>
        )}
        {girlsProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wide">Girls</span>
              {girlsQty > 0 && (
                <span className="text-[10px] text-pink-400 font-semibold ml-1">{girlsQty} students</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {girlsProducts.map(p => (
                <ProductChip key={p.id} url={p.images?.[0]?.imageUrl} name={p.name} gender="girls" />
              ))}
            </div>
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

      {/* Student count summary — class-wise */}
      {classRows.length > 0 && (() => {
        const totalBoys  = classRows.reduce((s, r) => s + r.boysCount, 0);
        const totalGirls = classRows.reduce((s, r) => s + r.girlsCount, 0);
        const showBoys  = totalBoys > 0;
        const showGirls = totalGirls > 0;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Student Count Summary</h3>
              <span className="ml-auto text-xs text-gray-400 font-medium">{totalBoys + totalGirls} total students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 font-medium text-gray-500">Class</th>
                    {showBoys && (
                      <th className="text-center px-3 py-2.5 font-medium text-blue-500">
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Boys
                        </span>
                      </th>
                    )}
                    {showGirls && (
                      <th className="text-center px-3 py-2.5 font-medium text-pink-500">
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" /> Girls
                        </span>
                      </th>
                    )}
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classRows.map(row => {
                    const rowTotal = row.boysCount + row.girlsCount;
                    return (
                      <tr key={row.className} className="hover:bg-gray-50/50">
                        <td className="px-5 py-2.5 font-medium text-gray-700">{row.className}</td>
                        {showBoys && (
                          <td className="px-3 py-2.5 text-center">
                            {row.boysCount > 0
                              ? <span className="font-semibold text-blue-600">{row.boysCount}</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                        )}
                        {showGirls && (
                          <td className="px-3 py-2.5 text-center">
                            {row.girlsCount > 0
                              ? <span className="font-semibold text-pink-600">{row.girlsCount}</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-center">
                          {rowTotal > 0
                            ? <span className="font-bold text-indigo-700">{rowTotal}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                    <td className="px-5 py-2.5 font-bold text-gray-700">Total</td>
                    {showBoys && <td className="px-3 py-2.5 text-center font-bold text-blue-600">{totalBoys}</td>}
                    {showGirls && <td className="px-3 py-2.5 text-center font-bold text-pink-600">{totalGirls}</td>}
                    <td className="px-3 py-2.5 text-center font-bold text-indigo-700">{totalBoys + totalGirls}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

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
