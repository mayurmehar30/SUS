"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Building2, ChevronRight, ChevronLeft, ClipboardList, User, Save } from "lucide-react";

import { Order, Product, AppSettings } from "@/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

import Stepper from "./_components/Stepper";
import UniformBuilderStep from "./_components/UniformBuilderStep";
import StudentCountsStep from "./_components/StudentCountsStep";
import OrderSummaryStep from "./_components/OrderSummaryStep";
import CartSidebar from "./_components/CartSidebar";
import OrderStatusView from "./_components/OrderStatusView";
import {
  UniformSet, UniformType, GenderKey, SectionType,
  emptyUniform, hasAnyProduct, getUniformTotalQty, getUniformEstimate, getSectionProducts,
} from "./_components/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactPerson {
  name: string;
  role: string;
  mobile: string;
  email: string;
}

const CONTACT_ROLES = ["Principal", "Teacher", "School Samiti", "Other"];

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "School Info" },
  { id: 2, label: "Build Uniforms" },
  { id: 3, label: "Student Counts" },
  { id: 4, label: "Review & Submit" },
];

const MAX_STEP = 4;

function lsKey(token: string) { return `sus_uniforms_${token}`; }

// ── Submission helper ─────────────────────────────────────────────────────────

function buildOrderItems(
  uniforms: UniformSet[],
  classRows: import("@/types").ClassStudentCount[],
) {
  const items: {
    productId: number;
    unitPrice: number;
    notes: string;
    classStudentCounts: { className: string; boysCount: number; girlsCount: number }[];
  }[] = [];

  const boysRows = classRows.filter(r => r.boysCount > 0)
    .map(r => ({ className: r.className, boysCount: r.boysCount, girlsCount: 0 }));
  const girlsRows = classRows.filter(r => r.girlsCount > 0)
    .map(r => ({ className: r.className, boysCount: 0, girlsCount: r.girlsCount }));

  for (const uniform of uniforms) {
    if (!hasAnyProduct(uniform)) continue;
    const boysProducts = getSectionProducts(uniform, "boys");
    const girlsProducts = getSectionProducts(uniform, "girls");
    for (const product of boysProducts) {
      if (boysRows.length > 0)
        items.push({ productId: product.id, unitPrice: product.finalPrice, notes: `${uniform.name} - Boys`, classStudentCounts: boysRows });
    }
    for (const product of girlsProducts) {
      if (girlsRows.length > 0)
        items.push({ productId: product.id, unitPrice: product.finalPrice, notes: `${uniform.name} - Girls`, classStudentCounts: girlsRows });
    }
  }
  return items;
}

// ── Loading / Error screens ───────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading order form...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, supportPhone }: { message: string; supportPhone: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⛔</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
        <p className="text-gray-500 text-sm">{message}</p>
        <p className="text-gray-400 text-xs mt-4">Please contact your sales representative for a new link.</p>
        <a href={`tel:${supportPhone}`} className="inline-flex items-center gap-2 mt-4 text-indigo-600 text-sm font-medium hover:underline">
          <Phone className="h-4 w-4" /> Call Support
        </a>
      </div>
    </div>
  );
}

// ── Contact Person Editor ────────────────────────────────────────────────────

function ContactPersonEditor({
  label, value, onChange, optional,
}: {
  label: string;
  value: ContactPerson;
  onChange: (v: ContactPerson) => void;
  optional?: boolean;
}) {
  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <User className="h-4 w-4 text-indigo-500" />
        {label}
        {optional && <span className="font-normal text-gray-400 text-xs">(optional)</span>}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input
            className={inputCls}
            placeholder="Full name"
            value={value.name}
            onChange={e => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs text-gray-500 mb-1 block">Role</label>
          <select
            className={inputCls}
            value={value.role}
            onChange={e => onChange({ ...value, role: e.target.value })}
          >
            <option value="">Select role</option>
            {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mobile</label>
          <input
            className={inputCls}
            placeholder="9876543210"
            value={value.mobile}
            onChange={e => onChange({ ...value, mobile: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Email</label>
          <input
            className={inputCls}
            type="email"
            placeholder="contact@school.com"
            value={value.email}
            onChange={e => onChange({ ...value, email: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ── School Info Step ──────────────────────────────────────────────────────────

function SchoolInfoStep({
  order, cp1, cp2, onCp1Change, onCp2Change, onNext,
}: {
  order: Order;
  cp1: ContactPerson;
  cp2: ContactPerson;
  onCp1Change: (v: ContactPerson) => void;
  onCp2Change: (v: ContactPerson) => void;
  onNext: () => void;
}) {
  const school = order.school;

  return (
    <div className="space-y-5">
      {/* School welcome header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-indigo-200 font-medium">Placing order for</p>
          <p className="text-lg font-bold text-white leading-tight">{school.name}</p>
        </div>
      </div>

      {/* Editable contact persons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Building2 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">Contact Persons</h3>
          <span className="text-xs text-gray-400 ml-1">— verify and update if needed</span>
        </div>
        <ContactPersonEditor label="Contact Person 1" value={cp1} onChange={onCp1Change} />
        <div className="border-t border-gray-100 pt-4">
          <ContactPersonEditor label="Contact Person 2" value={cp2} onChange={onCp2Change} optional />
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
      >
        Proceed to Build Uniforms <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Mobile bottom bar ─────────────────────────────────────────────────────────

function MobileBottomBar({
  uniformCount, grandTotal, totalQty, step, onNext, onBack, submitting, canProceed,
}: {
  uniformCount: number;
  grandTotal: number;
  totalQty: number;
  step: number;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
  canProceed: boolean;
}) {
  if (uniformCount === 0 && step === 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-xl px-4 py-3">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {uniformCount > 0 && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {uniformCount}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {totalQty > 0 ? `${totalQty} students` : `${uniformCount} uniform${uniformCount !== 1 ? "s" : ""}`}
                </p>
                {grandTotal > 0 && <p className="text-sm font-bold text-indigo-600">{formatCurrency(grandTotal)}</p>}
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 flex-shrink-0">
          {step > 1 && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {step < MAX_STEP ? (
            <button
              onClick={onNext}
              disabled={!canProceed}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                canProceed ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={submitting || !canProceed}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-green-600 text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PublicOrderPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [uniforms, setUniforms] = useState<UniformSet[]>([]);
  const [classRows, setClassRows] = useState<import("@/types").ClassStudentCount[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cp1, setCp1] = useState<ContactPerson>({ name: "", role: "", mobile: "", email: "" });
  const [cp2, setCp2] = useState<ContactPerson>({ name: "", role: "", mobile: "", email: "" });
  const [savedIndicator, setSavedIndicator] = useState(false);
  const isFirstMount = useRef(true);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading, error: orderError } = useQuery<Order>({
    queryKey: ["public-order", token],
    queryFn: () => api.get(`/orders/public/${token}`).then(r => r.data),
  });

  const { data: productsPage, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => api.get("/products", { params: { active: true, size: 200 } }).then(r => r.data),
    enabled: !!order,
  });

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["public-settings"],
    queryFn: () => api.get("/settings/public").then(r => r.data),
  });

  const { data: savedCountHistory } = useQuery<Array<{ id: number; savedAt: string; countsJson: string }>>({
    queryKey: ["count-history", token],
    queryFn: () => api.get(`/orders/public/${token}/count-history`).then(r => r.data),
    enabled: !!order,
    staleTime: 30000,
  });

  const supportPhone = appSettings?.support_phone || "+91-9999999999";

  const products: Product[] = (productsPage?.content ?? []).filter((p: Product) => p.active);

  // ── Load from localStorage on first mount ─────────────────────────────────
  useEffect(() => {
    if (!token) return;
    try {
      const saved = localStorage.getItem(lsKey(token));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUniforms(parsed);
          toast.success("Saved progress restored", { duration: 2000 });
        }
      }
    } catch { /* ignore */ }
  }, [token]);

  // ── Auto-save uniforms to localStorage ────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    try {
      localStorage.setItem(lsKey(token), JSON.stringify(uniforms));
      setSavedIndicator(true);
      const t = setTimeout(() => setSavedIndicator(false), 1500);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [uniforms, token]);

  // ── Pre-fill contact persons from school data ──────────────────────────────
  useEffect(() => {
    if (!order?.school) return;
    const s = order.school;
    setCp1({ name: s.contactPerson || "", role: s.contactPersonRole || "", mobile: s.mobile || "", email: s.email || "" });
    setCp2({ name: s.contactPerson2Name || "", role: s.contactPerson2Role || "", mobile: s.contactPerson2Mobile || "", email: s.contactPerson2Email || "" });
  }, [order?.school?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialise shared classRows from school's configured class names ────────
  useEffect(() => {
    const classes = order?.school?.classNames;
    if (!classes || classes.length === 0) return;
    setClassRows(prev => {
      if (prev.length > 0) {
        return classes.map(cls => {
          const existing = prev.find(r => r.className === cls);
          return existing ?? { className: cls, boysCount: 0, girlsCount: 0, totalCount: 0 };
        });
      }
      return classes.map(cls => ({ className: cls, boysCount: 0, girlsCount: 0, totalCount: 0 }));
    });
  }, [order?.school?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-fill classRows from last saved count history ──────────────────────
  useEffect(() => {
    if (!savedCountHistory || savedCountHistory.length === 0) return;
    try {
      const lastCounts: Array<{ className: string; boysCount: number; girlsCount: number }> =
        JSON.parse(savedCountHistory[0].countsJson);
      setClassRows(prev => {
        if (prev.length === 0) return prev;
        return prev.map(row => {
          const saved = lastCounts.find(c => c.className === row.className);
          return saved
            ? { ...row, boysCount: saved.boysCount, girlsCount: saved.girlsCount, totalCount: saved.boysCount + saved.girlsCount }
            : row;
        });
      });
    } catch { /* ignore parse errors */ }
  }, [savedCountHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutation ───────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () => {
      const items = buildOrderItems(uniforms, classRows);
      const cpNotes: string[] = [];
      if (cp1.name) cpNotes.push(`CP1: ${cp1.name}${cp1.role ? ` (${cp1.role})` : ""}${cp1.mobile ? ` | ${cp1.mobile}` : ""}${cp1.email ? ` | ${cp1.email}` : ""}`);
      if (cp2.name) cpNotes.push(`CP2: ${cp2.name}${cp2.role ? ` (${cp2.role})` : ""}${cp2.mobile ? ` | ${cp2.mobile}` : ""}${cp2.email ? ` | ${cp2.email}` : ""}`);
      return api.post(`/orders/public/${token}/submit`, {
        items,
        notes: [...cpNotes, orderNotes, deliveryNotes].filter(Boolean).join(" | "),
      });
    },
    onSuccess: () => {
      try { localStorage.removeItem(lsKey(token)); } catch { /* ignore */ }
      router.push(`/order/${token}/success`);
    },
    onError: () => toast.error("Failed to submit order. Please try again."),
  });

  // ── Uniform management ─────────────────────────────────────────────────────
  const addUniform = useCallback(() => {
    setUniforms(prev => {
      const letter = String.fromCharCode(65 + prev.length);
      return [...prev, emptyUniform(`Uniform ${letter}`, order?.school?.classNames)];
    });
  }, [order?.school?.classNames]);

  const removeUniform = useCallback((id: string) => {
    setUniforms(prev => prev.filter(u => u.id !== id));
  }, []);

  const renameUniform = useCallback((id: string, name: string) => {
    setUniforms(prev => prev.map(u => u.id === id ? { ...u, name } : u));
  }, []);

  const changeUniformType = useCallback((id: string, type: UniformType) => {
    setUniforms(prev => prev.map(u => u.id === id ? { ...u, uniformType: type } : u));
  }, []);

  const setProduct = useCallback((uniformId: string, gender: GenderKey, type: "topwear" | "bottomwear", product: Product | null) => {
    setUniforms(prev => prev.map(u => {
      if (u.id !== uniformId) return u;
      return { ...u, [gender]: { ...u[gender], [type]: product } };
    }));
  }, []);

  const toggleAccessory = useCallback((uniformId: string, gender: GenderKey, product: Product) => {
    setUniforms(prev => prev.map(u => {
      if (u.id !== uniformId) return u;
      const existing = u[gender].accessories;
      const has = existing.some(p => p.id === product.id);
      return {
        ...u,
        [gender]: {
          ...u[gender],
          accessories: has ? existing.filter(p => p.id !== product.id) : [...existing, product],
        },
      };
    }));
  }, []);

  const copyBoysToGirls = useCallback((uniformId: string, type: SectionType) => {
    setUniforms(prev => prev.map(u => {
      if (u.id !== uniformId) return u;
      const val = type === "accessories" ? [...u.boys.accessories] : u.boys[type];
      return { ...u, girls: { ...u.girls, [type]: val } };
    }));
  }, []);

  const updateClassRow = useCallback((idx: number, field: "boysCount" | "girlsCount", value: number) => {
    setClassRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: Math.max(0, value) };
      updated.totalCount = updated.boysCount + updated.girlsCount;
      return updated;
    }));
  }, []);

  // ── Explicit save ─────────────────────────────────────────────────────────
  const handleSaveProgress = useCallback(() => {
    if (!token) return;
    try {
      localStorage.setItem(lsKey(token), JSON.stringify(uniforms));
      toast.success("Progress saved! Your uniforms are stored locally.", { duration: 2000 });
    } catch {
      toast.error("Could not save progress");
    }
  }, [token, uniforms]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const uniformsWithProducts = uniforms.filter(hasAnyProduct);
  const grandTotal = uniformsWithProducts.reduce((s, u) => s + getUniformEstimate(u, classRows), 0);
  const totalQty = uniformsWithProducts.reduce((s, u) => s + getUniformTotalQty(u, classRows), 0);

  const canProceed =
    step === 1 ? true :
    step === 2 ? uniformsWithProducts.length > 0 :
    step === 3 ? totalQty > 0 :
    termsAccepted && uniformsWithProducts.length > 0;

  const handleNext = () => {
    if (step === MAX_STEP) { submitMutation.mutate(); return; }
    if (!canProceed) {
      const msg =
        step === 2 ? "Please create at least one uniform with products" :
        step === 3 ? "Please enter student counts for at least one class" :
        "Please accept the terms to submit";
      toast.error(msg);
      return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (orderLoading) return <LoadingScreen />;
  if (orderError || !order) return <ErrorScreen message="This order link is invalid or has expired. Please request a new link from your school administrator." supportPhone={supportPhone} />;
  if (!order.school?.active) return <ErrorScreen message="This school account is currently inactive. Please contact your sales representative to reactivate it." supportPhone={supportPhone} />;

  // Non-DRAFT orders get a status/history view
  if (order.status !== "DRAFT") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {order.school?.name?.charAt(0) || "S"}
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-gray-900 text-sm truncate">{order.school?.name}</h1>
                  <p className="text-xs text-gray-400">Uniform Order · #{order.orderNumber}</p>
                </div>
              </div>
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-colors flex-shrink-0"
              >
                <Phone className="h-3.5 w-3.5" /> Support
              </a>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
          <OrderStatusView
            order={order}
            token={token}
            classRows={classRows}
            onUpdateRow={updateClassRow}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {order.school?.name?.charAt(0) || "S"}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-sm truncate">{order.school?.name}</h1>
                <p className="text-xs text-gray-400">Uniform Order · #{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {savedIndicator && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 font-medium animate-pulse">
                  <Save className="h-3 w-3" /> Saved
                </span>
              )}
              {uniformsWithProducts.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {uniformsWithProducts.length} uniform{uniformsWithProducts.length !== 1 ? "s" : ""}
                  {grandTotal > 0 ? ` · ${formatCurrency(grandTotal)}` : ""}
                </div>
              )}
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> Support
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <Stepper current={step} steps={STEPS} />
        </div>
      </div>

      {/* Step label */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-0">
        <h2 className="text-lg font-bold text-gray-900">
          {step === 1 && "School Information"}
          {step === 2 && "Build Your Uniforms"}
          {step === 3 && "Enter Student Counts"}
          {step === 4 && "Review & Submit Order"}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {step === 1 && "Verify school details and confirm contact persons"}
          {step === 2 && "Create uniform sets and assign products for boys and girls"}
          {step === 3 && "Enter class-wise student counts for each uniform"}
          {step === 4 && "Review your order details and submit"}
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-5 pb-28 lg:pb-10">
        <div className="lg:flex lg:gap-6">

          {/* Step content */}
          <div className="lg:flex-1 min-w-0">
            {step === 1 && (
              <SchoolInfoStep
                order={order}
                cp1={cp1}
                cp2={cp2}
                onCp1Change={setCp1}
                onCp2Change={setCp2}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              productsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <UniformBuilderStep
                  uniforms={uniforms}
                  products={products}
                  deliveryNotes={deliveryNotes}
                  onDeliveryChange={setDeliveryNotes}
                  onSave={handleSaveProgress}
                  onAddUniform={addUniform}
                  onRename={renameUniform}
                  onTypeChange={changeUniformType}
                  onDelete={removeUniform}
                  onSetProduct={setProduct}
                  onToggleAccessory={toggleAccessory}
                  onCopyBoysToGirls={copyBoysToGirls}
                />
              )
            )}
            {step === 3 && (
              <StudentCountsStep
                classRows={classRows}
                uniforms={uniforms}
                token={token}
                onUpdateRow={updateClassRow}
                locked={order.locked}
                savedBy={cp1.name || undefined}
              />
            )}
            {step === 4 && (
              <OrderSummaryStep
                uniforms={uniforms}
                classRows={classRows}
                orderNotes={orderNotes}
                deliveryNotes={deliveryNotes}
                onNotesChange={setOrderNotes}
                onDeliveryChange={setDeliveryNotes}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                schoolName={order.school?.name || "your school"}
                cp1={cp1}
                cp2={cp2}
              />
            )}

            {/* Desktop step navigation */}
            {step > 1 && (
              <div className="hidden lg:flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {step < MAX_STEP ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      canProceed ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={submitMutation.isPending || !canProceed}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Order"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop sticky sidebar */}
          {step >= 2 && (
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-20">
                <CartSidebar
                  uniforms={uniforms}
                  classRows={classRows}
                  grandTotal={grandTotal}
                  totalQty={totalQty}
                  step={step}
                  maxStep={MAX_STEP}
                  onNext={handleNext}
                  onBack={handleBack}
                  submitting={submitMutation.isPending}
                  canProceed={canProceed}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <MobileBottomBar
        uniformCount={uniformsWithProducts.length}
        grandTotal={grandTotal}
        totalQty={totalQty}
        step={step}
        onNext={handleNext}
        onBack={handleBack}
        submitting={submitMutation.isPending}
        canProceed={canProceed}
      />
    </div>
  );
}
