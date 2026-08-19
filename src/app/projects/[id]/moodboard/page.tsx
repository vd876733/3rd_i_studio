import React from "react";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import MoodBoardClient from "./MoodBoardClient";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MoodBoardPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  // Load inventory items that are currently AVAILABLE to drag onto the canvas
  const availableItems = await prisma.inventoryItem.findMany({
    where: {
      currentStatus: "AVAILABLE",
    },
    orderBy: {
      sku: "asc",
    },
  });

  // Map database details securely across the server-client boundary
  const formattedProject = {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    moodBoardState: project.moodBoardState,
  };

  const formattedItems = availableItems.map((item) => ({
    id: item.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    photos: item.photos,
  }));

  return (
    <MoodBoardClient
      project={formattedProject}
      availableItems={formattedItems}
    />
  );
}
