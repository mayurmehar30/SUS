"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, SubCategory } from "@/types";

interface Vendor { id: number; name: string; active: boolean; }
import api from "@/lib/api";
import { toTitleCase } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Product name required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  vendorId: z.string().optional(),
  fabricType: z.string().optional(),
  color: z.string().optional(),
  gender: z.string().optional(),
  season: z.string().optional(),
  basePrice: z.string().optional(),
  gstPercent: z.string().optional(),
  discountPercent: z.string().optional(),
  sizeOptions: z.string().optional(),
  active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;
interface UploadedImage { url: string; preview: string; uploading?: boolean; }

interface ProductData {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: number;
  subCategoryId?: number;
  vendorId?: number;
  fabricType?: string;
  color?: string;
  gender?: string;
  season?: string;
  basePrice?: number;
  gstPercent?: number;
  discountPercent?: number;
  sizeOptions?: string;
  active: boolean;
  images?: { imageUrl: string }[];
}

// ---- Form rendered only after product data is ready ----
function EditForm({ product, productId, categories, vendors }: {
  product: ProductData;
  productId: string;
  categories: Category[];
  vendors: Vendor[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product.categoryId ? String(product.categoryId) : ""
  );
  const [finalPrice, setFinalPrice] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>(
    (product.images ?? []).map(img => ({ url: img.imageUrl, preview: img.imageUrl, uploading: false }))
  );

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      categoryId: product.categoryId ? String(product.categoryId) : "",
      subCategoryId: product.subCategoryId ? String(product.subCategoryId) : "",
      vendorId: product.vendorId ? String(product.vendorId) : "",
      fabricType: product.fabricType || "",
      color: product.color || "",
      gender: product.gender || "",
      season: product.season || "",
      basePrice: product.basePrice != null ? String(product.basePrice) : "",
      gstPercent: product.gstPercent != null ? String(product.gstPercent) : "",
      discountPercent: product.discountPercent != null ? String(product.discountPercent) : "",
      sizeOptions: product.sizeOptions || "",
      active: product.active,
    },
  });

  const base = parseFloat(watch("basePrice") || "0");
  const gst = parseFloat(watch("gstPercent") || "0");
  const disc = parseFloat(watch("discountPercent") || "0");

  useEffect(() => {
    let price = base;
    if (gst > 0) price += price * gst / 100;
    if (disc > 0) price -= price * disc / 100;
    setFinalPrice(Math.round(price * 100) / 100);
  }, [base, gst, disc]);

  const { data: subCategories } = useQuery<SubCategory[]>({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: () => api.get(`/categories/${selectedCategoryId}/subcategories`).then(r => r.data),
    enabled: !!selectedCategoryId,
  });

  const mutation = useMutation({
    mutationFn: (data: object) => api.put(`/products/${productId}`, data).then(r => r.data),
    onSuccess: () => { toast.success("Product updated"); router.push("/catalog"); },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to update product");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { url: "", preview, uploading: true }]);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setImages(prev => prev.map(img =>
          img.preview === preview ? { url: res.data.url, preview, uploading: false } : img
        ));
      } catch {
        toast.error(`Failed to upload ${file.name}`);
        setImages(prev => prev.filter(img => img.preview !== preview));
        URL.revokeObjectURL(preview);
      }
    }
    e.target.value = "";
  };

  const removeImage = (preview: string) => {
    setImages(prev => {
      const img = prev.find(i => i.preview === preview);
      if (img && img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.preview !== preview);
    });
  };

  const onSubmit = (data: FormData) => {
    const uploadedImages = images.filter(i => i.url && !i.uploading);
    mutation.mutate({
      ...data,
      categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
      subCategoryId: data.subCategoryId ? parseInt(data.subCategoryId) : undefined,
      vendorId: data.vendorId ? parseInt(data.vendorId) : undefined,
      basePrice: data.basePrice ? parseFloat(data.basePrice) : 0,
      gstPercent: data.gstPercent ? parseFloat(data.gstPercent) : 0,
      discountPercent: data.discountPercent ? parseFloat(data.discountPercent) : 0,
      images: uploadedImages.map((img, idx) => ({ imageUrl: img.url, imageType: "FRONT", sortOrder: idx })),
    });
  };

  const stillUploading = images.some(i => i.uploading);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photos */}
      <Card>
        <CardHeader><CardTitle>Product Photos</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.preview} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {img.uploading ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                ) : (
                  <button type="button" onClick={() => removeImage(img.preview)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-indigo-500 transition-colors">
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add Photo</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>
          <p className="text-xs text-gray-400 mt-2">First image will be the main photo.</p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <Label>Product Name *</Label>
            <Input {...register("name")} onChange={e => setValue("name", toTitleCase(e.target.value), { shouldValidate: true })} placeholder="School Shirt - White" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>SKU Code</Label>
            <Input {...register("sku")} />
          </div>

          {/* Category — defaultValue set at mount, no re-render needed */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              defaultValue={product.categoryId ? String(product.categoryId) : undefined}
              onValueChange={(v) => { setValue("categoryId", v); setSelectedCategoryId(v); setValue("subCategoryId", ""); }}
            >
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.active).map(c =>
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Category */}
          <div className="space-y-1">
            <Label>Sub Category</Label>
            <Select
              defaultValue={product.subCategoryId ? String(product.subCategoryId) : undefined}
              onValueChange={(v) => setValue("subCategoryId", v)}
              disabled={!selectedCategoryId}
            >
              <SelectTrigger><SelectValue placeholder="Select sub-category" /></SelectTrigger>
              <SelectContent>
                {subCategories?.filter(sc => sc.active).map(sc =>
                  <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div className="space-y-1">
            <Label>Vendor</Label>
            <Select
              defaultValue={product.vendorId ? String(product.vendorId) : undefined}
              onValueChange={(v) => setValue("vendorId", v)}
            >
              <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select defaultValue={product.gender || undefined} onValueChange={(v) => setValue("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Boys">Boys</SelectItem>
                <SelectItem value="Girls">Girls</SelectItem>
                <SelectItem value="Unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Season */}
          <div className="space-y-1">
            <Label>Season</Label>
            <Select defaultValue={product.season || undefined} onValueChange={(v) => setValue("season", v)}>
              <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="All Season">All Season</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Fabric Type</Label>
            <Input {...register("fabricType")} placeholder="Cotton, Polyester..." />
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <Input {...register("color")} placeholder="White, Navy Blue..." />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Size Options</Label>
            <Input {...register("sizeOptions")} placeholder="XS, S, M, L, XL, XXL" />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Description</Label>
            <textarea {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              placeholder="Product description..." />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>Base Price (₹)</Label>
            <Input type="number" step="0.01" {...register("basePrice")} placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <Label>GST %</Label>
            <Input type="number" step="0.01" {...register("gstPercent")} placeholder="5" />
          </div>
          <div className="space-y-1">
            <Label>Discount %</Label>
            <Input type="number" step="0.01" {...register("discountPercent")} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Final Price (₹)</Label>
            <div className="h-10 flex items-center px-3 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
              ₹{finalPrice.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("active")} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Product is Active (visible in catalog)</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending || stillUploading}>
          {(mutation.isPending || stillUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          {stillUploading ? "Uploading..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// ---- Page: fetches data, renders form only when ready ----
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get(`/products/${productId}`).then(r => r.data),
    enabled: !!productId,
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors-active"],
    queryFn: () => api.get("/vendors/active").then(r => r.data),
  });

  const loading = productLoading || catsLoading;

  return (
    <DashboardLayout title="Edit Product">
      <div className="max-w-3xl">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : product ? (
          /* key forces full remount if navigating between different products */
          <EditForm key={productId} product={product} productId={productId} categories={categories} vendors={vendors} />
        ) : (
          <p className="text-gray-500 text-center py-20">Product not found.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
