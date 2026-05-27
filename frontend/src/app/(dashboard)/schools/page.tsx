"use client";

import { useState } from "react";

const ALL_CLASSES = [
  "Nursery", "Jr. KG", "Sr. KG",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th",
];

function ClassNamesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const remaining = ALL_CLASSES.filter(c => !value.includes(c));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border rounded-md bg-gray-50">
        {value.map((cls, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
            {cls}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-red-500 leading-none">×</button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400 self-center">No classes added</span>}
      </div>
      {remaining.length > 0 && (
        <select
          className="w-full text-sm border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          value=""
          onChange={e => { if (e.target.value) onChange([...value, e.target.value]); }}
        >
          <option value="">+ Add a class...</option>
          {remaining.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {remaining.length === 0 && (
        <p className="text-xs text-gray-400">All classes added.</p>
      )}
    </div>
  );
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Check, Pencil, Link2, ToggleLeft, ToggleRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { School } from "@/types";
import api from "@/lib/api";
import { formatDate, toTitleCase } from "@/lib/utils";

const CONTACT_ROLES = ["Principal", "Teacher", "School Samiti", "Other"] as const;

const schoolSchema = z.object({
  name: z.string().min(1, "School name required"),
  schoolCode: z.string().min(1, "School code required"),
  address: z.string().optional(),
  // Contact 1
  contactPerson: z.string().optional(),
  contactPersonRole: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  // Contact 2
  contactPerson2Name: z.string().optional(),
  contactPerson2Role: z.string().optional(),
  contactPerson2Mobile: z.string().optional(),
  contactPerson2Email: z.string().email("Invalid email").optional().or(z.literal("")),
  active: z.boolean().default(true),
  classNames: z.array(z.string()).optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export default function SchoolsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["schools", search],
    queryFn: () => api.get("/schools", { params: search ? { search } : {} }).then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { active: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: SchoolFormData) => api.post("/schools", data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School created");
      setDialogOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to create school");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SchoolFormData }) =>
      api.put(`/schools/${id}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School updated");
      setDialogOpen(false);
      setEditingSchool(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School deactivated");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to deactivate school");
    },
  });

  const activateMutation = useMutation({
    mutationFn: (school: School) =>
      api.put(`/schools/${school.id}`, { ...school, active: true }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School activated");
    },
    onError: () => toast.error("Failed to activate school"),
  });

  const openCreate = () => { reset({ active: true }); setEditingSchool(null); setDialogOpen(true); };
  const openEdit = (school: School) => {
    setEditingSchool(school);
    const fields: (keyof SchoolFormData)[] = [
      "name", "schoolCode", "address", "active",
      "contactPerson", "contactPersonRole", "mobile", "email",
      "contactPerson2Name", "contactPerson2Role", "contactPerson2Mobile", "contactPerson2Email",
    ];
    fields.forEach(k => setValue(k, (school as unknown as Record<string, string | boolean>)[k] as string ?? ""));
    setValue("classNames", school.classNames ?? []);
    setDialogOpen(true);
  };

  const onSubmit = (data: SchoolFormData) => {
    if (editingSchool) updateMutation.mutate({ id: editingSchool.id, data });
    else createMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return Promise.resolve();
  };

  const toWhatsAppNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    return digits;
  };

  const generateLink = async (school: School) => {
    try {
      const res = await api.post(`/schools/${school.id}/generate-token`);
      const url = res.data.orderUrl;
      const mobile = school.mobile?.trim();
      if (mobile) {
        const waNumber = toWhatsAppNumber(mobile);
        const message = encodeURIComponent(
          `Hello, here is the uniform order link for ${school.name}:\n${url}`
        );
        window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
        setCopiedId(school.id);
        toast.success("Opening WhatsApp with order link!");
      } else {
        await copyToClipboard(url);
        setCopiedId(school.id);
        toast.success("Order link copied to clipboard!");
      }
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to generate link");
    }
  };

  const placeOrder = async (schoolId: number) => {
    try {
      const res = await api.post(`/schools/${schoolId}/generate-token`);
      window.open(res.data.orderUrl, "_blank");
    } catch {
      toast.error("Failed to open order form");
    }
  };

  return (
    <DashboardLayout title="Schools">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search schools..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add School</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">School</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact 1</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Contact 2</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Added</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools?.map(school => (
                    <tr key={school.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/schools/${school.id}`)}
                          className="font-medium text-gray-900 hover:text-indigo-700 hover:underline text-left"
                        >
                          {school.name}
                        </button>
                        <p className="text-xs text-gray-400">{school.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{school.schoolCode}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-700 text-sm">{school.contactPerson}</p>
                        {school.contactPersonRole && <p className="text-xs text-indigo-500">{school.contactPersonRole}</p>}
                        <p className="text-xs text-gray-400">{school.mobile}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {school.contactPerson2Name ? (
                          <>
                            <p className="text-gray-700 text-sm">{school.contactPerson2Name}</p>
                            {school.contactPerson2Role && <p className="text-xs text-indigo-500">{school.contactPerson2Role}</p>}
                            <p className="text-xs text-gray-400">{school.contactPerson2Mobile}</p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(school.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={school.active ? "success" : "secondary"}>{school.active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Place order" onClick={() => placeOrder(school.id)}>
                            <ShoppingCart className="h-4 w-4 text-indigo-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title={school.mobile ? "Send on WhatsApp" : "Copy order link"} onClick={() => generateLink(school)}>
                            {copiedId === school.id
                              ? <Check className="h-4 w-4 text-green-500" />
                              : <Link2 className={`h-4 w-4 ${school.mobile ? "text-green-600" : ""}`} />
                            }
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(school)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {school.active ? (
                            <Button variant="ghost" size="icon" title="Deactivate" onClick={() => deleteMutation.mutate(school.id)}>
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" title="Activate" onClick={() => activateMutation.mutate(school)}>
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!schools || schools.length === 0) && (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">No schools found. Add your first school.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchool ? "Edit School" : "Add New School"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>School Name *</Label>
                <Input {...register("name")} onChange={e => setValue("name", toTitleCase(e.target.value), { shouldValidate: true })} placeholder="Green Valley High School" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>School Code *</Label>
                <Input {...register("schoolCode")} placeholder="GVH001" />
                {errors.schoolCode && <p className="text-xs text-red-500">{errors.schoolCode.message}</p>}
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Address</Label>
                <Input {...register("address")} placeholder="Full address" />
              </div>
            </div>

            {/* Contact person 1 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Contact Person 1</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input {...register("contactPerson")} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <select
                    {...register("contactPersonRole")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select role</option>
                    {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input {...register("mobile")} placeholder="9876543210" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input {...register("email")} type="email" placeholder="contact@school.com" />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            {/* Contact person 2 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Contact Person 2 <span className="font-normal text-gray-400">(optional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input {...register("contactPerson2Name")} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <select
                    {...register("contactPerson2Role")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select role</option>
                    {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input {...register("contactPerson2Mobile")} placeholder="9876543210" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input {...register("contactPerson2Email")} type="email" placeholder="contact2@school.com" />
                  {errors.contactPerson2Email && <p className="text-xs text-red-500">{errors.contactPerson2Email.message}</p>}
                </div>
              </div>
            </div>

            {/* Class Names */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 border-b pb-1">Class Names</p>
              <p className="text-xs text-gray-400">These classes appear in the student counts step of the order form.</p>
              <ClassNamesEditor value={watch("classNames") ?? []} onChange={v => setValue("classNames", v)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSchool ? "Save Changes" : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
