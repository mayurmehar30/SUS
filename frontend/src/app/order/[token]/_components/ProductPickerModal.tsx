"use client";
import { useState } from "react";
import { Search, Check, Package, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Product, ProductImage } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SectionType, GenderKey } from "./types";

interface ProductPickerModalProps {
  open: boolean;
  gender: GenderKey;
  type: SectionType;
  products: Product[];
  multiSelect?: boolean;
  // single-select mode
  selectedId?: number | null;
  onSelect?: (product: Product | null) => void;
  // multi-select mode
  selectedIds?: number[];
  onToggle?: (product: Product) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<SectionType, string> = {
  topwear: "Topwear",
  bottomwear: "Bottomwear",
  accessories: "Accessories",
};

// ── Image Zoom Viewer ──────────────────────────────────────────────────────────

function ImageViewer({
  images, startIndex, onClose,
}: {
  images: ProductImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);

  const current = images[idx];
  const zoomIn  = () => setZoom(z => Math.min(3, parseFloat((z + 0.5).toFixed(1))));
  const zoomOut = () => setZoom(z => Math.max(0.5, parseFloat((z - 0.5).toFixed(1))));
  const prev    = () => { setIdx(i => i - 1); setZoom(1); };
  const next    = () => { setIdx(i => i + 1); setZoom(1); };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} disabled={zoom <= 0.5} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-white/70 text-sm font-mono w-10 text-center">{zoom}×</span>
          <button onClick={zoomIn} disabled={zoom >= 3} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        {images.length > 1 && (
          <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>
        )}
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Image */}
      <div className="flex items-center justify-center w-full h-full overflow-hidden px-16 py-16">
        <img
          src={current.imageUrl}
          alt="Product"
          style={{ transform: `scale(${zoom})`, transition: "transform 0.2s ease" }}
          className="max-w-full max-h-full object-contain select-none cursor-zoom-in"
          onClick={e => { e.stopPropagation(); if (zoom < 3) zoomIn(); }}
          draggable={false}
        />
      </div>

      {/* Prev / Next */}
      {idx > 0 && (
        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {idx < images.length - 1 && (
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => { setIdx(i); setZoom(1); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-white" : "border-white/30 opacity-60 hover:opacity-90"
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export default function ProductPickerModal({
  open, gender, type, products, multiSelect = false,
  selectedId = null, onSelect,
  selectedIds = [], onToggle,
  onClose,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [viewer, setViewer] = useState<{ images: ProductImage[]; startIndex: number } | null>(null);

  if (!open) return null;

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const genderLabel = gender === "boys" ? "Boys" : "Girls";
  const typeLabel = TYPE_LABELS[type];

  const isSelected = (id: number) =>
    multiSelect ? selectedIds.includes(id) : selectedId === id;

  const handleClick = (product: Product) => {
    if (multiSelect) {
      onToggle?.(product);
      // don't close — allow picking multiple
    } else {
      onSelect?.(selectedId === product.id ? null : product);
      onClose();
    }
  };

  const openViewer = (e: React.MouseEvent, images: ProductImage[], idx: number) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setViewer({ images, startIndex: idx });
  };

  const selectionCount = multiSelect ? selectedIds.length : (selectedId != null ? 1 : 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {multiSelect ? "Add" : "Select"} {genderLabel} {typeLabel}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {multiSelect
                  ? `${selectionCount} selected · tap to add or remove`
                  : selectionCount ? "1 selected · tap to change" : "None selected · tap to choose"}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${typeLabel.toLowerCase()}...`}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No {typeLabel.toLowerCase()} products found</p>
              </div>
            ) : (
              <div className="space-y-2 mt-1">
                {filtered.map(product => {
                  const sel = isSelected(product.id);
                  const images = product.images ?? [];
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleClick(product)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        sel
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-100 hover:border-indigo-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {/* Thumbnail with zoom trigger */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-14 h-14 rounded-lg overflow-hidden bg-indigo-50 cursor-zoom-in"
                          onClick={e => openViewer(e, images, 0)}
                        >
                          {images[0]?.imageUrl ? (
                            <img src={images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-indigo-200" />
                            </div>
                          )}
                        </div>
                        {images.length > 1 && (
                          <button
                            onClick={e => openViewer(e, images, 0)}
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow"
                          >
                            <Maximize2 className="h-2.5 w-2.5 text-white" />
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.subCategoryName}</p>
                        {product.sizeOptions && (
                          <p className="text-xs text-gray-400 mt-0.5">Sizes: {product.sizeOptions}</p>
                        )}
                        {images.length > 1 && (
                          <button
                            onClick={e => openViewer(e, images, 0)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5 underline"
                          >
                            View all {images.length} photos
                          </button>
                        )}
                      </div>

                      {/* Price + indicator */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">{formatCurrency(product.finalPrice)}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          sel ? "bg-indigo-600" : "border-2 border-gray-300"
                        }`}>
                          {sel && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              {multiSelect
                ? selectionCount > 0 ? `Done — ${selectionCount} selected` : "Cancel"
                : selectionCount > 0 ? "Done — 1 selected" : "Cancel"}
            </button>
          </div>
        </div>
      </div>

      {viewer && (
        <ImageViewer images={viewer.images} startIndex={viewer.startIndex} onClose={() => setViewer(null)} />
      )}
    </>
  );
}
