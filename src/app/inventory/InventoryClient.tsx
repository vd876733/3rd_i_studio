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
  BookmarkCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "RESERVED":
        return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "PACKED":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "ON_SITE":
        return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
      case "DAMAGED":
        return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      case "LOST":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800/50";
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
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap", getStatusColor(item.currentStatus))}>
                      {item.currentStatus}
                    </span>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No matching inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
