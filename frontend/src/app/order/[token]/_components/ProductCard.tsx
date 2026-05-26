"use client";
import { Check, Package, ShoppingCart, X } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  selectedSize: string;
  onAdd: () => void;
  onRemove: () => void;
  onSizeChange: (size: string) => void;
}

const GENDER_COLORS: Record<string, string> = {
  Boys: "bg-blue-100 text-blue-700",
  Girls: "bg-pink-100 text-pink-700",
  Unisex: "bg-purple-100 text-purple-700",
};

export default function ProductCard({
  product, isSelected, selectedSize, onAdd, onRemove, onSizeChange,
}: ProductCardProps) {
  const sizes = product.sizeOptions
    ? product.sizeOptions.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col ${
      isSelected
        ? "border-indigo-500 shadow-lg shadow-indigo-100"
        : "border-gray-100 hover:border-indigo-200 hover:shadow-md"
    }`}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-slate-100 overflow-hidden">
        {product.images?.[0]?.imageUrl ? (
          <img
            src={product.images[0].imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-14 w-14 text-indigo-200" />
          </div>
        )}
        {/* Gender badge */}
        {product.gender && (
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${GENDER_COLORS[product.gender] || "bg-gray-100 text-gray-600"}`}>
            {product.gender}
          </span>
        )}
        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{product.subCategoryName || product.categoryName}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-indigo-600 font-bold text-base">{formatCurrency(product.finalPrice)}</span>
          {product.fabricType && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{product.fabricType}</span>
          )}
        </div>

        {/* Size picker */}
        {sizes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Size</p>
            <div className="flex flex-wrap gap-1">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  className={`text-xs px-2 py-1 rounded-lg border font-medium transition-all ${
                    selectedSize === size
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-auto">
          {isSelected ? (
            <button
              onClick={onRemove}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
