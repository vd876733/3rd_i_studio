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
    const { barcode, boxId, userId } = body;

    if (!barcode || !boxId) {
      return NextResponse.json({ error: "barcode and boxId are required" }, { status: 400 });
    }

    // 1. Resolve user ID for audit log, fallback to packer user if none provided
    let packUserId = userId;
    if (!packUserId) {
      const packerUser = await prisma.user.findFirst({
        where: { role: "PACKER" },
      });
      packUserId = packerUser?.id;
    }
    if (!packUserId) {
      const anyUser = await prisma.user.findFirst();
      packUserId = anyUser?.id;
    }
    if (!packUserId) {
      return NextResponse.json({ error: "No user found to assign packing responsibility" }, { status: 400 });
    }

    // 2. Fetch box details
    const box = await prisma.box.findUnique({
      where: { id: boxId },
    });
    if (!box) {
      return NextResponse.json({ error: "Target box not found" }, { status: 404 });
    }

    // 3. Find the inventory item by barcode or SKU
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { barcode },
          { sku: barcode },
        ],
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found with that barcode or SKU" }, { status: 404 });
    }

    // 4. Find the project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 4.5 Verify the item is reserved for this shoot (present in moodboard state)
    let isReserved = false;
    if (project.moodBoardState) {
      try {
        const elements = typeof project.moodBoardState === "string"
          ? JSON.parse(project.moodBoardState)
          : project.moodBoardState;
        if (Array.isArray(elements)) {
          isReserved = elements.some((el: any) => el.itemId === item.id);
        }
      } catch (e) {
        console.error("Failed to parse project moodBoardState:", e);
      }
    }

    if (!isReserved) {
      return NextResponse.json({ error: "Invalid Barcode or Item not reserved for this shoot" }, { status: 400 });
    }

    // 5. Transaction to create packing link, update item state, and write AuditLog
    const [packedItem] = await prisma.$transaction([
      prisma.projectPackedItem.create({
        data: {
          projectId,
          inventoryItemId: item.id,
          boxId,
          packedById: packUserId,
        },
        include: {
          inventoryItem: true,
          box: true,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          currentStatus: InventoryStatus.PACKED,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: packUserId,
          action: "PACKED",
          entityType: "Box",
          newValue: `Packed item '${item.name}' (SKU: ${item.sku}) into Box '${box.boxNumber}' for Project '${project.name}' (${project.projectCode})`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      packedItem: {
        id: packedItem.id,
        projectId: packedItem.projectId,
        inventoryItemId: packedItem.inventoryItemId,
        boxId: packedItem.boxId,
        scannedAt: packedItem.scannedAt.toISOString(),
        inventoryItem: {
          sku: packedItem.inventoryItem.sku,
          name: packedItem.inventoryItem.name,
          category: packedItem.inventoryItem.category,
        },
        box: packedItem.box ? {
          boxNumber: packedItem.box.boxNumber,
        } : null,
      },
    });
  } catch (error: any) {
    console.error("Error in Pack scan API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
