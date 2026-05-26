"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Product, ClassStudentCount } from "@/types";
import ProductCard from "./ProductCard";

type GenderTab = "All" | "Boys" | "Girls" | "Unisex";
const TABS: GenderTab[] = ["All", "Boys", "Girls", "Unisex"];

interface CartItem { product: Product; selectedSize: string; classRows: ClassStudentCount[]; }

interface CatalogStepProps {
  products: Product[];
  cart: Record<number, CartItem>;
  onAdd: (product: Product) => void;
  onRemove: (productId: number) => void;
  onSizeChange: (productId: number, size: string) => void;
}

export default function CatalogStep({ products, cart, onAdd, onRemove, onSizeChange }: CatalogStepProps) {
  const [activeTab, setActiveTab] = useState<GenderTab>("All");
  const [search, setSearch] = useState("");

  const filtered = products.filter(p => {
    const matchesGender = activeTab === "All" || p.gender === activeTab;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryName || "").toLowerCase().includes(search.toLowerCase());
    return matchesGender && matchesSearch;
  });

  const tabCounts: Record<GenderTab, number> = {
    All: products.length,
    Boys: products.filter(p => p.gender === "Boys").length,
    Girls: products.filter(p => p.gender === "Girls").length,
    Unisex: products.filter(p => p.gender === "Unisex").length,
  };

  return (
    <div>
      {/* Search + Tabs */}
      <div className="mb-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search uniforms..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different tab or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={!!cart[product.id]}
              selectedSize={cart[product.id]?.selectedSize || ""}
              onAdd={() => onAdd(product)}
              onRemove={() => onRemove(product.id)}
              onSizeChange={size => onSizeChange(product.id, size)}
            />
          ))}
        </div>
      )}

      {/* Selected count hint */}
      {Object.keys(cart).length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium">
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            {Object.keys(cart).length}
          </div>
          item{Object.keys(cart).length !== 1 ? "s" : ""} selected — scroll down or click Continue
        </div>
      )}
    </div>
  );
}
