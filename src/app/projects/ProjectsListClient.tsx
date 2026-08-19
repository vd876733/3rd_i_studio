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
  CheckCircle2
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

export default function ProjectsListClient({ initialProjects }: { initialProjects: ProjectData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filtering logic
  const filteredProjects = initialProjects.filter((project) => {
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
      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", colorClass)}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects by name, code, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-400"
          />
        </div>

        {/* Status Select Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-zinc-700 dark:text-zinc-300"
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
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div 
              key={project.id}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
            >
              {/* Top Row: Code and Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                    {project.projectCode}
                  </code>
                  {getStatusBadge(project.status)}
                </div>
                
                {/* Project Name */}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {project.name}
                </h3>
                
                {/* Client Metadata */}
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  Client: {project.client.name}
                </p>
              </div>

              {/* Schedule and Details */}
              <div className="mt-5 space-y-3 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
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
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>Call Time: {project.reportingTime}</span>
                  </div>
                )}
                {project.siteDetails && (
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">Site: {project.siteDetails.address}</span>
                  </div>
                )}
              </div>

              {/* Team Assignments */}
              <div className="mt-5 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 space-y-2.5">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold block">Assigned Crew</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Stylist */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-zinc-400 uppercase">Stylist</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {project.leadStylist ? project.leadStylist.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                  {/* Packer */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-zinc-400 uppercase">Packer</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {project.leadPacker ? project.leadPacker.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                  {/* Driver */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-zinc-400 uppercase">Driver</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {project.leadDriver ? project.leadDriver.name.split(" ")[0] : "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex items-center justify-end">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs transition-all duration-200 hover:gap-2 shadow-sm shadow-cyan-500/10"
                >
                  <span>Manage Production</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <Briefcase className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-700 dark:text-zinc-300">No projects found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Try modifying your search criteria or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
