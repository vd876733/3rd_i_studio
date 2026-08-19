"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { 
  ScanBarcode, 
  Camera, 
  VideoOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square
} from "lucide-react";

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Instantiate code reader
    codeReaderRef.current = new BrowserMultiFormatReader();

    // List available camera devices
    codeReaderRef.current.listVideoInputDevices()
      .then((videoDevices) => {
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      })
      .catch((err) => {
        console.error("Error listing cameras:", err);
        setError("Could not discover camera devices. Please check permissions.");
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
    setIsScanning(true);

    try {
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result, err) => {
          if (result) {
            setScanResult(result.getText());
            // Vibrate device if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
          }
          if (err && !(err.name === "NotFoundException")) {
            // Log real decoder errors, ignore normal 'NotFound' exceptions (which occur every frame a barcode isn't seen)
            console.debug("Decoder status:", err);
          }
        }
      );
    } catch (err: any) {
      console.error("Error starting camera stream:", err);
      setError(err.message || "Failed to initiate video stream.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-955 dark:text-zinc-50 flex items-center gap-2">
          <ScanBarcode className="w-6 h-6 text-cyan-500" />
          <span>Real-time Barcode Scanner</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Scan UPC, EAN, QR codes directly inside the browser using your device's camera.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scanner Viewfinder Box */}
        <div className="md:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-xl bg-card border border-border text-card-foreground overflow-hidden shadow-sm flex flex-col items-center justify-center">
            {/* Camera Video Stream */}
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${isScanning ? "block" : "hidden"}`} 
            />

            {/* Offline/Not Scanning Screen */}
            {!isScanning && (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
                  <VideoOff className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Camera is offline</p>
                <button
                  onClick={startScanner}
                  disabled={!selectedDevice}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {/* Viewfinder Target HUD Box */}
            {isScanning && (
              <div className="absolute inset-0 border-[3px] border-cyan-500/30 m-8 pointer-events-none rounded-xl flex items-center justify-center">
                <div className="w-48 h-24 border-2 border-cyan-400 rounded-md opacity-70 animate-pulse relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-300 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-300 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-300 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-300 -mb-1 -mr-1" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/80 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons & Device Selector */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm text-card-foreground">
            {isScanning ? (
              <button
                onClick={stopScanner}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={startScanner}
                disabled={!selectedDevice}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Start Stream</span>
              </button>
            )}

            {/* Camera Select Dropdown */}
            {devices.length > 1 && (
              <div className="flex-1 min-w-[200px] flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Camera:</span>
                <select
                  value={selectedDevice}
                  onChange={(e) => {
                    setSelectedDevice(e.target.value);
                    if (isScanning) {
                      stopScanner();
                      // Wait a moment for reset to take effect
                      setTimeout(startScanner, 100);
                    }
                  }}
                  className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-zinc-200"
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

        {/* Results Sidebar */}
        <div className="space-y-4">
          <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6 h-full flex flex-col">
            <h3 className="font-semibold text-foreground text-sm">Decoding Feed</h3>
            
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              {scanResult ? (
                <div className="space-y-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Decoded Output</span>
                    <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 break-all font-mono text-sm text-slate-900 dark:text-zinc-50 font-bold select-all">
                      {scanResult}
                    </div>
                  </div>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Clear Result
                  </button>
                </div>
              ) : error ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                </div>
              ) : isScanning ? (
                <div className="space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">Position barcode inside red viewfinder line to read...</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Press Start Camera above to scan</p>
              )}
            </div>

            <div className="border-t border-border pt-4 mt-auto">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-2">Supported Standards</span>
              <div className="flex flex-wrap gap-1.5">
                {["UPC-A", "EAN-13", "QR Code", "Code 128", "Code 39"].map((std) => (
                  <span key={std} className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                    {std}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
