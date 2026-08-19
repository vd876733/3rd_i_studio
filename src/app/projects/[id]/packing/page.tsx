import React from "react";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PackingClient from "./PackingClient";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
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

  // Load inventory items that are currently AVAILABLE or RESERVED to serve as the packing picklist
  const availableItems = await prisma.inventoryItem.findMany({
    where: {
      currentStatus: {
        in: ["AVAILABLE", "RESERVED"],
      },
    },
    orderBy: {
      sku: "asc",
    },
  });

  // Map database entity properties to clean JSON structures across the server-client boundary
  const formattedProject = {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    client: {
      name: project.client.name,
    },
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

  const formattedAvailableItems = availableItems.map((item) => ({
    id: item.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    currentStatus: item.currentStatus,
  }));

  return (
    <PackingClient
      project={formattedProject}
      availableItems={formattedAvailableItems}
    />
  );
}
