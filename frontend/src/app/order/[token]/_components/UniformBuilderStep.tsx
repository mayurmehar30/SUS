"use client";
import { useState } from "react";
import { Plus, PackageOpen, Truck, Save, Check } from "lucide-react";
import { Product } from "@/types";
import { UniformSet, UniformType, GenderKey, SectionType, hasAnyProduct } from "./types";
import UniformCard from "./UniformCard";

interface UniformBuilderStepProps {
  uniforms: UniformSet[];
  products: Product[];
  deliveryNotes: string;
  onDeliveryChange: (v: string) => void;
  onSave: () => void;
  onAddUniform: () => void;
  onRename: (id: string, name: string) => void;
  onTypeChange: (id: string, type: UniformType) => void;
  onDelete: (id: string) => void;
  onSetProduct: (uniformId: string, gender: GenderKey, type: "topwear" | "bottomwear", product: Product | null) => void;
  onToggleAccessory: (uniformId: string, gender: GenderKey, product: Product) => void;
  onCopyBoysToGirls: (uniformId: string, type: SectionType) => void;
}

export default function UniformBuilderStep({
  uniforms, products, deliveryNotes, onDeliveryChange, onSave,
  onAddUniform, onRename, onTypeChange, onDelete,
  onSetProduct, onToggleAccessory, onCopyBoysToGirls,
}: UniformBuilderStepProps) {
  const [saved, setSaved] = useState(false);
  const anyWithProducts = uniforms.some(hasAnyProduct);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (uniforms.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <PackageOpen className="h-8 w-8 text-indigo-300" />
          </div>
          <h3 className="font-bold text-gray-800 text-base mb-1">No uniforms yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Create uniform sets for your school. Each set has separate products for boys and girls.
          </p>
          <button
            onClick={onAddUniform}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create First Uniform
          </button>
        </div>
        <DeliveryNotesCard value={deliveryNotes} onChange={onDeliveryChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uniforms.map((uniform, index) => (
        <UniformCard
          key={uniform.id}
          uniform={uniform}
          allUniforms={uniforms}
          index={index}
          products={products}
          onRename={name => onRename(uniform.id, name)}
          onTypeChange={type => onTypeChange(uniform.id, type)}
          onDelete={() => onDelete(uniform.id)}
          onSetProduct={(gender, type, product) => onSetProduct(uniform.id, gender, type, product)}
          onToggleAccessory={(gender, product) => onToggleAccessory(uniform.id, gender, product)}
          onCopyBoysToGirls={type => onCopyBoysToGirls(uniform.id, type)}
        />
      ))}

      <button
        onClick={onAddUniform}
        className="w-full py-3.5 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/60 transition-all font-semibold text-sm flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add Another Uniform
      </button>

      {!anyWithProducts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium text-center">
          Add at least one product to a uniform before continuing
        </div>
      )}

      {/* Save Progress button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
          saved
            ? "border-green-400 bg-green-50 text-green-700"
            : "border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400"
        }`}
      >
        {saved ? (
          <><Check className="h-4 w-4" /> Progress Saved!</>
        ) : (
          <><Save className="h-4 w-4" /> Save Progress</>
        )}
      </button>

      <DeliveryNotesCard value={deliveryNotes} onChange={onDeliveryChange} />
    </div>
  );
}

function DeliveryNotesCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <Truck className="h-4 w-4 text-indigo-500" />
        Delivery Instructions <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder="e.g. Deliver to school main gate, preferred delivery time 9am–12pm..."
        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />
    </div>
  );
}
