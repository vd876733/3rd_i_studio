import React from "react";
import Link from "next/link";
import { PrismaClient, ProjectStatus, InventoryStatus } from "@prisma/client";
import { 
  Briefcase, 
  Package, 
  Layers, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const prisma = new PrismaClient();

// This is a Server Component, so we can fetch data directly from Prisma!
export default async function DashboardPage() {
  // 1. Gather stats from SQLite
  const totalInventory = await prisma.inventoryItem.count();
  const onShoot = await prisma.inventoryItem.count({
    where: { currentStatus: InventoryStatus.ON_SITE },
  });
  const packed = await prisma.inventoryItem.count({
    where: { currentStatus: InventoryStatus.PACKED },
  });
  const missingDamaged = await prisma.inventoryItem.count({
    where: {
      currentStatus: { in: [InventoryStatus.DAMAGED, InventoryStatus.LOST] },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todaysProjects = await prisma.project.count({
    where: {
      shootDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  const overdueReturns = await prisma.project.count({
    where: {
      shootDate: {
        lt: today,
      },
      status: {
        notIn: [ProjectStatus.COMPLETED, ProjectStatus.INQUIRY],
      },
    },
  });

  // 2. Fetch all projects to render in pipeline stages
  const projects = await prisma.project.findMany({
    include: {
      client: true,
      leadStylist: true,
    },
    orderBy: {
      shootDate: "asc",
    },
  });

  // Define Pipeline columns
  const PIPELINE_STAGES: { status: ProjectStatus; label: string; borderClass: string; textClass: string; dotClass: string }[] = [
    { status: ProjectStatus.INQUIRY, label: "Inquiry", borderClass: "border-slate-200 dark:border-zinc-800", textClass: "text-slate-600 dark:text-zinc-400", dotClass: "bg-slate-400" },
    { status: ProjectStatus.BOOKED, label: "Booked", borderClass: "border-blue-200 dark:border-blue-900/50", textClass: "text-blue-600 dark:text-blue-400", dotClass: "bg-blue-500" },
    { status: ProjectStatus.PACKING, label: "Packing", borderClass: "border-amber-200 dark:border-amber-900/50", textClass: "text-amber-600 dark:text-amber-400", dotClass: "bg-amber-500" },
    { status: ProjectStatus.DISPATCHED, label: "Dispatched", borderClass: "border-purple-200 dark:border-purple-900/50", textClass: "text-purple-600 dark:text-purple-400", dotClass: "bg-purple-500" },
    { status: ProjectStatus.ON_SITE, label: "On Site", borderClass: "border-indigo-200 dark:border-indigo-900/50", textClass: "text-indigo-600 dark:text-indigo-400", dotClass: "bg-indigo-500" },
    { status: ProjectStatus.RETURNING, label: "Returning", borderClass: "border-cyan-200 dark:border-cyan-900/50", textClass: "text-cyan-600 dark:text-cyan-400", dotClass: "bg-cyan-500" },
    { status: ProjectStatus.COMPLETED, label: "Completed", borderClass: "border-emerald-200 dark:border-emerald-900/50", textClass: "text-emerald-600 dark:text-emerald-400", dotClass: "bg-emerald-500" },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-955 dark:text-zinc-50 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-500" />
          <span>Executive Dashboard</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Operational summary, real-time logistics analytics, and active production pipelines.
        </p>
      </div>

      {/* Summary Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Inventory */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">Total Inventory</span>
            <span className="text-xl text-foreground font-bold">{totalInventory}</span>
          </div>
        </div>

        {/* On Shoot */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">On Shoot</span>
            <span className="text-xl text-foreground font-bold">{onShoot}</span>
          </div>
        </div>

        {/* Packed */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">Packed Ready</span>
            <span className="text-xl text-foreground font-bold">{packed}</span>
          </div>
        </div>

        {/* Missing/Damaged */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">Lost / Damaged</span>
            <span className="text-xl text-foreground font-bold">{missingDamaged}</span>
          </div>
        </div>

        {/* Today's Projects */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">Today's Shoots</span>
            <span className="text-xl text-foreground font-bold">{todaysProjects}</span>
          </div>
        </div>

        {/* Overdue Returns */}
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-5 space-y-3">
          <div className="p-2 w-fit rounded-lg bg-purple-50 dark:bg-purple-955/30 text-purple-600 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block text-muted-foreground font-medium">Overdue Returns</span>
            <span className="text-xl text-foreground font-bold">{overdueReturns}</span>
          </div>
        </div>
      </section>

      {/* Project Status Pipeline View */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-500" />
            <span>Active Project Pipeline</span>
          </h2>
          <Link 
            href="/projects" 
            className="text-xs font-semibold text-cyan-500 hover:text-cyan-600 inline-flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pipeline Board grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.status === stage.status);
            return (
              <div 
                key={stage.status}
                className={cn(
                  "bg-muted/40 border border-border rounded-xl flex flex-col min-h-[300px] shadow-sm p-4",
                  stage.borderClass
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", stage.dotClass)} />
                    <span className={cn("text-xs font-bold uppercase tracking-wide", stage.textClass)}>
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Column Body / Project Cards */}
                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
                  {stageProjects.length > 0 ? (
                    stageProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="p-3 rounded-xl bg-card border border-border text-card-foreground hover:border-slate-350 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 block text-left shadow-sm"
                      >
                        <span className="text-[9px] font-bold text-muted-foreground font-mono tracking-wide block mb-1">
                          {project.projectCode}
                        </span>
                        <h4 className="text-xs text-foreground font-bold leading-snug line-clamp-2">
                          {project.name}
                        </h4>
                        <div className="flex flex-col gap-1 mt-2.5 pt-2.5 border-t border-border">
                          <span className="text-[10px] text-muted-foreground truncate">
                            Client: {project.client.name.split(" ")[0]}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(project.shootDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-4 text-center border border-dashed border-border rounded-xl">
                      <span className="text-[10px] text-muted-foreground italic">No Projects</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
