import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, InventoryStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { itemId, userId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    // 1. Resolve user ID, fallback to Stylist or Admin
    let currentUserId = userId;
    if (!currentUserId) {
      const stylist = await prisma.user.findFirst({ where: { role: "STYLIST" } });
      currentUserId = stylist?.id;
    }
    if (!currentUserId) {
      const anyUser = await prisma.user.findFirst();
      currentUserId = anyUser?.id;
    }
    if (!currentUserId) {
      return NextResponse.json({ error: "No user found to assign database log" }, { status: 400 });
    }

    // 2. Load item and project
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Transaction to release item and log audit
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStatus: InventoryStatus.AVAILABLE,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: "RELEASED",
          entityType: "InventoryItem",
          newValue: `Released item '${item.name}' (SKU: ${item.sku}) from Project '${project.name}' (${project.projectCode}) back to available pool`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, itemId, status: InventoryStatus.AVAILABLE });
  } catch (error: any) {
    console.error("Error in Moodboard release API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
