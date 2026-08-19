"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Camera,
  VideoOff,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrowserMultiFormatReader } from "@zxing/library";

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
  availableItems: initialAvailableItems,
  embedded = false,
  onProjectChange,
  onAuditLogCreated,
  onAvailableItemsChange,
}: {
  project: any;
  availableItems: ReservedItemData[];
  embedded?: boolean;
  onProjectChange?: (project: any) => void;
  onAuditLogCreated?: (action: string, newValue: string) => void;
  onAvailableItemsChange?: (items: ReservedItemData[]) => void;
}) {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [availableItems, setAvailableItems] = useState<ReservedItemData[]>(initialAvailableItems);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    setAvailableItems(initialAvailableItems);
  }, [initialAvailableItems]);

  const [activeBoxId, setActiveBoxId] = useState<string>(
    initialProject.boxes.length > 0 ? initialProject.boxes[0].id : ""
  );

  const [newBoxName, setNewBoxName] = useState("");
  const [isCreatingBox, setIsCreatingBox] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [packStatus, setPackStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isPacking, setIsPacking] = useState(false);

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize ZXing reader on mount and cleanup
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Synthesize soft audio confirmation beep using Web Audio API
  const playBeep = (success: boolean) => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (success) {
        // High pitch success beep
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        // Low pitch error buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.debug("Audio play blocked or unsupported:", e);
    }
  };

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
      
      setProject((prev) => {
        const updated = {
          ...prev,
          boxes: [...prev.boxes, newBox],
        };
        if (onProjectChange) onProjectChange(updated);
        return updated;
      });
      
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
      playBeep(false);
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
      setProject((prev) => {
        const updated = {
          ...prev,
          packedItems: [...prev.packedItems, newPackedItem],
        };
        if (onProjectChange) onProjectChange(updated);
        return updated;
      });

      // 2. Remove item from the available list of items to pack
      setAvailableItems((prev) => {
        const updated = prev.filter((item) => item.barcode !== barcodeToPack);
        if (onAvailableItemsChange) onAvailableItemsChange(updated);
        return updated;
      });

      if (onAuditLogCreated) {
        onAuditLogCreated(
          "PACKED",
          `Packed item '${newPackedItem.inventoryItem.name}' (SKU: ${newPackedItem.inventoryItem.sku}) into Transit Box '${newPackedItem.box.boxNumber}'`
        );
      }

      // Trigger success confirmation HUD
      setPackStatus({ 
        success: true, 
        message: `Successfully packed '${newPackedItem.inventoryItem.name}' into ${newPackedItem.box.boxNumber}!` 
      });

      playBeep(true);

      // Vibrate mobile device
      if (navigator.vibrate) {
        navigator.vibrate(150);
      }

      setManualBarcode("");
    } catch (err: any) {
      console.error(err);
      setPackStatus({ success: false, message: err.message || "Failed to complete packing scan lookup." });
      playBeep(false);
    } finally {
      setIsPacking(false);
    }
  };

  // Start Camera Barcode Scanner
  const startCameraScanner = async () => {
    if (!codeReaderRef.current) return;
    setCameraError(null);
    setPackStatus(null);
    setIsCameraActive(true);

    try {
      const devices = await codeReaderRef.current.listVideoInputDevices();
      setCameras(devices);

      let targetDeviceId = selectedCamera;
      if (!targetDeviceId && devices.length > 0) {
        // Find rear/back lens
        const backCamera = devices.find((device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
        );
        targetDeviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;
        setSelectedCamera(targetDeviceId);
      }

      if (targetDeviceId && videoRef.current) {
        codeReaderRef.current.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const barcode = result.getText();
              handlePackBarcode(barcode);
            }
            if (err && !(err.name === "NotFoundException")) {
              console.debug("Scanner status:", err);
            }
          }
        );
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(err.message || "Unable to initialize camera devices. Check permissions.");
      setIsCameraActive(false);
    }
  };

  // Stop Camera Barcode Scanner
  const stopCameraScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsCameraActive(false);
  };

  // Change selected camera device
  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isCameraActive) {
      stopCameraScanner();
      setTimeout(() => {
        setIsCameraActive(true);
        if (codeReaderRef.current && videoRef.current) {
          codeReaderRef.current.decodeFromVideoDevice(
            deviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                handlePackBarcode(result.getText());
              }
            }
          );
        }
      }, 200);
    }
  };

  // Progress calculations
  const totalReservedItems = availableItems.length + project.packedItems.length;
  const packedPercent = totalReservedItems > 0 
    ? Math.round((project.packedItems.length / totalReservedItems) * 100) 
    : 0;

  // Box breakdowns
  const activeBox = project.boxes.find((b) => b.id === activeBoxId);
  const activeBoxName = activeBox ? activeBox.boxNumber : "Selected Box";
  const activeBoxItems = project.packedItems.filter((i) => i.boxId === activeBoxId);

  return (
    <div className={cn("flex-1 space-y-6 max-w-6xl mx-auto w-full", embedded ? "p-0" : "p-6 md:p-8")}>
      {/* Header */}
      {!embedded && (
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
      )}

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
                        "w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 cursor-pointer",
                        isActive
                          ? "border-cyan-500/30 bg-cyan-500/[0.03] text-zinc-900 dark:text-zinc-50 font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/30 text-zinc-650 dark:text-zinc-400"
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

          {/* Active Box Items Breakdown */}
          {activeBoxId && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wide text-zinc-500 flex items-center justify-between">
                <span>Items in {activeBoxName}</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded font-mono shrink-0">
                  {activeBoxItems.length} packed
                </span>
              </h4>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pt-1">
                {activeBoxItems.length > 0 ? (
                  activeBoxItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-xs font-semibold flex items-center justify-between"
                    >
                      <span className="truncate pr-2 text-zinc-800 dark:text-zinc-200">{item.inventoryItem.name}</span>
                      <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider shrink-0">{item.inventoryItem.sku}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-450 italic text-center py-4">No items packed inside this box yet.</p>
                )}
              </div>
            </div>
          )}

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
                className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Center/Right Column: Scan & Items List */}
        <div className="md:col-span-2 space-y-6">
          {/* Packing HUD Scan Terminal / Camera Scanner */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-950/60 shadow-lg text-white space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-cyan-400" />
                <span>{isCameraActive ? "Camera Scan Viewport" : "Scanning Simulator Mode"}</span>
              </h3>

              {/* Toggle camera scanner mode */}
              <button
                onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer",
                  isCameraActive 
                    ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20" 
                    : "bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-450 border border-cyan-500/20"
                )}
              >
                {isCameraActive ? (
                  <>
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Turn Off Camera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Turn On Camera</span>
                  </>
                )}
              </button>
            </div>

            {/* Viewfinder box if camera active */}
            {isCameraActive && (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-inner flex flex-col items-center justify-center">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                  />
                  {/* Scan Overlay target */}
                  <div className="absolute inset-0 border-[3px] border-cyan-500/10 m-6 pointer-events-none rounded-2xl flex items-center justify-center">
                    <div className="w-40 h-24 border-2 border-cyan-400 rounded-lg opacity-70 animate-pulse relative">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-300 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-300 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-300 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-300 -mb-1 -mr-1" />
                      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/80 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Device Camera lens list */}
                {cameras.length > 1 && (
                  <div className="flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Select Lens:</span>
                    <select
                      value={selectedCamera}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {cameras.map((cam) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-red-500/5 text-red-400 border border-red-500/10 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual entry scan HUD */}
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
                className="px-4.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
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
                  ? "bg-emerald-500/5 text-emerald-450 border-emerald-500/10"
                  : "bg-rose-500/5 text-rose-450 border-rose-500/10"
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
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                  {availableItems.length} left
                </span>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setManualBarcode(item.barcode);
                        setPackStatus(null);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/20 dark:bg-zinc-950/20 flex flex-col gap-1 transition-all duration-150 cursor-pointer"
                    >
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">{item.sku}</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono select-all">Barcode: {item.barcode}</span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-450 italic">
                    All reserved items have been packed!
                  </div>
                )}
              </div>
            </div>

            {/* Packed Items List grouped by Box */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-xs uppercase tracking-wide text-zinc-500">Packed Items Log</h4>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
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
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                          {packed.box ? packed.box.boxNumber : "Packed"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{packed.inventoryItem.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-450 italic">
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
