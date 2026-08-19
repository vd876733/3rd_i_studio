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
      boxes: true,
      packedItems: {
        include: {
          inventoryItem: true,
          box: true,
        },
        orderBy: {
          scannedAt: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Load available/reserved items for the packing picker
  const availableItemsForPacking = await prisma.inventoryItem.findMany({
    where: {
      currentStatus: {
        in: ["AVAILABLE", "RESERVED"],
      },
    },
    orderBy: {
      sku: "asc",
    },
  });

  // Load available items for the mood board canvas
  const availableItemsForMoodboard = await prisma.inventoryItem.findMany({
    where: {
      currentStatus: "AVAILABLE",
    },
    orderBy: {
      sku: "asc",
    },
  });

  // Load and filter audit logs for this project
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const projectCodeLower = project.projectCode.toLowerCase();
  const projectNameLower = project.name.toLowerCase();
  const projectIdLower = project.id.toLowerCase();

  const filteredAuditLogs = auditLogs.filter((log) => {
    const text = `${log.newValue || ""} ${log.oldValue || ""} ${log.action || ""} ${log.entityType || ""}`.toLowerCase();
    return (
      text.includes(projectCodeLower) ||
      text.includes(projectNameLower) ||
      text.includes(projectIdLower)
    );
  }).map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    newValue: log.newValue,
    oldValue: log.oldValue,
    createdAt: log.createdAt.toISOString(),
    user: {
      id: log.user.id,
      name: log.user.name,
      role: log.user.role,
      email: log.user.email,
    },
  }));

  // Safe mapping of Date objects to ISO strings for Client Component boundary
  const formattedProject = {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    shootDate: project.shootDate.toISOString(),
    reportingTime: project.reportingTime,
    moodBoardState: project.moodBoardState,
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
      landmark: project.siteDetails.landmark,
      siteSupervisorName: project.siteDetails.siteSupervisorName,
      siteSupervisorEmail: project.siteDetails.siteSupervisorEmail,
      siteSupervisorPhone: project.siteDetails.siteSupervisorPhone,
      photographerName: project.siteDetails.photographerName,
      photographerEmail: project.siteDetails.photographerEmail,
      photographerPhone: project.siteDetails.photographerPhone,
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
    boxes: project.boxes.map((b) => ({
      id: b.id,
      boxNumber: b.boxNumber,
    })),
    packedItems: project.packedItems.map((pi) => ({
      id: pi.id,
      inventoryItemId: pi.inventoryItemId,
      boxId: pi.boxId,
      scannedAt: pi.scannedAt.toISOString(),
      inventoryItem: {
        sku: pi.inventoryItem.sku,
        barcode: pi.inventoryItem.barcode,
        name: pi.inventoryItem.name,
        category: pi.inventoryItem.category,
      },
      box: pi.box ? {
        boxNumber: pi.box.boxNumber,
      } : null,
    })),
  };

  const formattedAvailableItemsForPacking = availableItemsForPacking.map((item) => ({
    id: item.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    currentStatus: item.currentStatus,
  }));

  const formattedAvailableItemsForMoodboard = availableItemsForMoodboard.map((item) => ({
    id: item.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    photos: item.photos,
  }));

  return (
    <ProjectDetailClient
      project={formattedProject}
      availableItemsForPacking={formattedAvailableItemsForPacking}
      availableItemsForMoodboard={formattedAvailableItemsForMoodboard}
      auditLogs={filteredAuditLogs}
    />
  );
}

