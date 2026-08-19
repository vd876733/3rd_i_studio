"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  User, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  X,
  MapPin,
  CalendarDays,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string; // STYLIST, PACKER, DRIVER, ADMIN
}

interface AvailabilityRecord {
  id: string;
  userId: string;
  date: string;
  status: string; // AVAILABLE, ON_SITE, ON_LEAVE
  notes: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  projectCode: string;
  shootDate: string;
  leadStylistId: string | null;
  leadPackerId: string | null;
  leadDriverId: string | null;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [availabilities, setAvailabilities] = useState<AvailabilityRecord[]>([]);
  const [activeProjects, setActiveProjects] = useState<ProjectData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ success: boolean; message: string } | null>(null);

  // Month navigation state
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Modal scheduler state
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ON_LEAVE");
  const [notes, setNotes] = useState("");

  const showNotification = (success: boolean, message: string) => {
    setNotification({ success, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load staff scheduler data");

      setStaff(data.staff || []);
      setAvailabilities(data.availabilities || []);
      setActiveProjects(data.activeProjects || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper date formatter
  const formatDateKey = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // Resolve staff status for a date
  const getStaffStatusOnDate = (userId: string, date: Date) => {
    const dateKey = formatDateKey(date);

    // 1. Check database overrides
    const override = availabilities.find(
      (a) => a.userId === userId && formatDateKey(new Date(a.date)) === dateKey
    );
    if (override) {
      return { 
        status: override.status, 
        notes: override.notes, 
        source: "override" 
      };
    }

    // 2. Check active projects where staff is assigned on this shoot date
    const project = activeProjects.find((p) => {
      const shootKey = formatDateKey(new Date(p.shootDate));
      return (
        shootKey === dateKey &&
        (p.leadStylistId === userId || p.leadPackerId === userId || p.leadDriverId === userId)
      );
    });

    if (project) {
      return {
        status: "ON_SITE",
        notes: `Assigned to ${project.name} (${project.projectCode})`,
        source: "project"
      };
    }

    return { 
      status: "AVAILABLE", 
      notes: "Available", 
      source: "default" 
    };
  };

  // Handle scheduler form submit
  const handleScheduleAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedDate || !selectedStatus) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDate.toISOString(),
          status: selectedStatus,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");

      showNotification(true, "Availability schedule saved!");
      setIsSchedulerOpen(false);
      setNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save schedule");
    } finally {
      setActionLoading(false);
    }
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const paddingCells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    paddingCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i),
    });
  }

  const currentCells = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  const totalCells = paddingCells.length + currentCells.length;
  const nextPadding = 42 - totalCells; // Standard 6 rows of 7 days
  const nextCells = [];
  for (let i = 1; i <= nextPadding; i++) {
    nextCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const calendarCells = [...paddingCells, ...currentCells, ...nextCells];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
            <CalendarIcon className="w-6 h-6 text-cyan-500" />
            <span>Staff Availability & Deployments</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Track stylist, packer, and driver availability. Log leave overrides and site dispatch schedules.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={cn(
          "px-4 py-3 rounded-xl text-xs font-semibold border flex items-center gap-2 max-w-md animate-fadeIn shadow-sm fixed bottom-6 right-6 z-55",
          notification.success 
            ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/15" 
            : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/15"
        )}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Sidebar directory */}
        <div className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Staff Directory</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Current active crew status for today.</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
            {loading ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">Loading directory...</p>
            ) : staff.length > 0 ? (
              staff.map((u) => {
                const todayStatus = getStaffStatusOnDate(u.id, today);
                let badgeClass = "";
                switch (todayStatus.status) {
                  case "AVAILABLE":
                    badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                    break;
                  case "ON_SITE":
                    badgeClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                    break;
                  case "ON_LEAVE":
                    badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
                    break;
                }

                return (
                  <div key={u.id} className="p-3 rounded-xl border border-border bg-muted/30 shadow-sm flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground block truncate">{u.name}</span>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mt-0.5">{u.role}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide shrink-0", badgeClass)}>
                      {todayStatus.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-6">No crew records found.</p>
            )}
          </div>
        </div>

        {/* Calendar Workspace (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Calendar Controller Header */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">
              {monthNames[month]} {year}
            </h3>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 border border-border rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-[10px] font-bold uppercase cursor-pointer text-muted-foreground"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 border border-border rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-border rounded-2xl overflow-hidden bg-card text-card-foreground shadow-sm flex-1 flex flex-col">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="p-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r last:border-r-0 border-border">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1">
              {loading ? (
                <div className="col-span-full row-span-full flex flex-col items-center justify-center gap-3 text-muted-foreground py-32">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                  <span className="text-xs font-semibold">Generating availability grids...</span>
                </div>
              ) : (
                calendarCells.map((cell, idx) => {
                  const isToday = formatDateKey(cell.date) === formatDateKey(today);
                  
                  // Filter out staff status details for this day
                  const dayAvailabilities = staff.map((member) => {
                    const statusObj = getStaffStatusOnDate(member.id, cell.date);
                    return {
                      member,
                      ...statusObj,
                    };
                  }).filter((x) => x.status !== "AVAILABLE"); // Only show On Site and Leave in calendar cells

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(cell.date);
                        if (staff.length > 0) setSelectedUserId(staff[0].id);
                        setIsSchedulerOpen(true);
                      }}
                      className={cn(
                        "p-2.5 border-r border-b last:border-r-0 border-border flex flex-col justify-between min-h-[90px] cursor-pointer hover:bg-muted/40 transition-colors relative",
                        !cell.isCurrentMonth && "bg-muted/20 opacity-40",
                        isToday && "ring-1 ring-inset ring-cyan-500 bg-cyan-500/5"
                      )}
                    >
                      {/* Day Label */}
                      <span className={cn(
                        "text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center",
                        isToday ? "bg-cyan-500 text-white" : "text-muted-foreground"
                      )}>
                        {cell.day}
                      </span>

                      {/* Overrides / Deployments */}
                      <div className="space-y-1 mt-1.5">
                        {dayAvailabilities.slice(0, 3).map((a, aIdx) => {
                          const isLeave = a.status === "ON_LEAVE";
                          return (
                            <div 
                              key={aIdx} 
                              title={`${a.member.name}: ${a.notes}`}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-semibold truncate block max-w-full border",
                                isLeave 
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400 border-rose-500/20" 
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border-blue-500/20"
                              )}
                            >
                              {a.member.name.split(" ")[0]} ({isLeave ? "Leave" : "Site"})
                            </div>
                          );
                        })}
                        {dayAvailabilities.length > 3 && (
                          <div className="text-[7px] text-muted-foreground font-bold pl-1 uppercase">
                            + {dayAvailabilities.length - 3} more crew
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduler Modal */}
      {isSchedulerOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border max-w-md w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cyan-500" />
                <span>Override Schedule</span>
              </h3>
              <button onClick={() => setIsSchedulerOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground text-xs">
              Configure deployment status overrides for date: <strong className="font-bold font-mono text-foreground">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </p>

            <form onSubmit={handleScheduleAvailability} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Select Staff Crew</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Availability Override Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="AVAILABLE">AVAILABLE (Idle / Back to Pool)</option>
                  <option value="ON_LEAVE">ON LEAVE (Vacation / Sick / Off)</option>
                  <option value="ON_SITE">ON SITE (Direct deployment override)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">Notes & Details</label>
                <textarea
                  placeholder="e.g. Annual summer leave, medical appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSchedulerOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Override</span>
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
