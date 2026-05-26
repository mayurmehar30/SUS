"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Product, Category, SubCategory, ApiPage } from "@/types";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

const CARD_GRADIENTS = [
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-400 to-violet-500",
  "from-cyan-400 to-sky-500",
];

export default function CatalogPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
  });

  const { data: subCategories } = useQuery<SubCategory[]>({
    queryKey: ["subcategories", categoryFilter],
    queryFn: () => api.get(`/categories/${categoryFilter}/subcategories`).then(r => r.data),
    enabled: categoryFilter !== "all",
  });

  const { data: productsPage, isLoading } = useQuery<ApiPage<Product>>({
    queryKey: ["products", search, categoryFilter, subCategoryFilter, statusFilter],
    queryFn: () => api.get("/products", {
      params: {
        search: search || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        subCategoryId: subCategoryFilter !== "all" ? subCategoryFilter : undefined,
        active: statusFilter === "all" ? undefined : statusFilter === "active",
      },
    }).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/products/${id}/toggle`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success("Product status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const products = productsPage?.content ?? [];
  const total = productsPage?.totalElements ?? 0;

  return (
    <DashboardLayout title="Product Catalog">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search by name or SKU…"
            className="pl-9 h-9 text-sm rounded-xl border-gray-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setSubCategoryFilter("all"); }}>
          <SelectTrigger className="w-40 h-9 text-sm rounded-xl">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.filter(c => c.active).map(c =>
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter} disabled={categoryFilter === "all"}>
          <SelectTrigger className="w-44 h-9 text-sm rounded-xl">
            <SelectValue placeholder="Sub-Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub-Categories</SelectItem>
            {subCategories?.filter(sc => sc.active).map(sc =>
              <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-sm rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => router.push("/catalog/new")} className="h-9 rounded-xl gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {!isLoading && (
        <p className="text-xs text-gray-400 mb-4 font-medium">{total} product{total !== 1 ? "s" : ""}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 animate-fade-in">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <Package className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No products found</p>
          <p className="text-xs text-gray-400 mb-5">Try adjusting filters or add a new product.</p>
          <Button className="rounded-xl gap-1.5" onClick={() => router.push("/catalog/new")}>
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group animate-fade-in-up ${!product.active ? "opacity-55" : ""}`}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              {/* Image */}
              <div className="h-48 relative overflow-hidden">
                {product.images?.[0]?.imageUrl ? (
                  <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[product.id % CARD_GRADIENTS.length]} flex flex-col items-center justify-center gap-2`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Package className="h-6 w-6 text-white/90" />
                    </div>
                    <span className="text-[10px] text-white/70 font-semibold uppercase tracking-widest">No Image</span>
                  </div>
                )}
                {/* Gradient overlay at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                {/* Status badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${product.active ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"}`}>
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
                {/* Action buttons */}
                <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => toggleMutation.mutate(product.id)} className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow text-gray-500 hover:text-indigo-600 transition-colors" title={product.active ? "Deactivate" : "Activate"}>
                    {product.active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => router.push(`/catalog/${product.id}/edit`)} className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow text-gray-500 hover:text-indigo-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(product)} className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 truncate">{product.name}</h3>
                {(product.categoryName || product.subCategoryName) && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {product.categoryName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{product.categoryName}</span>
                    )}
                    {product.subCategoryName && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{product.subCategoryName}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-indigo-600">{formatCurrency(product.finalPrice)}</span>
                  {product.sku && (
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">{product.sku}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-1">
            This will permanently delete <span className="font-semibold text-gray-800">{deleteTarget?.name}</span>. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
