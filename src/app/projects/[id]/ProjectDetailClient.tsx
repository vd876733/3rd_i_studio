"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  Info, 
  CheckSquare, 
  Square,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

// TS Interfaces
interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface ClientProfile {
  id: string;
  name: string;
  email: string | null;
  contactNumbers: string;
}

interface SiteDetailsProfile {
  address: string;
  googleMapsUrl: string | null;
  parkingNotes: string | null;
  contactNumbers: string;
}

interface ProjectDetailData {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  shootDate: string;
  reportingTime: string | null;
  client: ClientProfile;
  siteDetails: SiteDetailsProfile | null;
  leadStylist: UserProfile | null;
  leadPacker: UserProfile | null;
  leadDriver: UserProfile | null;
}

const WAREHOUSE_CHECKLIST_ITEMS = [
  { id: "wh-1", label: "Verify inventory barcode matching list" },
  { id: "wh-2", label: "Inspect item physical condition & load photos" },
  { id: "wh-3", label: "Pack transit blankets & secure tie straps" },
  { id: "wh-4", label: "Verify print of client shoot sheet & delivery receipt" },
  { id: "wh-5", label: "Check truck cargo door locks & load constraints" },
];

const SITE_CHECKLIST_ITEMS = [
  { id: "site-1", label: "Count all return inventory items against manifest" },
  { id: "site-2", label: "Conduct photo audit of shoot site rooms (for damage check)" },
  { id: "site-3", label: "Clear all packaging materials & trash from styling area" },
  { id: "site-4", label: "Verify lockup of property and return site keys" },
  { id: "site-5", label: "Obtain client sign-off on return sheet" },
];

export default function ProjectDetailClient({ project }: { project: ProjectDetailData }) {
  const [activeTab, setActiveTab] = useState<"logistics" | "checklists">("logistics");
  
  // Checklist states
  const [whChecked, setWhChecked] = useState<Record<string, boolean>>({});
  const [siteChecked, setSiteChecked] = useState<Record<string, boolean>>({});

  const toggleWhItem = (itemId: string) => {
    setWhChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleSiteItem = (itemId: string) => {
    setSiteChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Calculate percentages
  const whCount = WAREHOUSE_CHECKLIST_ITEMS.filter((item) => whChecked[item.id]).length;
  const whPercent = Math.round((whCount / WAREHOUSE_CHECKLIST_ITEMS.length) * 100);

  const siteCount = SITE_CHECKLIST_ITEMS.filter((item) => siteChecked[item.id]).length;
  const sitePercent = Math.round((siteCount / SITE_CHECKLIST_ITEMS.length) * 100);

  const getStatusBadge = (status: string) => {
    let colorClass = "";
    switch (status) {
      case "INQUIRY":
        colorClass = "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-300 border-slate-200/50 dark:border-slate-800/50";
        break;
      case "BOOKED":
        colorClass = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
        break;
      case "PACKING":
        colorClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
        break;
      case "DISPATCHED":
        colorClass = "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30";
        break;
      case "ON_SITE":
        colorClass = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30";
        break;
      case "RETURNING":
        colorClass = "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30";
        break;
      case "COMPLETED":
        colorClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
        break;
    }
    return (
      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", colorClass)}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Back to list and Header */}
      <div className="space-y-4">
        <Link 
          href="/projects" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                {project.projectCode}
              </code>
              {getStatusBadge(project.status)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {project.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex gap-6">
        <button
          onClick={() => setActiveTab("logistics")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-all duration-200 px-1",
            activeTab === "logistics"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          Site & Logistics Details
        </button>
        <button
          onClick={() => setActiveTab("checklists")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-all duration-200 px-1",
            activeTab === "checklists"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          Operational Checklists
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "logistics" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Shoot Site Address & Map */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-cyan-500" />
                <span>Shoot Site Location</span>
              </h3>
              
              {project.siteDetails ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {project.siteDetails.address}
                    </p>
                  </div>
                  
                  {project.siteDetails.googleMapsUrl && (
                    <a
                      href={project.siteDetails.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-600 font-semibold border border-cyan-500/20 px-3.5 py-2 rounded-xl hover:bg-cyan-500/5 transition-colors"
                    >
                      <span>Get Driving Directions (Google Maps)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No shoot site details configured for this project.</p>
              )}
            </div>

            {/* Client Contact Info */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Phone className="w-4.5 h-4.5 text-cyan-500" />
                <span>Client Contact Metadata</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Company Name</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">{project.client.name}</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Contact Number</span>
                  <span className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">{project.client.contactNumbers}</span>
                </div>
              </div>
            </div>

            {/* Parking and Site Access Notes */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-cyan-500" />
                <span>Parking & Logistics Instructions</span>
              </h3>
              {project.siteDetails?.parkingNotes ? (
                <div className="p-4 rounded-xl bg-amber-500/5 text-amber-800 dark:text-amber-400 border border-amber-500/10 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <p className="text-xs leading-relaxed font-medium">
                    {project.siteDetails.parkingNotes}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No custom parking guidelines specified.</p>
              )}
            </div>
          </div>

          {/* Right Sidebar: Crew Assignments */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Team Assignments</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Crew leads assigned to this shoot.</p>
              </div>

              <div className="space-y-4">
                {/* Stylist */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-100 dark:border-pink-900/30">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Lead Stylist</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                      {project.leadStylist ? project.leadStylist.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Packer */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Lead Packer</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                      {project.leadPacker ? project.leadPacker.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/30">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Lead Driver</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                      {project.leadDriver ? project.leadDriver.name : "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shoot Time Slot Details */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Shoot Schedule</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Date</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {new Date(project.shootDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Reporting Call Time</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {project.reportingTime || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Warehouse Checklist Card */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-500" />
                  <span>Before Leaving Warehouse</span>
                </h3>
                <span className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                  {whPercent}% Done
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${whPercent}%` }}
                />
              </div>

              {/* Checklist list */}
              <div className="space-y-3 mt-4">
                {WAREHOUSE_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = !!whChecked[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleWhItem(item.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-150",
                        isChecked
                          ? "border-amber-500/20 bg-amber-500/[0.02] text-zinc-800 dark:text-zinc-200"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-zinc-500"
                      )}
                    >
                      <div className="shrink-0 mt-0.5 text-amber-500">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </div>
                      <span className={cn("text-xs font-medium leading-relaxed", isChecked ? "line-through opacity-70" : "")}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {whPercent === 100 && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 text-center text-xs font-semibold">
                Warehouse checkout audit fully verified!
              </div>
            )}
          </div>

          {/* On-Site Return Checklist Card */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                  <span>Before Leaving Site (Return)</span>
                </h3>
                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                  {sitePercent}% Done
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${sitePercent}%` }}
                />
              </div>

              {/* Checklist list */}
              <div className="space-y-3 mt-4">
                {SITE_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = !!siteChecked[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSiteItem(item.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-150",
                        isChecked
                          ? "border-indigo-500/20 bg-indigo-500/[0.02] text-zinc-800 dark:text-zinc-200"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-zinc-500"
                      )}
                    >
                      <div className="shrink-0 mt-0.5 text-indigo-500">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </div>
                      <span className={cn("text-xs font-medium leading-relaxed", isChecked ? "line-through opacity-70" : "")}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {sitePercent === 100 && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 text-center text-xs font-semibold">
                Site return audit fully verified!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
