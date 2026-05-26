"use client";
import { useState } from "react";
import { Trash2, X, Package, Copy, RefreshCw } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  UniformSet, UniformType, GenderKey, SectionType,
  getProductsForSection, getUsedProductIds,
} from "./types";
import ProductPickerModal from "./ProductPickerModal";

interface UniformCardProps {
  uniform: UniformSet;
  allUniforms: UniformSet[];    // needed to filter out products used in other uniforms
  index: number;
  products: Product[];
  onRename: (name: string) => void;
  onTypeChange: (t: UniformType) => void;
  onDelete: () => void;
  onSetProduct: (gender: GenderKey, type: "topwear" | "bottomwear", product: Product | null) => void;
  onToggleAccessory: (gender: GenderKey, product: Product) => void;
  onCopyBoysToGirls: (type: SectionType) => void;
}

interface PickerState { gender: GenderKey; type: SectionType; }

const UNIFORM_TYPES: UniformType[] = ["Regular", "Sport", "Scout Guide", "Other"];
const SECTION_LABELS: Record<SectionType, string> = {
  topwear: "Topwear",
  bottomwear: "Bottomwear",
  accessories: "Accessories",
};

const GENDER_CFG = {
  boys:  { label: "Boys",  emoji: "👦", bg: "bg-blue-50/60",  headerBg: "bg-blue-100/80",  text: "text-blue-800" },
  girls: { label: "Girls", emoji: "👧", bg: "bg-pink-50/60",  headerBg: "bg-pink-100/80",  text: "text-pink-800" },
};

// ── Single product chip (topwear / bottomwear) ────────────────────────────────

function ProductChip({
  product, onRemove, onReplace,
}: {
  product: Product;
  onRemove: () => void;
  onReplace: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 hover:border-indigo-200 transition-colors">
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-indigo-50 flex-shrink-0">
        {product.images?.[0]?.imageUrl ? (
          <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-4 w-4 text-indigo-200" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{product.name}</p>
        <p className="text-xs text-indigo-600 font-medium">{formatCurrency(product.finalPrice)}/pc</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onReplace} title="Change" className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-indigo-500 transition-colors rounded-full hover:bg-indigo-50">
          <RefreshCw className="h-3 w-3" />
        </button>
        <button onClick={onRemove} title="Remove" className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Multi-select accessory chips ──────────────────────────────────────────────

function AccessoryChip({ product, onRemove }: { product: Product; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs">
      <span className="font-medium text-gray-700 truncate max-w-[100px]">{product.name}</span>
      <span className="text-indigo-500 font-semibold">{formatCurrency(product.finalPrice)}</span>
      <button onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Topwear / Bottomwear section (single pick) ────────────────────────────────

function SingleSection({
  label, selected, available, onPick, onRemove, canCopy, onCopy,
}: {
  label: string;
  selected: Product | null;
  available: Product[];
  onPick: () => void;
  onRemove: () => void;
  canCopy?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {canCopy && onCopy && (
          <button onClick={onCopy} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors">
            <Copy className="h-2.5 w-2.5" /> Same as Boys
          </button>
        )}
      </div>
      {selected ? (
        <ProductChip product={selected} onRemove={onRemove} onReplace={available.length > 0 ? onPick : onRemove} />
      ) : available.length > 0 ? (
        <button onClick={onPick} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-center text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all">
          + Select {label}
        </button>
      ) : (
        <div className="w-full border border-gray-100 rounded-xl py-2 text-center text-xs text-gray-300 bg-gray-50/50">
          No {label.toLowerCase()} products available
        </div>
      )}
    </div>
  );
}

// ── Accessories section (multi-pick) ─────────────────────────────────────────

function AccessoriesSection({
  selected, available, onAdd, onRemove, canCopy, onCopy,
}: {
  selected: Product[];
  available: Product[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  canCopy?: boolean;
  onCopy?: () => void;
}) {
  // Hide section if no accessories available and none selected
  if (available.length === 0 && selected.length === 0) return null;

  const remainingAvailable = available.filter(p => !selected.some(s => s.id === p.id));

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accessories</span>
        <div className="flex items-center gap-2">
          {canCopy && onCopy && (
            <button onClick={onCopy} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <Copy className="h-2.5 w-2.5" /> Same as Boys
            </button>
          )}
          {remainingAvailable.length > 0 && (
            <button onClick={onAdd} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              + Add
            </button>
          )}
        </div>
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(p => (
            <AccessoryChip key={p.id} product={p} onRemove={() => onRemove(p.id)} />
          ))}
        </div>
      ) : remainingAvailable.length > 0 ? (
        <button onClick={onAdd} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-center text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all">
          + Add Accessories
        </button>
      ) : null}
    </div>
  );
}

// ── Uniform Card ──────────────────────────────────────────────────────────────

export default function UniformCard({
  uniform, allUniforms, index, products, onRename, onTypeChange, onDelete,
  onSetProduct, onToggleAccessory, onCopyBoysToGirls,
}: UniformCardProps) {
  const [picker, setPicker] = useState<PickerState | null>(null);

  // Build available products for the picker, excluding products used in other uniforms
  // Accessories are allowed in multiple uniforms, so no dedup for that type
  const pickerProducts = picker ? (() => {
    const sectionProducts = getProductsForSection(products, picker.gender, picker.type);
    if (picker.type === "accessories") return sectionProducts;
    const usedIds = getUsedProductIds(allUniforms, uniform.id, picker.gender, picker.type);
    return sectionProducts.filter(p => !usedIds.has(p.id));
  })() : [];

  // For accessories: selectedIds is the array; for single: it's the current product id or null
  const pickerIsAccessories = picker?.type === "accessories";
  const pickerSelectedId = picker && !pickerIsAccessories
    ? ((uniform[picker.gender][picker.type] as Product | null)?.id ?? null)
    : null;
  const pickerSelectedIds = picker && pickerIsAccessories
    ? uniform[picker.gender].accessories.map(p => p.id)
    : [];

  const selectedCount = [
    uniform.boys.topwear, uniform.boys.bottomwear, ...uniform.boys.accessories,
    uniform.girls.topwear, uniform.girls.bottomwear, ...uniform.girls.accessories,
  ].filter(Boolean).length;

  const letter = String.fromCharCode(65 + index);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0">
          {letter}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <input
            value={uniform.name}
            onChange={e => onRename(e.target.value)}
            className="font-bold text-gray-900 text-sm bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-none py-0.5 min-w-0 flex-1"
            placeholder="Uniform name..."
          />
          <select
            value={uniform.uniformType}
            onChange={e => onTypeChange(e.target.value as UniformType)}
            className="text-xs text-indigo-700 bg-indigo-100 border-0 rounded-full px-2 py-1 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer flex-shrink-0"
          >
            {UNIFORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">
              {selectedCount} item{selectedCount !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete uniform">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Two-column body: Boys | Girls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {(["boys", "girls"] as GenderKey[]).map(gender => {
          const cfg = GENDER_CFG[gender];
          const topAvail = getProductsForSection(products, gender, "topwear")
            .filter(p => !getUsedProductIds(allUniforms, uniform.id, gender, "topwear").has(p.id));
          const botAvail = getProductsForSection(products, gender, "bottomwear")
            .filter(p => !getUsedProductIds(allUniforms, uniform.id, gender, "bottomwear").has(p.id));
          const accAvail = getProductsForSection(products, gender, "accessories");

          return (
            <div key={gender} className={cfg.bg}>
              <div className={`${cfg.headerBg} px-4 py-2 flex items-center gap-1.5`}>
                <span className="text-base">{cfg.emoji}</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
              </div>
              <div className="p-4">
                <SingleSection
                  label="Topwear"
                  selected={uniform[gender].topwear}
                  available={topAvail}
                  onPick={() => setPicker({ gender, type: "topwear" })}
                  onRemove={() => onSetProduct(gender, "topwear", null)}
                  canCopy={gender === "girls" && !!uniform.boys.topwear}
                  onCopy={gender === "girls" ? () => onCopyBoysToGirls("topwear") : undefined}
                />
                <SingleSection
                  label="Bottomwear"
                  selected={uniform[gender].bottomwear}
                  available={botAvail}
                  onPick={() => setPicker({ gender, type: "bottomwear" })}
                  onRemove={() => onSetProduct(gender, "bottomwear", null)}
                  canCopy={gender === "girls" && !!uniform.boys.bottomwear}
                  onCopy={gender === "girls" ? () => onCopyBoysToGirls("bottomwear") : undefined}
                />
                <AccessoriesSection
                  selected={uniform[gender].accessories}
                  available={accAvail}
                  onAdd={() => setPicker({ gender, type: "accessories" })}
                  onRemove={id => onToggleAccessory(gender, uniform[gender].accessories.find(p => p.id === id)!)}
                  canCopy={gender === "girls" && uniform.boys.accessories.length > 0}
                  onCopy={gender === "girls" ? () => onCopyBoysToGirls("accessories") : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Product picker */}
      {picker && (
        <ProductPickerModal
          open
          gender={picker.gender}
          type={picker.type}
          products={pickerProducts}
          selectedId={pickerIsAccessories ? null : pickerSelectedId}
          selectedIds={pickerIsAccessories ? pickerSelectedIds : undefined}
          multiSelect={pickerIsAccessories}
          onSelect={product => {
            if (!pickerIsAccessories) {
              onSetProduct(picker.gender, picker.type as "topwear" | "bottomwear", product);
              setPicker(null);
            }
          }}
          onToggle={product => {
            if (pickerIsAccessories) onToggleAccessory(picker.gender, product);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
