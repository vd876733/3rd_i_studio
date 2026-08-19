"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Package, 
  Search, 
  MapPin, 
  Tag, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  X,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "./actions";
import JsBarcode from "jsbarcode";

// Barcode Generator helper component using jsbarcode
const BarcodeValue: React.FC<{ value: string }> = ({ value }) => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.8,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error("Failed to generate barcode:", err);
      }
    }
  }, [value]);

  return <svg ref={svgRef} className="mx-auto" />;
};

// TS Interfaces
interface InventoryItemData {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  rackNumber: string;
  shelfNumber: string;
  currentStatus: string;
  replacementCost: number;
  photos: any; // string[] after parse
}

export default function InventoryClient({ initialItems }: { initialItems: InventoryItemData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [printItem, setPrintItem] = useState<InventoryItemData | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Decor");
  const [replacementCost, setReplacementCost] = useState("");
  const [rackNumber, setRackNumber] = useState("Rack A1");
  const [shelfNumber, setShelfNumber] = useState("Shelf 1");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-generation effect for SKU & Barcode
  useEffect(() => {
    if (isEditing) return;
    if (!name.trim()) {
      setSku("");
      setBarcode("");
      return;
    }
    const cleanName = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    const catCode = category.slice(0, 3).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    setSku(`SKU-${catCode}-${cleanName || "PROP"}-${num}`);
    setBarcode(`BARCODE-99${num.toString().slice(-3)}`);
  }, [name, category, isEditing]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingItemId(null);
    setName("");
    setCategory("Decor");
    setReplacementCost("");
    setRackNumber("Rack A1");
    setShelfNumber("Shelf 1");
    setSku("");
    setBarcode("");
    setImageUrl("");
    setStatus("AVAILABLE");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItemData) => {
    setIsEditing(true);
    setEditingItemId(item.id);
    setName(item.name);
    setCategory(item.category);
    setReplacementCost(item.replacementCost.toString());
    setRackNumber(item.rackNumber);
    setShelfNumber(item.shelfNumber);
    setSku(item.sku);
    setBarcode(item.barcode);
    setImageUrl(getPhotoUrl(item.photos));
    setStatus(item.currentStatus);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    try {
      const res = await deleteInventoryItem(id);
      if (!res.success) {
        alert(res.error || "Failed to delete item.");
      }
    } catch (err: any) {
      alert("An error occurred while deleting the item.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (!sku.trim()) {
      setFormError("SKU is required.");
      return;
    }
    if (!barcode.trim()) {
      setFormError("Barcode is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const photos = imageUrl.trim() ? [imageUrl.trim()] : [];

    const payload = {
      name: name.trim(),
      category,
      rackNumber: rackNumber.trim(),
      shelfNumber: shelfNumber.trim(),
      replacementCost: Number(replacementCost) || 0,
      sku: sku.trim(),
      barcode: barcode.trim(),
      photos,
      currentStatus: status,
    };

    try {
      if (isEditing && editingItemId) {
        const res = await updateInventoryItem(editingItemId, payload);
        if (res.success) {
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to update item.");
        }
      } else {
        const res = await createInventoryItem(payload);
        if (res.success) {
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to create item.");
        }
      }
    } catch (err: any) {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load snapshot in LocalStorage cache for offline scanning capability!
  useEffect(() => {
    try {
      localStorage.setItem("inventory_cache", JSON.stringify(initialItems));
      console.log("Cached inventory items offline successfully.");
    } catch (err) {
      console.error("Failed to write inventory cache to LocalStorage:", err);
    }
  }, [initialItems]);

  // Extract unique categories for category dropdown
  const categories = ["ALL", ...Array.from(new Set(initialItems.map((item) => item.category)))];

  // Filtering logic
  const filteredItems = initialItems.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rackNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shelfNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = activeStatus === "ALL" || item.currentStatus === activeStatus;
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "RESERVED":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "PACKED":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "ON_SITE":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "DAMAGED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "LOST":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const getPhotoUrl = (photos: any): string => {
    if (Array.isArray(photos) && photos.length > 0) {
      return photos[0];
    }
    try {
      const parsed = typeof photos === "string" ? JSON.parse(photos) : photos;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
    return "https://picsum.photos/seed/placeholder/200";
  };

  return (
    <div className="space-y-6">
      {/* Search Input and Categories Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search SKU, name, rack (e.g. A1), shelf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400"
          />
        </div>
        
        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Add Prop Button */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Prop</span>
        </button>
      </div>

      {/* Fast Filter Status Buttons */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wide">Status:</span>
        <button
          onClick={() => setActiveStatus("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
            activeStatus === "ALL"
              ? "bg-slate-200 border-slate-300 text-slate-900"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          All Items ({initialItems.length})
        </button>
        {["AVAILABLE", "RESERVED", "PACKED", "ON_SITE", "DAMAGED"].map((status) => {
          const count = initialItems.filter((i) => i.currentStatus === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5",
                activeStatus === status
                  ? "bg-slate-200 border-slate-300 text-slate-900"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>{status.replace("_", " ")}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid view for Mobile, Table view for Desktop */}
      {/* Mobile grid (below md) */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex gap-4 text-slate-900"
            >
              {/* Photo Preview */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                <img
                  src={getPhotoUrl(item.photos)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Body */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono font-bold text-slate-500 truncate">{item.sku}</code>
                    <div className="flex items-center gap-1.5 relative">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap", getStatusColor(item.currentStatus))}>
                        {item.currentStatus}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(activeActionMenuId === `mobile-${item.id}` ? null : `mobile-${item.id}`);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      
                      {activeActionMenuId === `mobile-${item.id}` && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenuId(null)} />
                          <div className="absolute right-0 top-6 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 z-20 text-left text-[10px] font-semibold text-slate-700">
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleOpenEdit(item);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3 h-3 text-cyan-500" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleDelete(item.id, item.name);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 hover:text-red-600 flex items-center gap-1.5 text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span>Delete</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setPrintItem(item);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 border-t border-slate-100 cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-cyan-500" />
                              <span>Print Label</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate-600">Cat: {item.category}</p>
                </div>
                
                {/* Rack & Shelf */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1 border-t border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span>Rack: {item.rackNumber} / {item.shelfNumber}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-white/40">
            <span className="text-xs text-slate-500 italic">No inventory items found.</span>
          </div>
        )}
      </div>

      {/* Desktop table view (md and up) */}
      <div className="hidden md:block border border-slate-200 rounded-xl bg-white text-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-semibold">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="bg-white text-slate-900 hover:bg-slate-50 transition-colors">
                    {/* Item photo + name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                          <img
                            src={getPhotoUrl(item.photos)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    
                    {/* SKU / Barcode */}
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="space-y-0.5">
                        <span className="block text-slate-900 font-bold">{item.sku}</span>
                        <span className="block text-slate-500">{item.barcode}</span>
                      </div>
                    </td>
 
                    {/* Category */}
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {item.category}
                    </td>
 
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getStatusColor(item.currentStatus))}>
                        {item.currentStatus}
                      </span>
                    </td>
 
                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>Rack {item.rackNumber}, {item.shelfNumber}</span>
                      </div>
                    </td>
 
                    {/* Replacement Cost */}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${item.replacementCost.toFixed(2)}
                    </td>

                    {/* Desktop Actions Cell */}
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeActionMenuId === item.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenuId(null)} />
                          <div className="absolute right-6 top-12 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 z-20 text-left text-xs font-semibold text-slate-700">
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleOpenEdit(item);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleDelete(item.id, item.name);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-50 hover:text-red-650 flex items-center gap-1.5 text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Delete</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setPrintItem(item);
                              }}
                              className="w-full px-4 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1.5 border-t border-slate-100 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Print Label</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No matching inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          
          {/* Card Container */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-900 relative z-50 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Prop Details" : "Add New Prop"}
              </h3>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Oak Dining Chair"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                />
              </div>

              {/* Category & Replacement Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  >
                    <option value="Decor">Decor</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Rugs">Rugs</option>
                    <option value="Props">Props</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Replacement Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={replacementCost}
                    onChange={(e) => setReplacementCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Location (Rack / Shelf) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Warehouse Rack</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A1"
                    value={rackNumber}
                    onChange={(e) => setRackNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Warehouse Shelf</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf 1"
                    value={shelfNumber}
                    onChange={(e) => setShelfNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  />
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SKU-XXX-XXXX"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="BARCODE-XXXX"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Image URL</label>
                <input
                  type="text"
                  placeholder="https://picsum.photos/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                />
              </div>

              {/* Edit Status Selector */}
              {isEditing && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Prop Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="PACKED">PACKED</option>
                    <option value="ON_SITE">ON_SITE</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Save Changes" : "Create Item"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Preview Modal */}
      {printItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setPrintItem(null)}
          />
          
          {/* Card Container */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-900 relative z-50 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-500" />
                <span>Print Barcode Label</span>
              </h3>
              <button 
                onClick={() => setPrintItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Sticker Preview */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <div 
                className="w-[3.5in] h-[2in] p-4 bg-white border border-slate-300 rounded shadow-md flex flex-col justify-between text-slate-900 font-sans relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">3rdiStudio Assets</span>
                  <span className="text-[8px] font-bold text-cyan-600 px-1.5 py-0.5 bg-cyan-55 rounded border border-cyan-100 uppercase">{printItem.category}</span>
                </div>

                {/* Name */}
                <div className="py-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{printItem.name}</h4>
                </div>

                {/* Barcode Render */}
                <div className="flex flex-col items-center justify-center py-1">
                  <BarcodeValue value={printItem.barcode} />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-700 mt-1">{printItem.sku}</span>
                </div>

                {/* Location Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[9px] font-semibold text-slate-500">
                  <span>Rack {printItem.rackNumber}, {printItem.shelfNumber}</span>
                  <span className="font-mono text-slate-700">${printItem.replacementCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPrintItem(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Wrapper (Absolute copy rendered only during print output) */}
      {printItem && (
        <div id="print-sticker-wrapper" className="hidden print:flex print:items-center print:justify-center">
          <div 
            className="w-[3.5in] h-[2in] p-4 bg-white flex flex-col justify-between text-slate-900 font-sans relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-350">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase font-mono">3rdiStudio Assets</span>
              <span className="text-[8px] font-bold text-slate-800 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 uppercase">{printItem.category}</span>
            </div>

            {/* Name */}
            <div className="py-1">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{printItem.name}</h4>
            </div>

            {/* Barcode Render */}
            <div className="flex flex-col items-center justify-center py-1">
              <BarcodeValue value={printItem.barcode} />
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-700 mt-1">{printItem.sku}</span>
            </div>

            {/* Location Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-350 text-[9px] font-semibold text-slate-600">
              <span>Rack {printItem.rackNumber}, {printItem.shelfNumber}</span>
              <span className="font-mono text-slate-800">${printItem.replacementCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS style override for printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all base styles */
          body * {
            visibility: hidden !important;
          }
          /* Show print wrapper and all its contents */
          #print-sticker-wrapper, #print-sticker-wrapper * {
            visibility: visible !important;
          }
          #print-sticker-wrapper {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            z-index: 9999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}} />
    </div>
  );
}
