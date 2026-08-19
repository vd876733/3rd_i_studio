import React from "react";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ProjectDetailClient from "./ProjectDetailClient";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      siteDetails: true,
      leadStylist: true,
      leadPacker: true,
      leadDriver: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Safe mapping of Date objects to ISO strings for Client Component boundary
  const formattedProject = {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    shootDate: project.shootDate.toISOString(),
    reportingTime: project.reportingTime,
    client: {
      id: project.client.id,
      name: project.client.name,
      email: project.client.email,
      contactNumbers: project.client.contactNumbers,
    },
    siteDetails: project.siteDetails ? {
      address: project.siteDetails.address,
      googleMapsUrl: project.siteDetails.googleMapsUrl,
      parkingNotes: project.siteDetails.parkingNotes,
      contactNumbers: project.siteDetails.contactNumbers,
    } : null,
    leadStylist: project.leadStylist ? {
      id: project.leadStylist.id,
      name: project.leadStylist.name,
      role: project.leadStylist.role,
      email: project.leadStylist.email,
    } : null,
    leadPacker: project.leadPacker ? {
      id: project.leadPacker.id,
      name: project.leadPacker.name,
      role: project.leadPacker.role,
      email: project.leadPacker.email,
    } : null,
    leadDriver: project.leadDriver ? {
      id: project.leadDriver.id,
      name: project.leadDriver.name,
      role: project.leadDriver.role,
      email: project.leadDriver.email,
    } : null,
  };

  return <ProjectDetailClient project={formattedProject} />;
}
