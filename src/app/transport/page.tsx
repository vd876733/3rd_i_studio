"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Truck, 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Wrench, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  PlusCircle,
  X,
  Briefcase,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrichedVehicle {
  id: string;
  name: string;
  licensePlate: string;
  status: string; // AVAILABLE, IN_TRANSIT, MAINTENANCE
  driverId: string | null;
  driverName: string | null;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  departureTime: string | null;
  returnTime: string | null;
}

interface DriverUser {
  id: string;
  name: string;
}

interface ProjectSelect {
  id: string;
  name: string;
  projectCode: string;
}

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverUser[]>([]);
  const [projects, setProjects] = useState<ProjectSelect[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ success: boolean; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<EnrichedVehicle | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [driverId, setDriverId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");

  const showNotification = (success: boolean, message: string) => {
    setNotification({ success, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch vehicles
      const vRes = await fetch("/api/transport");
      const vData = await vRes.json();
      if (!vRes.ok) throw new Error(vData.error || "Failed to load vehicles");
      setVehicles(vData.vehicles || []);

      // 2. Fetch projects & drivers (via projects/staff endpoints)
      const staffRes = await fetch("/api/staff");
      const staffData = await staffRes.json();
      if (staffRes.ok) {
        // Filter out drivers
        const driverUsers = (staffData.staff || [])
          .filter((u: any) => u.role === "DRIVER")
          .map((u: any) => ({ id: u.id, name: u.name }));
        setDrivers(driverUsers);
      }

      const pRes = await fetch("/api/staff"); // using activeProjects or fetching all projects
      // Let's call /api/staff which returns activeProjects, or query all projects.
      // Wait, we can fetch all projects by making a custom lightweight query, 
      // or we can read them from staffData (which includes activeProjects). Let's load projects.
      const projectsRes = await fetch("/api/staff"); // It returns activeProjects, let's use that!
      const projectsData = await projectsRes.json();
      if (projectsRes.ok) {
        setProjects(projectsData.activeProjects || []);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching transport data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Additional fetch for all projects if needed to assign to any project
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        if (res.ok && data.activeProjects) {
          // If we want a broader project list, we can load them or let it fallback
          // Let's make sure we query projects from api
        }
      } catch (e) {}
    };
    fetchAllProjects();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licensePlate) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          licensePlate: licensePlate.toUpperCase().replace(/\s/g, ""),
          status: "AVAILABLE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register vehicle");

      showNotification(true, "Vehicle registered successfully!");
      setIsCreateOpen(false);
      setName("");
      setLicensePlate("");
      fetchData(); // reload
    } catch (err: any) {
      alert(err.message || "Failed to create vehicle");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (vehicle: EnrichedVehicle) => {
    setSelectedVehicle(vehicle);
    setName(vehicle.name);
    setLicensePlate(vehicle.licensePlate);
    setStatus(vehicle.status);
    setDriverId(vehicle.driverId || "");
    setProjectId(vehicle.projectId || "");
    
    // Format ISO string to datetime-local format: YYYY-MM-DDTHH:MM
    const formatDateTime = (isoStr: string | null) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setDepartureTime(formatDateTime(vehicle.departureTime));
    setReturnTime(formatDateTime(vehicle.returnTime));
    setIsEditOpen(true);
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/transport/${selectedVehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          licensePlate: licensePlate.toUpperCase().replace(/\s/g, ""),
          status,
          driverId: driverId || null,
          projectId: projectId || null,
          departureTime: departureTime ? new Date(departureTime).toISOString() : null,
          returnTime: returnTime ? new Date(returnTime).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vehicle");

      showNotification(true, "Vehicle details updated successfully!");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update vehicle");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle from the active registry?")) return;

    try {
      const res = await fetch(`/api/transport/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete vehicle");

      showNotification(true, "Vehicle deleted from registry.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete vehicle");
    }
  };

  // Stats helper
  const totalVehicles = vehicles.length;
  const transitCount = vehicles.filter((v) => v.status === "IN_TRANSIT").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex flex-col">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-500" />
            <span>Vehicle Logistics & Fleet Control</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Dispatch fleet vehicles, pair transport crew drivers, and manage equipment transit schedules.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={cn(
          "px-4 py-3 rounded-xl text-xs font-semibold border flex items-center gap-2 max-w-md animate-fadeIn shadow-sm fixed bottom-6 right-6 z-55",
          notification.success 
            ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/15" 
            : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/15"
        )}>
          {notification.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Fleet Vehicles", value: totalVehicles, icon: Truck, color: "text-cyan-500 bg-cyan-500/5" },
          { label: "Available / Idle", value: availableCount, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/5" },
          { label: "Dispatched (In Transit)", value: transitCount, icon: Calendar, color: "text-amber-500 bg-amber-500/5" },
          { label: "Under Maintenance", value: maintenanceCount, icon: Wrench, color: "text-rose-500 bg-rose-500/5" }
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold block">{s.label}</span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{s.value}</span>
              </div>
              <div className={cn("p-3 rounded-xl shrink-0", s.color)}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="flex-1 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="text-xs font-semibold">Loading fleet logs...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center border border-dashed border-red-200 rounded-2xl bg-red-500/5 text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Try Again</button>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => {
              // Determine status styles
              let statusBadge = "";
              switch (v.status) {
                case "AVAILABLE":
                  statusBadge = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
                  break;
                case "IN_TRANSIT":
                  statusBadge = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
                  break;
                case "MAINTENANCE":
                  statusBadge = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
                  break;
              }

              return (
                <div key={v.id} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group">
                  <div className="space-y-4">
                    {/* Header: Name and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{v.name}</h3>
                        <code className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">
                          {v.licensePlate}
                        </code>
                      </div>
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", statusBadge)}>
                        {v.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Driver and Project schedule info */}
                    <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850/80 space-y-3.5">
                      <div className="flex items-center gap-2.5 text-xs">
                        <User className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold block">Assigned Driver</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300 text-xs">
                            {v.driverName || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs border-t border-zinc-100 dark:border-zinc-850/80 pt-3">
                        <Briefcase className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold block">Project Schedule</span>
                          {v.projectName ? (
                            <Link href={`/projects/${v.projectId}`} className="font-bold text-cyan-500 hover:underline text-xs flex items-center gap-1">
                              <span>{v.projectName}</span>
                              <code className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">{v.projectCode}</code>
                            </Link>
                          ) : (
                            <span className="text-zinc-450 italic text-xs">No active project assignment</span>
                          )}
                        </div>
                      </div>

                      {(v.departureTime || v.returnTime) && (
                        <div className="flex flex-col gap-1.5 border-t border-zinc-100 dark:border-zinc-850/80 pt-3 text-[10px] text-zinc-500">
                          {v.departureTime && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Departure:</span>
                              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {new Date(v.departureTime).toLocaleDateString()} {new Date(v.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          )}
                          {v.returnTime && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Return:</span>
                              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {new Date(v.returnTime).toLocaleDateString()} {new Date(v.returnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-850/50">
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 hover:border-red-500/20 transition-all hover:bg-red-500/5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-bold text-xs cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Dispatch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <Truck className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">No vehicles registered</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Get started by registering a transit vehicle inside your styling logistics database.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Vehicle</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-md w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-500" />
                <span>Register Fleet Vehicle</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 block">Vehicle Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ford Transit Cargo Van (White)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 block">License Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7XYZ99 (Alpha-numeric, unique)"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono uppercase"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Dispatch Modal */}
      {isEditOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Edit className="w-5 h-5 text-cyan-500" />
                <span>Modify Fleet Assignment</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVehicle} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">Vehicle Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">License Plate</label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="AVAILABLE">Available / Idle</option>
                    <option value="IN_TRANSIT">In Transit / Dispatched</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">Assigned Driver</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-850 pt-3">
                <label className="text-xs font-semibold text-zinc-500 block">Linked Production Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">No Project Assigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} [{p.projectCode}]</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 block">Estimated Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Assignments</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline ArrowLeft icon matching navigation style
function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
