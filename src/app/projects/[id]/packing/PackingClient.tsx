"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Package, 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  ScanBarcode,
  Sparkles,
  ClipboardList,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces
interface BoxData {
  id: string;
  boxNumber: string;
}

interface PackedItemData {
  id: string;
  inventoryItemId: string;
  boxId: string | null;
  scannedAt: string;
  inventoryItem: {
    sku: string;
    barcode: string;
    name: string;
    category: string;
  };
  box: {
    boxNumber: string;
  } | null;
}

interface ReservedItemData {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  currentStatus: string;
}

interface ProjectData {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  client: { name: string };
  boxes: BoxData[];
  packedItems: PackedItemData[];
}

export default function PackingClient({
  project: initialProject,
  availableItems: initialAvailableItems
}: {
  project: ProjectData;
  availableItems: ReservedItemData[];
}) {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [availableItems, setAvailableItems] = useState<ReservedItemData[]>(initialAvailableItems);
  const [activeBoxId, setActiveBoxId] = useState<string>(
    initialProject.boxes.length > 0 ? initialProject.boxes[0].id : ""
  );

  const [newBoxName, setNewBoxName] = useState("");
  const [isCreatingBox, setIsCreatingBox] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [packStatus, setPackStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isPacking, setIsPacking] = useState(false);

  // Dynamic box creation
  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoxName.trim()) return;

    setIsCreatingBox(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/boxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxNumber: newBoxName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create box");
      
      const newBox = await res.json();
      
      setProject((prev) => ({
        ...prev,
        boxes: [...prev.boxes, newBox],
      }));
      
      // Auto-select the newly created box
      setActiveBoxId(newBox.id);
      setNewBoxName("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not create box.");
    } finally {
      setIsCreatingBox(false);
    }
  };

  // Perform item packing lookup and update states
  const handlePackBarcode = async (barcodeToPack: string) => {
    if (!activeBoxId) {
      setPackStatus({ success: false, message: "Please select or create a Box first!" });
      return;
    }

    setIsPacking(true);
    setPackStatus(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: barcodeToPack, boxId: activeBoxId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to pack item");
      }

      const responseData = await res.json();
      const newPackedItem = responseData.packedItem;

      // Update local state:
      // 1. Add item to project packedItems list
      setProject((prev) => ({
        ...prev,
        packedItems: [...prev.packedItems, newPackedItem],
      }));

      // 2. Remove item from the available list of items to pack
      setAvailableItems((prev) => 
        prev.filter((item) => item.barcode !== barcodeToPack)
      );

      // Trigger success confirmation HUD
      setPackStatus({ 
        success: true, 
        message: `Successfully packed '${newPackedItem.inventoryItem.name}' into ${newPackedItem.box.boxNumber}!` 
      });

      // Vibrate mobile device
      if (navigator.vibrate) {
        navigator.vibrate(150);
      }

      setManualBarcode("");
    } catch (err: any) {
      console.error(err);
      setPackStatus({ success: false, message: err.message || "Failed to complete packing scan lookup." });
    } finally {
      setIsPacking(false);
    }
  };

  // Progress calculations
  const totalReservedItems = availableItems.length + project.packedItems.length;
  const packedPercent = totalReservedItems > 0 
    ? Math.round((project.packedItems.length / totalReservedItems) * 100) 
    : 0;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          href={`/projects/${project.id}`} 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Details</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                {project.projectCode}
              </code>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 uppercase">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-cyan-500" />
              <span>Project Packing & Box Assignment</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Progress Bar & Status Warning */}
      <section className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase">Project Packing Progress</span>
          <span className="text-sm font-extrabold text-cyan-500">{packedPercent}% Completed</span>
        </div>
        <div className="w-full bg-zinc-150 dark:bg-zinc-850 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${packedPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-400">
          {project.packedItems.length} of {totalReservedItems} items securely packed into transit boxes.
        </p>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Box Selection & Creation */}
        <div className="space-y-6">
          {/* Active Box Selector */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-cyan-500" />
              <span>Select Active Transit Box</span>
            </h3>

            <div className="space-y-2">
              {project.boxes.length > 0 ? (
                project.boxes.map((box) => {
                  const boxItems = project.packedItems.filter((i) => i.boxId === box.id);
                  const isActive = activeBoxId === box.id;
                  return (
                    <button
                      key={box.id}
                      onClick={() => {
                        setActiveBoxId(box.id);
                        setPackStatus(null);
                      }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150",
                        isActive
                          ? "border-cyan-500/30 bg-cyan-500/[0.03] text-zinc-900 dark:text-zinc-50 font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      <span className="text-xs truncate">{box.boxNumber}</span>
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded font-mono font-semibold shrink-0">
                        {boxItems.length} items
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-400 italic">No boxes created yet.</p>
              )}
            </div>
          </div>

          {/* Box Creation Form */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Create New Box</h3>
            <form onSubmit={handleCreateBox} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Fragile Box A"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
                disabled={isCreatingBox}
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={isCreatingBox || !newBoxName.trim()}
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Center/Right Column: Scan & Items List */}
        <div className="md:col-span-2 space-y-6">
          {/* Packing HUD scan terminal */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-950/60 shadow-lg text-white space-y-4">
            <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-cyan-400" />
              <span>Scanning Simulator Mode</span>
            </h3>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Input reserved item barcode (e.g. BARCODE-99015)..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                disabled={isPacking}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePackBarcode(manualBarcode.trim());
                  }
                }}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-zinc-500"
              />
              <button
                onClick={() => handlePackBarcode(manualBarcode.trim())}
                disabled={isPacking || !manualBarcode.trim()}
                className="px-4.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
              >
                {isPacking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pack</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Query Results */}
            {packStatus && (
              <div className={cn(
                "p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium border leading-relaxed",
                packStatus.success
                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                  : "bg-rose-500/5 text-rose-400 border-rose-500/10"
              )}>
                {packStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{packStatus.message}</span>
              </div>
            )}
          </div>

          {/* Reserved Items vs Packed Items panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Reserved Items Picklist */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-xs uppercase tracking-wide text-zinc-500">Pick List (Reserved)</h4>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-mono">
                  {availableItems.length} left
                </span>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setManualBarcode(item.barcode)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/20 dark:bg-zinc-950/20 flex flex-col gap-1 transition-all duration-150"
                    >
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">{item.sku}</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono select-all">Barcode: {item.barcode}</span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400 italic">
                    All reserved items have been packed!
                  </div>
                )}
              </div>
            </div>

            {/* Packed Items List grouped by Box */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-xs uppercase tracking-wide text-zinc-500">Packed Items Log</h4>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
                  {project.packedItems.length} packed
                </span>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {project.packedItems.length > 0 ? (
                  project.packedItems.map((packed) => (
                    <div
                      key={packed.id}
                      className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] flex flex-col gap-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">{packed.inventoryItem.sku}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          {packed.box ? packed.box.boxNumber : "Packed"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{packed.inventoryItem.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400 italic">
                    No items packed yet. Select a box and scan barcodes to pack.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
