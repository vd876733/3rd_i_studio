import React from "react";
import { PrismaClient } from "@prisma/client";
import ProjectsListClient from "./ProjectsListClient";
import { Briefcase } from "lucide-react";

const prisma = new PrismaClient();

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      client: true,
      leadStylist: true,
      leadPacker: true,
      leadDriver: true,
      siteDetails: true,
    },
    orderBy: {
      shootDate: "asc",
    },
  });

  // Safe mapping of Date objects to ISO strings for Client Component boundary
  const formattedProjects = projects.map((p) => ({
    id: p.id,
    projectCode: p.projectCode,
    name: p.name,
    status: p.status,
    shootDate: p.shootDate.toISOString(),
    reportingTime: p.reportingTime,
    client: {
      id: p.client.id,
      name: p.client.name,
      contactNumbers: p.client.contactNumbers,
    },
    leadStylist: p.leadStylist ? { id: p.leadStylist.id, name: p.leadStylist.name, role: p.leadStylist.role } : null,
    leadPacker: p.leadPacker ? { id: p.leadPacker.id, name: p.leadPacker.name, role: p.leadPacker.role } : null,
    leadDriver: p.leadDriver ? { id: p.leadDriver.id, name: p.leadDriver.name, role: p.leadDriver.role } : null,
    siteDetails: p.siteDetails ? { address: p.siteDetails.address } : null,
  }));

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-cyan-500" />
          <span>Project Management</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Monitor schedules, checklist logs, site maps, and crew assignments for shoot productions.
        </p>
      </div>

      <ProjectsListClient initialProjects={formattedProjects} />
    </div>
  );
}
