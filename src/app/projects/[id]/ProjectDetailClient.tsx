"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  Package,
  History,
  Mail,
  UserCheck,
  Navigation,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import PackingClient from "./packing/PackingClient";
import MoodBoardClient from "./moodboard/MoodBoardClient";

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
  landmark: string | null;
  siteSupervisorName: string | null;
  siteSupervisorEmail: string | null;
  siteSupervisorPhone: string | null;
  photographerName: string | null;
  photographerEmail: string | null;
  photographerPhone: string | null;
}

interface ProjectDetailData {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  shootDate: string;
  reportingTime: string | null;
  moodBoardState: any;
  client: ClientProfile;
  siteDetails: SiteDetailsProfile | null;
  leadStylist: UserProfile | null;
  leadPacker: UserProfile | null;
  leadDriver: UserProfile | null;
  boxes: any[];
  packedItems: any[];
}

const WAREHOUSE_CHECKLIST_ITEMS = [
  { id: "wh-1", label: "All boxes packed" },
  { id: "wh-2", label: "Fragile items secured" },
  { id: "wh-3", label: "Verify inventory barcode matching list" },
  { id: "wh-4", label: "Inspect item physical condition & load photos" },
  { id: "wh-5", label: "Verify print of client shoot sheet & delivery receipt" },
];

const SITE_CHECKLIST_ITEMS = [
  { id: "site-1", label: "Styling approved" },
  { id: "site-2", label: "Waste removed" },
  { id: "site-3", label: "Count all return inventory items against manifest" },
  { id: "site-4", label: "Conduct photo audit of shoot site rooms (for damage check)" },
  { id: "site-5", label: "Verify lockup of property and return site keys" },
];

export default function ProjectDetailClient({
  project,
  availableItemsForPacking,
  availableItemsForMoodboard,
  auditLogs,
}: {
  project: ProjectDetailData;
  availableItemsForPacking: any[];
  availableItemsForMoodboard: any[];
  auditLogs: any[];
}) {
  const [activeTab, setActiveTab] = useState<
    "site-info" | "packing" | "moodboard" | "checklists" | "audit-history"
  >("site-info");

  // Checklist states
  const [whChecked, setWhChecked] = useState<Record<string, boolean>>({});
  const [siteChecked, setSiteChecked] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Restore checklist state from localStorage on client-side mount
  useEffect(() => {
    setIsMounted(true);
    const storedWh = localStorage.getItem(`chk_wh_${project.id}`);
    const storedSite = localStorage.getItem(`chk_site_${project.id}`);
    if (storedWh) {
      try {
        setWhChecked(JSON.parse(storedWh));
      } catch (e) {
        console.error(e);
      }
    }
    if (storedSite) {
      try {
        setSiteChecked(JSON.parse(storedSite));
      } catch (e) {
        console.error(e);
      }
    }
  }, [project.id]);

  const toggleWhItem = (itemId: string) => {
    const updated = { ...whChecked, [itemId]: !whChecked[itemId] };
    setWhChecked(updated);
    localStorage.setItem(`chk_wh_${project.id}`, JSON.stringify(updated));
  };

  const toggleSiteItem = (itemId: string) => {
    const updated = { ...siteChecked, [itemId]: !siteChecked[itemId] };
    setSiteChecked(updated);
    localStorage.setItem(`chk_site_${project.id}`, JSON.stringify(updated));
  };

  // Calculate percentages
  const whCount = WAREHOUSE_CHECKLIST_ITEMS.filter((item) => whChecked[item.id]).length;
  const whPercent = Math.round((whCount / WAREHOUSE_CHECKLIST_ITEMS.length) * 100) || 0;

  const siteCount = SITE_CHECKLIST_ITEMS.filter((item) => siteChecked[item.id]).length;
  const sitePercent = Math.round((siteCount / SITE_CHECKLIST_ITEMS.length) * 100) || 0;

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
      default:
        colorClass = "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
    return (
      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider", colorClass)}>
        {status}
      </span>
    );
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "INITIAL_DATABASE_SEED":
        return "bg-slate-500 text-white dark:bg-slate-800 dark:text-slate-300 border-slate-500/20";
      case "PROJECT_CREATED":
        return "bg-green-500 text-white dark:bg-green-950/40 dark:text-green-400 border-green-500/20";
      case "RESERVED":
        return "bg-cyan-500 text-white dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-500/20";
      case "PACKED":
        return "bg-amber-500 text-white dark:bg-amber-950/40 dark:text-amber-400 border-amber-500/20";
      case "RELEASED":
        return "bg-rose-500 text-white dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500 text-white dark:bg-zinc-800";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
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

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 md:gap-6">
        {[
          { id: "site-info", label: "Site Info & Contacts", icon: MapPin },
          { id: "packing", label: "Packing & Boxes", icon: Package },
          { id: "moodboard", label: "Mood Board", icon: Sparkles },
          { id: "checklists", label: "Checklists", icon: ClipboardCheck },
          { id: "audit-history", label: "Audit History", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-semibold border-b-2 transition-all duration-200 px-1 flex items-center gap-1.5 cursor-pointer relative",
                isActive
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* SITE INFO & CONTACTS TAB */}
        {activeTab === "site-info" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left Col: Location, Schedule & Parking notes */}
            <div className="md:col-span-2 space-y-6">
              {/* Site Details Card */}
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-5">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Shoot Site Location</span>
                </h3>

                {project.siteDetails ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/85">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Complete Address</span>
                      <p className="text-sm font-semibold text-zinc-805 dark:text-zinc-200 mt-1">
                        {project.siteDetails.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.siteDetails.landmark && (
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/85">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Site Landmark</span>
                          <p className="text-xs font-semibold text-zinc-805 dark:text-zinc-200 mt-1">
                            {project.siteDetails.landmark}
                          </p>
                        </div>
                      )}
                      
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/85">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Call Time (Reporting)</span>
                        <p className="text-xs font-mono font-bold text-zinc-805 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>{project.reportingTime || "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    {project.siteDetails.googleMapsUrl && (
                      <div className="pt-2">
                        <a
                          href={project.siteDetails.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl transition-all duration-205 shadow-md shadow-cyan-500/10 hover:shadow-cyan-600/20 active:scale-[0.98]"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Navigate via Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-xl text-center">
                    <p className="text-xs text-zinc-505 italic">No location coordinates configured for this project.</p>
                  </div>
                )}
              </div>

              {/* Contacts Grid */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Production Contacts & Cards</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Client Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Client Partner
                    </span>
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-3">
                      {project.client.name}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400">
                      {project.client.email && (
                        <a href={`mailto:${project.client.email}`} className="flex items-center gap-2 hover:text-cyan-500 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{project.client.email}</span>
                        </a>
                      )}
                      <a href={`tel:${project.client.contactNumbers}`} className="flex items-center gap-2 hover:text-cyan-500 transition-colors font-mono">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>{project.client.contactNumbers}</span>
                      </a>
                    </div>
                  </div>

                  {/* 2. Stylist Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Stylist
                    </span>
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-3">
                      {project.leadStylist ? project.leadStylist.name : "Unassigned"}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400">
                      {project.leadStylist?.email ? (
                        <a href={`mailto:${project.leadStylist.email}`} className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{project.leadStylist.email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-450 italic">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No email provided</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-mono text-zinc-500">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span>Direct Team Line</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Site Supervisor Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold font-mono">
                      Site Supervisor
                    </span>
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-3">
                      {project.siteDetails?.siteSupervisorName || "Not Configured"}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400">
                      {project.siteDetails?.siteSupervisorEmail ? (
                        <a href={`mailto:${project.siteDetails.siteSupervisorEmail}`} className="flex items-center gap-2 hover:text-amber-500 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{project.siteDetails.siteSupervisorEmail}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-450 italic">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No email configured</span>
                        </div>
                      )}
                      {project.siteDetails?.siteSupervisorPhone ? (
                        <a href={`tel:${project.siteDetails.siteSupervisorPhone}`} className="flex items-center gap-2 hover:text-amber-500 transition-colors font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span>{project.siteDetails.siteSupervisorPhone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-450 italic font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No phone configured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Photographer Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Photographer
                    </span>
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-3">
                      {project.siteDetails?.photographerName || "Not Configured"}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400">
                      {project.siteDetails?.photographerEmail ? (
                        <a href={`mailto:${project.siteDetails.photographerEmail}`} className="flex items-center gap-2 hover:text-indigo-500 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{project.siteDetails.photographerEmail}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-450 italic">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No email configured</span>
                        </div>
                      )}
                      {project.siteDetails?.photographerPhone ? (
                        <a href={`tel:${project.siteDetails.photographerPhone}`} className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span>{project.siteDetails.photographerPhone}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-450 italic font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No phone configured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Logistics Instructions & Schedule Details */}
            <div className="space-y-6">
              {/* Parking Rules & Logistics */}
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Parking Rules & Site Access</span>
                </h3>
                {project.siteDetails?.parkingNotes ? (
                  <div className="p-4 rounded-xl bg-amber-550/5 text-amber-800 dark:text-amber-400 border border-amber-500/10 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                    <p className="text-xs leading-relaxed font-medium">
                      {project.siteDetails.parkingNotes}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 text-center">
                    <p className="text-xs text-zinc-500 italic">No customized site access rules configured.</p>
                  </div>
                )}
              </div>

              {/* Time Slots Details */}
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Production Schedule</span>
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Shoot Date</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-150">
                      {new Date(project.shootDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Call Time</span>
                    <span className="font-mono font-bold text-cyan-500">
                      {project.reportingTime || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PACKING & BOXES TAB */}
        {activeTab === "packing" && (
          <div className="animate-fadeIn">
            <PackingClient
              project={project}
              availableItems={availableItemsForPacking}
              embedded={true}
            />
          </div>
        )}

        {/* MOOD BOARD TAB */}
        {activeTab === "moodboard" && (
          <div className="animate-fadeIn">
            <MoodBoardClient
              project={project}
              availableItems={availableItemsForMoodboard}
              embedded={true}
            />
          </div>
        )}

        {/* CHECKLISTS TAB */}
        {activeTab === "checklists" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Warehouse Checklist Card */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-500" />
                    <span>Before Leaving Warehouse</span>
                  </h3>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded font-mono">
                    {whPercent}% Done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-805 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${whPercent}%` }}
                  />
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5 mt-4">
                  {WAREHOUSE_CHECKLIST_ITEMS.map((item) => {
                    const isChecked = !!whChecked[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleWhItem(item.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-150 cursor-pointer",
                          isChecked
                            ? "border-amber-500/20 bg-amber-500/[0.02] text-zinc-800 dark:text-zinc-200"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-zinc-550"
                        )}
                      >
                        <div className="shrink-0 mt-0.5 text-amber-500">
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>
                        <span className={cn("text-xs font-medium leading-relaxed", isChecked ? "line-through opacity-50" : "")}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {isMounted && whPercent === 100 && (
                <div className="mt-5 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Warehouse check fully cleared!</span>
                </div>
              )}
            </div>

            {/* On-Site Checklist Card */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                    <span>Before Leaving Site</span>
                  </h3>
                  <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded font-mono">
                    {sitePercent}% Done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-805 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${sitePercent}%` }}
                  />
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5 mt-4">
                  {SITE_CHECKLIST_ITEMS.map((item) => {
                    const isChecked = !!siteChecked[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleSiteItem(item.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-150 cursor-pointer",
                          isChecked
                            ? "border-indigo-500/20 bg-indigo-500/[0.02] text-zinc-800 dark:text-zinc-200"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 text-zinc-550"
                        )}
                      >
                        <div className="shrink-0 mt-0.5 text-indigo-500">
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>
                        <span className={cn("text-xs font-medium leading-relaxed", isChecked ? "line-through opacity-50" : "")}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isMounted && sitePercent === 100 && (
                <div className="mt-5 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Site return clearance fully secured!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIT HISTORY TAB */}
        {activeTab === "audit-history" && (
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Project Audit Logs</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Chronological database modifications and team actions.</p>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 rounded font-mono">
                {auditLogs.length} entries
              </span>
            </div>

            {auditLogs.length > 0 ? (
              <div className="relative border-l border-zinc-205 dark:border-zinc-800 pl-5 ml-2.5 space-y-6 py-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Point Dot */}
                    <div className={cn(
                      "absolute -left-[27.5px] top-1.5 w-3.5 h-3.5 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center text-[8px]",
                      getActionColor(log.action)
                    )} />

                    {/* Timeline Entry Card */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded font-mono font-bold uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold font-mono">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {log.newValue}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 pt-0.5">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span className="font-semibold">{log.user.name}</span>
                        <span className="text-zinc-400">({log.user.role})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl bg-zinc-50/20">
                <AlertCircle className="w-8 h-8 text-zinc-305 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-505 dark:text-zinc-450 italic">No audit trail recorded for this project.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
