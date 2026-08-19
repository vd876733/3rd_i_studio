"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { 
  ScanBarcode, 
  Camera, 
  VideoOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Square,
  MapPin,
  Package,
  Layers,
  ArrowRight,
  WifiOff,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces for decoded response
interface ScannedItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  rackNumber: string;
  shelfNumber: string;
  currentStatus: string;
  replacementCost: number;
  photos: any;
  boxNumber: string | null;
  boxId: string | null;
}

export default function MobileScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [itemData, setItemData] = useState<ScannedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineUsed, setIsOfflineUsed] = useState(false);
  const [isSystemOffline, setIsSystemOffline] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Monitor network status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSystemOffline(!navigator.onLine);
      const handleOnline = () => setIsSystemOffline(false);
      const handleOffline = () => setIsSystemOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();

    // Query cameras and auto-select rear lens if present
    codeReaderRef.current.listVideoInputDevices()
      .then((videoDevices) => {
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          // Look for back/rear environment camera
          const backCamera = videoDevices.find((device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear") ||
            device.label.toLowerCase().includes("environment")
          );
          setSelectedDevice(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
        }
      })
      .catch((err) => {
        console.error("Camera list failed:", err);
        setError("Unable to initialize camera devices. Check hardware permissions.");
      });

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanner = () => {
    if (!codeReaderRef.current || !selectedDevice || !videoRef.current) return;
    
    setError(null);
    setScanResult(null);
    setItemData(null);
    setIsScanning(true);

    try {
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            stopScanner();
            handleBarcodeScanned(barcode);
          }
          if (err && !(err.name === "NotFoundException")) {
            console.debug("Decoder status:", err);
          }
        }
      );
    } catch (err: any) {
      console.error("Failed to start camera feed:", err);
      setError(err.message || "Failed to start camera feed.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScanResult(barcode);
    setIsLoading(true);
    setError(null);
    setItemData(null);
    setIsOfflineUsed(false);

    // If completely offline, skip fetch and query offline cache directly
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queryOfflineCache(barcode);
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${barcode}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Item barcode not found in local database.");
        }
        throw new Error("Network query failed.");
      }
      const data = await res.json();
      setItemData(data);
    } catch (err: any) {
      console.warn("Fetch failed, querying local cache:", err);
      queryOfflineCache(barcode);
    } finally {
      setIsLoading(false);
    }
  };

  const queryOfflineCache = (barcode: string) => {
    setIsOfflineUsed(true);
    try {
      const cacheStr = localStorage.getItem("inventory_cache");
      if (!cacheStr) {
        setError("Offline Fallback: No cached inventory database found. Visit the inventory list while online first.");
        return;
      }
      const cache: any[] = JSON.parse(cacheStr);
      const item = cache.find((i) => i.barcode === barcode);
      if (!item) {
        setError(`Offline Fallback: Barcode [${barcode}] not found in offline cache.`);
        return;
      }
      setItemData({
        id: item.id,
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        category: item.category,
        rackNumber: item.rackNumber,
        shelfNumber: item.shelfNumber,
        currentStatus: item.currentStatus,
        replacementCost: item.replacementCost,
        photos: item.photos,
        boxNumber: "Offline Mode (N/A)", // Box relationships are not cached in simple local schema
        boxId: null,
      });
    } catch (err) {
      console.error("Local storage parse failed:", err);
      setError("Offline Fallback: Failed to query local cache.");
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
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <ScanBarcode className="w-6 h-6 text-cyan-500" />
          <span>Mobile Barcode Scanner</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Instant inventory scanner. Automatically queries local DB or falls back to local cache when offline.
        </p>
      </div>

      {/* Connection Offline Bar */}
      {(isSystemOffline || isOfflineUsed) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs font-semibold">
            {isSystemOffline ? (
              <span>Device is currently OFFLINE. The scanner is querying the local cache snapshot.</span>
            ) : (
              <span>Network fetch failed. Loaded inventory details from offline cache snapshot.</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Viewfinder camera box */}
        <div className="md:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-slate-900 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-900 overflow-hidden shadow-inner flex flex-col items-center justify-center">
            {/* Live Camera Stream */}
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${isScanning ? "block" : "hidden"}`} 
            />

            {/* Offline/Not Scanning HUD */}
            {!isScanning && (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                  <VideoOff className="w-6 h-6" />
                </div>
                <p className="text-zinc-400 text-sm font-medium">Camera is offline</p>
                <button
                  onClick={startScanner}
                  disabled={!selectedDevice}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Camera Stream</span>
                </button>
              </div>
            )}

            {/* Scan Overlay target */}
            {isScanning && (
              <div className="absolute inset-0 border-[3px] border-cyan-500/20 m-6 pointer-events-none rounded-2xl flex items-center justify-center">
                <div className="w-40 h-24 border-2 border-cyan-400 rounded-lg opacity-70 animate-pulse relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-300 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-300 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-300 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-300 -mb-1 -mr-1" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/80 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Device Controls */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            {isScanning ? (
              <button
                onClick={stopScanner}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-xs transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={startScanner}
                disabled={!selectedDevice}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Start Stream</span>
              </button>
            )}

            {/* Selector list */}
            {devices.length > 1 && (
              <div className="flex-1 min-w-[180px] flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Lens:</span>
                <select
                  value={selectedDevice}
                  onChange={(e) => {
                    setSelectedDevice(e.target.value);
                    if (isScanning) {
                      stopScanner();
                      setTimeout(startScanner, 100);
                    }
                  }}
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-zinc-200"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Scan Query Output Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 h-full flex flex-col justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">Decoded Item Specs</h3>
            
            <div className="flex-1 flex flex-col justify-center py-6">
              {isLoading ? (
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-550">Querying database for item details...</p>
                </div>
              ) : itemData ? (
                <div className="space-y-4 text-left">
                  {/* Photo preview */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-955 shadow-sm">
                    <img
                      src={getPhotoUrl(itemData.photos)}
                      alt={itemData.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm", getStatusColor(itemData.currentStatus))} >
                        {itemData.currentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Name and SKU */}
                  <div className="space-y-1">
                    <code className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">{itemData.sku}</code>
                    <h4 className="text-md font-bold text-slate-900 dark:text-zinc-50 leading-tight">{itemData.name}</h4>
                    <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-800/50 mt-1 font-mono">
                      {itemData.barcode}
                    </span>
                  </div>

                  {/* Locations Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Rack & Shelf</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mt-0.5">
                          {itemData.rackNumber} / {itemData.shelfNumber}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-955 border border-slate-150 dark:border-zinc-800 flex items-start gap-2">
                      <Package className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Assigned Box</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mt-0.5 truncate">
                          {itemData.boxNumber || "Not Boxed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium px-4 leading-relaxed">{error}</p>
                  {scanResult && (
                    <button
                      onClick={() => handleBarcodeScanned(scanResult)}
                      className="text-xs text-cyan-500 hover:text-cyan-600 font-semibold underline flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Scan Lookup</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-2 p-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/20 dark:bg-zinc-950/20">
                  <span className="text-xs text-slate-400 italic block">No active barcode scan.</span>
                  <span className="text-[10px] text-slate-500">Decoded barcode values will trigger instant DB query lookup.</span>
                </div>
              )}
            </div>

            {/* Quick manual scan input for testing if camera isn't accessible */}
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 mt-auto">
              <span className="text-[9px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5 font-bold">Manual Scan Simulation</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode (e.g. BARCODE-99002)..."
                  className="flex-1 bg-slate-50 text-slate-900 border border-slate-300 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        handleBarcodeScanned(val);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
