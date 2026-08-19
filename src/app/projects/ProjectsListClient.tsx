"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight, 
  Filter, 
  CheckCircle2,
  Edit,
  Plus,
  X,
  RefreshCw,
  AlertTriangle,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript Interfaces for props
interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface ClientProfile {
  id: string;
  name: string;
  contactNumbers: string;
}

interface ProjectData {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  shootDate: string;
  reportingTime: string | null;
  client: ClientProfile;
  leadStylist: UserProfile | null;
  leadPacker: UserProfile | null;
  leadDriver: UserProfile | null;
  siteDetails: {
    address: string;
  } | null;
}

interface ClientSelect {
  id: string;
  name: string;
}

interface StaffSelect {
  id: string;
  name: string;
  role: string;
}

export default function ProjectsListClient({ 
  initialProjects,
  clients = [],
  staff = []
}: { 
  initialProjects: ProjectData[];
  clients?: ClientSelect[];
  staff?: StaffSelect[];
}) {
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

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

  // Filtering logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider", colorClass)}>
        {status}
      </span>
    );
  };

  const stylistsList = staff.filter((s) => s.role === "STYLIST");
  const packersList = staff.filter((s) => s.role === "PACKER");
  const driversList = staff.filter((s) => s.role === "DRIVER");

  // Handlers for modals
  const handleOpenCreate = () => {
    setName("");
    // Generate a default project code: PROJ-RANDOM
    setProjectCode(`PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
    setClientId(clients.length > 0 ? clients[0].id : "");
    setShootDate("");
    setReportingTime("");
    setStatus("INQUIRY");
    setLeadStylistId("");
    setLeadPackerId("");
    setLeadDriverId("");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (project: ProjectData) => {
    setSelectedProject(project);
    setName(project.name);
    setProjectCode(project.projectCode);
    setClientId(project.client.id);
    
    // Format shootDate: YYYY-MM-DD
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !projectCode || !clientId || !shootDate) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
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
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      // Reload lists or manually append
      // Fetch full list again from backend or assemble mock return
      const clientObj = clients.find(c => c.id === clientId);
      const stylistObj = staff.find(s => s.id === leadStylistId);
      const packerObj = staff.find(s => s.id === leadPackerId);
      const driverObj = staff.find(s => s.id === leadDriverId);

      const newProject: ProjectData = {
        ...data.project,
        client: clientObj ? { id: clientObj.id, name: clientObj.name, contactNumbers: "" } : { id: "", name: "", contactNumbers: "" },
        leadStylist: stylistObj ? { id: stylistObj.id, name: stylistObj.name, role: stylistObj.role } : null,
        leadPacker: packerObj ? { id: packerObj.id, name: packerObj.name, role: packerObj.role } : null,
        leadDriver: driverObj ? { id: driverObj.id, name: driverObj.name, role: driverObj.role } : null,
        siteDetails: null
      };

      setProjects((prev) => [...prev, newProject].sort((a,b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime()));
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
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

      setProjects((prev) => 
        prev.map((p) => 
          p.id === selectedProject.id 
            ? {
                ...p,
                ...data.project,
                client: clientObj ? { id: clientObj.id, name: clientObj.name, contactNumbers: p.client.contactNumbers } : p.client,
                leadStylist: stylistObj ? { id: stylistObj.id, name: stylistObj.name, role: stylistObj.role } : null,
                leadPacker: packerObj ? { id: packerObj.id, name: packerObj.name, role: packerObj.role } : null,
                leadDriver: driverObj ? { id: driverObj.id, name: driverObj.name, role: driverObj.role } : null,
              }
            : p
        )
      );
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to update project");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
          <input
            type="text"
            placeholder="Search projects by name, code, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-400"
          />
        </div>

        {/* Status Select Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-foreground"
            >
              <option value="ALL">All Stages</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="BOOKED">Booked</option>
              <option value="PACKING">Packing</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="ON_SITE">On Site</option>
              <option value="RETURNING">Returning</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div 
              key={project.id}
              className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm flex flex-col justify-between hover:shadow-md hover:border-border transition-all duration-200"
            >
              {/* Top Row: Code and Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    {project.projectCode}
                  </code>
                  {getStatusBadge(project.status)}
                </div>
                
                {/* Project Name */}
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {project.name}
                </h3>
                
                {/* Client Metadata */}
                <p className="text-sm text-muted-foreground font-medium">
                  Client: {project.client.name}
                </p>
              </div>

              {/* Schedule and Details */}
              <div className="mt-5 space-y-3 pt-5 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>
                    Shoot Date: {new Date(project.shootDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                </div>
                {project.reportingTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>Call Time: {project.reportingTime}</span>
                  </div>
                )}
                {project.siteDetails && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">Site: {project.siteDetails.address}</span>
                  </div>
                )}
              </div>

              {/* Team Assignments */}
              <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">Assigned Crew</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Stylist */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase">Stylist</span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {project.leadStylist ? project.leadStylist.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                  {/* Packer */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase">Packer</span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {project.leadPacker ? project.leadPacker.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                  {/* Driver */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase">Driver</span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {project.leadDriver ? project.leadDriver.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => handleOpenEdit(project)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-muted-foreground hover:bg-muted font-bold text-xs cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Edit Details</span>
                </button>

                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-all duration-200 hover:gap-2 shadow-sm shadow-cyan-500/10 cursor-pointer"
                >
                  <span>Manage Production</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-3xl bg-card text-card-foreground">
            <Briefcase className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="font-bold text-foreground">No projects found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try modifying your search criteria or status filter.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-500" />
                <span>Create Production Project</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vogue Summer Cover"
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
                    placeholder="e.g. PRJ-9901"
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
                    placeholder="e.g. 08:30 AM"
                    value={reportingTime}
                    onChange={(e) => setReportingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Crew dropdowns */}
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
                  onClick={() => setIsCreateOpen(false)}
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
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Edit className="w-5 h-5 text-cyan-500" />
                <span>Modify Project Details</span>
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

              {/* Crew dropdowns */}
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
                  <span>Save Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
