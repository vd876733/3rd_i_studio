"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Trash2, 
  Copy, 
  Maximize2, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces
interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  photos: any;
}

interface CanvasElement {
  id: string; // unique instance ID
  itemId: string; // references InventoryItem.id
  name: string;
  photos: any;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

interface ProjectData {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  moodBoardState: any; // CanvasElement[] stored in database
}

export default function MoodBoardClient({
  project,
  availableItems: initialAvailableItems,
  embedded = false
}: {
  project: ProjectData;
  availableItems: InventoryItem[];
  embedded?: boolean;
}) {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>(initialAvailableItems);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Initialize Canvas layout from Project's moodBoardState JSON
  useEffect(() => {
    if (project.moodBoardState) {
      try {
        const parsed = typeof project.moodBoardState === "string" 
          ? JSON.parse(project.moodBoardState) 
          : project.moodBoardState;
        if (Array.isArray(parsed)) {
          setCanvasElements(parsed);
        }
      } catch (err) {
        console.error("Failed to parse moodBoardState:", err);
      }
    }
  }, [project.moodBoardState]);

  // Search items list
  const filteredAvailable = availableItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Add item to moodboard and trigger reserve API
  const handleAddItemToCanvas = async (item: InventoryItem) => {
    // Check if item is already on canvas to avoid duplicate network reservation
    const isAlreadyOnCanvas = canvasElements.some((el) => el.itemId === item.id);
    
    // Create new element coordinate parameters
    const nextZIndex = canvasElements.length > 0 
      ? Math.max(...canvasElements.map((el) => el.zIndex)) + 1 
      : 1;

    const newElement: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: item.id,
      name: item.name,
      photos: item.photos,
      x: 150 + (canvasElements.length % 5) * 20,
      y: 120 + (canvasElements.length % 5) * 20,
      scale: 0.8,
      rotation: 0,
      zIndex: nextZIndex
    };

    setCanvasElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);

    if (!isAlreadyOnCanvas) {
      // 1. Call reservation API
      try {
        const res = await fetch(`/api/projects/${project.id}/moodboard/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });
        if (!res.ok) throw new Error("Failed to reserve item");
        
        // Remove item from sidebar available list
        setAvailableItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err) {
        console.error("Reserve API failed:", err);
      }
    }
  };

  // Canvas Actions
  const handleScaleChange = (factor: number) => {
    if (!selectedElementId) return;
    setCanvasElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? { ...el, scale: Math.max(0.2, Math.min(3.0, el.scale + factor)) }
          : el
      )
    );
  };

  const handleRotateChange = (deg: number) => {
    if (!selectedElementId) return;
    setCanvasElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? { ...el, rotation: (el.rotation + deg + 360) % 360 }
          : el
      )
    );
  };

  const handleLayerChange = (direction: "up" | "down") => {
    if (!selectedElementId) return;
    setCanvasElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? { ...el, zIndex: Math.max(1, el.zIndex + (direction === "up" ? 1 : -1)) }
          : el
      )
    );
  };

  const handleDuplicateElement = () => {
    if (!selectedElementId) return;
    const target = canvasElements.find((el) => el.id === selectedElementId);
    if (!target) return;

    const nextZIndex = Math.max(...canvasElements.map((el) => el.zIndex)) + 1;
    const duplicate: CanvasElement = {
      ...target,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: target.x + 25,
      y: target.y + 25,
      zIndex: nextZIndex
    };

    setCanvasElements((prev) => [...prev, duplicate]);
    setSelectedElementId(duplicate.id);
  };

  const handleDeleteElement = async () => {
    if (!selectedElementId) return;
    const target = canvasElements.find((el) => el.id === selectedElementId);
    if (!target) return;

    // Filter elements
    const updatedElements = canvasElements.filter((el) => el.id !== selectedElementId);
    setCanvasElements(updatedElements);
    setSelectedElementId(null);

    // If no other instance of this item remains on the canvas, release it back to AVAILABLE status
    const remainingInstances = updatedElements.some((el) => el.itemId === target.itemId);
    if (!remainingInstances) {
      try {
        const res = await fetch(`/api/projects/${project.id}/moodboard/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: target.itemId }),
        });
        if (!res.ok) throw new Error("Failed to release item");
        
        // Put back into available list
        const releasedItem: InventoryItem = {
          id: target.itemId,
          sku: "SKU-TEMP",
          barcode: "BARCODE-TEMP",
          name: target.name,
          category: "Visuals",
          photos: target.photos
        };
        setAvailableItems((prev) => [...prev, releasedItem]);
      } catch (err) {
        console.error("Release API failed:", err);
      }
    }
  };

  // Save layout state to SQLite
  const handleSaveLayout = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/moodboard/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodBoardState: canvasElements }),
      });
      if (!res.ok) throw new Error("Failed to save layout");
      
      setSaveStatus({ success: true, message: "Moodboard layout saved successfully!" });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, message: err.message || "Failed to save configuration layout." });
    } finally {
      setIsSaving(false);
    }
  };

  // Drag handlers for absolute container
  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    setSelectedElementId(elementId);
    const target = canvasElements.find((el) => el.id === elementId);
    if (!target || !workspaceRef.current) return;

    const rect = workspaceRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left - target.x;
    const startY = e.clientY - rect.top - target.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - rect.left - startX;
      const newY = moveEvent.clientY - rect.top - startY;

      setCanvasElements((prev) =>
        prev.map((el) =>
          el.id === elementId
            ? { ...el, x: Math.max(0, Math.min(800 - 150, newX)), y: Math.max(0, Math.min(600 - 150, newY)) }
            : el
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Export Canvas layout as PNG image
  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      // 1. Create native canvas element matching 800x600 specs
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not instantiate canvas 2D context");

      // Draw background
      ctx.fillStyle = "#18181b"; // zinc-900 (matches dark theme canvas)
      ctx.fillRect(0, 0, 800, 600);

      // Draw subtle grid overlay
      ctx.strokeStyle = "#27272a"; // zinc-800
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Draw title text
      ctx.fillStyle = "#a1a1aa"; // zinc-400
      ctx.font = "bold 14px Courier New, monospace";
      ctx.fillText(`STYLING OS - MOODBOARD [${project.projectCode}]`, 30, 40);

      // Sort elements by zIndex to draw back-to-front correctly
      const sorted = [...canvasElements].sort((a, b) => a.zIndex - b.zIndex);

      // Load all images asynchronously
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous"; // Bypass CORS if loaded from CDN/Picsum
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = url;
        });
      };

      for (const el of sorted) {
        try {
          const imgUrl = getPhotoUrl(el.photos);
          const img = await loadImage(imgUrl);

          // Renders card dimensions: width=140, height=140
          const cardW = 140;
          const cardH = 140;

          ctx.save();
          // Move context origin to item center
          ctx.translate(el.x + cardW / 2, el.y + cardH / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.scale(el.scale, el.scale);

          // Draw rounded card background wrapper
          ctx.fillStyle = "#27272a"; // zinc-800
          ctx.beginPath();
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
          ctx.fill();

          // Draw the photo image inside (inset of 6px)
          const inset = 6;
          ctx.beginPath();
          ctx.roundRect(-cardW / 2 + inset, -cardH / 2 + inset, cardW - inset * 2, cardH - inset * 2 - 20, 8);
          ctx.clip();
          ctx.drawImage(img, -cardW / 2 + inset, -cardH / 2 + inset, cardW - inset * 2, cardH - inset * 2 - 20);

          ctx.restore();
        } catch (e) {
          console.warn("Skipping drawing image for element due to load failure:", el.name);
        }
      }

      // Trigger composite image download link
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `moodboard-${project.projectCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error(err);
      alert("Failed to render mood board layout to image.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn("flex-1 space-y-6 max-w-7xl mx-auto w-full flex flex-col", embedded ? "p-0" : "p-6 md:p-8")}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!embedded ? (
          <div className="space-y-1">
            <Link 
              href={`/projects/${project.id}`} 
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Project Details</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <span>Interactive Mood Board Editor</span>
            </h1>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Project Design Canvas</span>
            </h3>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {saveStatus && (
            <div className={cn(
              "px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5",
              saveStatus.success ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-rose-500/5 text-rose-400 border-rose-500/10"
            )}>
              {saveStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Layout"}</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Editor Layout: Sidebar (available items) + Canvas Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Column: Available picklist sidebar */}
        <div className="p-5 rounded-2xl border border-zinc-250/20 dark:border-zinc-850/20 bg-white/50 dark:bg-zinc-900/20 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Props Repository</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Drag/click items to add to board. Placed items are auto-reserved.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search props name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-1">
            {filteredAvailable.length > 0 ? (
              filteredAvailable.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddItemToCanvas(item)}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-150 flex gap-3 cursor-pointer hover:shadow-sm"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
                    <img
                      src={getPhotoUrl(item.photos)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[8px] font-mono text-zinc-400 font-bold block">{item.sku}</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 block">{item.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic text-center py-12">No available props found.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Canvas Workspace area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Controls Bar for Selected Element */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-3 justify-between min-h-[50px]">
            {selectedElementId ? (
              <>
                <span className="text-xs text-zinc-500 font-semibold truncate max-w-[200px]">
                  Selection: {canvasElements.find((e) => e.id === selectedElementId)?.name}
                </span>

                <div className="flex items-center gap-2">
                  {/* Scale controls */}
                  <div className="flex border border-zinc-250 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleScaleChange(-0.1)} 
                      className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      A-
                    </button>
                    <button 
                      onClick={() => handleScaleChange(0.1)} 
                      className="px-2.5 py-1 text-xs font-bold border-l border-zinc-250 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      A+
                    </button>
                  </div>

                  {/* Rotate controls */}
                  <div className="flex border border-zinc-250 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleRotateChange(-15)} 
                      className="px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <RotateCw className="w-3.5 h-3.5 scale-x-[-1]" />
                    </button>
                    <button 
                      onClick={() => handleRotateChange(15)} 
                      className="px-2 py-1 border-l border-zinc-250 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Layer controls */}
                  <div className="flex border border-zinc-250 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleLayerChange("down")} 
                      className="px-2.5 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleLayerChange("up")} 
                      className="px-2.5 py-1 border-l border-zinc-250 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Duplicate */}
                  <button
                    onClick={handleDuplicateElement}
                    className="p-1.5 border border-zinc-250 dark:border-zinc-700 rounded-lg text-zinc-650 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-850"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={handleDeleteElement}
                    className="p-1.5 border border-red-500/20 rounded-lg text-red-500 hover:text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <span className="text-xs text-zinc-400 italic">Select an item on the canvas below to adjust properties.</span>
            )}
          </div>

          {/* Absolute HTML5 Canvas Box container */}
          <div
            ref={workspaceRef}
            onClick={() => setSelectedElementId(null)}
            className="flex-1 min-h-[500px] max-h-[600px] border border-zinc-250 dark:border-zinc-850 rounded-2xl bg-zinc-900 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden shadow-inner cursor-default"
          >
            {canvasElements.map((el) => {
              const isSelected = selectedElementId === el.id;
              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, el.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(el.id);
                  }}
                  className={cn(
                    "absolute select-none rounded-2xl p-1.5 bg-zinc-850 dark:bg-zinc-900 border flex flex-col items-center justify-between cursor-move shadow-md active:scale-95 transition-shadow",
                    isSelected 
                      ? "border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30" 
                      : "border-zinc-750 dark:border-zinc-800"
                  )}
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: "140px",
                    height: "140px",
                    zIndex: el.zIndex,
                    transform: `rotate(${el.rotation}deg) scale(${el.scale})`,
                    transformOrigin: "center center"
                  }}
                >
                  {/* Photo container */}
                  <div className="w-full h-[96px] bg-zinc-950 rounded-xl overflow-hidden relative">
                    <img
                      src={getPhotoUrl(el.photos)}
                      alt={el.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  {/* Title overlay label */}
                  <div className="w-full text-center px-1">
                    <span className="text-[9px] font-bold text-zinc-300 truncate block w-full pointer-events-none">
                      {el.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
