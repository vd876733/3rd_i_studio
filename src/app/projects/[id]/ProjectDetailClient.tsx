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
  AlertCircle,
  Edit,
  X,
  RefreshCw,
  Save
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
  warehouseChecklist?: any;
  siteChecklist?: any;
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
  project: initialProject,
  availableItemsForPacking: initialAvailableItemsForPacking,
  availableItemsForMoodboard: initialAvailableItemsForMoodboard,
  auditLogs: initialAuditLogs,
  clients = [],
  staff = [],
}: {
  project: ProjectDetailData;
  availableItemsForPacking: any[];
  availableItemsForMoodboard: any[];
  auditLogs: any[];
  clients?: any[];
  staff?: any[];
}) {
  const [project, setProject] = useState<ProjectDetailData>(initialProject);
  const [auditLogs, setAuditLogs] = useState<any[]>(initialAuditLogs);
  const [availableItemsForMoodboard, setAvailableItemsForMoodboard] = useState<any[]>(initialAvailableItemsForMoodboard);
  const [availableItemsForPacking, setAvailableItemsForPacking] = useState<any[]>(initialAvailableItemsForPacking);
  const [activeTab, setActiveTab] = useState<
    "site-info" | "packing" | "moodboard" | "checklists" | "audit-history"
  >("site-info");

  const handleAddAuditLog = (action: string, newValue: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      entityType: "InventoryItem",
      newValue,
      oldValue: null,
      createdAt: new Date().toISOString(),
      user: { id: "current-user", name: "Admin User", role: "ADMIN", email: "admin@stylingos.com" }
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Checklist states
  const [whChecked, setWhChecked] = useState<Record<string, boolean>>(
    project.warehouseChecklist ? (project.warehouseChecklist as Record<string, boolean>) : {}
  );
  const [siteChecked, setSiteChecked] = useState<Record<string, boolean>>(
    project.siteChecklist ? (project.siteChecklist as Record<string, boolean>) : {}
  );
  const [isMounted, setIsMounted] = useState(false);

  // Edit project state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [clientId, setClientId] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [reportingTime, setReportingTime] = useState("");
  const [status, setStatus] = useState("INQUIRY");
  const [leadStylistId, setLeadStylistId] = useState("");
  const [leadPackerId, setLeadPackerId] = useState("");
  const [leadDriverId, setLeadDriverId] = useState("");

  // Sync checklist states when project details update
  useEffect(() => {
    setIsMounted(true);
    if (project.warehouseChecklist) {
      setWhChecked(project.warehouseChecklist as Record<string, boolean>);
    } else {
      setWhChecked({});
    }
    if (project.siteChecklist) {
      setSiteChecked(project.siteChecklist as Record<string, boolean>);
    } else {
      setSiteChecked({});
    }
  }, [project.id, project.warehouseChecklist, project.siteChecklist]);

  const toggleWhItem = async (itemId: string) => {
    const updated = { ...whChecked, [itemId]: !whChecked[itemId] };
    setWhChecked(updated);
    
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseChecklist: updated }),
      });
      if (!res.ok) throw new Error("Failed to save checklist state");
      
      setProject((prev) => ({
        ...prev,
        warehouseChecklist: updated,
      }));
    } catch (err) {
      console.error("Error saving warehouse checklist:", err);
    }
  };

  const toggleSiteItem = async (itemId: string) => {
    const updated = { ...siteChecked, [itemId]: !siteChecked[itemId] };
    setSiteChecked(updated);
    
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteChecklist: updated }),
      });
      if (!res.ok) throw new Error("Failed to save checklist state");
      
      setProject((prev) => ({
        ...prev,
        siteChecklist: updated,
      }));
    } catch (err) {
      console.error("Error saving site checklist:", err);
    }
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
      case "PROJECT_UPDATED":
        return "bg-cyan-500 text-white dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-500/20";
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

  const stylistsList = staff.filter((s) => s.role === "STYLIST");
  const packersList = staff.filter((s) => s.role === "PACKER");
  const driversList = staff.filter((s) => s.role === "DRIVER");

  const handleOpenEdit = () => {
    setName(project.name);
    setProjectCode(project.projectCode);
    setClientId(project.client.id);
    
    const dateObj = new Date(project.shootDate);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    setShootDate(`${yyyy}-${mm}-${dd}`);

    setReportingTime(project.reportingTime || "");
    setStatus(project.status);
    setLeadStylistId(project.leadStylist?.id || "");
    setLeadPackerId(project.leadPacker?.id || "");
    setLeadDriverId(project.leadDriver?.id || "");
    setIsEditOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          projectCode: projectCode.toUpperCase().replace(/\s/g, ""),
          clientId,
          shootDate,
          reportingTime: reportingTime || null,
          status,
          leadStylistId: leadStylistId || null,
          leadPackerId: leadPackerId || null,
          leadDriverId: leadDriverId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");

      const clientObj = clients.find(c => c.id === clientId);
      const stylistObj = staff.find(s => s.id === leadStylistId);
      const packerObj = staff.find(s => s.id === leadPackerId);
      const driverObj = staff.find(s => s.id === leadDriverId);

      const updatedProject: ProjectDetailData = {
        ...project,
        ...data.project,
        client: clientObj ? { id: clientObj.id, name: clientObj.name, email: project.client.email, contactNumbers: project.client.contactNumbers } : project.client,
        leadStylist: stylistObj ? { id: stylistObj.id, name: stylistObj.name, role: stylistObj.role, email: stylistObj.email || "" } : null,
        leadPacker: packerObj ? { id: packerObj.id, name: packerObj.name, role: packerObj.role, email: packerObj.email || "" } : null,
        leadDriver: driverObj ? { id: driverObj.id, name: driverObj.name, role: driverObj.role, email: driverObj.email || "" } : null,
      };

      setProject(updatedProject);

      // Prepend local audit log
      const newLog = {
        id: `log-${Date.now()}`,
        action: "PROJECT_UPDATED",
        entityType: "Project",
        newValue: `Updated details for project '${name}' (${projectCode}) via details dashboard`,
        oldValue: null,
        createdAt: new Date().toISOString(),
        user: { id: "current-user", name: "Admin User", role: "ADMIN", email: "admin@stylingos.com" }
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to update project");
    } finally {
      setActionLoading(false);
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
              <code className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-955 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                {project.projectCode}
              </code>
              {getStatusBadge(project.status)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {project.name}
            </h1>
          </div>

          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-bold text-xs cursor-pointer transition-all"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-500" />
            <span>Edit Project Details</span>
          </button>
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
              {/* Project Quick Overview */}
              <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <MapPin className="w-4.5 h-4.5 text-cyan-500" />
                    <span>Shoot Site Location</span>
                  </h3>
                </div>

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
                      
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-800/85">
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
                  <div className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-cyan-100 dark:bg-cyan-955/40 text-cyan-700 dark:text-cyan-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Client Partner
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-3">
                      {project.client.name}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
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
                  <div className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-cyan-100 dark:bg-cyan-955/40 text-cyan-700 dark:text-cyan-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Lead Stylist
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-3">
                      {project.leadStylist?.name || "Unassigned"}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                      {project.leadStylist?.email && (
                        <a href={`mailto:${project.leadStylist.email}`} className="flex items-center gap-2 hover:text-cyan-500 transition-colors">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{project.leadStylist.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 3. Site Supervisor Card */}
                  <div className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded uppercase tracking-wider block w-max font-bold">
                      Site Supervisor
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-3">
                      {project.siteDetails?.siteSupervisorName || "Not Configured"}
                    </h4>
                    <div className="mt-4 space-y-2.5 text-xs text-muted-foreground">
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
                        <div className="flex items-center gap-2 text-zinc-455 italic font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-455" />
                          <span>No phone configured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Photographer Card */}
                  <div className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
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
              <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
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
                  <div className="p-4 rounded-xl bg-muted border border-border text-center">
                    <p className="text-xs text-muted-foreground italic">No customized site access rules configured.</p>
                  </div>
                )}
              </div>

              {/* Time Slots Details */}
              <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Production Schedule</span>
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Shoot Date</span>
                    <span className="font-bold text-foreground">
                      {new Date(project.shootDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Call Time</span>
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
              onProjectChange={setProject}
              onAuditLogCreated={handleAddAuditLog}
              onAvailableItemsChange={setAvailableItemsForPacking}
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
              onAuditLogCreated={handleAddAuditLog}
              onAvailableItemsChange={setAvailableItemsForMoodboard}
            />
          </div>
        )}

        {/* CHECKLISTS TAB */}
        {activeTab === "checklists" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Warehouse Checklist Card */}
            <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-500" />
                    <span>Before Leaving Warehouse</span>
                  </h3>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded font-mono">
                    {whPercent}% Done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${whPercent}%` }}
                  />
                </div>

                {/* List Items */}
                <div className="space-y-3 pt-2">
                  {WAREHOUSE_CHECKLIST_ITEMS.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => toggleWhItem(item.id)}
                      className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                    >
                      <button className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-750 dark:text-zinc-600 dark:hover:text-zinc-400">
                        {whChecked[item.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700" />
                        )}
                      </button>
                      <span className={cn(whChecked[item.id] && "line-through text-zinc-400 dark:text-zinc-650")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Site Wrap Checklist Card */}
            <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                    <span>Site Wrapping & Returns</span>
                  </h3>
                  <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded font-mono">
                    {sitePercent}% Done
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${sitePercent}%` }}
                  />
                </div>

                {/* List Items */}
                <div className="space-y-3 pt-2">
                  {SITE_CHECKLIST_ITEMS.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => toggleSiteItem(item.id)}
                      className="flex items-start gap-3 text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                    >
                      <button className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-750 dark:text-zinc-600 dark:hover:text-zinc-400">
                        {siteChecked[item.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700" />
                        )}
                      </button>
                      <span className={cn(siteChecked[item.id] && "line-through text-zinc-400 dark:text-zinc-650")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG HISTORY TAB */}
        {activeTab === "audit-history" && (
          <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-500" />
                <span>Project Change Log Audit</span>
              </h3>
              <span className="text-[10px] font-bold bg-zinc-105 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2.5 py-0.5 rounded font-mono">
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

      {/* Edit Modal (Crew Assignments) */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Edit className="w-5 h-5 text-cyan-500" />
                <span>Edit Project details</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Project Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Project Code</label>
                  <input
                    type="text"
                    required
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Client Partner</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Production Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="INQUIRY">INQUIRY</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="PACKING">PACKING</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="ON_SITE">ON SITE</option>
                    <option value="RETURNING">RETURNING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Shoot Date</label>
                  <input
                    type="date"
                    required
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Reporting Time (Call Time)</label>
                  <input
                    type="text"
                    value={reportingTime}
                    onChange={(e) => setReportingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Crew assignments */}
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Assign Production Crew</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground block uppercase">Lead Stylist</label>
                    <select
                      value={leadStylistId}
                      onChange={(e) => setLeadStylistId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background text-foreground border border-border rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {stylistsList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground block uppercase">Lead Packer</label>
                    <select
                      value={leadPackerId}
                      onChange={(e) => setLeadPackerId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background text-foreground border border-border rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {packersList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground block uppercase">Lead Driver</label>
                    <select
                      value={leadDriverId}
                      onChange={(e) => setLeadDriverId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background text-foreground border border-border rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {driversList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

