"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Store, Phone, Mail, MapPin, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { toTitleCase } from "@/lib/utils";

const VENDOR_COLORS = [
  { gradient: "from-indigo-500 to-violet-600", light: "bg-indigo-50",  text: "text-indigo-700",  glow: "shadow-indigo-200"  },
  { gradient: "from-sky-500 to-blue-600",      light: "bg-sky-50",     text: "text-sky-700",     glow: "shadow-sky-200"     },
  { gradient: "from-emerald-500 to-teal-600",  light: "bg-emerald-50", text: "text-emerald-700", glow: "shadow-emerald-200" },
  { gradient: "from-rose-500 to-pink-600",     light: "bg-rose-50",    text: "text-rose-700",    glow: "shadow-rose-200"    },
  { gradient: "from-amber-500 to-orange-600",  light: "bg-amber-50",   text: "text-amber-700",   glow: "shadow-amber-200"   },
  { gradient: "from-violet-500 to-purple-600", light: "bg-violet-50",  text: "text-violet-700",  glow: "shadow-violet-200"  },
];

interface Vendor {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  active: boolean;
}

const emptyForm = (): Omit<Vendor, "id"> => ({
  name: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "", active: true,
});

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => api.get("/vendors").then(r => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vendors"] });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/vendors", data).then(r => r.data),
    onSuccess: () => { toast.success("Vendor created"); invalidate(); closeForm(); },
    onError: () => toast.error("Failed to create vendor"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => api.put(`/vendors/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success("Vendor updated"); invalidate(); closeForm(); },
    onError: () => toast.error("Failed to update vendor"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/vendors/${id}/toggle`),
    onSuccess: () => { toast.success("Status updated"); invalidate(); },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendors/${id}`),
    onSuccess: () => { toast.success("Vendor deleted"); invalidate(); setDeleteConfirm(null); },
    onError: () => toast.error("Failed to delete vendor"),
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (v: Vendor) => {
    setEditId(v.id);
    setForm({ name: v.name, contactPerson: v.contactPerson || "", phone: v.phone || "", email: v.email || "", address: v.address || "", gstNumber: v.gstNumber || "", active: v.active });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm()); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Vendor name is required"); return; }
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const field = (key: keyof typeof form, label: string, placeholder?: string, type = "text", transform?: (v: string) => string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={type}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: transform ? transform(e.target.value) : e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <DashboardLayout title="Vendors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""} registered</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-indigo-200 bg-indigo-50/30 animate-scale-in">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">{editId ? "Edit Vendor" : "Add New Vendor"}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  {field("name", "Vendor Name *", "e.g. Rathi Fabrics Pvt Ltd", "text", toTitleCase)}
                </div>
                {field("contactPerson", "Contact Person", "Full name")}
                {field("phone", "Phone", "+91-9876543210", "tel")}
                {field("email", "Email", "vendor@example.com", "email")}
                {field("gstNumber", "GST Number", "e.g. 24AABCR1234A1Z5")}
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <textarea
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    rows={2}
                    placeholder="Full business address..."
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="vendor-active"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <Label htmlFor="vendor-active" className="cursor-pointer">Active</Label>
                </div>
                <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editId ? "Save Changes" : "Create Vendor"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vendor list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-shimmer h-52 rounded-2xl" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-rose-200 animate-float">
              <Store className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">No vendors yet</p>
            <p className="text-xs text-gray-400 mb-5">Add your first vendor to get started.</p>
            <Button onClick={openCreate} className="rounded-xl gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Vendor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map((v, i) => {
              const vc = VENDOR_COLORS[i % VENDOR_COLORS.length];
              return (
              <Card
                key={v.id}
                className={`relative flex flex-col overflow-hidden animate-fade-in-up hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${!v.active ? "opacity-60" : ""}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Color accent strip at top */}
                <div className={`h-1 w-full bg-gradient-to-r ${vc.gradient}`} />
                <CardContent className="pt-4 pb-4 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vc.gradient} shadow-md ${vc.glow} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-sm">{v.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate text-sm">{v.name}</p>
                        {v.contactPerson && <p className="text-xs text-gray-400 truncate">{v.contactPerson}</p>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${v.active ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-500 flex-1">
                    {v.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className={`h-3 w-3 flex-shrink-0 ${vc.text}`} />
                        <span className="font-medium">{v.phone}</span>
                      </div>
                    )}
                    {v.email && (
                      <div className="flex items-center gap-2">
                        <Mail className={`h-3 w-3 flex-shrink-0 ${vc.text}`} />
                        <span className="truncate">{v.email}</span>
                      </div>
                    )}
                    {v.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className={`h-3 w-3 flex-shrink-0 mt-0.5 ${vc.text}`} />
                        <span className="line-clamp-2">{v.address}</span>
                      </div>
                    )}
                    {v.gstNumber && (
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${vc.light} mt-1`}>
                        <span className={`text-[10px] font-semibold ${vc.text}`}>GST</span>
                        <span className={`font-mono text-[10px] ${vc.text}`}>{v.gstNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 mt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleMutation.mutate(v.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      title={v.active ? "Deactivate" : "Activate"}
                    >
                      {v.active
                        ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                        : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(v)}
                      className={`p-1.5 rounded-lg transition-colors ${vc.light} ${vc.text} hover:opacity-80`}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(v.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Delete confirmation */}
        {deleteConfirm !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h3 className="font-bold text-gray-900 mb-2">Delete Vendor?</h3>
              <p className="text-sm text-gray-500 mb-5">
                This will permanently delete the vendor. Products assigned to this vendor will have their vendor cleared.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(deleteConfirm!)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
