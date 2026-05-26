"use client";

import { useState } from "react";
import { useRequireRole } from "@/hooks/useRequireRole";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toTitleCase } from "@/lib/utils";

interface SubCategory {
  id: number;
  name: string;
  active: boolean;
}

interface Category {
  id: number;
  name: string;
  active: boolean;
}

export default function CategoriesPage() {
  const allowed = useRequireRole(["SUPER_ADMIN"]);
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

  const [subDialog, setSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
  const [subName, setSubName] = useState("");
  const [parentCatId, setParentCatId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
  });

  // One independent query per expanded category — clean invalidation by catId
  const subResults = useQueries({
    queries: Array.from(expandedIds).map(id => ({
      queryKey: ["subcategories", id],
      queryFn: (): Promise<SubCategory[]> => api.get(`/categories/${id}/subcategories`).then(r => r.data),
      staleTime: 0,
    })),
  });

  // Build map: catId → SubCategory[]
  const subsMap: Record<number, SubCategory[]> = {};
  Array.from(expandedIds).forEach((id, idx) => {
    subsMap[id] = subResults[idx]?.data ?? [];
  });

  const invalidateSubs = (catId: number) =>
    queryClient.invalidateQueries({ queryKey: ["subcategories", catId] });

  // --- Category mutations ---
  const createCatMutation = useMutation({
    mutationFn: (name: string) => api.post("/categories", { name }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      setCatDialog(false);
      setCatName("");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, name, active }: { id: number; name: string; active: boolean }) =>
      api.put(`/categories/${id}`, { name, active }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      setCatDialog(false);
      setEditingCat(null);
      setCatName("");
    },
    onError: () => toast.error("Failed to update category"),
  });

  const toggleCatMutation = useMutation({
    mutationFn: (cat: Category) =>
      api.put(`/categories/${cat.id}`, { name: cat.name, active: !cat.active }).then(r => r.data),
    onSuccess: (_, cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(cat.active ? "Category deactivated" : "Category activated");
    },
    onError: () => toast.error("Failed to update category"),
  });

  // --- SubCategory mutations ---
  const createSubMutation = useMutation({
    mutationFn: ({ catId, name }: { catId: number; name: string }) =>
      api.post(`/categories/${catId}/subcategories`, { name }).then(r => r.data),
    onSuccess: (_, { catId }) => {
      invalidateSubs(catId);
      toast.success("Sub-category created");
      setSubDialog(false);
      setSubName("");
    },
    onError: () => toast.error("Failed to create sub-category"),
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ catId, subId, name, active }: { catId: number; subId: number; name: string; active: boolean }) =>
      api.put(`/categories/${catId}/subcategories/${subId}`, { name, active }).then(r => r.data),
    onSuccess: (_, { catId }) => {
      invalidateSubs(catId);
      toast.success("Sub-category updated");
      setSubDialog(false);
      setEditingSub(null);
      setSubName("");
    },
    onError: () => toast.error("Failed to update sub-category"),
  });

  const toggleSubMutation = useMutation({
    mutationFn: ({ catId, sub }: { catId: number; sub: SubCategory }) =>
      api.put(`/categories/${catId}/subcategories/${sub.id}`, { name: sub.name, active: !sub.active }).then(r => r.data),
    onSuccess: (_, { catId, sub }) => {
      invalidateSubs(catId);
      toast.success(sub.active ? "Sub-category deactivated" : "Sub-category activated");
    },
    onError: () => toast.error("Failed to update sub-category"),
  });

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreateCat = () => { setEditingCat(null); setCatName(""); setCatDialog(true); };
  const openEditCat = (cat: Category) => { setEditingCat(cat); setCatName(cat.name); setCatDialog(true); };

  const openCreateSub = (catId: number) => {
    setExpandedIds(prev => new Set(prev).add(catId));
    setEditingSub(null);
    setSubName("");
    setParentCatId(catId);
    setSubDialog(true);
  };

  const openEditSub = (sub: SubCategory, catId: number) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setParentCatId(catId);
    setSubDialog(true);
  };

  const handleCatSubmit = () => {
    if (!catName.trim()) return;
    if (editingCat) updateCatMutation.mutate({ id: editingCat.id, name: catName, active: editingCat.active });
    else createCatMutation.mutate(catName);
  };

  const handleSubSubmit = () => {
    if (!subName.trim() || !parentCatId) return;
    if (editingSub) updateSubMutation.mutate({ catId: parentCatId, subId: editingSub.id, name: subName, active: editingSub.active });
    else createSubMutation.mutate({ catId: parentCatId, name: subName });
  };

  if (!allowed) return null;

  return (
    <DashboardLayout title="Categories">
      <div className="flex justify-end mb-6">
        <Button onClick={openCreateCat}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="divide-y">
              {categories?.map(cat => {
                const isExpanded = expandedIds.has(cat.id);
                const subs = subsMap[cat.id] ?? [];
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <span className="flex-1 font-medium text-gray-900">{cat.name}</span>
                      <Badge variant={cat.active ? "success" : "secondary"}>
                        {cat.active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Add sub-category" onClick={() => openCreateSub(cat.id)}>
                          <Plus className="h-4 w-4 text-indigo-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditCat(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          title={cat.active ? "Deactivate" : "Activate"}
                          onClick={() => toggleCatMutation.mutate(cat)}
                          disabled={toggleCatMutation.isPending}
                        >
                          {cat.active
                            ? <ToggleRight className="h-5 w-5 text-green-500" />
                            : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 border-t">
                        {subs.length === 0 ? (
                          <p className="px-12 py-3 text-sm text-gray-400">No sub-categories yet.</p>
                        ) : (
                          subs.map(sub => (
                            <div key={sub.id} className="flex items-center gap-3 px-12 py-2.5 border-b last:border-0 hover:bg-gray-100">
                              <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                              <Badge variant={sub.active ? "success" : "secondary"} className="text-xs">
                                {sub.active ? "Active" : "Inactive"}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditSub(sub, cat.id)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  title={sub.active ? "Deactivate" : "Activate"}
                                  onClick={() => toggleSubMutation.mutate({ catId: cat.id, sub })}
                                  disabled={toggleSubMutation.isPending}
                                >
                                  {sub.active
                                    ? <ToggleRight className="h-4 w-4 text-green-500" />
                                    : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(!categories || categories.length === 0) && (
                <div className="py-12 text-center text-gray-400">
                  No categories found. Add your first category.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={catName}
                onChange={e => setCatName(toTitleCase(e.target.value))}
                placeholder="e.g. Uniforms"
                onKeyDown={e => e.key === "Enter" && handleCatSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCatSubmit}
              disabled={!catName.trim() || createCatMutation.isPending || updateCatMutation.isPending}
            >
              {editingCat ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-category dialog */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingSub ? "Edit Sub-Category" : "Add Sub-Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={subName}
                onChange={e => setSubName(toTitleCase(e.target.value))}
                placeholder="e.g. Shirts"
                onKeyDown={e => e.key === "Enter" && handleSubSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubSubmit}
              disabled={!subName.trim() || createSubMutation.isPending || updateSubMutation.isPending}
            >
              {editingSub ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
