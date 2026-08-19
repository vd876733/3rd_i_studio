"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Search, 
  Trash2, 
  Copy, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

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
  sku?: string;
  barcode?: string;
  category?: string;
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
  embedded = false,
  onAuditLogCreated,
  onAvailableItemsChange,
}: {
  project: ProjectData;
  availableItems: InventoryItem[];
  embedded?: boolean;
  onAuditLogCreated?: (action: string, newValue: string) => void;
  onAvailableItemsChange?: (items: InventoryItem[]) => void;
}) {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>(initialAvailableItems);

  // Sync availableItems when initialAvailableItems prop changes
  useEffect(() => {
    setAvailableItems(initialAvailableItems);
  }, [initialAvailableItems]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);

  // Dynamic import of Fabric
  const [fabric, setFabric] = useState<any>(null);
  useEffect(() => {
    import("fabric").then((module) => {
      setFabric((module as any).fabric);
    });
  }, []);

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

  // Search items list
  const filteredAvailable = availableItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize Fabric Canvas and Load Saved State
  useEffect(() => {
    if (!fabric || !canvasRef.current) return;

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8fafc", // light off-white background
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = canvas;

    // Add unselectable, floating brand watermark / title text to the canvas
    const titleText = new fabric.Text(`STYLING OS - MOODBOARD [${project.projectCode}]`, {
      left: 20,
      top: 20,
      fontSize: 12,
      fontFamily: "Courier New, monospace",
      fill: "#94a3b8", // slate-400
      fontWeight: "bold",
      selectable: false,
      hoverCursor: "default",
    });
    canvas.add(titleText);

    // Parse initial layout elements
    let initialElements: CanvasElement[] = [];
    if (project.moodBoardState) {
      try {
        const parsed = typeof project.moodBoardState === "string"
          ? JSON.parse(project.moodBoardState)
          : project.moodBoardState;
        if (Array.isArray(parsed)) {
          initialElements = parsed;
        }
      } catch (err) {
        console.error("Failed to parse moodBoardState:", err);
      }
    }

    // Load initial objects sequentially to preserve ordering and layout
    const loadSavedElements = async () => {
      for (const el of initialElements) {
        const url = getPhotoUrl(el.photos);
        await new Promise<void>((resolve) => {
          fabric.Image.fromURL(
            url,
            (img: any) => {
              if (img) {
                // Determine scale relative to natural size
                const maxDim = 140;
                const baseScale = maxDim / Math.max(img.width || 1, img.height || 1);

                img.set({
                  left: el.x,
                  top: el.y,
                  scaleX: baseScale * (el.scale || 1),
                  scaleY: baseScale * (el.scale || 1),
                  angle: el.rotation || 0,
                  
                  // Premium control point aesthetics
                  cornerColor: "#06b6d4",
                  cornerStrokeColor: "#ffffff",
                  borderColor: "#06b6d4",
                  cornerSize: 8,
                  transparentCorners: false,
                  borderScaleFactor: 2,

                  // Border and shadow styling
                  stroke: "#ffffff",
                  strokeWidth: 4,
                  shadow: new fabric.Shadow({
                    color: "rgba(0, 0, 0, 0.4)",
                    blur: 15,
                    offsetX: 5,
                    offsetY: 5,
                  }),
                });

                // Attach metadata parameters
                (img as any).id = el.id;
                (img as any).itemId = el.itemId;
                (img as any).name = el.name;
                (img as any).photos = el.photos;
                (img as any).sku = el.sku || "SKU-TEMP";
                (img as any).barcode = el.barcode || "BARCODE-TEMP";
                (img as any).category = el.category || "Visuals";

                canvas.add(img);
              }
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }
      canvas.renderAll();
    };

    loadSavedElements();

    // Active Selection Event Listeners
    const updateSelection = () => {
      const activeObj = canvas.getActiveObject();
      if (activeObj && (activeObj as any).itemId) {
        setSelectedElementId((activeObj as any).id);
        setSelectedObjectName((activeObj as any).name);
      } else {
        setSelectedElementId(null);
        setSelectedObjectName(null);
      }
    };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);

    // Keyboard delete listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          handleDeleteElement();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [fabric]);

  // Sidebar drag handler
  const handleDragStartSidebar = (e: React.DragEvent, item: InventoryItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  // Drop handler on canvas container
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const item = JSON.parse(dataStr) as InventoryItem;

      // Get drop position relative to canvas element
      const rect = canvas.getElement().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Restrict items strictly within canvas bounds
      if (x < 0 || x > 800 || y < 0 || y > 600) return;

      // Center the drop coordinates relative to the 140px card boundaries
      const size = 140;
      const dropX = x - size / 2;
      const dropY = y - size / 2;

      await handleAddItemToCanvas(item, dropX, dropY);
    } catch (err) {
      console.error("Drop handler failed:", err);
    }
  };

  // Add Item to Canvas & trigger Reserve API
  const handleAddItemToCanvas = async (item: InventoryItem, dropX?: number, dropY?: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric) return;

    // Check if the item is already on the canvas to avoid duplicate network reservation requests
    const objects = canvas.getObjects() as any[];
    const isAlreadyOnCanvas = objects.some((obj) => obj.itemId === item.id);

    const x = dropX !== undefined ? dropX : 150 + (objects.length % 5) * 20;
    const y = dropY !== undefined ? dropY : 120 + (objects.length % 5) * 20;
    const id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const url = getPhotoUrl(item.photos);
    fabric.Image.fromURL(
      url,
      (img: any) => {
        if (!img) return;

        const maxDim = 140;
        const baseScale = maxDim / Math.max(img.width || 1, img.height || 1);

        img.set({
          left: x,
          top: y,
          scaleX: baseScale * 0.8,
          scaleY: baseScale * 0.8,
          angle: 0,
          
          // Selection handles style
          cornerColor: "#06b6d4",
          cornerStrokeColor: "#ffffff",
          borderColor: "#06b6d4",
          cornerSize: 8,
          transparentCorners: false,
          borderScaleFactor: 2,

          // Shadow and border aesthetics
          stroke: "#ffffff",
          strokeWidth: 4,
          shadow: new fabric.Shadow({
            color: "rgba(0, 0, 0, 0.4)",
            blur: 15,
            offsetX: 5,
            offsetY: 5,
          }),
        });

        // Set properties
        (img as any).id = id;
        (img as any).itemId = item.id;
        (img as any).name = item.name;
        (img as any).photos = item.photos;
        (img as any).sku = item.sku;
        (img as any).barcode = item.barcode;
        (img as any).category = item.category;

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        setSelectedElementId(id);
        setSelectedObjectName(item.name);
      },
      { crossOrigin: "anonymous" }
    );

    if (!isAlreadyOnCanvas) {
      try {
        const res = await fetch(`/api/projects/${project.id}/moodboard/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });
        if (!res.ok) throw new Error("Failed to reserve item");
        
        // Remove item from sidebar available list
        setAvailableItems((prev) => {
          const updated = prev.filter((i) => i.id !== item.id);
          if (onAvailableItemsChange) onAvailableItemsChange(updated);
          return updated;
        });

        if (onAuditLogCreated) {
          onAuditLogCreated(
            "RESERVED",
            `Reserved item '${item.name}' (SKU: ${item.sku}) for Project '${project.name}' (${project.projectCode}) via Moodboard canvas placement`
          );
        }
      } catch (err) {
        console.error("Reserve API failed:", err);
      }
    }
  };

  // Canvas Actions
  const handleScaleChange = (factor: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      const currentScaleX = active.scaleX || 1.0;
      const newScale = Math.max(0.1, Math.min(5.0, currentScaleX + factor));
      active.set({
        scaleX: newScale,
        scaleY: newScale
      });
      canvas.requestRenderAll();
    }
  };

  const handleRotateChange = (deg: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      const currentAngle = active.angle || 0;
      const newAngle = (currentAngle + deg + 360) % 360;
      active.set({ angle: newAngle });
      canvas.requestRenderAll();
    }
  };

  const handleLayerChange = (direction: "up" | "down") => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      if (direction === "up") {
        canvas.bringForward(active);
      } else {
        // Prevent sending behind the static watermark background title (which is index 0)
        const objects = canvas.getObjects();
        const activeIndex = objects.indexOf(active);
        if (activeIndex > 1) {
          canvas.sendBackwards(active);
        }
      }
      canvas.requestRenderAll();
    }
  };

  const handleDuplicateElement = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && (active as any).itemId) {
      const id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      active.clone((cloned: any) => {
        if (!cloned) return;
        canvas.discardActiveObject();
        
        cloned.set({
          left: (active.left || 0) + 20,
          top: (active.top || 0) + 20,
          evented: true,
        });

        cloned.id = id;
        cloned.itemId = (active as any).itemId;
        cloned.name = (active as any).name;
        cloned.photos = (active as any).photos;
        cloned.sku = (active as any).sku;
        cloned.barcode = (active as any).barcode;
        cloned.category = (active as any).category;

        // Visual controls properties
        cloned.set({
          cornerColor: "#06b6d4",
          cornerStrokeColor: "#ffffff",
          borderColor: "#06b6d4",
          cornerSize: 8,
          transparentCorners: false,
          borderScaleFactor: 2,
        });

        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        
        setSelectedElementId(id);
        setSelectedObjectName((active as any).name);
      });
    }
  };

  const handleDeleteElement = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject() as any;
    if (!activeObject || !activeObject.itemId) return;

    const targetItemId = activeObject.itemId;
    const targetName = activeObject.name;
    const targetPhotos = activeObject.photos;
    const targetSku = activeObject.sku;
    const targetBarcode = activeObject.barcode;
    const targetCategory = activeObject.category;

    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedElementId(null);
    setSelectedObjectName(null);

    // If no other instance of this item remains on the canvas, release it back to AVAILABLE status
    const remainingObjects = canvas.getObjects() as any[];
    const remainingInstances = remainingObjects.some((obj) => obj.itemId === targetItemId);

    if (!remainingInstances) {
      try {
        const res = await fetch(`/api/projects/${project.id}/moodboard/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: targetItemId }),
        });
        if (!res.ok) throw new Error("Failed to release item");
        
        // Put back into available list and sort by SKU
        const releasedItem: InventoryItem = {
          id: targetItemId,
          sku: targetSku || "SKU-TEMP",
          barcode: targetBarcode || "BARCODE-TEMP",
          name: targetName,
          category: targetCategory || "Visuals",
          photos: targetPhotos
        };

        setAvailableItems((prev) => {
          const exists = prev.some(i => i.id === releasedItem.id);
          if (exists) return prev;
          const updated = [...prev, releasedItem].sort((a, b) => a.sku.localeCompare(b.sku));
          if (onAvailableItemsChange) onAvailableItemsChange(updated);
          return updated;
        });

        if (onAuditLogCreated) {
          onAuditLogCreated(
            "RELEASED",
            `Released item '${targetName}' (SKU: ${targetSku}) from Project '${project.name}' (${project.projectCode}) back to available pool`
          );
        }
      } catch (err) {
        console.error("Release API failed:", err);
      }
    }
  };

  // Save layout state to SQLite database
  const handleSaveLayout = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    setSaveStatus(null);

    // Filter out title text or non-inventory-item objects
    const itemsToSave: CanvasElement[] = [];
    const objects = canvas.getObjects();

    objects.forEach((obj: any) => {
      if (obj.itemId) {
        // Re-scale values relative to natural dimensions (img.width/height)
        const naturalWidth = obj.width || 1;
        const maxDim = 140;
        const baseScale = maxDim / Math.max(naturalWidth, obj.height || 1);
        // Recover original scaling factor (canvas elements relative to the 140 bounds)
        const relativeScale = obj.scaleX / baseScale;

        itemsToSave.push({
          id: obj.id,
          itemId: obj.itemId,
          name: obj.name,
          photos: obj.photos,
          x: obj.left || 0,
          y: obj.top || 0,
          scale: Number(relativeScale.toFixed(2)),
          rotation: obj.angle || 0,
          zIndex: objects.indexOf(obj),
          sku: obj.sku,
          barcode: obj.barcode,
          category: obj.category
        });
      }
    });

    try {
      const res = await fetch(`/api/projects/${project.id}/moodboard/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodBoardState: itemsToSave }),
      });
      if (!res.ok) throw new Error("Failed to save layout");
      
      setSaveStatus({ success: true, message: "Moodboard layout saved successfully!" });
      setTimeout(() => setSaveStatus(null), 3000);

      if (onAuditLogCreated) {
        onAuditLogCreated(
          "PROJECT_UPDATED",
          `Saved moodboard layout configuration state for Project '${project.name}' (${project.projectCode})`
        );
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ success: false, message: err.message || "Failed to save configuration layout." });
    } finally {
      setIsSaving(false);
    }
  };

  // Export Canvas layout as PNG image
  const handleExportPNG = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      // Temporarily clear selection box to avoid drawing handles in the PNG export
      canvas.discardActiveObject();
      canvas.renderAll();

      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1.0,
      });

      const link = document.createElement("a");
      link.download = `moodboard-${project.projectCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to render mood board layout to PNG.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export Canvas layout as PDF document
  const handleExportPDF = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      // Temporarily clear selection box to avoid drawing handles in the PDF export
      canvas.discardActiveObject();
      canvas.renderAll();

      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1.0,
      });

      // Instantiate jsPDF with landscape orientation matching the 800x600 pixels bounds
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 800, 600);
      pdf.save(`moodboard-${project.projectCode}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to render mood board layout to PDF.");
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
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-zinc-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Project Details</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <span>Interactive Mood Board Editor</span>
            </h1>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
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
              saveStatus.success ? "bg-emerald-500/5 text-emerald-455 border-emerald-500/10" : "bg-rose-500/5 text-rose-455 border-rose-500/10"
            )}>
              {saveStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Layout"}</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export PNG</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Layout: Sidebar (available items) + Canvas Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Column: Available picklist sidebar */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-bold">Props Repository</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Drag/click items to add to board. Placed items are auto-reserved.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search props name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-1">
            {filteredAvailable.length > 0 ? (
              filteredAvailable.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStartSidebar(e, item)}
                  onClick={() => handleAddItemToCanvas(item)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 hover:border-slate-350 transition-all duration-150 flex gap-3 cursor-grab active:cursor-grabbing hover:shadow-sm"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-200">
                    <img
                      src={getPhotoUrl(item.photos)}
                      alt={item.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[8px] font-mono text-slate-400 font-bold block">{item.sku}</span>
                    <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">{item.name}</span>
                    <span className="text-[10px] text-slate-550 block">{item.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-12">No available props found.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Canvas Workspace area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Controls Bar for Selected Element */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 flex flex-wrap items-center gap-3 justify-between min-h-[50px]">
            {selectedElementId ? (
              <>
                <span className="text-xs text-slate-700 font-semibold truncate max-w-[200px]">
                  Selection: {selectedObjectName}
                </span>

                <div className="flex items-center gap-2">
                  {/* Scale controls */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => handleScaleChange(-0.05)} 
                      className="px-2.5 py-1 text-xs font-bold hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      A-
                    </button>
                    <button 
                      onClick={() => handleScaleChange(0.05)} 
                      className="px-2.5 py-1 text-xs font-bold border-l border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      A+
                    </button>
                  </div>

                  {/* Rotate controls */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => handleRotateChange(-15)} 
                      className="px-2 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 scale-x-[-1]" />
                    </button>
                    <button 
                      onClick={() => handleRotateChange(15)} 
                      className="px-2 py-1 border-l border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Layer controls */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => handleLayerChange("down")} 
                      className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleLayerChange("up")} 
                      className="px-2.5 py-1 border-l border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Duplicate */}
                  <button
                    onClick={handleDuplicateElement}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={handleDeleteElement}
                    className="p-1.5 border border-red-500/20 rounded-lg text-red-500 hover:text-white hover:bg-red-500 transition-colors cursor-pointer bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-500 italic">Select an item on the canvas below to adjust properties.</span>
            )}
          </div>

          {/* Absolute HTML5 Canvas Box container */}
          <div
            ref={workspaceRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 min-h-[500px] max-h-[600px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative"
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
